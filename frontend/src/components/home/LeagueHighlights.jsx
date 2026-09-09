import { leagues } from '../../data/leagues';
import { useUi } from '../../context/UiContext';
import styles from './LeagueHighlights.module.css';

export function LeagueHighlights() {
  const { setActiveSport } = useUi();

  return (
    <div className={styles.grid}>
      {leagues.map((league) => (
        <button
          key={league.id}
          type="button"
          className={styles.card}
          style={{ '--league-accent': league.accent }}
          onClick={() => setActiveSport(league.sportId)}
        >
          <span>{league.eventCount} eventos</span>
          <strong>{league.name}</strong>
        </button>
      ))}
    </div>
  );
}
