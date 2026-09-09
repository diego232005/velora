import { SectionHeader } from '../common/SectionHeader';
import { MatchCard } from './MatchCard';
import styles from './LeagueSection.module.css';

export function LeagueSection({ title, events }) {
  if (!events.length) return null;

  return (
    <section className={styles.section}>
      <SectionHeader title={title} eyebrow="Liga" />
      <div className={styles.list}>
        {events.map((event) => (
          <MatchCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
