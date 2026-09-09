import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import styles from './FormMessage.module.css';

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export function FormMessage({ tone = 'info', children }) {
  if (!children) return null;
  const Icon = icons[tone] || Info;

  return (
    <div className={`${styles.message} ${styles[tone]}`} role="status">
      <Icon size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
