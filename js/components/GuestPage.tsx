import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { callClaude, useWittyLoader } from '../utils';
import { SOMMELIER_SYSTEM } from '../constants';
import { LOCAL_CUISINE_KNOWLEDGE } from '../localCuisine';

const QUICK_DISHES = [
  'Teochew Suckling Pig',
  'Mutton Biryani',
  'Laksa Lemak',
  'Char Kway Teow',
  'Beef Rendang',
  'Hainanese Chicken Rice',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MD_COMPONENTS: any = {
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong style={{ color: 'var(--gold)' }}>{children}</strong>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noreferrer">{children}</a>
  ),
};

const GUEST_SYSTEM = `${SOMMELIER_SYSTEM}

${LOCAL_CUISINE_KNOWLEDGE}

GUEST RECOMMENDATION RULES:
Given a dish:
1. Name 2–3 wine varietals that pair well. For each, explain WHY using WSET principles (acidity vs fat, tannin vs protein, residual sugar vs heat) tied to this dish's specific flavour compounds — use local flavour cues (e.g. "the pandan sweetness", "the wok hei char", "the sambal heat") not generic descriptors.
2. Suggest exactly 3 wines available in Singapore — at least 1 per varietal — with SGD price estimate and a Singapore retailer (Cold Storage, RedMart, Vinothèque, 1855 The Wine Bar, Benchmark Wines, Bottles & Bottles, The Fine Wine Experience, etc.).
3. Format: one short varietal-rationale paragraph (3–4 sentences), then "**3 wines to try in Singapore:**" as a bullet list (• **Wine Name** | Winery | ~S$XX | Retailer).
4. Keep total response under 200 words. No extra headers.`;

interface GuestPageProps {
  onSignIn: () => void;
}

export function GuestPage({ onSignIn }: GuestPageProps) {
  const [dish, setDish]     = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { msg: loadMsg, visible: loadVisible } = useWittyLoader(loading);
  const inputRef  = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (dishName: string) => {
    const d = dishName.trim();
    if (!d || loading) return;
    setResult('');
    setLoading(true);
    try {
      const text = await callClaude({
        system: GUEST_SYSTEM,
        messages: [{ role: 'user', content: `What wine pairs well with ${d}?` }],
        maxTokens: 500,
      });
      setResult(text);
    } catch {
      setResult('Sorry, something went wrong. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  return (
    <div className="ge-guest-page">
      <div className="ge-guest-cta-bar">
        <span>Track your cellar &amp; get personalised pairings</span>
        <button className="ge-btn btn-g ge-guest-cta-btn" onClick={onSignIn}>
          Sign in free →
        </button>
      </div>

      <div className="ge-guest-hero">
        <div className="ge-guest-logo">🍷</div>
        <h1 className="ge-guest-title">Grape Expectations</h1>
        <p className="ge-guest-sub">Your Singaporean Sommelier</p>

        <p className="ge-guest-prompt-label">What are you eating tonight?</p>

        <form
          className="ge-guest-form"
          onSubmit={e => { e.preventDefault(); handleSubmit(dish); }}
        >
          <input
            ref={inputRef}
            className="ge-guest-input"
            value={dish}
            onChange={e => setDish(e.target.value)}
            placeholder="e.g. Teochew suckling pig, mutton biryani…"
            autoFocus
          />
          <button
            type="submit"
            className="ge-btn btn-g ge-guest-send"
            disabled={!dish.trim() || loading}
          >
            →
          </button>
        </form>

        <div className="ge-guest-chips">
          {QUICK_DISHES.map(d => (
            <button
              key={d}
              className="ge-btn btn-o ge-guest-chip"
              onClick={() => { setDish(d); handleSubmit(d); }}
              disabled={loading}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="ge-guest-loading">
          <div className={`ge-guest-loading-msg${loadVisible ? ' visible' : ''}`}>
            {loadMsg}
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="ge-guest-result" ref={resultRef}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
            {result}
          </ReactMarkdown>
          <div className="ge-guest-result-cta">
            <button className="ge-btn btn-g" onClick={onSignIn}>
              Sign in to manage your cellar &amp; get personalised pairings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
