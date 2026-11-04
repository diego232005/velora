import { formatOdd } from '../../utils/format';
import { useBetSlip } from '../../context/BetSlipContext';
import styles from './OddButton.module.css';

export function OddButton({ event, odd, compact = false }) {
  const { addSelection, isSelected, setMessage } = useBetSlip();
  const selected = isSelected(odd.id);
  const status = String(event?.status || '').toLowerCase();
  const closed =
    status.includes('vivo') ||
    status.includes('final') ||
    status.includes('aplaz') ||
    status.includes('suspend');

  return (
    <button
      type="button"
      disabled={closed}
      className={`${styles.odd} ${compact ? styles.compact : ''} ${selected ? styles.selected : ''}`}
      onClick={() => {
        if (closed) {
          setMessage?.('Este partido ya no admite apuestas.');
          return;
        }
        addSelection({
          oddId: odd.id,
          eventId: event.id,
          label: `${event.homeTeam.short} vs ${event.awayTeam.short}`,
          pick: odd.label,
          market: event.market,
          leagueName: event.leagueName,
          odd: odd.value,
        });
      }}
      aria-pressed={selected}
      aria-label={`Cuota ${odd.label} ${formatOdd(odd.value)}`}
    >
      <span>{odd.label}</span>
      <strong>{formatOdd(odd.value)}</strong>
    </button>
  );
}
