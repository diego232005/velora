import { API_URL } from '../../api/client';
import styles from './TeamBadge.module.css';

function resolveCrestSrc(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = String(API_URL || '').replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export function TeamBadge({ team, size = 'md' }) {
  const crest = resolveCrestSrc(team?.crestUrl);
  const label = (team?.short || team?.name || '?').slice(0, 3);

  return (
    <span
      className={`${styles.badge} ${styles[size]}`}
      style={{ '--team-color': team?.color || '#3ef0ff' }}
      aria-hidden="true"
    >
      {crest ? (
        <span className={styles.crestWrap}>
          <img className={styles.crest} src={crest} alt="" loading="lazy" />
        </span>
      ) : (
        label
      )}
    </span>
  );
}
