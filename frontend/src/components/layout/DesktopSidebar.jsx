import { SportsSidebar } from '../sports/SportsSidebar';
import styles from './DesktopSidebar.module.css';

export function DesktopSidebar() {
  return (
    <aside className={styles.sidebar} aria-label="Navegación de apuestas">
      <SportsSidebar />
    </aside>
  );
}
