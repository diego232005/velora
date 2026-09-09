import { BetSlip } from '../betting/BetSlip';
import { LegalDialog } from '../common/LegalDialog';
import { SearchOverlay } from '../common/SearchOverlay';
import { DesktopSidebar } from './DesktopSidebar';
import { Footer } from './Footer';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';
import { MobileNavigation } from './MobileNavigation';
import styles from './AppLayout.module.css';

export function AppLayout({ children }) {
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#contenido-principal">
        Saltar al contenido
      </a>
      <Header />
      <div className={styles.body}>
        <DesktopSidebar />
        <main className={styles.main} id="contenido-principal">
          {children}
        </main>
        <BetSlip />
      </div>
      <Footer />
      <MobileNavigation />
      <MobileDrawer />
      <SearchOverlay />
      <LegalDialog />
    </div>
  );
}
