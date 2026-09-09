import { Shield } from 'lucide-react';
import { brand } from '../../config/brand';
import styles from './ResponsibleGamingNotice.module.css';

export function ResponsibleGamingNotice({ compact = false }) {
  return (
    <aside className={`${styles.notice} ${compact ? styles.compact : ''}`}>
      <Shield size={18} aria-hidden="true" />
      <p>
        {compact
          ? `+${brand.minAge}. Juego responsable. Demostración visual, sin dinero real.`
          : `Servicio exclusivo para mayores de ${brand.minAge} años. Juega con responsabilidad. Esta interfaz es una maquetación de demostración y no opera apuestas reales.`}
      </p>
    </aside>
  );
}
