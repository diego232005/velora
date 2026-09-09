import { Plus } from 'lucide-react';
import { sports } from '../../data/sports';
import { SportIcon } from './SportIcon';
import { TeamBadge } from './TeamBadge';
import { OddButton } from './OddButton';
import styles from './LiveEventCard.module.css';

export function LiveEventCard({ event }) {
  const sport = sports.find((item) => item.id === event.sportId);

  return (
    <article className={styles.card} id={`event-${event.id}`}>
      <header className={styles.top}>
        <span className={styles.live}>
          <span className={styles.pulse} />
          En vivo
        </span>
        <span className={styles.meta}>
          <SportIcon name={sport?.icon} size={14} />
          {sport?.name} · {event.leagueName}
        </span>
      </header>

      <div className={styles.scoreboard}>
        <div className={styles.team}>
          <TeamBadge team={event.homeTeam} />
          <span>{event.homeTeam.name}</span>
        </div>
        <div className={styles.score}>
          <strong>
            {event.score.home} - {event.score.away}
          </strong>
          <small>
            {event.period} · {event.clock}
          </small>
        </div>
        <div className={`${styles.team} ${styles.away}`}>
          <span>{event.awayTeam.name}</span>
          <TeamBadge team={event.awayTeam} />
        </div>
      </div>

      <div className={styles.odds}>
        {event.odds.map((odd) => (
          <OddButton key={odd.id} event={event} odd={odd} />
        ))}
        <span className={styles.markets} title="Mercados adicionales de demostración">
          <Plus size={14} aria-hidden="true" />
          {event.extraMarkets}
        </span>
      </div>
    </article>
  );
}
