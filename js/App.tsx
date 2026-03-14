import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import type { Wine, ChatMessage, RecommendedWine, Stats, NewWineForm, UserProfile, DrinkingStatus } from './types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { LOCAL_FLAVOUR_REFS, LOCAL_CUISINE_KNOWLEDGE } from './localCuisine';
import AuthPage from './AuthPage';
import champagneGif from '../images/champagne-loading.gif';

import { SOMMELIER_SYSTEM, DRINKING_STATUS_PRIORITY, DRINKING_STATUS_DESCRIPTIONS } from './constants';
import { getDrinkingStatus, computeStats, mapDbWine, callClaude, compressImage, parseRecommendedWines, useWittyLoader } from './utils';

import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { AnalyticsView } from './components/AnalyticsView';
import { CellarView } from './components/CellarView';
import { ChatDrawer } from './components/ChatDrawer';
import { AddWineModal } from './components/AddWineModal';

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
  const [sort, setSort]     = useState<'name' | 'vintage' | 'price' | 'type' | 'window'>('window');
  const [search, setSearch] = useState('');

  /* ─── Theme ──────────────────────────────────────────────────── */
  const [themeMode, setThemeMode]   = useState<'light' | 'dark'>('dark');
  const themeManualRef              = useRef(false);

  /* ─── Mobile menu ────────────────────────────────────────────── */
  const [menuOpen, setMenuOpen]         = useState(false);

  /* ─── Chat ───────────────────────────────────────────────────── */
  const [chatOpen, setChatOpen]         = useState(false);
  const [chatInput, setChatInput]       = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading]   = useState(false);
  const [copiedIdx, setCopiedIdx]       = useState<number | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [wineFeedback, setWineFeedback] = useState<Record<string, 'thumbs_up' | 'thumbs_down'>>({});
  const [lastUserQuery, setLastUserQuery] = useState('');

  /* ─── Analytics ──────────────────────────────────────────────── */
  const [aiSummary, setAiSummary]           = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  /* ─── Add Wine Modal ─────────────────────────────────────────── */
  const [showAdd, setShowAdd]       = useState(false);
  const [addTab, setAddTab]         = useState<'photo' | 'manual'>('photo');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [scanLoading, setScanLoading]   = useState(false);
  const { msg: chatMsg,    visible: chatMsgVisible    } = useWittyLoader(chatLoading);
  const { msg: summaryMsg, visible: summaryMsgVisible } = useWittyLoader(summaryLoading);
  const { msg: scanMsg,    visible: scanMsgVisible    } = useWittyLoader(scanLoading);
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

  const [localPairings, setLocalPairings] = useState<string[]>([]);
  const [pairingsLoading, setPairingsLoading] = useState(false);
  const [windowLoading, setWindowLoading] = useState(false);
  const [scanNotes, setScanNotes] = useState<{ wine: string; winery: string; tasting: string } | null>(null);
  const [wantSommelierNotes, setWantSommelierNotes] = useState(false);

  const chatEndRef      = useRef<HTMLDivElement>(null);
  const chatInputRef    = useRef<HTMLInputElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  /* ─── Auth + Wines init (parallel) ───────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.auth.getSession(),
      supabase.from('wines').select('*'),
    ]).then(([{ data: { session: s } }, { data: wineData, error: wineErr }]) => {
      if (cancelled) return;
      setSession(s);
      setSessionReady(true);
      if (s) {
        if (!wineErr && wineData) setWines(wineData.map(mapDbWine));
        supabase.from('profiles').select('*').eq('id', s.user.id).single()
          .then(({ data }) => { if (!cancelled && data) setProfile(data as UserProfile); });
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (_event === 'SIGNED_IN') {
        setSession(s);
        setLoading(true);
        Promise.all([
          supabase.from('wines').select('*'),
          supabase.from('profiles').select('*').eq('id', s!.user.id).single(),
        ]).then(([{ data: wd, error: we }, { data: pd }]) => {
          if (!we && wd) setWines(wd.map(mapDbWine));
          if (pd) setProfile(pd as UserProfile);
          setLoading(false);
        });
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setWines([]);
        setProfile(null);
        setChatMessages([]);
        setChatSessionId(null);
        setWineFeedback({});
      }
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  /* ─── Time-based theme (sunrise ~6:30am / sunset ~7:30pm local) ─ */
  useEffect(() => {
    const applyTimeTheme = () => {
      if (themeManualRef.current) return;
      const now   = new Date();
      const total = now.getHours() * 60 + now.getMinutes();
      setThemeMode(total >= 390 && total < 1170 ? 'light' : 'dark');
    };
    applyTimeTheme();
    const id = setInterval(applyTimeTheme, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ─── Apply data-theme to <html> ────────────────────────────── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    themeManualRef.current = true;
    setThemeMode(m => m === 'dark' ? 'light' : 'dark');
  };

  /* ─── Derived wine lists ─────────────────────────────────────── */
  const activeWines = useMemo(() =>
    wines.filter(w => w.inventory > 0),
    [wines]
  );
  const stats: Stats = useMemo(() => computeStats(activeWines), [activeWines]);

  /* ─── Inventory ──────────────────────────────────────────────── */
  const updateInventory = useCallback(async (id: string, delta: number) => {
    const wine = wines.find(w => w.id === id);
    if (!wine) return;
    const next = Math.max(0, wine.inventory + delta);
    setWines(prev => prev.map(w => w.id === id ? { ...w, inventory: next } : w));
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
          system: SOMMELIER_SYSTEM,
          messages: [{ role: 'user', content: `For the wine below, return ONLY a JSON object with "drinkFrom" (integer year) and "drinkBy" (integer year), or null for each if unknown. No markdown, no explanation.\n\nWine: ${wine.name} | ${wine.winery} | Vintage: ${wine.vintage} | ${wine.type} (${wine.style}) | ${wine.region}, ${wine.country}` }],
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
      const primeCt     = activeWines.reduce((s, w) => getDrinkingStatus(w) === 'prime'           ? s + w.inventory : s, 0);
      const drinkSoonCt = activeWines.reduce((s, w) => getDrinkingStatus(w) === 'approaching_end' ? s + w.inventory : s, 0);
      const pastPeakCt  = activeWines.reduce((s, w) => getDrinkingStatus(w) === 'past_peak'       ? s + w.inventory : s, 0);
      const tooYoungCt  = activeWines.reduce((s, w) => getDrinkingStatus(w) === 'too_young'       ? s + w.inventory : s, 0);
      const txt = await callClaude({
        system: SOMMELIER_SYSTEM,
        messages: [{ role: 'user', content: `Write a Cellar Health Snapshot for this collection in 150–180 words across 2–3 short paragraphs.

Structure the paragraphs as two implicit parts — what's working and what to consider — woven into natural flowing prose without headers or bullet points. Do not use bold text. Do not include a title or heading — begin directly with the prose. Each paragraph should be 2–4 sentences.

Cover:
- The cellar's personality: dominant styles, regions, and varietals that give it identity
- Which bottles are in their prime drinking window right now and deserve near-term attention (use the exact counts provided below)
- Balance across styles (red/white/sparkling) and whether any are underrepresented
- The drinking window spread — if a large cluster is too young and near-term options are limited, call it out
- Specific gaps worth filling to round out the collection

Drinking window breakdown (use these exact numbers): ${primeCt} bottles prime, ${drinkSoonCt} drink soon, ${pastPeakCt} past peak, ${tooYoungCt} too young.

Where natural, weave in 1–2 references to local Singaporean food or occasions to ground the assessment in the user's context. Use the dish names below as inspiration — do not force every sentence to reference local food.

LOCAL FLAVOUR REFS: ${LOCAL_FLAVOUR_REFS}
${LOCAL_CUISINE_KNOWLEDGE}

Cellar:
${cellarList}` }],
        maxTokens: 800,
      });
      setAiSummary(txt);
    } catch (e) {
      console.error('loadSummary error:', e);
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
        return `• [id:${w.id}] ${w.name} | ${w.winery} | Vintage: ${w.vintage || 'NV'} | ${w.type} (${w.style}) | ${[w.subRegion, w.region, w.country].filter(Boolean).join(', ')} | ${w.inventory} bottle${w.inventory > 1 ? 's' : ''} | Price: ${w.price ? `S$${w.price}` : 'unpriced'}${windowStr}`;
      }).join('\n');
      const history = [...chatMessages, userMsg].map(({ role, content }) => ({ role, content }));
      const txt = await callClaude({
        system: `${SOMMELIER_SYSTEM}

CELLAR INVENTORY:
${cellarCtx}

${LOCAL_CUISINE_KNOWLEDGE}

RECOMMENDATION RULES:
1. Recommend exactly 3 bottles FROM the cellar that best suit the request — name them specifically and say why
2. For each cellar recommendation, include its price (S$) and drinking window (e.g. "S$85 | Drink 2022–2030, currently prime")
3. Then recommend exactly 2 bottles NOT in the cellar — these must be a different varietal from any of the cellar picks above — include SGD price estimates
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
10. End every recommendation response with a "Verdict" section. Format it as a bullet list — one bullet per recommended wine with a one-line summary of why it was chosen. Never use a markdown table for the Verdict; plain bullet points only (e.g. • **Wine Name** — reason). List all 5 wines (3 cellar + 2 sought) in the Verdict.
11. Keep your total response under 500 words. Be specific and sharp — cut preamble, not content.
12. After the Verdict section, append this block exactly (used internally by the app — do NOT mention it to the user):
<!-- WINES_JSON
[{"name":"Wine Name","winery":"Winery","in_cellar":true,"cellar_wine_id":"uuid-from-[id:uuid]"},...]
-->
List all 5 recommended wines in the same order as the Verdict. For cellar wines, copy the uuid from the [id:uuid] prefix in the cellar inventory. For non-cellar wines set cellar_wine_id to null. Output valid JSON on a single line inside the block.

DRINKING WINDOW PRIORITY:
When recommending wines from the cellar, prioritise by drinking window status in this order:
${(Object.entries(DRINKING_STATUS_PRIORITY) as [DrinkingStatus, number][])
  .sort(([, a], [, b]) => a - b)
  .map(([status], i) => `${i + 1}. ${status} — ${DRINKING_STATUS_DESCRIPTIONS[status]}`)
  .join('\n')}`,
        messages: history,
        maxTokens: 1800,
      });

      const recommendedWines = parseRecommendedWines(txt);
      const assistantMsgId = crypto.randomUUID();
      if (sid && session) {
        await supabase.from('recommendation_messages').insert({
          id: assistantMsgId,
          session_id: sid, user_id: session.user.id, role: 'assistant', content: txt,
        });
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: txt,
        messageId: assistantMsgId,
        recommendedWines: recommendedWines.length > 0 ? recommendedWines : undefined,
      }]);
    } catch (e) {
      console.error('[sendChat error]', e);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, I encountered an error. Please try again.' }]);
    }
    setChatLoading(false);
  };

  /* ─── Feedback (per-wine thumbs on Verdict bullets) ─────────── */
  const submitWineFeedback = async (msg: ChatMessage, wine: RecommendedWine, thumbs: 'thumbs_up' | 'thumbs_down') => {
    if (!msg.messageId || !session) return;
    const mid = msg.messageId;
    const fbKey = `${mid}:${wine.name}`;
    if (wineFeedback[fbKey] === thumbs) {
      setWineFeedback(prev => { const next = { ...prev }; delete next[fbKey]; return next; });
      await supabase.from('recommendation_feedback')
        .delete()
        .eq('user_id', session.user.id)
        .eq('message_id', mid)
        .eq('wine_name', wine.name);
      return;
    }
    setWineFeedback(prev => ({ ...prev, [fbKey]: thumbs }));
    await supabase.from('recommendation_feedback').upsert({
      user_id: session.user.id,
      message_id: mid,
      wine_name: wine.name,
      winery: wine.winery,
      feedback: thumbs,
      in_cellar: wine.in_cellar,
      cellar_wine_id: wine.cellar_wine_id ?? null,
      context_query: lastUserQuery,
    }, { onConflict: 'user_id,message_id,wine_name' });
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
      name: '', winery: '', vintage: '', price: '',
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
        system: `${SOMMELIER_SYSTEM}\n\n${LOCAL_CUISINE_KNOWLEDGE}`,
        messages: [{ role: 'user', content: `Given this wine, return ONLY a raw JSON object (no markdown, no backticks).\n\nWine: ${[wine.vintage, wine.winery, wine.name].filter(Boolean).join(' ')} (${[wine.type, wine.region, wine.country].filter(Boolean).join(', ')})\n\n{"localPairings":["**Dish name**: one sentence referencing acidity, tannin, body or flavour synergy with the dish.","**Dish name**: ...","**Dish name**: ..."],"wineSummary":"one sentence describing the wine's character, appellation and style","winerySummary":"one sentence about the producer — founding story, philosophy or a standout fact","tastingNotes":"2–3 sentences of tasting notes. Where apt, use local flavour references: ${LOCAL_FLAVOUR_REFS}."}\n\nSuggest exactly 3 Singapore or Southeast Asian local dishes for localPairings. Return ONLY the JSON object.` }],
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
      if (index === previewIndexRef.current) {
        setPairingsLoading(false);
        toast.error('Could not enrich wine details — please try again.');
      }
    }
  };

  const fetchDrinkingWindow = async (wine: Partial<Wine>, index: number) => {
    const v = wine?.vintage?.trim();
    if (!wine?.name || !v || v === 'NV' || v.toLowerCase() === 'null') return;
    if (index === previewIndexRef.current) setWindowLoading(true);
    try {
      const raw = await callClaude({
        system: SOMMELIER_SYSTEM,
        messages: [{ role: 'user', content: `For the wine below, return ONLY a JSON object with "drinkFrom" (integer year) and "drinkBy" (integer year), or null for each if unknown. No markdown, no explanation.\n\nWine: ${wine.name} | ${wine.winery} | Vintage: ${wine.vintage} | ${wine.type} (${wine.style}) | ${wine.region}, ${wine.country}` }],
        maxTokens: 60,
      });
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      const drinkFrom = parsed.drinkFrom != null ? parseInt(String(parsed.drinkFrom), 10) : null;
      const drinkBy   = parsed.drinkBy   != null ? parseInt(String(parsed.drinkBy),   10) : null;
      setScannedWines(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], drinkFrom, drinkBy, _windowFetched: true } as Partial<Wine> & { _windowFetched: boolean };
        return updated;
      });
      if (index === previewIndexRef.current) {
        const df = drinkFrom != null ? String(drinkFrom) : '';
        const db = drinkBy   != null ? String(drinkBy)   : '';
        if (df || db) setNewWine(p => ({ ...p, drinkFrom: df, drinkBy: db }));
        setWindowLoading(false);
      }
    } catch {
      if (index === previewIndexRef.current) {
        setWindowLoading(false);
        toast.error('Could not estimate drinking window — please enter dates manually.');
      }
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
      const wn = scannedWines[nextIdx] as Partial<Wine> & { _enriched?: boolean; localPairings?: string[]; wineSummary?: string; winerySummary?: string; tastingNotes?: string; _windowFetched?: boolean };
      if (wn?._enriched) {
        setLocalPairings(wn.localPairings || []);
        setScanNotes(wn?.wineSummary || wn?.winerySummary || wn?.tastingNotes
          ? { wine: wn.wineSummary || '', winery: wn.winerySummary || '', tasting: wn.tastingNotes || '' }
          : null);
        setPairingsLoading(false);
      } else {
        setLocalPairings([]);
        setScanNotes(null);
        if (!wn?._windowFetched) fetchDrinkingWindow(scannedWines[nextIdx], nextIdx);
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
      <Toaster position="bottom-center" richColors />

      <Header
        wines={wines}
        session={session}
        profile={profile}
        isEstimatingWindows={isEstimatingWindows}
        windowEstimationProgress={windowEstimationProgress}
        themeMode={themeMode}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        estimateDrinkingWindows={estimateDrinkingWindows}
        toggleTheme={toggleTheme}
        handleSignOut={handleSignOut}
        setShowAdd={setShowAdd}
      />

      <main className="ge-main">
        <StatsBar stats={stats} setTab={setTab} setSort={setSort} />

        <div className="ge-tabs">
          <button className={`ge-tab ${tab === 'cellar' ? 'on' : ''}`} onClick={() => setTab('cellar')}>🍾 My Cellar</button>
          <button className={`ge-tab ${tab === 'analytics' ? 'on' : ''}`} onClick={() => { setTab('analytics'); loadSummary(); }}>📊 Analytics</button>
        </div>

        {tab === 'analytics' && (
          <AnalyticsView
            activeWines={activeWines}
            aiSummary={aiSummary}
            summaryLoading={summaryLoading}
            summaryMsg={summaryMsg}
            summaryMsgVisible={summaryMsgVisible}
            loadSummary={loadSummary}
            themeMode={themeMode}
            stats={stats}
          />
        )}

        {tab === 'cellar' && (
          <CellarView
            wines={activeWines}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            sort={sort}
            setSort={setSort}
            updateInventory={updateInventory}
            themeMode={themeMode}
          />
        )}
      </main>

      <ChatDrawer
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        chatMsg={chatMsg}
        chatMsgVisible={chatMsgVisible}
        copiedIdx={copiedIdx}
        wineFeedback={wineFeedback}
        sendChat={sendChat}
        submitWineFeedback={submitWineFeedback}
        copyMessage={copyMessage}
        chatEndRef={chatEndRef}
        chatInputRef={chatInputRef}
      />

      <AddWineModal
        showAdd={showAdd}
        addTab={addTab}
        setAddTab={setAddTab}
        photoPreview={photoPreview}
        setPhotoPreview={setPhotoPreview}
        scanLoading={scanLoading}
        scanMsg={scanMsg}
        scanMsgVisible={scanMsgVisible}
        scannedWines={scannedWines}
        setScannedWines={setScannedWines}
        previewIndex={previewIndex}
        setPreviewIndex={setPreviewIndex}
        newWine={newWine}
        setNewWine={setNewWine}
        localPairings={localPairings}
        setLocalPairings={setLocalPairings}
        pairingsLoading={pairingsLoading}
        windowLoading={windowLoading}
        scanNotes={scanNotes}
        setScanNotes={setScanNotes}
        wantSommelierNotes={wantSommelierNotes}
        setWantSommelierNotes={setWantSommelierNotes}
        handlePhoto={handlePhoto}
        closeModal={closeModal}
        advancePreview={advancePreview}
        confirmCurrentWine={confirmCurrentWine}
        addWine={addWine}
        fileInputRef={fileInputRef}
        galleryInputRef={galleryInputRef}
      />
    </div>
  );
}
