import { sports } from '../../data/sports';
import { useUi } from '../../context/UiContext';
import { SportIcon } from './SportIcon';
import styles from './SportsNavigation.module.css';

export function SportsNavigation({ orientation = 'horizontal', onSelect }) {
  const { activeSport, setActiveSport } = useUi();
  const items = [{ id: 'all', name: 'Todos', icon: 'all', eventCount: null }, ...sports];

  return (
    <nav
      className={`${styles.nav} ${orientation === 'vertical' ? styles.vertical : styles.horizontal}`}
      aria-label="Filtrar por deporte"
    >
      {items.map((sport) => {
        const selected = activeSport === sport.id;
        return (
          <button
            key={sport.id}
            type="button"
            className={`${styles.item} ${selected ? styles.selected : ''} ${sport.featured ? styles.featured : ''}`}
            onClick={() => {
              setActiveSport(sport.id);
              onSelect?.(sport.id);
            }}
            aria-pressed={selected}
          >
            <SportIcon name={sport.icon} />
            <span className={styles.name}>{sport.name}</span>
            {sport.eventCount != null && (
              <span className={styles.count}>{sport.eventCount}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
