import { useState } from 'react';
import { Clock, Plus, Star } from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import { OddButton } from './OddButton';
import { TeamBadge } from './TeamBadge';
import styles from './MatchCard.module.css';

export function MatchCard({ event }) {
  const [favorite, setFavorite] = useState(event.isFavorite);

  return (
    <article className={styles.card} id={`event-${event.id}`}>
      <div className={styles.meta}>
        <span>
          <Clock size={14} aria-hidden="true" />
          {formatDateTime(event.startsAt)}
        </span>
        <button
          type="button"
          className={`${styles.fav} ${favorite ? styles.on : ''}`}
          onClick={() => setFavorite((current) => !current)}
          aria-pressed={favorite}
          aria-label={favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        >
          <Star size={16} />
        </button>
      </div>

      <div className={styles.teams}>
        <div>
          <TeamBadge team={event.homeTeam} size="sm" />
          <span>{event.homeTeam.name}</span>
        </div>
        <div>
          <TeamBadge team={event.awayTeam} size="sm" />
          <span>{event.awayTeam.name}</span>
        </div>
      </div>

      <div className={styles.market}>
        <small>{event.market}</small>
        <div className={styles.odds}>
          {event.odds.map((odd) => (
            <OddButton key={odd.id} event={event} odd={odd} compact />
          ))}
          <span className={styles.extra}>
            <Plus size={12} aria-hidden="true" />
            {event.extraMarkets}
          </span>
        </div>
      </div>
    </article>
  );
}
