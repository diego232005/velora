import { Facebook, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { brand } from '../../config/brand';
import { useUi } from '../../context/UiContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { Logo } from '../common/Logo';
import { ResponsibleGamingNotice } from '../common/ResponsibleGamingNotice';
import styles from './Footer.module.css';

export function Footer() {
  const { copy, setLegalDialog } = useUi();

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div>
          <Logo />
          <p className={styles.tagline}>{brand.tagline}</p>
          <div className={styles.social}>
            <a href="#social-instagram" aria-label="Instagram de demostración">
              <Instagram size={18} />
            </a>
            <a href="#social-facebook" aria-label="Facebook de demostración">
              <Facebook size={18} />
            </a>
            <a href="#social-youtube" aria-label="YouTube de demostración">
              <Youtube size={18} />
            </a>
          </div>
        </div>
        <div>
          <h2>Corporativo</h2>
          <ul>
            <li>
              <Link to="/">{brand.name}</Link>
            </li>
            <li>
              <Link to="/carga-masiva">Carga masiva</Link>
            </li>
            <li>
              <button type="button" onClick={() => setLegalDialog('terms')}>
                Términos y condiciones
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setLegalDialog('privacy')}>
                Política de privacidad
              </button>
            </li>
          </ul>
        </div>
        <div>
          <h2>Ayuda</h2>
          <ul>
            <li>
              <a href={`mailto:${brand.supportEmail}`}>Centro de ayuda</a>
            </li>
            <li>
              <button type="button" onClick={() => setLegalDialog('responsible')}>
                Juego responsable
              </button>
            </li>
            <li>
              <span>+{brand.minAge} solamente</span>
            </li>
          </ul>
        </div>
        <div>
          <h2>Idioma</h2>
          <LanguageSelector />
        </div>
      </div>
      <ResponsibleGamingNotice />
      <p className={styles.disclaimer}>
        {copy.demoNotice} {brand.legalEntity}.
      </p>
    </footer>
  );
}
