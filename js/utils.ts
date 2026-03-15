import { useState, useEffect } from 'react';
import type { Wine, Stats, ClaudeParams, ImageData, RecommendedWine, DrinkingStatus } from './types';
import { CURRENT_YEAR, DRINKING_STATUS_PRIORITY, BADGE_STYLES } from './constants';
import { getRandomMessage } from './loadingMessages';

export function getDrinkingStatus(wine: Wine): DrinkingStatus {
  const { drinkFrom, drinkBy } = wine;
  if (drinkFrom == null && drinkBy == null) return 'unknown';
  const from = drinkFrom ?? -Infinity;
  const by   = drinkBy   ??  Infinity;
  if (CURRENT_YEAR < from) return 'too_young';
  if (CURRENT_YEAR > by)   return 'past_peak';
  if (drinkBy != null && drinkBy - CURRENT_YEAR <= 2) return 'approaching_end';
  return 'prime';
}

export function computeStats(wines: Wine[]): Stats {
  if (!wines.length) return { totalBottles: 0, uniqueWines: 0, avgPrice: null, count2016: 0, count2018: 0, count2023: 0, modeCountry: '—', modeStyle: '—', drinkSoon: 0, pastPeak: 0 };
  const bottles = wines.flatMap(w => Array(Math.max(0, w.inventory)).fill(w) as Wine[]);
  const modeOf = (field: keyof Wine): string => {
    const freq: Record<string, number> = {};
    bottles.forEach(w => {
      const v = String(w[field] || '');
      if (v && v !== 'NV') freq[v] = (freq[v] || 0) + 1;
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || '—';
  };
  const priced = wines.filter(w => w.price);
  const drinkSoon = wines.reduce((s, w) => getDrinkingStatus(w) === 'approaching_end' ? s + w.inventory : s, 0);
  const pastPeak  = wines.reduce((s, w) => getDrinkingStatus(w) === 'past_peak'       ? s + w.inventory : s, 0);
  return {
    totalBottles: bottles.length,
    uniqueWines: wines.length,
    avgPrice: priced.length ? Math.round(priced.reduce((s, w) => s + (w.price || 0), 0) / priced.length) : null,
    count2016: bottles.filter(w => w.vintage === '2016').length,
    count2018: bottles.filter(w => w.vintage === '2018').length,
    count2023: bottles.filter(w => w.vintage === '2023').length,
    modeCountry: modeOf('country'),
    modeStyle: modeOf('style'),
    drinkSoon,
    pastPeak,
  };
}

export function mapDbWine(row: Record<string, unknown>): Wine {
  return {
    id: row.id as string,
    name: row.name as string,
    winery: (row.winery as string) || '',
    vintage: (row.vintage as string) || '',
    price: (row.price as number | null) ?? null,
    inventory: row.inventory as number,
    style: (row.style as string) || '',
    country: (row.country as string) || '',
    region: (row.region as string) || '',
    subRegion: (row.sub_region as string) || '',
    type: (row.type as string) || 'Red',
    source: (row.source as string) || 'manual',
    drinkFrom: (row.drink_from as number | null) ?? null,
    drinkBy:   (row.drink_by   as number | null) ?? null,
  };
}

export async function callClaude({ messages, system = '', maxTokens = 1800, imageData = null }: ClaudeParams): Promise<string> {
  const res = await fetch('/.netlify/functions/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system, maxTokens, imageData }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.content || '';
}

export async function compressImage(file: File, maxPx = 1600, quality = 0.85): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (Math.max(width, height) > maxPx) {
        const scale = maxPx / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Compression failed')); return; }
        const reader2 = new FileReader();
        reader2.onload = () => {
          const result = reader2.result as string;
          resolve({ data: result.split(',')[1], mimeType: 'image/jpeg' });
        };
        reader2.onerror = reject;
        reader2.readAsDataURL(blob);
      }, 'image/jpeg', quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function parseRecommendedWines(content: string): RecommendedWine[] {
  const match = content.match(/<!-- WINES_JSON\n([\s\S]*?)\n-->/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]) as RecommendedWine[];
  } catch {
    return [];
  }
}

export function stripWinesJson(content: string): string {
  return content.replace(/\s*<!-- WINES_JSON[\s\S]*?-->/, '').trim();
}

export function useWittyLoader(active: boolean) {
  const [msg, setMsg]         = useState(() => getRandomMessage());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) {
      setMsg(getRandomMessage());
      setVisible(true);
      return;
    }
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsg(prev => getRandomMessage(prev));
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(id);
  }, [active]);

  return { msg, visible };
}

// Re-export BADGE_STYLES and DRINKING_STATUS_PRIORITY for components that need them
export { BADGE_STYLES, DRINKING_STATUS_PRIORITY };
