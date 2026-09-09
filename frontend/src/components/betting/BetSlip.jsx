import { Ticket, Trash2, X } from 'lucide-react';
import { useBetSlip } from '../../context/BetSlipContext';
import { formatMoney, formatOdd } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';
import { FormMessage } from '../common/FormMessage';
import { PrimaryButton } from '../common/PrimaryButton';
import styles from './BetSlip.module.css';

export function BetSlip() {
  const {
    selections,
    stake,
    setStake,
    open,
    setOpen,
    demoMessage,
    removeSelection,
    clearSelections,
    placeDemoBet,
    totalOdd,
    potentialWin,
  } = useBetSlip();

  return (
    <>
      <aside className={`${styles.panel} ${open ? styles.open : ''}`} aria-label="Cupón de apuestas">
        <header className={styles.header}>
          <div>
            <p>Cupón</p>
            <strong>
              {selections.length} {selections.length === 1 ? 'selección' : 'selecciones'}
            </strong>
          </div>
          <div className={styles.headerActions}>
            {selections.length > 0 && (
              <button type="button" onClick={clearSelections}>
                Vaciar
              </button>
            )}
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Cerrar cupón"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {selections.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="El cupón está vacío"
            text="Toca una cuota para añadir una selección de demostración."
          />
        ) : (
          <ul className={styles.list}>
            {selections.map((item) => (
              <li key={item.oddId} className={styles.item}>
                <div>
                  <small>{item.leagueName}</small>
                  <p>{item.label}</p>
                  <span>
                    {item.market} · {item.pick}
                  </span>
                </div>
                <div className={styles.itemSide}>
                  <strong>{formatOdd(item.odd)}</strong>
                  <button
                    type="button"
                    onClick={() => removeSelection(item.oddId)}
                    aria-label={`Eliminar ${item.pick}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.summary}>
          <label htmlFor="stake">
            Importe
            <input
              id="stake"
              type="number"
              min="1"
              step="1"
              value={stake}
              onChange={(event) => setStake(event.target.value)}
            />
          </label>
          <div>
            <span>Cuota total</span>
            <strong>{formatOdd(totalOdd || 1)}</strong>
          </div>
          <div>
            <span>Ganancia potencial</span>
            <strong>{formatMoney(potentialWin)}</strong>
          </div>
          <PrimaryButton fullWidth onClick={placeDemoBet}>
            Apostar ahora
          </PrimaryButton>
          <FormMessage tone="info">{demoMessage}</FormMessage>
        </div>
      </aside>

      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen(true)}
        aria-label="Abrir cupón de apuestas"
      >
        <Ticket size={18} />
        Cupón
        {selections.length > 0 && <span>{selections.length}</span>}
      </button>
    </>
  );
}
