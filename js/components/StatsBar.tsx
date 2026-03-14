import type { Stats } from '../types';

interface StatsBarProps {
  stats: Stats;
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

export function StatsBar({ stats, setTab, setSort }: StatsBarProps) {
  return (
    <div className="ge-stats">
      <StatCard v={stats.totalBottles} l="Total Bottles" />
      <StatCard v={stats.uniqueWines} l="Unique Wines" />
      <StatCard v={stats.avgPrice ? `S$${stats.avgPrice}` : '—'} l="Avg Price" />
      <StatCard v={stats.count2016 || 0} l="2016 Bottles" />
      <StatCard v={stats.count2018 || 0} l="2018 Bottles" />
      <StatCard v={stats.count2023 || 0} l="2023 Bottles" />
      <StatCard v={stats.drinkSoon} l="Drink Soon" accentColor="#d97706" onClick={() => { setTab('cellar'); setSort('window'); }} />
      <StatCard v={stats.pastPeak} l="Past Peak" accentColor="#dc2626" onClick={() => { setTab('cellar'); setSort('window'); }} />
    </div>
  );
}
