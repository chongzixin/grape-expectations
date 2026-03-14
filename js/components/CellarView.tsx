import { useMemo } from 'react';
import type { Wine } from '../types';
import { FLAGS, TYPE_STYLE, TYPE_STYLE_LIGHT, DRINKING_STATUS_PRIORITY } from '../constants';
import { getDrinkingStatus } from '../utils';
import { DrinkingWindowBadge } from './DrinkingWindowBadge';

interface CellarViewProps {
  wines: Wine[];
  filter: string;
  setFilter: (f: string) => void;
  search: string;
  setSearch: (s: string) => void;
  sort: string;
  setSort: (s: string) => void;
  updateInventory: (id: string, delta: number) => void;
  themeMode: 'light' | 'dark';
}

function Badge({ type, themeMode }: { type: string; themeMode: 'light' | 'dark' }) {
  const palette = themeMode === 'light' ? TYPE_STYLE_LIGHT : TYPE_STYLE;
  const s = palette[type] || palette.Red;
  return <span className="tbadge" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{type}</span>;
}

export function CellarView({
  wines, filter, setFilter, search, setSearch, sort, setSort,
  updateInventory, themeMode,
}: CellarViewProps) {
  const types = useMemo(() =>
    ['All', ...Array.from(new Set(wines.map(w => w.type).filter(Boolean)))],
    [wines]
  );

  const filteredWines = useMemo(() => {
    let ws = [...wines];
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
  }, [wines, filter, search, sort]);

  return (
    <div className="fade">
      <div className="ge-filters">
        {types.map(t => (
          <button key={t} className={`ge-fbtn ${filter === t ? 'on' : ''}`} onClick={() => setFilter(t)}>{t}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="ge-srch" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="ge-sel" value={sort} onChange={e => setSort(e.target.value)}>
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
          <div style={{ fontSize: 'var(--fs-base)', marginTop: 6 }}>Adjust filters or add wines to your cellar.</div>
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
                  <div className="show-m" style={{ marginTop: 4 }}>
                    <DrinkingWindowBadge wine={wine} />
                  </div>
                </td>
                <td className="hide-m">
                  <Badge type={wine.type} themeMode={themeMode} />
                  {wine.style && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 3 }}>{wine.style}</div>}
                </td>
                <td style={{ color: 'var(--parch)', fontSize: 'var(--fs-base)' }}>{wine.vintage || '—'}</td>
                <td className="hide-m" style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>
                  {FLAGS[wine.country] || ''} {wine.subRegion || wine.region || wine.country || '—'}
                </td>
                <td className="hide-m" style={{ fontSize: 'var(--fs-base)', color: wine.price ? 'var(--gold)' : 'var(--dim)' }}>
                  {wine.price ? `S$${Number.isInteger(wine.price) ? wine.price : wine.price.toFixed(2)}` : '—'}
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
  );
}
