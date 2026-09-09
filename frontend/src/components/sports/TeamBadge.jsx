import styles from './TeamBadge.module.css';

export function TeamBadge({ team, size = 'md' }) {
  return (
    <span
      className={`${styles.badge} ${styles[size]}`}
      style={{ '--team-color': team.color }}
      aria-hidden="true"
    >
      {team.short.slice(0, 3)}
    </span>
  );
}
