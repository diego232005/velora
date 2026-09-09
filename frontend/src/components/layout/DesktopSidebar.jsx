import { SportsNavigation } from '../sports/SportsNavigation';
import styles from './DesktopSidebar.module.css';

export function DesktopSidebar() {
  return (
    <aside className={styles.sidebar} aria-label="Deportes">
      <p className={styles.label}>Deportes</p>
      <SportsNavigation orientation="vertical" />
    </aside>
  );
}
