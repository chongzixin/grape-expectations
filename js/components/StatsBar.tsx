import { useState } from 'react';
import type { Stats } from '../types';

interface StatsBarProps {
  stats: Stats;
  trackedYears: number[];
  onUpdateTrackedYear: (index: number, year: number) => void;
  setTab: (t: 'cellar' | 'analytics') => void;
  setSort: (s: string) => void;
}

function StatCard({ v, l, onClick, accentColor }: { v: string | number; l: string; onClick?: () => void; accentColor?: string }) {
  return (
    <div
      className={`ge-stat${onClick ? ' ge-stat-btn' : ''}`}
      onClick={onClick}
      style={accentColor ? { borderColor: `${accentColor}33` } : undefined}
    >
      <div className="ge-stat-v" title={String(v)} style={accentColor ? { color: accentColor } : undefined}>{v}</div>
      <div className="ge-stat-l">{l}</div>
    </div>
  );
}

function TrackedYearCard({ year, count, otherYears, onUpdate }: {
  year: number;
  count: number;
  otherYears: number[];
  onUpdate: (year: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(year));
  const [error, setError]     = useState<string | null>(null);

  const startEdit = () => {
    setDraft(String(year));
    setError(null);
    setEditing(true);
  };

  const confirm = () => {
    const trimmed = draft.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setError('Enter a 4-digit year');
      setEditing(false);
      return;
    }
    const value = Number(trimmed);
    if (otherYears.includes(value)) {
      setError('Already tracked');
      setEditing(false);
      return;
    }
    setError(null);
    setEditing(false);
    if (value !== year) onUpdate(value);
  };

  const cancel = () => {
    setDraft(String(year));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="ge-stat">
        <input
          type="text"
          inputMode="numeric"
          className="ge-stat-year-input"
          value={draft}
          autoFocus
          onChange={e => { setDraft(e.target.value); setError(null); }}
          onBlur={confirm}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
        />
        <div className="ge-stat-l">Bottles</div>
      </div>
    );
  }

  return (
    <div className={`ge-stat${error ? ' ge-stat-error' : ''}`}>
      <button type="button" className="ge-stat-edit" onClick={startEdit} aria-label={`Edit tracked year ${year}`}>✎</button>
      <div className="ge-stat-v" title={String(count)}>{count}</div>
      <div className="ge-stat-l">{year} Bottles</div>
      {error && <div className="ge-stat-err-msg">{error}</div>}
    </div>
  );
}

export function StatsBar({ stats, trackedYears, onUpdateTrackedYear, setTab, setSort }: StatsBarProps) {
  return (
    <div className="ge-stats">
      <StatCard v={stats.totalBottles} l="Total Bottles" />
      <StatCard v={stats.uniqueWines} l="Unique Wines" />
      <StatCard v={stats.avgPrice ? `S$${stats.avgPrice}` : '—'} l="Avg Price" />
      {trackedYears.map((year, i) => (
        <TrackedYearCard
          key={i}
          year={year}
          count={stats.trackedYearCounts[i] || 0}
          otherYears={trackedYears.filter((_, j) => j !== i)}
          onUpdate={newYear => onUpdateTrackedYear(i, newYear)}
        />
      ))}
      <StatCard v={stats.drinkSoon} l="Drink Soon" accentColor="#d97706" onClick={() => { setTab('cellar'); setSort('window'); }} />
      <StatCard v={stats.pastPeak} l="Past Peak" accentColor="#dc2626" onClick={() => { setTab('cellar'); setSort('window'); }} />
    </div>
  );
}
