import { Search } from 'lucide-react';
import { useUi } from '../../context/UiContext';
import styles from './SearchButton.module.css';

export function SearchButton() {
  const { copy, setSearchOpen } = useUi();

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setSearchOpen(true)}
      aria-label={copy.search}
    >
      <Search size={18} aria-hidden="true" />
      <span className={styles.label}>{copy.search}</span>
    </button>
  );
}
