import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Wine, ChatMessage, Stats, ImageData, ClaudeParams, NewWineForm } from './types';

/* ═══════════════════════════════════════════════════════════════════
   GRAPE EXPECTATIONS — Singaporean Cellar Sommelier
═══════════════════════════════════════════════════════════════════ */

const SAMPLE_WINES: Wine[] = [
  { id: 's1', name: 'Vosne-Romanee La Croix Blanche', winery: 'Domaine Chevillon-Chezeaux', vintage: '2022', price: null, inventory: 1, style: 'Pinot Noir', country: 'France', region: 'Burgundy', subRegion: 'Vosne-Romanee', type: 'Red' },
  { id: 's2', name: 'Vosne-Romanee 1er Cru Les Rouges', winery: 'Bruno Desaunay-Bissey', vintage: '2013', price: 170, inventory: 1, style: 'Pinot Noir', country: 'France', region: 'Burgundy', subRegion: 'Vosne-Romanee', type: 'Red' },
  { id: 's3', name: 'Julienas', winery: 'Chateau Des Capitans', vintage: '2022', price: null, inventory: 1, style: 'Gamay', country: 'France', region: 'Beaujolais', subRegion: 'Julienas', type: 'Red' },
  { id: 's4', name: 'Single Vineyard Chardonnay', winery: 'PepperGreen Estate', vintage: '2021', price: null, inventory: 1, style: 'Chardonnay', country: 'Australia', region: 'New South Wales', subRegion: 'Southern Highlands', type: 'White' },
  { id: 's5', name: 'Lluerna Xarel-lo', winery: 'Els Vinyerons', vintage: '2022', price: null, inventory: 1, style: 'Xarel-lo', country: 'Spain', region: 'Catalunya', subRegion: 'Penedes', type: 'White' },
  { id: 's6', name: 'Cuvee St-Denis Brut Champagne Grand Cru', winery: 'Varnier Fanniere', vintage: 'NV', price: null, inventory: 1, style: 'Chardonnay', country: 'France', region: 'Champagne', subRegion: 'Champagne Grand Cru', type: 'Sparkling' },
];

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

/* ─── Analytics ─────────────────────────────────────────────────── */
function computeStats(wines: Wine[]): Stats {
  if (!wines.length) return { totalBottles: 0, uniqueWines: 0, avgPrice: null, count2018: 0, count2023: 0, modeVintage: '—', modeCountry: '—', modeStyle: '—' };
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
    count2018: bottles.filter(w => w.vintage === '2018').length,
    count2023: bottles.filter(w => w.vintage === '2023').length,
    modeVintage: modeOf('vintage'),
    modeCountry: modeOf('country'),
    modeStyle: modeOf('style'),
  };
}

