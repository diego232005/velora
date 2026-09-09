import { Link } from 'react-router-dom';
import { brand } from '../../config/brand';
import styles from './Logo.module.css';

function Mark() {
  return (
    <svg
      className={styles.mark}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="10" className={styles.markBg} />
      <path
        d="M8 9.5h5.8L18 22.4 22.2 9.5H28L20.3 27h-4.6L8 9.5Z"
        className={styles.markLetter}
      />
      <rect x="22.6" y="24" width="6" height="2.6" rx="1.3" className={styles.markAccent} />
    </svg>
  );
}

export function Logo({ to = '/', compact = false, as = 'link' }) {
  const content = (
    <>
      <Mark />
      {!compact && (
        <span className={styles.wordmark}>
          <span className={styles.name}>{brand.name}</span>
          <span className={styles.short}>{brand.shortName}</span>
        </span>
      )}
    </>
  );

  if (as === 'span') {
    return <span className={styles.logo}>{content}</span>;
  }

  return (
    <Link to={to} className={styles.logo} aria-label={`${brand.name}, ir al inicio`}>
      {content}
    </Link>
  );
}
