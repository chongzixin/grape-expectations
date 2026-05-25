import type { Wine, NewWineForm } from '../types';

interface DuplicateWineModalProps {
  match: Wine;
  form: NewWineForm;
  onMerge: () => void;
  onAddAsNew: () => void;
  onCancel: () => void;
}

export function DuplicateWineModal({ match, form, onMerge, onAddAsNew, onCancel }: DuplicateWineModalProps) {
  const addQty   = parseInt(form.inventory) || 1;
  const addPrice = form.price ? parseFloat(form.price) : null;
  const newInventory = match.inventory + addQty;

  let mergedPrice: number | null;
  if (match.price != null && addPrice != null) {
    mergedPrice = Math.round(((match.price * match.inventory + addPrice * addQty) / newInventory) * 100) / 100;
  } else {
    mergedPrice = match.price ?? addPrice;
  }

  const pricePreview = (() => {
    if (match.price != null && addPrice != null) {
      return `S$${Number.isInteger(mergedPrice) ? mergedPrice : mergedPrice?.toFixed(2)} (weighted avg of S$${match.price} + S$${addPrice})`;
    }
    if (mergedPrice != null) {
      return `S$${Number.isInteger(mergedPrice) ? mergedPrice : mergedPrice?.toFixed(2)}`;
    }
    return 'unset';
  })();

  return (
    <div className="ge-modal-bg" onClick={onCancel}>
      <div className="ge-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="ge-modal-ttl" style={{ marginBottom: 0 }}>Duplicate Found</div>
          <button className="ge-btn btn-o" onClick={onCancel} style={{ padding: '4px 10px', fontSize: 'var(--fs-sm)' }}>✕</button>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', marginBottom: 16 }}>
          A wine with a similar name, winery, and vintage is already in your cellar:
        </p>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: 'var(--parch)', fontSize: 'var(--fs-base)' }}>
            {match.winery ? `${match.winery} — ` : ''}{match.name}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>
            {match.vintage || 'NV'} · {match.inventory} bottle{match.inventory !== 1 ? 's' : ''} in cellar
            {match.price != null ? ` · S$${Number.isInteger(match.price) ? match.price : match.price.toFixed(2)}` : ''}
          </div>
        </div>

        <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 8, padding: '10px 14px', marginBottom: 24, fontSize: 'var(--fs-sm)', color: 'var(--parch)' }}>
          <strong style={{ color: 'var(--gold)' }}>If you merge: </strong>
          {newInventory} bottle{newInventory !== 1 ? 's' : ''} total · price {pricePreview}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="ge-btn btn-g" style={{ width: '100%', justifyContent: 'center' }} onClick={onMerge}>
            ✦ Merge — update existing entry
          </button>
          <button className="ge-btn btn-o" style={{ width: '100%', justifyContent: 'center' }} onClick={onAddAsNew}>
            Add as separate entry
          </button>
          <button className="ge-btn btn-o" style={{ width: '100%', justifyContent: 'center' }} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
