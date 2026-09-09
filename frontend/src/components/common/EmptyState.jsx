import styles from './EmptyState.module.css';

export function EmptyState({ title, text, icon: Icon }) {
  return (
    <div className={styles.empty} role="status">
      {Icon && <Icon size={28} aria-hidden="true" />}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}
