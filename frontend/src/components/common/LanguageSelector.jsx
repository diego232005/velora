import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { languages } from '../../config/i18n';
import { useUi } from '../../context/UiContext';
import styles from './LanguageSelector.module.css';

export function LanguageSelector({ compact = false }) {
  const { language, setLanguage } = useUi();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const current = languages.find((item) => item.code === language) || languages[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={16} aria-hidden="true" />
        <span>{compact ? current.short : current.label}</span>
        <ChevronDown size={14} aria-hidden="true" className={open ? styles.chevronOpen : ''} />
      </button>

      {open && (
        <ul
          id={listId}
          className={styles.menu}
          role="listbox"
          aria-label="Idioma"
        >
          {languages.map((item) => {
            const selected = item.code === language;
            return (
              <li key={item.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`${styles.option} ${selected ? styles.optionActive : ''}`}
                  onClick={() => {
                    setLanguage(item.code);
                    setOpen(false);
                  }}
                >
                  <span className={styles.optionCode}>{item.short}</span>
                  <span className={styles.optionLabel}>{item.label}</span>
                  {selected && <Check size={14} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
