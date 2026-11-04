import { Home, Radio, Ticket, UserPlus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBetSlip } from '../../context/BetSlipContext';
import { useUi } from '../../context/UiContext';
import styles from './MobileNavigation.module.css';

export function MobileNavigation() {
  const { copy } = useUi();
  const { isAuthenticated } = useAuth();
  const { selections, setOpen } = useBetSlip();

  return (
    <nav className={styles.nav} aria-label="Navegación móvil">
      <NavLink to="/" className={styles.item} end>
        <Home size={20} />
        <span>Inicio</span>
      </NavLink>
      <button
        type="button"
        className={styles.item}
        onClick={() => {
          document.getElementById('en-vivo')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <Radio size={20} />
        <span>{copy.live}</span>
      </button>
      <button type="button" className={styles.item} onClick={() => setOpen(true)}>
        <span className={styles.badgeWrap}>
          <Ticket size={20} />
          {selections.length > 0 && (
            <span className={styles.badge}>{selections.length}</span>
          )}
        </span>
        <span>{copy.betSlip}</span>
      </button>
      {isAuthenticated ? (
        <NavLink to="/mis-apuestas" className={styles.item}>
          <Ticket size={20} />
          <span>{copy.myBets || 'Mis apuestas'}</span>
        </NavLink>
      ) : (
        <NavLink to="/register" className={styles.item}>
          <UserPlus size={20} />
          <span>{copy.register}</span>
        </NavLink>
      )}
    </nav>
  );
}
