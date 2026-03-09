import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Wine, ChatMessage, Stats, ImageData, ClaudeParams, NewWineForm, UserProfile, DrinkingStatus } from './types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import AuthPage from './AuthPage';
import champagneGif from '../images/champagne-loading.gif';

/* ═══════════════════════════════════════════════════════════════════
   GRAPE EXPECTATIONS — Singaporean Cellar Sommelier
═══════════════════════════════════════════════════════════════════ */

const FLAGS: Record<string, string> = {
  France: '🇫🇷', Australia: '🇦🇺', Spain: '🇪🇸', Italy: '🇮🇹',
  'United States': '🇺🇸', Germany: '🇩🇪', 'New Zealand': '🇳🇿',
  Portugal: '🇵🇹', Argentina: '🇦🇷', Chile: '🇨🇱',
  'South Africa': '🇿🇦', Austria: '🇦🇹', Greece: '🇬🇷', Japan: '🇯🇵',
};

interface TypeStyle { dot: string; bg: string; border: string; text: string; }
const TYPE_STYLE: Record<string, TypeStyle> = {
  Red:       { dot: '#e05c6b', bg: 'rgba(139,26,46,0.2)',   border: 'rgba(180,50,70,0.4)',   text: '#f9b4bf' },
  White:     { dot: '#d4c44a', bg: 'rgba(139,130,26,0.2)',  border: 'rgba(180,170,50,0.4)',  text: '#f5f0a8' },
  Sparkling: { dot: '#5bbad5', bg: 'rgba(26,106,139,0.2)',  border: 'rgba(50,140,180,0.4)',  text: '#aadff5' },
  'Rosé':    { dot: '#d45aa0', bg: 'rgba(139,26,106,0.2)',  border: 'rgba(180,50,140,0.4)',  text: '#f5aae0' },
  Dessert:   { dot: '#d4a45a', bg: 'rgba(139,90,26,0.2)',   border: 'rgba(180,120,50,0.4)',  text: '#f5d4aa' },
  Fortified: { dot: '#8a5ad4', bg: 'rgba(90,26,139,0.2)',   border: 'rgba(120,50,180,0.4)', text: '#c4aaf5' },
};

/* ─── Drinking window ───────────────────────────────────────────── */
const CURRENT_YEAR = new Date().getFullYear();

const DRINKING_STATUS_PRIORITY: Record<DrinkingStatus, number> = {
  prime: 1,
  approaching_end: 2,
  past_peak: 3,
  too_young: 4,
  unknown: 5,
};

const BADGE_STYLES: Record<DrinkingStatus, { background: string; color: string; label: string }> = {
  prime:           { background: '#16a34a', color: '#ffffff', label: 'Prime' },
  approaching_end: { background: '#d97706', color: '#ffffff', label: 'Drink Soon' },
  past_peak:       { background: '#dc2626', color: '#ffffff', label: 'Past Peak' },
  too_young:       { background: '#2563eb', color: '#ffffff', label: 'Too Young' },
  unknown:         { background: '#6b7280', color: '#ffffff', label: 'Unknown' },
};

function getDrinkingStatus(wine: Wine): DrinkingStatus {
  const { drinkFrom, drinkBy } = wine;
  if (drinkFrom == null && drinkBy == null) return 'unknown';
  const from = drinkFrom ?? -Infinity;
  const by   = drinkBy   ??  Infinity;
  if (CURRENT_YEAR < from) return 'too_young';
  if (CURRENT_YEAR > by)   return 'past_peak';
  if (drinkBy != null && drinkBy - CURRENT_YEAR <= 2) return 'approaching_end';
  return 'prime';
}

function DrinkingWindowBadge({ wine }: { wine: Wine }) {
  const status = getDrinkingStatus(wine);
  const { background, color, label } = BADGE_STYLES[status];
  const windowText = wine.drinkFrom || wine.drinkBy
    ? `${wine.drinkFrom ?? '?'}–${wine.drinkBy ?? '?'}`
    : null;
  return (
    <span
      title={windowText ?? 'No window data'}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: 600,
        background,
        color,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {label}
      {windowText && (
        <span style={{ fontWeight: 400, marginLeft: 4, opacity: 0.85 }}>{windowText}</span>
      )}
    </span>
  );
}

/* ─── Analytics ─────────────────────────────────────────────────── */
function computeStats(wines: Wine[]): Stats {
  if (!wines.length) return { totalBottles: 0, uniqueWines: 0, avgPrice: null, count2016: 0, count2018: 0, count2023: 0, modeCountry: '—', modeStyle: '—' };
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
  return {
    totalBottles: bottles.length,
    uniqueWines: wines.length,
    avgPrice: priced.length ? Math.round(priced.reduce((s, w) => s + (w.price || 0), 0) / priced.length) : null,
    count2016: bottles.filter(w => w.vintage === '2016').length,
    count2018: bottles.filter(w => w.vintage === '2018').length,
    count2023: bottles.filter(w => w.vintage === '2023').length,
    modeCountry: modeOf('country'),
    modeStyle: modeOf('style'),
  };
}

/* ─── DB → App model ────────────────────────────────────────────── */
function mapDbWine(row: Record<string, unknown>): Wine {
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

/* ─── Claude API (proxied via Netlify function) ──────────────────── */
async function callClaude({ messages, system = '', maxTokens = 1800, imageData = null }: ClaudeParams): Promise<string> {
  const res = await fetch('/.netlify/functions/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system, maxTokens, imageData }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.content || '';
}

async function compressImage(file: File, maxPx = 1600, quality = 0.85): Promise<ImageData> {
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

/* ─── Markdown renderer (simple) ────────────────────────────────── */
function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, li) => {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        const rendered = parts.map((p, pi) =>
          pi % 2 === 1 ? <strong key={pi} style={{ color: '#c9a84c' }}>{p}</strong> : p
        );
        return <span key={li}>{rendered}{li < lines.length - 1 && <br />}</span>;
      })}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════ */
