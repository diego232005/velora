import styles from './PasswordStrength.module.css';

export function PasswordStrength({ strength }) {
  return (
    <div className={styles.strength} data-tone={strength.tone} aria-live="polite">
      <span />
      <span />
      <span />
      <small>Seguridad: {strength.label}</small>
    </div>
  );
}
