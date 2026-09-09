import styles from './SectionHeader.module.css';

export function SectionHeader({ eyebrow, title, action }) {
  return (
    <header className={styles.header}>
      <div>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {action}
    </header>
  );
}
