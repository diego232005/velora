import { X } from 'lucide-react';
import { useUi } from '../../context/UiContext';
import { Logo } from '../common/Logo';
import { SportsNavigation } from '../sports/SportsNavigation';
import styles from './MobileDrawer.module.css';

export function MobileDrawer() {
  const { mobileMenuOpen, setMobileMenuOpen } = useUi();

  if (!mobileMenuOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => setMobileMenuOpen(false)}
    >
      <aside
        className={styles.drawer}
        aria-label="Menú de deportes"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.top}>
          <Logo />
          <button
            type="button"
            className={styles.close}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>
        <SportsNavigation
          orientation="vertical"
          onSelect={() => setMobileMenuOpen(false)}
        />
      </aside>
    </div>
  );
}
