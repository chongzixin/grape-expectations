import type { Wine } from '../types';
import { BADGE_STYLES } from '../constants';
import { getDrinkingStatus } from '../utils';

export function DrinkingWindowBadge({ wine }: { wine: Wine }) {
  const status = getDrinkingStatus(wine);
  const { background, color, label } = BADGE_STYLES[status];
  const windowText = wine.drinkFrom || wine.drinkBy
    ? `${wine.drinkFrom ?? '?'}–${wine.drinkBy ?? '?'}`
    : null;
  return (
    <span
      title={windowText ?? 'No window data'}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: 600,
        background,
        color,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {label}
      {windowText && (
        <span style={{ fontWeight: 400, marginLeft: 4, opacity: 0.85 }}>{windowText}</span>
      )}
    </span>
  );
}
