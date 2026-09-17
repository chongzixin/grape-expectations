import { useState } from 'react';
import type { Stats } from '../types';

interface StatsBarProps {
  stats: Stats;
  setTab: (t: 'cellar' | 'analytics') => void;
  setSort: (s: string) => void;
  updateTrackedYear: (slot: 1 | 2 | 3, newYear: number) => void;
}

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

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

function YearStatCard({ year, count, slot, onConfirm }: {
  year: number; count: number; slot: 1 | 2 | 3; onConfirm: (slot: 1 | 2 | 3, newYear: number) => void;
}) {
  const [editing, setEditing]   = useState(false);
  const [draftValue, setDraftValue] = useState(String(year));
  const [error, setError]       = useState<string | null>(null);

  const startEdit = () => {
    setDraftValue(String(year));
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    setDraftValue(String(year));
  };

  const confirmEdit = () => {
    const trimmed = draftValue.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setError('Enter a 4-digit year');
      return;
    }
    const parsed = parseInt(trimmed, 10);
    if (parsed < MIN_YEAR || parsed > MAX_YEAR) {
      setError(`Year must be ${MIN_YEAR}–${MAX_YEAR}`);
      return;
    }
    onConfirm(slot, parsed);
    setEditing(false);
    setError(null);
  };

  if (editing) {
    return (
      <div className="ge-stat ge-stat-editing">
        <input
          className="ge-stat-year-input"
          type="number"
          value={draftValue}
          autoFocus
          onChange={e => { setDraftValue(e.target.value); setError(null); }}
          onKeyDown={e => {
            if (e.key === 'Enter') confirmEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          onBlur={cancelEdit}
        />
        {error && <div className="ge-stat-year-err">{error}</div>}
        <div className="ge-stat-l">Bottles</div>
        <div className="ge-stat-year-actions">
          <button
            className="ge-stat-year-btn confirm"
            title="Confirm"
            onMouseDown={e => { e.preventDefault(); confirmEdit(); }}
          >✓</button>
          <button
            className="ge-stat-year-btn cancel"
            title="Cancel"
            onMouseDown={e => { e.preventDefault(); cancelEdit(); }}
          >✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ge-stat ge-stat-year">
      <button className="ge-stat-year-edit" title="Edit tracked year" onClick={startEdit}>✎</button>
      <div className="ge-stat-v">{count}</div>
      <div className="ge-stat-l">{year} Bottles</div>
    </div>
  );
}

export function StatsBar({ stats, setTab, setSort, updateTrackedYear }: StatsBarProps) {
  return (
    <div className="ge-stats">
      <StatCard v={stats.totalBottles} l="Total Bottles" />
      <StatCard v={stats.uniqueWines} l="Unique Wines" />
      <StatCard v={stats.avgPrice ? `S$${stats.avgPrice}` : '—'} l="Avg Price" />
      {stats.trackedYearCounts.map(({ year, count }, i) => (
        <YearStatCard key={i} year={year} count={count} slot={(i + 1) as 1 | 2 | 3} onConfirm={updateTrackedYear} />
      ))}
      <StatCard v={stats.drinkSoon} l="Drink Soon" accentColor="#d97706" onClick={() => { setTab('cellar'); setSort('window'); }} />
      <StatCard v={stats.pastPeak} l="Past Peak" accentColor="#dc2626" onClick={() => { setTab('cellar'); setSort('window'); }} />
    </div>
  );
}
