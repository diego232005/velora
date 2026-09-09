import { brand } from '../../config/brand';
import { LegalDialog } from '../common/LegalDialog';
import { Logo } from '../common/Logo';
import { ResponsibleGamingNotice } from '../common/ResponsibleGamingNotice';
import styles from './AuthLayout.module.css';

export function AuthLayout({ children, title, subtitle, wide = false }) {
  return (
    <div className={styles.shell}>
      <section className={styles.visual} aria-hidden="true">
        <div className={styles.orb} />
        <div className={styles.orbAlt} />
        <div className={styles.visualContent}>
          <Logo as="span" />
          <p className={styles.slogan}>{brand.slogan}</p>
          <p className={styles.tagline}>{brand.tagline}</p>
          <ul>
            <li>Mercados en vivo de demostración</li>
            <li>Cuotas claras, diseño internacional</li>
            <li>Juego responsable desde el primer clic</li>
          </ul>
        </div>
      </section>
      <main className={styles.panel}>
        <div className={`${styles.card} ${wide ? styles.wide : ''}`}>
          <div className={styles.mobileBrand}>
            <Logo />
          </div>
          <h1>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
          <ResponsibleGamingNotice compact />
        </div>
      </main>
      <LegalDialog />
    </div>
  );
}
