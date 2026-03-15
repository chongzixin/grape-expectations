export interface DonutSegment { label: string; value: number; color: string; }

export function DonutChart({ data }: { data: DonutSegment[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>No data</div>;
  const cx = 55, cy = 55, R = 42, r = 26;
  let angle = -Math.PI / 2;
  const segments = data.filter(d => d.value > 0).map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const sa = angle, ea = angle + sweep;
    angle = ea;
    const largeArc = sweep > Math.PI ? 1 : 0;
    const ox1 = cx + R * Math.cos(sa), oy1 = cy + R * Math.sin(sa);
    const ox2 = cx + R * Math.cos(ea), oy2 = cy + R * Math.sin(ea);
    const ix1 = cx + r * Math.cos(sa), iy1 = cy + r * Math.sin(sa);
    const ix2 = cx + r * Math.cos(ea), iy2 = cy + r * Math.sin(ea);
    return { ...d, path: `M${ox1},${oy1} A${R},${R} 0 ${largeArc} 1 ${ox2},${oy2} L${ix2},${iy2} A${r},${r} 0 ${largeArc} 0 ${ix1},${iy1}Z` };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
        {segments.map(s => <path key={s.label} d={s.path} fill={s.color} />)}
      </svg>
      <div style={{ flex: 1 }}>
        {data.filter(d => d.value > 0).map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, fontSize: 'var(--fs-sm)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--parch)', flex: 1 }}>{d.label}</span>
            <span style={{ color: 'var(--muted)' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