/* ─── Storage helpers ───────────────────────────────────────────── */
function storageGet(key: string): unknown {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function storageSet(key: string, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* silent */ }
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

async function fileToBase64(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ data: result.split(',')[1], mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
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
  const [wines, setWines]           = useState<Wine[]>([]);
  const [overrides, setOverrides]   = useState<Record<string, number>>({});
  const [localWines, setLocalWines] = useState<Wine[]>([]);
  const [loading, setLoading]       = useState(true);
  const [usingDemo, setUsingDemo]   = useState(false);

  const [tab, setTab]       = useState<'cellar' | 'analytics'>('cellar');
  const [filter, setFilter] = useState('All');
  const [sort, setSort]     = useState<'name' | 'vintage' | 'price' | 'type'>('name');
  const [search, setSearch] = useState('');

  const [chatOpen, setChatOpen]         = useState(false);
  const [chatInput, setChatInput]       = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading]   = useState(false);

  const [aiSummary, setAiSummary]           = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [showAdd, setShowAdd]       = useState(false);
  const [addTab, setAddTab]         = useState<'photo' | 'manual'>('photo');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [scanLoading, setScanLoading]   = useState(false);
  const [scannedWine, setScannedWine]   = useState<Partial<Wine> | null>(null);
  const [newWine, setNewWine] = useState<NewWineForm>({
    name: '', winery: '', vintage: '', price: '', inventory: '1',
    style: '', country: '', region: '', subRegion: '', type: 'Red',
  });

  const chatEndRef   = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Load Data ─────────────────────────────────────────────── */
  useEffect(() => {
    const savedOverrides = storageGet('ge_overrides') as Record<string, number> | null;
    if (savedOverrides) setOverrides(savedOverrides);
    const savedLocal = storageGet('ge_local_wines') as Wine[] | null;
    if (savedLocal) setLocalWines(savedLocal);

    (async () => {
      try {
        const res = await fetch('/.netlify/functions/sheets');
        if (!res.ok) throw new Error();
        const parsed = await res.json() as Wine[];
        if (parsed.length > 0) { setWines(parsed); setLoading(false); return; }
        throw new Error();
      } catch {
        setWines(SAMPLE_WINES);
        setUsingDemo(true);
      }
      setLoading(false);
    })();
  }, []);

  /* ─── Merged wine list ──────────────────────────────────────── */
  const allWines = useMemo(() => [...wines, ...localWines], [wines, localWines]);
  const activeWines = useMemo(() =>
    allWines.map(w => ({
      ...w,
      inventory: overrides[w.id] !== undefined ? overrides[w.id] : w.inventory,
    })).filter(w => w.inventory > 0),
    [allWines, overrides]
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
      return (a.name || '').localeCompare(b.name || '');
    });
    return ws;
  }, [activeWines, filter, search, sort]);

  /* ─── Inventory ─────────────────────────────────────────────── */
  const updateInventory = useCallback((id: string, delta: number) => {
    const wine = allWines.find(w => w.id === id);
    const cur = overrides[id] !== undefined ? overrides[id] : (wine?.inventory || 0);
    const next = Math.max(0, cur + delta);
    const updated = { ...overrides, [id]: next };
    setOverrides(updated);
    storageSet('ge_overrides', updated);

    // Sync back to Google Sheets for sheet-sourced wines
    if (id.startsWith('sheet_')) {
      const wineIndex = parseInt(id.replace('sheet_', ''), 10);
      fetch('/.netlify/functions/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wineIndex, inventory: next }),
      }).catch(console.error);
    }
  }, [allWines, overrides]);

  /* ─── AI Summary ────────────────────────────────────────────── */
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

  /* ─── Chat ──────────────────────────────────────────────────── */
  const sendChat = async (prefill?: string) => {
    const msg = (prefill || chatInput).trim();
    if (!msg || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setChatOpen(true);
    try {
      const cellarCtx = activeWines.map(w =>
        `• ${w.name} | ${w.winery} | Vintage: ${w.vintage || 'NV'} | ${w.type} (${w.style}) | ${[w.subRegion, w.region, w.country].filter(Boolean).join(', ')} | ${w.inventory} bottle${w.inventory > 1 ? 's' : ''} | Price: ${w.price ? `S$${w.price}` : 'unpriced'}`
      ).join('\n');
      const history: ChatMessage[] = [...chatMessages, userMsg];
      const txt = await callClaude({
        system: `You are "Grape Expectations" — an expert AI sommelier serving a Singaporean wine collector. You are elegant, knowledgeable, occasionally witty, and deeply passionate about wine.

CELLAR INVENTORY:
${cellarCtx}

RECOMMENDATION RULES:
1. Recommend up to 3 bottles FROM the cellar that best suit the request (state specifically which bottles and why)
2. Then recommend 2 bottles NOT in the cellar (different varietals for diversity) that would excel
3. For each recommendation: share interesting winery/winemaker history
4. Explain food pairings using WSET framework (acidity, tannin, body, alcohol, flavour compounds)
5. Consider budget, occasion, mood if mentioned
6. Bold wine names using **Wine Name** format
7. Be conversational — ask a follow-up if helpful
8. Prices should be referenced in SGD`,
        messages: history,
        maxTokens: 2000,
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: txt }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, I encountered an error. Please try again.' }]);
    }
    setChatLoading(false);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, chatLoading]);

  /* ─── Photo Scan ────────────────────────────────────────────── */
  const handlePhoto = async (file: File) => {
    setPhotoPreview(URL.createObjectURL(file));
    setScanLoading(true);
    setScannedWine(null);
    try {
      const imgData = await fileToBase64(file);
      const raw = await callClaude({
        imageData: imgData,
        messages: [{ role: 'user', content: `Analyse this wine label/invoice. Return ONLY a raw JSON object (no markdown, no backticks) with these fields:\n{"name":"wine name","winery":"producer name","vintage":"year or NV","price":null or number,"style":"grape variety","country":"country","region":"region","subRegion":"sub-region or null","type":"Red or White or Sparkling or Rosé or Dessert or Fortified"}\nUse null for unknown fields. Return ONLY the JSON.` }],
        maxTokens: 500,
      });
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as Partial<Wine>;
      setScannedWine(parsed);
      setNewWine(p => ({
        ...p,
        ...(Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, v ?? ''])
        ) as Partial<NewWineForm>),
        inventory: p.inventory || '1',
      }));
      setAddTab('manual');
    } catch {
      alert('Could not read label — please enter details manually.');
      setAddTab('manual');
    }
    setScanLoading(false);
  };

  /* ─── Add Wine ──────────────────────────────────────────────── */
  const addWine = () => {
    if (!newWine.name.trim()) { alert('Please enter the wine name.'); return; }
    const wine: Wine = {
      id: `local_${Date.now()}`,
      name: newWine.name.trim(),
      winery: newWine.winery.trim(),
      vintage: newWine.vintage.trim(),
      price: newWine.price ? parseFloat(newWine.price) : null,
      inventory: parseInt(newWine.inventory) || 1,
      style: newWine.style.trim(),
      country: newWine.country.trim(),
      region: newWine.region.trim(),
      subRegion: newWine.subRegion.trim(),
      type: newWine.type || 'Red',
    };
    const updated = [...localWines, wine];
    setLocalWines(updated);
    storageSet('ge_local_wines', updated);
    setShowAdd(false);
    setNewWine({ name: '', winery: '', vintage: '', price: '', inventory: '1', style: '', country: '', region: '', subRegion: '', type: 'Red' });
    setPhotoPreview(null);
    setScannedWine(null);
    setAddTab('photo');
  };

  /* ─── Render Helpers ────────────────────────────────────────── */
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
      'Light red for zichar tonight',
      'Best bottle for a special occasion',
      'White wine with sambal nasi lemak',
      'Aperitif before a long dinner',
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

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-title">🍷 Grape Expectations</div>
      <img src="/images/champagne-loading.gif" alt="Loading..." className="loading-gif" />
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
          {usingDemo && <span className="demo-tag">Demo data</span>}
          <span className="ornament hide-m">✦ ✦ ✦</span>
          <button className="ge-btn btn-g" onClick={() => setShowAdd(true)}>+ Add Wine</button>
        </div>
      </header>

      <main className="ge-main">
        {/* ── STATS ── */}
        <div className="ge-stats">
          <StatCard v={stats.totalBottles} l="Total Bottles" />
          <StatCard v={stats.uniqueWines} l="Unique Wines" />
          <StatCard v={stats.avgPrice ? `S$${stats.avgPrice}` : '—'} l="Avg Price" />
          <StatCard v={stats.count2018 || 0} l="2018 Bottles" />
          <StatCard v={stats.count2023 || 0} l="2023 Bottles" />
          <StatCard v={stats.modeVintage} l="Top Vintage" />
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
                    <th onClick={() => setSort('type')}>Type {sort === 'type' && '↑'}</th>
                    <th onClick={() => setSort('vintage')} className="hide-m">Vintage {sort === 'vintage' && '↑'}</th>
                    <th className="hide-m">Region</th>
                    <th onClick={() => setSort('price')} className="hide-m">Price {sort === 'price' && '↑'}</th>
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
                      <td>
                        <Badge type={wine.type} />
                        {wine.style && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{wine.style}</div>}
                      </td>
                      <td className="hide-m" style={{ color: 'var(--parch)', fontSize: 14 }}>{wine.vintage || '—'}</td>
                      <td className="hide-m" style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {FLAGS[wine.country] || ''} {wine.subRegion || wine.region || wine.country || '—'}
                      </td>
                      <td className="hide-m" style={{ fontSize: 13, color: wine.price ? 'var(--gold)' : 'var(--dim)' }}>
                        {wine.price ? `S$${wine.price}` : '—'}
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
                  {msg.role === 'assistant' ? <RichText text={msg.content} /> : msg.content}
                </div>
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
        <div className="ge-modal-bg" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="ge-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="ge-modal-ttl">✦ Add to Cellar</div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <div className="mtabs">
              {([['photo', '📷 Scan Label'], ['manual', '✍️ Manual Entry']] as [string, string][]).map(([t, l]) => (
                <button key={t} className={`mtab ${addTab === t ? 'on' : ''}`} onClick={() => setAddTab(t as 'photo' | 'manual')}>{l}</button>
              ))}
            </div>

            {addTab === 'photo' && (
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
                {!photoPreview ? (
                  <div className="photo-drop" onClick={() => fileInputRef.current?.click()}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Scan Your Wine Label</div>
                    <div style={{ fontSize: 12 }}>Click to upload a photo — AI will extract wine details automatically</div>
                    <div style={{ fontSize: 11, marginTop: 8, opacity: .6 }}>Supports wine labels, bottle photos & invoices</div>
                  </div>
                ) : (
                  <div>
                    <img src={photoPreview} style={{ width: '100%', borderRadius: 8, maxHeight: 220, objectFit: 'contain', background: 'var(--card)', marginBottom: 12 }} alt="Wine" />
                    {scanLoading ? (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>
                        <div className="spin" /> Scanning with AI vision...
                      </div>
                    ) : scannedWine ? (
                      <div style={{ background: 'rgba(139,26,46,0.12)', border: '1px solid rgba(139,26,46,0.3)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--parch)', marginBottom: 12 }}>
                        ✓ <strong style={{ color: 'var(--gold)' }}>{scannedWine.name}</strong> detected — review in Manual Entry tab
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="ge-btn btn-o" onClick={() => { setPhotoPreview(null); setScannedWine(null); fileInputRef.current?.click(); }}>
                        Try another
                      </button>
                      {scannedWine && !scanLoading && (
                        <button className="ge-btn btn-g" onClick={() => setAddTab('manual')}>Review & Save →</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {addTab === 'manual' && (
              <div>
                {scannedWine && (
                  <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--gold)', marginBottom: 16 }}>
                    ✦ Pre-filled from label scan — please verify details
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
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  <button className="ge-btn btn-o" onClick={() => setShowAdd(false)}>Cancel</button>
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
