import { Link } from 'react-router-dom';
import styles from './Buttons.module.css';

export function PrimaryButton({
  children,
  type = 'button',
  disabled = false,
  fullWidth = false,
  ariaLabel,
  onClick,
  to,
}) {
  const className = `${styles.button} ${styles.primary} ${fullWidth ? styles.full : ''}`;

  if (to) {
    return (
      <Link to={to} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
