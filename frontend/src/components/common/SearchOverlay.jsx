import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { liveEvents } from '../../data/liveEvents';
import { upcomingEvents } from '../../data/upcomingEvents';
import { useUi } from '../../context/UiContext';
import styles from './SearchOverlay.module.css';

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, copy } = useUi();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    return [...liveEvents, ...upcomingEvents].filter((event) => {
      const haystack = [
        event.leagueName,
        event.homeTeam.name,
        event.awayTeam.name,
        event.market,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [query]);

  if (!searchOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.top}>
          <h2 id="search-title">Buscar</h2>
          <button
            type="button"
            className={styles.close}
            onClick={() => setSearchOpen(false)}
            aria-label="Cerrar buscador"
          >
            <X size={18} />
          </button>
        </div>
        <label className={styles.field}>
          <Search size={18} aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
          />
        </label>
        <ul className={styles.results}>
          {results.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                className={styles.result}
                onClick={() => {
                  setSearchOpen(false);
                  document
                    .getElementById(`event-${event.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <span>
                  {event.homeTeam.name} vs {event.awayTeam.name}
                </span>
                <small>{event.leagueName}</small>
              </button>
            </li>
          ))}
        </ul>
        {query.trim().length >= 2 && results.length === 0 && (
          <p className={styles.empty}>No hay coincidencias en los datos de demostración.</p>
        )}
      </div>
    </div>
  );
}
