import { Globe } from 'lucide-react';
import { languages } from '../../config/i18n';
import { useUi } from '../../context/UiContext';
import styles from './LanguageSelector.module.css';

export function LanguageSelector({ compact = false }) {
  const { language, setLanguage } = useUi();

  return (
    <label className={styles.wrap}>
      <span className="visually-hidden">Idioma</span>
      <Globe size={16} aria-hidden="true" />
      <select
        className={styles.select}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label="Seleccionar idioma"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {compact ? item.short : item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
