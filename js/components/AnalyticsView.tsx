import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Wine, Stats } from '../types';
import { FLAGS, TYPE_STYLE, TYPE_STYLE_LIGHT } from '../constants';
import { getDrinkingStatus } from '../utils';
import { DonutChart } from './DonutChart';

interface AnalyticsViewProps {
  activeWines: Wine[];
  aiSummary: string;
  summaryLoading: boolean;
  summaryMsg: string;
  summaryMsgVisible: boolean;
  loadSummary: () => void;
  themeMode: 'light' | 'dark';
  stats: Stats;
}

export function AnalyticsView({
  activeWines, aiSummary, summaryLoading, summaryMsg, summaryMsgVisible,
  loadSummary, themeMode,
}: AnalyticsViewProps) {
  return (
    <div className="fade">
      <div className="ai-box">
        <div className="ai-hdr">✦ Sommelier's Assessment</div>
        {summaryLoading ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="spin" />
            <div className={`witty-msg${summaryMsgVisible ? '' : ' wm-hidden'}`}>{summaryMsg}</div>
          </div>
        ) : aiSummary ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              strong: ({ children }) => <strong style={{ color: 'var(--gold)' }}>{children}</strong>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
            }}
          >{aiSummary}</ReactMarkdown>
        ) : (
          <button className="ge-btn btn-o" onClick={loadSummary}>✦ Generate AI Assessment</button>
        )}
      </div>

      <div className="brk-grid">
        <div className="brk-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="brk-ttl">By Type</div>
              <DonutChart data={
                Object.entries(
                  activeWines.reduce<Record<string, number>>((a, w) => { a[w.type || 'Unknown'] = (a[w.type || 'Unknown'] || 0) + w.inventory; return a; }, {})
                ).sort((a, b) => b[1] - a[1]).map(([t, c]) => ({
                  label: t,
                  value: c,
                  color: (themeMode === 'light' ? TYPE_STYLE_LIGHT : TYPE_STYLE)[t]?.dot || '#888',
                }))
              } />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="brk-ttl">By Drinking Window</div>
              <DonutChart data={[
                { label: 'Too Young',  value: activeWines.reduce((s, w) => getDrinkingStatus(w) === 'too_young'      ? s + w.inventory : s, 0), color: '#2563eb' },
                { label: 'In Prime',   value: activeWines.reduce((s, w) => getDrinkingStatus(w) === 'prime'           ? s + w.inventory : s, 0), color: '#16a34a' },
                { label: 'Drink Soon', value: activeWines.reduce((s, w) => getDrinkingStatus(w) === 'approaching_end' ? s + w.inventory : s, 0), color: '#d97706' },
                { label: 'Past Peak',  value: activeWines.reduce((s, w) => getDrinkingStatus(w) === 'past_peak'       ? s + w.inventory : s, 0), color: '#dc2626' },
              ].filter(d => d.value > 0)} />
            </div>
          </div>
        </div>
        <div className="brk-card">
          <div className="brk-ttl">By Country</div>
          {Object.entries(
            activeWines.reduce<Record<string, number>>((a, w) => { a[w.country || 'Unknown'] = (a[w.country || 'Unknown'] || 0) + w.inventory; return a; }, {})
          ).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
            <div className="brk-row" key={c} style={{ color: 'var(--parch)' }}>
              <span>{FLAGS[c] || '🌍'} {c}</span>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>{n}</span>
            </div>
          ))}
        </div>
        <div className="brk-card">
          <div className="brk-ttl">By Varietal</div>
          {Object.entries(
            activeWines.reduce<Record<string, number>>((a, w) => { a[w.style || 'Unknown'] = (a[w.style || 'Unknown'] || 0) + w.inventory; return a; }, {})
          ).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
            <div className="brk-row" key={s} style={{ color: 'var(--parch)' }}>
              <span>{s}</span>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>{n}</span>
            </div>
          ))}
        </div>
        <div className="brk-card">
          <div className="brk-ttl">By Vintage</div>
          {Object.entries(
            activeWines.reduce<Record<string, number>>((a, w) => { const v = w.vintage || 'NV'; a[v] = (a[v] || 0) + w.inventory; return a; }, {})
          ).sort((a, b) => b[0] > a[0] ? 1 : -1).map(([v, n]) => (
            <div className="brk-row" key={v} style={{ color: 'var(--parch)' }}>
              <span>{v}</span>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
