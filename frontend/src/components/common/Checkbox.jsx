import styles from './Field.module.css';

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  error,
  required = false,
  name,
}) {
  return (
    <div className={styles.checkField}>
      <label className={styles.checkLabel} htmlFor={id}>
        <input
          id={id}
          name={name || id}
          className={styles.checkbox}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          required={required}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