export default function GrapeExpectations() {
  /* ─── Auth ───────────────────────────────────────────────────── */
  const [session, setSession]           = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile]           = useState<UserProfile | null>(null);

  /* ─── Cellar ─────────────────────────────────────────────────── */
  const [wines, setWines]   = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);

  /* ─── UI ─────────────────────────────────────────────────────── */
  const [tab, setTab]       = useState<'cellar' | 'analytics'>('cellar');
  const [filter, setFilter] = useState('All');
  const [sort, setSort]     = useState<'name' | 'vintage' | 'price' | 'type' | 'window'>('name');
  const [search, setSearch] = useState('');

  /* ─── Chat ───────────────────────────────────────────────────── */
  const [chatOpen, setChatOpen]         = useState(false);
  const [chatInput, setChatInput]       = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading]   = useState(false);
  const [copiedIdx, setCopiedIdx]       = useState<number | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'thumbs_up' | 'thumbs_down'>>({});
  const [lastUserQuery, setLastUserQuery] = useState('');

  /* ─── Analytics ──────────────────────────────────────────────── */
  const [aiSummary, setAiSummary]           = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  /* ─── Add Wine Modal ─────────────────────────────────────────── */
  const [showAdd, setShowAdd]       = useState(false);
  const [addTab, setAddTab]         = useState<'photo' | 'manual'>('photo');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [scanLoading, setScanLoading]   = useState(false);
  const [scannedWines, setScannedWines] = useState<Partial<Wine>[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewIndexRef = useRef(0);
  const [newWine, setNewWine] = useState<NewWineForm>({
    name: '', winery: '', vintage: '', price: '', inventory: '1',
    style: '', country: '', region: '', subRegion: '', type: 'Red',
    drinkFrom: '', drinkBy: '',
  });
  const [isEstimatingWindows, setIsEstimatingWindows] = useState(false);
  const [windowEstimationProgress, setWindowEstimationProgress] = useState<{ current: number; total: number } | null>(null);
  const scannedWine = scannedWines[previewIndex] ?? null;

  const [localPairings, setLocalPairings] = useState<string[]>([]);
  const [pairingsLoading, setPairingsLoading] = useState(false);
  const [windowLoading, setWindowLoading] = useState(false);
  const [scanNotes, setScanNotes] = useState<{ wine: string; winery: string; tasting: string } | null>(null);
  const [wantSommelierNotes, setWantSommelierNotes] = useState(false);

  const chatEndRef      = useRef<HTMLDivElement>(null);
  const chatInputRef    = useRef<HTMLInputElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  /* ─── Auth Setup ─────────────────────────────────────────────── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setSessionReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setWines([]);
        setProfile(null);
        setChatMessages([]);
        setChatSessionId(null);
        setMessageFeedback({});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ─── Load Profile ───────────────────────────────────────────── */
  useEffect(() => {
    if (!session) return;
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { if (data) setProfile(data as UserProfile); });
  }, [session]);

  /* ─── Load Wines from Supabase ───────────────────────────────── */
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    supabase.from('wines').select('*').eq('user_id', session.user.id)
      .then(({ data, error }) => {
        if (!error && data) setWines(data.map(mapDbWine));
        setLoading(false);
      });
  }, [session]);

  /* ─── Derived wine lists ─────────────────────────────────────── */
  const activeWines = useMemo(() =>
    wines.filter(w => w.inventory > 0),
    [wines]
  );
  const stats = useMemo(() => computeStats(activeWines), [activeWines]);
  const types = useMemo(() => ['All', ...Array.from(new Set(activeWines.map(w => w.type).filter(Boolean)))], [activeWines]);
  const filteredWines = useMemo(() => {
    let ws = [...activeWines];
    if (filter !== 'All') ws = ws.filter(w => w.type === filter);
    if (search) {
      const q = search.toLowerCase();
      ws = ws.filter(w =>
        [w.name, w.winery, w.region, w.country, w.style, w.subRegion].some(v => v?.toLowerCase().includes(q))
      );
    }
    ws.sort((a, b) => {
      if (sort === 'vintage') return (b.vintage || '') > (a.vintage || '') ? 1 : -1;
      if (sort === 'price') return (b.price || 0) - (a.price || 0);
      if (sort === 'type') return (a.type || '').localeCompare(b.type || '');
      if (sort === 'window') {
        const diff = DRINKING_STATUS_PRIORITY[getDrinkingStatus(a)] - DRINKING_STATUS_PRIORITY[getDrinkingStatus(b)];
        if (diff !== 0) return diff;
        return (a.drinkBy ?? 9999) - (b.drinkBy ?? 9999);
      }
      return (a.name || '').localeCompare(b.name || '');
    });
    return ws;
  }, [activeWines, filter, search, sort]);

  /* ─── Inventory ──────────────────────────────────────────────── */
  const updateInventory = useCallback(async (id: string, delta: number) => {
    const wine = wines.find(w => w.id === id);
    if (!wine) return;
    const next = Math.max(0, wine.inventory + delta);
    // Optimistic update
    setWines(prev => prev.map(w => w.id === id ? { ...w, inventory: next } : w));
    // Persist
    await supabase.from('wines')
      .update({ inventory: next, updated_at: new Date().toISOString() })
      .eq('id', id);
  }, [wines]);

  /* ─── Auth: Sign Out ─────────────────────────────────────────── */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  /* ─── Add Wine to Supabase ───────────────────────────────────── */
  const addWineToDb = async (form: NewWineForm, source: string): Promise<Wine | null> => {
    if (!session) return null;
    const { data, error } = await supabase.from('wines').insert({
      user_id: session.user.id,
      name: form.name.trim(),
      winery: form.winery.trim(),
      vintage: form.vintage.trim(),
      price: form.price ? parseFloat(form.price) : null,
      inventory: parseInt(form.inventory) || 1,
      style: form.style.trim(),
      country: form.country.trim(),
      region: form.region.trim(),
      sub_region: form.subRegion.trim(),
      type: form.type || 'Red',
      source,
      drink_from: form.drinkFrom ? parseInt(form.drinkFrom, 10) : null,
      drink_by:   form.drinkBy   ? parseInt(form.drinkBy,   10) : null,
    }).select().single();
    if (error || !data) { console.error('Failed to add wine:', error); return null; }
    return mapDbWine(data as Record<string, unknown>);
  };

  /* ─── Batch Drinking Window Estimation ───────────────────────── */
  const estimateDrinkingWindows = async () => {
    const winesNeedingWindow = wines.filter(w => w.drinkFrom == null && w.drinkBy == null);
    if (winesNeedingWindow.length === 0) return;
    setIsEstimatingWindows(true);
    setWindowEstimationProgress({ current: 0, total: winesNeedingWindow.length });
    for (let i = 0; i < winesNeedingWindow.length; i++) {
      const wine = winesNeedingWindow[i];
      setWindowEstimationProgress({ current: i + 1, total: winesNeedingWindow.length });
      try {
        const raw = await callClaude({
          messages: [{ role: 'user', content: `You are a sommelier. For the wine below, return ONLY a JSON object with "drinkFrom" (integer year) and "drinkBy" (integer year), or null for each if unknown. No markdown, no explanation.\n\nWine: ${wine.name} | ${wine.winery} | Vintage: ${wine.vintage} | ${wine.type} (${wine.style}) | ${wine.region}, ${wine.country}` }],
          maxTokens: 60,
        });
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
        const drinkFrom: number | null = parsed.drinkFrom != null ? parseInt(String(parsed.drinkFrom), 10) : null;
        const drinkBy:   number | null = parsed.drinkBy   != null ? parseInt(String(parsed.drinkBy),   10) : null;
        if (drinkFrom !== null || drinkBy !== null) {
          const { error } = await supabase.from('wines').update({ drink_from: drinkFrom, drink_by: drinkBy }).eq('id', wine.id);
          if (!error) {
            setWines(prev => prev.map(w => w.id === wine.id ? { ...w, drinkFrom, drinkBy } : w));
          }
        }
      } catch {
        // Continue to next wine
      }
    }
    setIsEstimatingWindows(false);
    setWindowEstimationProgress(null);
  };

  /* ─── AI Summary ─────────────────────────────────────────────── */
  const loadSummary = async () => {
    if (aiSummary || summaryLoading) return;
    setSummaryLoading(true);
    try {
      const cellarList = activeWines.map(w =>
        `${w.name} (${w.winery || 'unknown producer'}, ${w.vintage || 'NV'}, ${w.style || w.type}, ${w.subRegion || w.region || w.country}, ${w.inventory} btl${w.price ? `, S$${w.price}` : ''})`
      ).join('\n');
      const txt = await callClaude({
        system: 'You are an expert sommelier writing for a sophisticated Singaporean wine collector. Be elegant, insightful and concise.',
        messages: [{ role: 'user', content: `Write a 3-4 sentence sommelier's assessment of this cellar collection. Note any highlights, themes, or interesting observations:\n\n${cellarList}` }],
        maxTokens: 400,
      });
      setAiSummary(txt);
    } catch {
      setAiSummary('Unable to generate summary — please check your connection.');
    }
    setSummaryLoading(false);
  };

  /* ─── Chat ───────────────────────────────────────────────────── */
  const sendChat = async (prefill?: string) => {
    const msg = (prefill || chatInput).trim();
    if (!msg || chatLoading) return;
    setLastUserQuery(msg);
    const userMsg: ChatMessage = { role: 'user', content: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setChatOpen(true);
    try {
      // Ensure a chat session exists (fire-and-forget if fails)
      let sid = chatSessionId;
      if (!sid && session) {
        const { data: sessionData } = await supabase
          .from('recommendation_sessions')
          .insert({ user_id: session.user.id })
          .select('id')
          .single();
        sid = sessionData?.id ?? null;
        if (sid) setChatSessionId(sid);
      }

      // Persist user message
      if (sid && session) {
        supabase.from('recommendation_messages').insert({
          session_id: sid, user_id: session.user.id, role: 'user', content: msg,
        }).then(() => {});
      }

      const cellarCtx = activeWines.map(w => {
        const status = getDrinkingStatus(w);
        const windowStr = w.drinkFrom || w.drinkBy
          ? ` | Window: ${w.drinkFrom ?? '?'}–${w.drinkBy ?? '?'} [${status}]`
          : ' | Window: unknown';
        return `• ${w.name} | ${w.winery} | Vintage: ${w.vintage || 'NV'} | ${w.type} (${w.style}) | ${[w.subRegion, w.region, w.country].filter(Boolean).join(', ')} | ${w.inventory} bottle${w.inventory > 1 ? 's' : ''} | Price: ${w.price ? `S$${w.price}` : 'unpriced'}${windowStr}`;
      }).join('\n');
      // Strip messageId before sending to Claude
      const history = [...chatMessages, userMsg].map(({ role, content }) => ({ role, content }));
      const txt = await callClaude({
        system: `You are "Grape Expectations" — an expert AI sommelier serving a Singaporean wine collector. You are elegant, knowledgeable, occasionally witty, and deeply passionate about wine and local cuisine.

CELLAR INVENTORY:
${cellarCtx}

LOCAL CUISINE KNOWLEDGE — You have deep, dish-level knowledge of Singapore and SEA cuisine. Always name specific local dishes when explaining pairings. Never give generic "Asian food" advice.

REGIONAL CUISINES & SIGNATURE DISHES:
- Teochew: suckling pig (乳猪), chai poh kway teow (菜脯粿条), steamed fish (清蒸鱼), braised duck (卤鸭), oyster omelette (蚵仔煎), orh nee (芋泥)
- Hokkien: bak kut teh (肉骨茶), Hokkien prawn mee, char kway teow (炒粿条), popiah, lor bak
- Cantonese: dim sum (har gow, siu mai, char siu bao), char siu (叉烧), siu yuk (烧肉), steamed fish with ginger-scallion, wonton noodles
- Peranakan/Nonya: laksa lemak, ayam buah keluak, beef rendang, ngoh hiang, kueh pie tee
- Malay: nasi lemak with sambal, rendang, satay with peanut sauce, mee rebus, lontong
- Indian: fish head curry, roti prata, banana leaf rice, biryani (chicken or mutton), butter chicken
- Zi char: kung pao prawns, cereal butter prawns, salted egg yolk crab, sweet & sour pork, sambal kangkong, steamed tofu
- Hawker staples: Hainanese chicken rice, wonton mee, carrot cake (chai tow kway), rojak, cai png, chilli crab, black pepper crab

PAIRING PRINCIPLES FOR LOCAL DISHES:
- Rich/fatty (rendang, siu yuk, bak kut teh, char siu): high acidity cuts fat — Burgundy Pinot Noir, Champagne, Riesling, Barbera
- Spicy (laksa, curry, sambal nasi lemak, chilli crab): off-dry aromatic whites tame heat — Gewürztraminer, off-dry Riesling, Pinot Gris, Viognier; avoid high-tannin reds
- Delicate seafood (Teochew steamed fish, prawn dishes): crisp mineral whites — Chablis, Muscadet, Albariño, Mosel Riesling Kabinett
- Oyster dishes: Champagne, Chablis, Muscadet
- Umami/braised/soy (braised duck, lor bak, XO sauce, chicken rice): earthy medium-bodied reds or oxidative whites — Pinot Noir, aged Nebbiolo, Fino Sherry
- Wok hei/char (char kway teow, Hokkien mee, carrot cake): wines with body and smoky/toasty notes — Grenache, Syrah, oaked Chardonnay, Alsatian Pinot Gris
- Sweet/caramelised (char siu, satay peanut sauce): ripe fruit or slight sweetness — Grenache, Pinot Noir, off-dry Riesling
- Tangy/tamarind (assam fish, rojak, tamarind prawns): bright acidity and citrus to mirror tartness
- Suckling pig (Teochew style): fine bubbles and high acidity cut crackling fat without masking delicate pork — Champagne, Blanc de Blancs, dry Riesling
- Chai poh kway teow (salty preserved radish noodles): salt demands slight sweetness or firm body — off-dry Gewürztraminer, Alsatian Pinot Gris, or crisp Chablis by contrast

HANDLING MULTI-DISH MEAL QUERIES:
When the user mentions multiple dishes or a cuisine style (e.g. "Teochew spread", "zichar dinner with suckling pig and chai poh kway teow"):
1. Identify the dominant pairing challenge across all dishes (richest, spiciest, or most assertive sauce)
2. Find the wine that satisfies the most dishes without failing any
3. State trade-offs explicitly: "This wine is ideal for the suckling pig; for the chai poh kway teow alone you might prefer..."
4. If dishes are genuinely incompatible (e.g. delicate steamed fish + fiery curry), recommend two bottles by course cluster
5. Always name each specific dish — never say "the fish dish", say "the Teochew steamed pomfret"

RECOMMENDATION RULES:
1. Recommend up to 3 bottles FROM the cellar that best suit the request — name them specifically and say why
2. For each cellar recommendation, include its price (S$) and drinking window (e.g. "S$85 | Drink 2022–2030, currently prime")
3. Then recommend 2 bottles NOT in the cellar (different varietals) that would excel — include SGD price estimates
4. For each recommendation: share interesting winery/winemaker history
5. Explain pairings using WSET framework (acidity, tannin, body, alcohol, flavour compounds) tied to specific local dish characteristics (fat, spice, umami, cooking method, key sauces)
6. Consider budget, occasion, mood if mentioned
7. Structure every recommendation response as follows:
   - Open with 1–2 sentence intro (plain prose) explaining the pairing logic, naming specific local dish characteristics (e.g. "the lemongrass in laksa", "the wok hei smokiness", "the gula melaka sweetness")
   - **From your cellar:** (bold, no ## header) — bullet list, one wine per bullet:
     e.g. "- 🍷 **Wine Name Vintage** — S$XX | Drink YYYY–YYYY (status)"
     Indented second line: brief winery/winemaker note + WSET pairing rationale tied to named local flavour cues
   - **Worth seeking out:** (bold, no ## header) — same bullet format for non-cellar picks with ~SGD price estimate
   - Close with a short conversational follow-up question
   Never mix cellar and non-cellar wines in the same section. Use emojis sparingly (🍷 for wine bullets, 🍜 when naming local dishes, 🌶️ for spicy dishes) — never overdo it. Always reference specific local flavour cues; never say "Asian flavours".
8. Be conversational — ask a follow-up if helpful
9. All prices in SGD
10. End every recommendation response with a "Verdict" section. Format it as a bullet list — one bullet per recommended wine with a one-line summary of why it was chosen. Never use a markdown table for the Verdict; plain bullet points only (e.g. • **Wine Name** — reason)

DRINKING WINDOW PRIORITY:
When recommending wines from the cellar, prioritise by drinking window status in this order:
1. prime — Wine is currently at its best drinking window. Recommend these first.
2. approaching_end — Wine is within 2 years of its window end. Recommend urgently ("drink soon").
3. unknown — Window data not available; treat as potentially drinkable.
4. too_young — Wine has not yet reached its window. Only recommend if the user specifically asks about aging potential.
5. past_peak — Wine is past its peak window. Mention this clearly if recommending; it may still be enjoyable.`,
        messages: history,
        maxTokens: 2000,
      });

      // Persist assistant message and capture its ID for feedback linkage
      let assistantMsgId: string | undefined;
      if (sid && session) {
        const { data: msgData } = await supabase.from('recommendation_messages').insert({
          session_id: sid, user_id: session.user.id, role: 'assistant', content: txt,
        }).select('id').single();
        assistantMsgId = msgData?.id;
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: txt, messageId: assistantMsgId }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, I encountered an error. Please try again.' }]);
    }
    setChatLoading(false);
  };

  /* ─── Feedback (thumbs up/down on assistant messages) ────────── */
  const submitFeedback = async (msg: ChatMessage, thumbs: 'thumbs_up' | 'thumbs_down') => {
    if (!msg.messageId || !session) return;
    const mid = msg.messageId;
    // Toggle off if same vote
    if (messageFeedback[mid] === thumbs) {
      setMessageFeedback(prev => { const next = { ...prev }; delete next[mid]; return next; });
      await supabase.from('recommendation_feedback')
        .delete()
        .eq('user_id', session.user.id)
        .eq('message_id', mid)
        .eq('wine_name', 'response');
      return;
    }
    setMessageFeedback(prev => ({ ...prev, [mid]: thumbs }));
    await supabase.from('recommendation_feedback').upsert({
      user_id: session.user.id,
      message_id: mid,
      wine_name: 'response',
      feedback: thumbs,
      in_cellar: false,
      context_query: lastUserQuery,
    });
  };

  const copyMessage = useCallback((text: string, idx: number) => {
    const clean = text.replace(/\*\*(.+?)\*\*/g, '$1');
    navigator.clipboard.writeText(clean).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }).catch(() => {});
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, chatLoading]);

  /* ─── Photo Scan ─────────────────────────────────────────────── */
  const populateFormFromWine = (wine: Partial<Wine>) => {
    setNewWine({
      name: '', winery: '', vintage: '', price: '', inventory: '1',
      style: '', country: '', region: '', subRegion: '', type: 'Red',
      drinkFrom: '', drinkBy: '',
      ...(Object.fromEntries(
        Object.entries(wine as Record<string, unknown>).map(([k, v]) => [k, v ?? ''])
      ) as Partial<NewWineForm>),
      inventory: '1',
    });
  };

  const closeModal = () => {
    setShowAdd(false);
    setNewWine({ name: '', winery: '', vintage: '', price: '', inventory: '1', style: '', country: '', region: '', subRegion: '', type: 'Red', drinkFrom: '', drinkBy: '' });
    setPhotoPreview(null);
    setScannedWines([]);
    setPreviewIndex(0);
    setAddTab('photo');
    setLocalPairings([]);
    setPairingsLoading(false);
    setScanNotes(null);
  };

  const enrichWine = async (wine: Partial<Wine>, index: number) => {
    if (!wine?.name) return;
    try {
      const raw = await callClaude({
        messages: [{ role: 'user', content: `You are a Singapore sommelier. Given this wine, return ONLY a raw JSON object (no markdown, no backticks).\n\nWine: ${[wine.vintage, wine.winery, wine.name].filter(Boolean).join(' ')} (${[wine.type, wine.region, wine.country].filter(Boolean).join(', ')})\n\n{"localPairings":["**Dish name**: one sentence referencing acidity, tannin, body or flavour synergy with the dish.","**Dish name**: ...","**Dish name**: ..."],"wineSummary":"one sentence describing the wine's character, appellation and style","winerySummary":"one sentence about the producer — founding story, philosophy or a standout fact","tastingNotes":"2–3 sentences of tasting notes. Where apt, use local flavour references: lychee and starfruit not tropical fruit, red dates not dried fruit, pandan florals not floral aromatics, char siu richness not meaty, roasted barley like kopi-O not coffee notes, sharp like assam not tart acidity."}\n\nSuggest exactly 3 Singapore or Southeast Asian local dishes for localPairings. Return ONLY the JSON object.` }],
        maxTokens: 600,
      });
      const enriched = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setScannedWines(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...enriched, _enriched: true };
        return updated;
      });
      if (index === previewIndexRef.current) {
        if (Array.isArray(enriched.localPairings)) setLocalPairings(enriched.localPairings);
        if (enriched.wineSummary || enriched.winerySummary || enriched.tastingNotes) {
          setScanNotes({ wine: enriched.wineSummary || '', winery: enriched.winerySummary || '', tasting: enriched.tastingNotes || '' });
        }
        setPairingsLoading(false);
      }
    } catch {
      if (index === previewIndexRef.current) setPairingsLoading(false);
    }
  };

  const fetchDrinkingWindow = async (wine: Partial<Wine>, index: number) => {
    const v = wine?.vintage?.trim();
    if (!wine?.name || !v || v === 'NV' || v.toLowerCase() === 'null') return;
    if (index === previewIndexRef.current) setWindowLoading(true);
    try {
      const raw = await callClaude({
        messages: [{ role: 'user', content: `You are a sommelier. For the wine below, return ONLY a JSON object with "drinkFrom" (integer year) and "drinkBy" (integer year), or null for each if unknown. No markdown, no explanation.\n\nWine: ${wine.name} | ${wine.winery} | Vintage: ${wine.vintage} | ${wine.type} (${wine.style}) | ${wine.region}, ${wine.country}` }],
        maxTokens: 60,
      });
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      const drinkFrom = parsed.drinkFrom != null ? parseInt(String(parsed.drinkFrom), 10) : null;
      const drinkBy   = parsed.drinkBy   != null ? parseInt(String(parsed.drinkBy),   10) : null;
      setScannedWines(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], drinkFrom, drinkBy, _windowFetched: true } as any;
        return updated;
      });
      if (index === previewIndexRef.current) {
        const df = drinkFrom != null ? String(drinkFrom) : '';
        const db = drinkBy   != null ? String(drinkBy)   : '';
        if (df || db) setNewWine(p => ({ ...p, drinkFrom: df, drinkBy: db }));
        setWindowLoading(false);
      }
    } catch {
      if (index === previewIndexRef.current) setWindowLoading(false);
    }
  };

  const handlePhoto = async (file: File) => {
    setPhotoPreview(URL.createObjectURL(file));
    setScanLoading(true);
    setScannedWines([]);
    setLocalPairings([]);
    setScanNotes(null);
    setWindowLoading(false);
    setPreviewIndex(0);
    previewIndexRef.current = 0;
    try {
      const imgData = await compressImage(file, 2400);
      const raw = await callClaude({
        imageData: imgData,
        messages: [{ role: 'user', content: `Analyse this wine label or invoice image. Return ONLY a raw JSON array (no markdown, no backticks).\n- Single wine label → array with one object\n- Multiple bottles in one photo → one object per visible bottle label\n- Invoice with multiple wines → one object per wine line item\n\nCRITICAL field rules:\n- "name": the wine/appellation/cuvée name ONLY — do NOT include the producer name or vintage year in this field. e.g. "Bolgheri Rosso Superiore", not "Grattamacco Bolgheri Rosso Superiore 2019"\n- "winery": producer/château/domaine/estate name only\n- "vintage": 4-digit year or "NV" only — never include in "name"\n- "price": the per-bottle price to record. For invoices: use the "Unit Price" column (not "Amount", which is a line-item subtotal). If a per-line discount is shown, subtract it from the unit price to get the effective price per bottle. Use null if no price is visible.\n\nEach object: {"name":"wine name only","winery":"producer name only","vintage":"year or NV","price":null or number,"style":"grape variety or blend","country":"country","region":"wine region","subRegion":"sub-region or null","type":"Red or White or Sparkling or Rosé or Dessert or Fortified"}\n\nUse null for unknown fields. Return ONLY the JSON array.` }],
        maxTokens: 1500,
      });
      const jsonMatch = raw.match(/\[[\s\S]*\]/) ?? raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      let parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) parsed = [parsed];
      setScannedWines(parsed as Partial<Wine>[]);
      populateFormFromWine(parsed[0]);
      (parsed as Partial<Wine>[]).forEach((w, i) => fetchDrinkingWindow(w, i));
      if (wantSommelierNotes) {
        setPairingsLoading(true);
        (parsed as Partial<Wine>[]).forEach((w, i) => enrichWine(w, i));
      }
    } catch {
      alert('Could not read label — please enter details manually.');
      setAddTab('manual');
    }
    setScanLoading(false);
  };

  /* ─── Preview Confirm / Skip ─────────────────────────────────── */
  const advancePreview = (nextIdx: number) => {
    if (nextIdx >= scannedWines.length) {
      closeModal();
    } else {
      setPreviewIndex(nextIdx);
      previewIndexRef.current = nextIdx;
      setWindowLoading(false);
      populateFormFromWine(scannedWines[nextIdx]);
      const wn = scannedWines[nextIdx] as any;
      if (wn?._enriched) {
        setLocalPairings(wn.localPairings || []);
        setScanNotes(wn?.wineSummary || wn?.winerySummary || wn?.tastingNotes
          ? { wine: wn.wineSummary || '', winery: wn.winerySummary || '', tasting: wn.tastingNotes || '' }
          : null);
        setPairingsLoading(false);
      } else {
        setLocalPairings([]);
        setScanNotes(null);
        const wnNext = scannedWines[nextIdx] as any;
        if (!wnNext?._windowFetched) fetchDrinkingWindow(scannedWines[nextIdx], nextIdx);
        if (wantSommelierNotes) {
          setPairingsLoading(true);
          enrichWine(scannedWines[nextIdx], nextIdx);
        }
      }
    }
  };

  const confirmCurrentWine = async () => {
    if (!newWine.name.trim()) { alert('Please enter the wine name.'); return; }
    const wine = await addWineToDb(newWine, 'photo_scan');
    if (wine) {
      setWines(prev => [...prev, wine]);
      advancePreview(previewIndex + 1);
    }
  };

  /* ─── Add Wine (manual entry form) ──────────────────────────── */
  const addWine = async () => {
    if (!newWine.name.trim()) { alert('Please enter the wine name.'); return; }
    const wine = await addWineToDb(newWine, 'manual');
    if (wine) {
      setWines(prev => [...prev, wine]);
      if (scannedWines.length > 0 && previewIndex < scannedWines.length - 1) {
        setAddTab('photo');
        advancePreview(previewIndex + 1);
      } else {
        closeModal();
      }
    }
  };

  /* ─── Render Helpers ─────────────────────────────────────────── */
  const Badge = ({ type }: { type: string }) => {
    const s = TYPE_STYLE[type] || TYPE_STYLE.Red;
    return <span className="tbadge" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{type}</span>;
  };

  const StatCard = ({ v, l }: { v: string | number; l: string }) => (
    <div className="ge-stat">
      <div className="ge-stat-v" title={String(v)}>{v}</div>
      <div className="ge-stat-l">{l}</div>
    </div>
  );

  const QuickPrompts = () => {
    const prompts = [
      'White for Teochew suckling pig and chai poh kway teow',
      'Light red for zichar tonight',
      'Red to pair with rendang and nasi lemak',
      'Sparkling for dim sum brunch',
    ];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {prompts.map(p => (
          <button key={p} className="ge-fbtn" style={{ fontSize: 11 }}
            onClick={() => { setChatInput(p); sendChat(p); }}>
            {p}
          </button>
        ))}
      </div>
    );
  };

  /* ─── Auth guards ────────────────────────────────────────────── */
  if (!sessionReady) return (
    <div className="loading-screen">
      <div className="loading-title">🍷 Grape Expectations</div>
      <img src={champagneGif} alt="Loading..." className="loading-gif" />
    </div>
  );

  if (!session) return <AuthPage />;

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-title">🍷 Grape Expectations</div>
      <img src={champagneGif} alt="Loading..." className="loading-gif" />
      <div className="loading-text">Decanting your cellar...</div>
    </div>
  );

  return (
    <div className="ge fade">
      {/* ── HEADER ── */}
      <header className="ge-hdr">
        <div className="ge-logo">
          <span>🍷</span>
          <div>
            Grape Expectations
            <small>Your Singaporean Sommelier</small>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="ornament hide-m">✦ ✦ ✦</span>
          {wines.some(w => w.drinkFrom == null && w.drinkBy == null) && (
            <button
              className="ge-btn btn-o hide-m"
              onClick={estimateDrinkingWindows}
              disabled={isEstimatingWindows}
              style={{ fontSize: 12, padding: '6px 14px', opacity: isEstimatingWindows ? 0.6 : 1, cursor: isEstimatingWindows ? 'not-allowed' : 'pointer' }}
            >
              {isEstimatingWindows && windowEstimationProgress
                ? `Estimating… ${windowEstimationProgress.current}/${windowEstimationProgress.total}`
                : 'Estimate Windows'}
            </button>
          )}
          <button className="ge-btn btn-g" onClick={() => setShowAdd(true)}>+ Add Wine</button>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || 'Profile'}
              title={`${profile.display_name || session.user.email} · Sign out`}
              onClick={handleSignOut}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--border)',
                cursor: 'pointer', flexShrink: 0,
                transition: 'border-color 0.2s',
              }}
            />
          ) : (
            <button className="ge-btn btn-o" onClick={handleSignOut} style={{ fontSize: 12, padding: '6px 14px' }}>
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="ge-main">
        {/* ── STATS ── */}
        <div className="ge-stats">
          <StatCard v={stats.totalBottles} l="Total Bottles" />
          <StatCard v={stats.uniqueWines} l="Unique Wines" />
          <StatCard v={stats.avgPrice ? `S$${stats.avgPrice}` : '—'} l="Avg Price" />
          <StatCard v={stats.count2016 || 0} l="2016 Bottles" />
          <StatCard v={stats.count2018 || 0} l="2018 Bottles" />
          <StatCard v={stats.count2023 || 0} l="2023 Bottles" />
          <StatCard v={stats.modeCountry} l="Top Country" />
          <StatCard v={stats.modeStyle} l="Top Varietal" />
        </div>

        {/* ── TABS ── */}
        <div className="ge-tabs">
          <button className={`ge-tab ${tab === 'cellar' ? 'on' : ''}`} onClick={() => setTab('cellar')}>🍾 My Cellar</button>
          <button className={`ge-tab ${tab === 'analytics' ? 'on' : ''}`} onClick={() => { setTab('analytics'); loadSummary(); }}>📊 Analytics</button>
        </div>

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div className="fade">
            <div className="ai-box">
              <div className="ai-hdr">✦ Sommelier's Assessment</div>
              {summaryLoading ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  <div className="spin" /> Analysing your cellar...
                </div>
              ) : aiSummary ? (
                <p style={{ color: 'var(--parch)', lineHeight: 1.75 }}>{aiSummary}</p>
              ) : (
                <button className="ge-btn btn-o" onClick={loadSummary}>✦ Generate AI Assessment</button>
              )}
            </div>

            <div className="brk-grid">
              {/* By Type */}
              <div className="brk-card">
                <div className="brk-ttl">By Type</div>
                {Object.entries(
                  activeWines.reduce<Record<string, number>>((a, w) => { a[w.type || 'Unknown'] = (a[w.type || 'Unknown'] || 0) + w.inventory; return a; }, {})
                ).sort((a, b) => b[1] - a[1]).map(([t, c]) => (
                  <div className="brk-row" key={t}>
                    <Badge type={t} />
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{c} btl{c !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
              {/* By Country */}
              <div className="brk-card">
                <div className="brk-ttl">By Country</div>
                {Object.entries(
                  activeWines.reduce<Record<string, number>>((a, w) => { a[w.country || 'Unknown'] = (a[w.country || 'Unknown'] || 0) + w.inventory; return a; }, {})
                ).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
                  <div className="brk-row" key={c} style={{ color: 'var(--parch)' }}>
                    <span>{FLAGS[c] || '🌍'} {c}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{n}</span>
                  </div>
                ))}
              </div>
              {/* By Varietal */}
              <div className="brk-card">
                <div className="brk-ttl">By Varietal</div>
                {Object.entries(
                  activeWines.reduce<Record<string, number>>((a, w) => { a[w.style || 'Unknown'] = (a[w.style || 'Unknown'] || 0) + w.inventory; return a; }, {})
                ).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
                  <div className="brk-row" key={s} style={{ color: 'var(--parch)' }}>
                    <span>{s}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{n}</span>
                  </div>
                ))}
              </div>
              {/* By Vintage */}
              <div className="brk-card">
                <div className="brk-ttl">By Vintage</div>
                {Object.entries(
                  activeWines.reduce<Record<string, number>>((a, w) => { const v = w.vintage || 'NV'; a[v] = (a[v] || 0) + w.inventory; return a; }, {})
                ).sort((a, b) => b[0] > a[0] ? 1 : -1).map(([v, n]) => (
                  <div className="brk-row" key={v} style={{ color: 'var(--parch)' }}>
                    <span>{v}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CELLAR TAB ── */}
        {tab === 'cellar' && (
          <div className="fade">
            <div className="ge-filters">
              {types.map(t => (
                <button key={t} className={`ge-fbtn ${filter === t ? 'on' : ''}`} onClick={() => setFilter(t)}>{t}</button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input className="ge-srch" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="ge-sel" value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
                  <option value="name">Name</option>
                  <option value="vintage">Vintage</option>
                  <option value="price">Price</option>
                  <option value="type">Type</option>
                  <option value="window">Drinking Window</option>
                </select>
              </div>
            </div>

            {filteredWines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🍾</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>No wines found</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Adjust filters or add wines to your cellar.</div>
              </div>
            ) : (
              <table className="ge-tbl">
                <thead>
                  <tr>
                    <th onClick={() => setSort('name')}>Wine {sort === 'name' && '↑'}</th>
                    <th onClick={() => setSort('type')} className="hide-m">Type {sort === 'type' && '↑'}</th>
                    <th onClick={() => setSort('vintage')}>Vintage {sort === 'vintage' && '↑'}</th>
                    <th className="hide-m">Region</th>
                    <th onClick={() => setSort('price')} className="hide-m">Price {sort === 'price' && '↑'}</th>
                    <th onClick={() => setSort('window')} className="hide-m" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Window {sort === 'window' && '↑'}</th>
                    <th>Bottles</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWines.map(wine => (
                    <tr key={wine.id} className="wr">
                      <td>
                        <div className="wn">{wine.name}</div>
                        <div className="ww">{wine.winery}</div>
                      </td>
                      <td className="hide-m">
                        <Badge type={wine.type} />
                        {wine.style && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{wine.style}</div>}
                      </td>
                      <td style={{ color: 'var(--parch)', fontSize: 14 }}>{wine.vintage || '—'}</td>
                      <td className="hide-m" style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {FLAGS[wine.country] || ''} {wine.subRegion || wine.region || wine.country || '—'}
                      </td>
                      <td className="hide-m" style={{ fontSize: 13, color: wine.price ? 'var(--gold)' : 'var(--dim)' }}>
                        {wine.price ? `S$${wine.price}` : '—'}
                      </td>
                      <td className="hide-m window-cell">
                        <DrinkingWindowBadge wine={wine} />
                      </td>
                      <td>
                        <div className="inv">
                          <button className="ivb" onClick={() => updateInventory(wine.id, -1)}>−</button>
                          <span className="ivc">{wine.inventory}</span>
                          <button className="ivb" onClick={() => updateInventory(wine.id, +1)}>+</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* ── CHAT DRAWER ── */}
      <div className="ge-chat-wrap">
        {chatOpen && (
          <div className="ge-chat-msgs">
            {chatMessages.length === 0 && (
              <div style={{ paddingBottom: 8 }}>
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 15, fontWeight: 700, letterSpacing: 0.5, padding: '12px 0 6px' }}>
                  ✦ What shall we open tonight? ✦
                </div>
                <QuickPrompts />
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`cm ${msg.role}`}>
                <div className="cr">{msg.role === 'user' ? 'You' : '✦ Sommelier'}</div>
                <div className="cb">
                  {msg.role === 'assistant'
                    ? <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          strong: ({ children }) => <strong style={{ color: '#c9a84c' }}>{children}</strong>,
                          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
                        }}
                      >{msg.content}</ReactMarkdown>
                    : msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <div className="cm-actions">
                    <button
                      className={`cm-copy ${copiedIdx === i ? 'copied' : ''}`}
                      onClick={() => copyMessage(msg.content, i)}
                      title="Copy to clipboard"
                    >
                      {copiedIdx === i ? 'Copied!' : '⎘'}
                    </button>
                    {msg.messageId && (
                      <div className="cm-feedback">
                        <button
                          className={`cm-fb ${messageFeedback[msg.messageId] === 'thumbs_up' ? 'active' : ''}`}
                          onClick={() => submitFeedback(msg, 'thumbs_up')}
                          title="Helpful"
                        >👍</button>
                        <button
                          className={`cm-fb ${messageFeedback[msg.messageId] === 'thumbs_down' ? 'active' : ''}`}
                          onClick={() => submitFeedback(msg, 'thumbs_down')}
                          title="Not helpful"
                        >👎</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="cm assistant">
                <div className="cr">✦ Sommelier</div>
                <div className="cb"><div className="tdots"><span /><span /><span /></div></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        <div style={{ background: 'rgba(10,7,6,0.98)', borderTop: '1px solid var(--border)' }}>
          <div className="ge-chat-bar">
            {chatOpen && (
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>↓</button>
            )}
            <input
              ref={chatInputRef}
              className="ge-ci"
              placeholder={chatOpen ? 'Ask your sommelier...' : '🍷 Ask for your local dish pairing...'}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onFocus={() => setChatOpen(true)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
            />
            <button className="ge-cs" onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()}>
              {chatLoading ? <div className="spin" style={{ borderColor: 'rgba(10,7,6,0.3)', borderTopColor: '#080504' }} /> : '→'}
            </button>
          </div>
        </div>
      </div>

      {/* ── ADD WINE MODAL ── */}
      {showAdd && (
        <div className="ge-modal-bg" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="ge-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="ge-modal-ttl">✦ Add to Cellar</div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <div className="mtabs">
              {([['photo', '📷 Scan Photo'], ['manual', '✍️ Manual Entry']] as [string, string][]).map(([t, l]) => (
                <button key={t} className={`mtab ${addTab === t ? 'on' : ''}`} onClick={() => setAddTab(t as 'photo' | 'manual')}>{l}</button>
              ))}
            </div>

            {addTab === 'photo' && (
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) { handlePhoto(e.target.files[0]); e.target.value = ''; } }} />
                <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) { handlePhoto(e.target.files[0]); e.target.value = ''; } }} />
                {!photoPreview ? (
                  <div className="photo-drop">
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Scan Wine Label or Bottles</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Snap a single label, multiple bottles, or an invoice — we'll detect all wines</div>
                    <div className="scan-upload-btns">
                      <button className="ge-btn btn-g" onClick={() => fileInputRef.current?.click()}>📷 Take Photo</button>
                      <button className="ge-btn btn-o" onClick={() => galleryInputRef.current?.click()}>🖼️ Upload from Gallery</button>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12, color: 'var(--muted)', cursor: 'pointer', justifyContent: 'center', userSelect: 'none' }}>
                      <input type="checkbox" checked={wantSommelierNotes} onChange={e => setWantSommelierNotes(e.target.checked)} style={{ accentColor: 'var(--gold)', width: 14, height: 14, cursor: 'pointer' }} />
                      Include sommelier notes &amp; pairings
                      <span style={{ fontStyle: 'italic' }}>(takes a bit longer)</span>
                    </label>
                  </div>
                ) : (
                  <div>
                    <img src={photoPreview} style={{ width: '100%', borderRadius: 8, maxHeight: 160, objectFit: 'contain', background: 'var(--card)', marginBottom: 12 }} alt="Wine" />
                    {scanLoading && (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>
                        <div className="spin" /> Scanning with AI vision...
                      </div>
                    )}
                    {!scanLoading && scannedWines.length > 0 && (() => {
                      const isMulti = scannedWines.length > 1;
                      return (
                        <>
                          {isMulti && (
                            <div className="scan-pagination">
                              <button
                                className="scan-page-btn"
                                disabled={previewIndex === 0}
                                onClick={() => { const i = previewIndex - 1; setPreviewIndex(i); populateFormFromWine(scannedWines[i]); setLocalPairings((scannedWines[i] as any).localPairings || []); const wp = scannedWines[i] as any; setScanNotes(wp?.wineSummary || wp?.winerySummary || wp?.tastingNotes ? { wine: wp.wineSummary || '', winery: wp.winerySummary || '', tasting: wp.tastingNotes || '' } : null); }}
                              >←</button>
                              <span className="scan-pagination-label">Wine {previewIndex + 1} of {scannedWines.length}</span>
                              <button
                                className="scan-page-btn"
                                disabled={previewIndex === scannedWines.length - 1}
                                onClick={() => { const i = previewIndex + 1; setPreviewIndex(i); populateFormFromWine(scannedWines[i]); setLocalPairings((scannedWines[i] as any).localPairings || []); const wp = scannedWines[i] as any; setScanNotes(wp?.wineSummary || wp?.winerySummary || wp?.tastingNotes ? { wine: wp.wineSummary || '', winery: wp.winerySummary || '', tasting: wp.tastingNotes || '' } : null); }}
                              >→</button>
                            </div>
                          )}
                          <div className="wine-preview-card">
                            <div className="wpc-scan-banner">✦ AI detected — review and edit if needed</div>
                            <div className="wpc-fields">
                              <div className="wpc-field wpc-full">
                                <label className="fl">Wine Name *</label>
                                <input className="fi" value={newWine.name} onChange={e => setNewWine(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chambolle-Musigny" />
                              </div>
                              <div className="wpc-field wpc-full">
                                <label className="fl">Winery / Producer</label>
                                <input className="fi" value={newWine.winery} onChange={e => setNewWine(p => ({ ...p, winery: e.target.value }))} placeholder="e.g. Domaine Mugnier" />
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Vintage</label>
                                <input className="fi" value={newWine.vintage} onChange={e => setNewWine(p => ({ ...p, vintage: e.target.value }))} placeholder="e.g. 2019 or NV" />
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Type</label>
                                <select className="fi" style={{ cursor: 'pointer' }} value={newWine.type} onChange={e => setNewWine(p => ({ ...p, type: e.target.value }))}>
                                  {['Red', 'White', 'Sparkling', 'Rosé', 'Dessert', 'Fortified'].map(t => <option key={t}>{t}</option>)}
                                </select>
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Price (S$)</label>
                                <input className="fi" type="number" value={newWine.price} onChange={e => setNewWine(p => ({ ...p, price: e.target.value }))} placeholder="—" />
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Varietal / Style</label>
                                <input className="fi" value={newWine.style} onChange={e => setNewWine(p => ({ ...p, style: e.target.value }))} placeholder="e.g. Pinot Noir" />
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Country</label>
                                <input className="fi" value={newWine.country} onChange={e => setNewWine(p => ({ ...p, country: e.target.value }))} placeholder="e.g. France" />
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Region</label>
                                <input className="fi" value={newWine.region} onChange={e => setNewWine(p => ({ ...p, region: e.target.value }))} placeholder="e.g. Burgundy" />
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Sub-Region</label>
                                <input className="fi" value={newWine.subRegion} onChange={e => setNewWine(p => ({ ...p, subRegion: e.target.value }))} placeholder="e.g. Gevrey-Chambertin" />
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Bottles</label>
                                <div className="inv">
                                  <button className="ivb" onClick={() => setNewWine(p => ({ ...p, inventory: String(Math.max(1, parseInt(p.inventory) - 1)) }))}>−</button>
                                  <span className="ivc">{newWine.inventory}</span>
                                  <button className="ivb" onClick={() => setNewWine(p => ({ ...p, inventory: String(parseInt(p.inventory) + 1) }))}>+</button>
                                </div>
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Drink From</label>
                                <input className="fi" type="number" min="1900" max="2100" placeholder="e.g. 2024" value={newWine.drinkFrom} onChange={e => setNewWine(p => ({ ...p, drinkFrom: e.target.value }))} />
                              </div>
                              <div className="wpc-field">
                                <label className="fl">Drink To</label>
                                <input className="fi" type="number" min="1900" max="2100" placeholder="e.g. 2032" value={newWine.drinkBy} onChange={e => setNewWine(p => ({ ...p, drinkBy: e.target.value }))} />
                              </div>
                            </div>
                            {windowLoading && !newWine.drinkFrom && !newWine.drinkBy && (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
                                <div className="spin" /> Estimating drinking window…
                              </div>
                            )}
                            {pairingsLoading && !scanNotes && localPairings.length === 0 && (
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>
                                <div className="spin" /> Preparing sommelier notes…
                              </div>
                            )}
                            {(scanNotes || localPairings.length > 0) && (
                              <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 8, padding: '10px 14px', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {scanNotes && (scanNotes.wine || scanNotes.winery || scanNotes.tasting) && (<>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 0.5 }}>🍷 SOMMELIER NOTES</div>
                                  {scanNotes.wine    && <div style={{ fontSize: 12, color: 'var(--parch)', lineHeight: 1.65 }}><RichText text={`**Wine:** ${scanNotes.wine}`} /></div>}
                                  {scanNotes.winery  && <div style={{ fontSize: 12, color: 'var(--parch)', lineHeight: 1.65 }}><RichText text={`**Producer:** ${scanNotes.winery}`} /></div>}
                                  {scanNotes.tasting && <div style={{ fontSize: 12, color: 'var(--parch)', lineHeight: 1.65 }}><RichText text={`**Tasting:** ${scanNotes.tasting}`} /></div>}
                                </>)}
                                {scanNotes && localPairings.length > 0 && (
                                  <div style={{ borderTop: '1px solid rgba(201,168,76,0.25)', margin: '4px 0' }} />
                                )}
                                {localPairings.length > 0 && (<>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 0.5 }}>🍜 LOCAL DISH PAIRINGS</div>
                                  {localPairings.map((p, i) => (
                                    <div key={i} style={{ fontSize: 12, color: 'var(--parch)', lineHeight: 1.65 }}><RichText text={p} /></div>
                                  ))}
                                </>)}
                              </div>
                            )}
                          </div>
                          <div className="wpc-actions">
                            <button className="ge-btn btn-o" onClick={() => { setPhotoPreview(null); setScannedWines([]); setPreviewIndex(0); }}>
                              Try another
                            </button>
                            {isMulti && (
                              <button className="ge-btn btn-o" onClick={() => advancePreview(previewIndex + 1)}>
                                ✗ Skip
                              </button>
                            )}
                            <button className="ge-btn btn-g" onClick={confirmCurrentWine}>
                              ✓ {isMulti ? 'Add Wine' : 'Add to Cellar'}
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {addTab === 'manual' && (
              <div>
                {scannedWine && (
                  <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--gold)', marginBottom: 16 }}>
                    {scannedWines.length > 1
                      ? `✦ Wine ${previewIndex + 1} of ${scannedWines.length} — verify and add to cellar`
                      : '✦ Pre-filled from label scan — please verify details'}
                  </div>
                )}
                <div className="fg">
                  <div className="ff full">
                    <label className="fl">Wine Name *</label>
                    <input className="fi" value={newWine.name} onChange={e => setNewWine(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chambolle-Musigny" />
                  </div>
                  <div className="ff full">
                    <label className="fl">Winery / Producer</label>
                    <input className="fi" value={newWine.winery} onChange={e => setNewWine(p => ({ ...p, winery: e.target.value }))} placeholder="e.g. Domaine Mugnier" />
                  </div>
                  <div className="ff">
                    <label className="fl">Vintage</label>
                    <input className="fi" value={newWine.vintage} onChange={e => setNewWine(p => ({ ...p, vintage: e.target.value }))} placeholder="e.g. 2019 or NV" />
                  </div>
                  <div className="ff">
                    <label className="fl">Price (S$)</label>
                    <input className="fi" type="number" value={newWine.price} onChange={e => setNewWine(p => ({ ...p, price: e.target.value }))} placeholder="e.g. 180" />
                  </div>
                  <div className="ff">
                    <label className="fl">Type *</label>
                    <select className="fi" style={{ cursor: 'pointer' }} value={newWine.type} onChange={e => setNewWine(p => ({ ...p, type: e.target.value }))}>
                      {['Red', 'White', 'Sparkling', 'Rosé', 'Dessert', 'Fortified'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="ff">
                    <label className="fl">Varietal / Style</label>
                    <input className="fi" value={newWine.style} onChange={e => setNewWine(p => ({ ...p, style: e.target.value }))} placeholder="e.g. Pinot Noir" />
                  </div>
                  <div className="ff">
                    <label className="fl">Country</label>
                    <input className="fi" value={newWine.country} onChange={e => setNewWine(p => ({ ...p, country: e.target.value }))} placeholder="e.g. France" />
                  </div>
                  <div className="ff">
                    <label className="fl">Region</label>
                    <input className="fi" value={newWine.region} onChange={e => setNewWine(p => ({ ...p, region: e.target.value }))} placeholder="e.g. Burgundy" />
                  </div>
                  <div className="ff">
                    <label className="fl">Sub-Region</label>
                    <input className="fi" value={newWine.subRegion} onChange={e => setNewWine(p => ({ ...p, subRegion: e.target.value }))} placeholder="e.g. Gevrey-Chambertin" />
                  </div>
                  <div className="ff">
                    <label className="fl">Number of Bottles</label>
                    <input className="fi" type="number" min="1" value={newWine.inventory} onChange={e => setNewWine(p => ({ ...p, inventory: e.target.value }))} />
                  </div>
                  <div className="ff">
                    <label className="fl">Drink From</label>
                    <input className="fi" type="number" min="1900" max="2100" placeholder="e.g. 2024" value={newWine.drinkFrom} onChange={e => setNewWine(p => ({ ...p, drinkFrom: e.target.value }))} />
                  </div>
                  <div className="ff">
                    <label className="fl">Drink To</label>
                    <input className="fi" type="number" min="1900" max="2100" placeholder="e.g. 2032" value={newWine.drinkBy} onChange={e => setNewWine(p => ({ ...p, drinkBy: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  {scannedWines.length > 0
                    ? <button className="ge-btn btn-o" onClick={() => setAddTab('photo')}>← Back to Preview</button>
                    : <button className="ge-btn btn-o" onClick={closeModal}>Cancel</button>
                  }
                  <button className="ge-btn btn-g" onClick={addWine}>✦ Add to Cellar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
