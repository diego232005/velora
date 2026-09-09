import { formatOdd } from '../../utils/format';
import { useBetSlip } from '../../context/BetSlipContext';
import styles from './OddButton.module.css';

export function OddButton({ event, odd, compact = false }) {
  const { addSelection, isSelected } = useBetSlip();
  const selected = isSelected(odd.id);

  return (
    <button
      type="button"
      className={`${styles.odd} ${compact ? styles.compact : ''} ${selected ? styles.selected : ''}`}
      onClick={() =>
        addSelection({
          oddId: odd.id,
          eventId: event.id,
          label: `${event.homeTeam.short} vs ${event.awayTeam.short}`,
          pick: odd.label,
          market: event.market,
          leagueName: event.leagueName,
          odd: odd.value,
        })
      }
      aria-pressed={selected}
      aria-label={`Cuota ${odd.label} ${formatOdd(odd.value)}`}
    >
      <span>{odd.label}</span>
      <strong>{formatOdd(odd.value)}</strong>
    </button>
  );
}
