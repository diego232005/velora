import { promotions } from '../../data/promotions';
import styles from './PromotionalBanner.module.css';

export function PromotionalBanner() {
  return (
    <div className={styles.grid}>
      {promotions.map((promo) => (
        <article key={promo.id} className={`${styles.card} ${styles[promo.tone]}`}>
          <span>{promo.badge}</span>
          <h3>{promo.title}</h3>
          <p>{promo.text}</p>
          <small>Aplican términos y condiciones. Promoción ficticia de demostración.</small>
        </article>
      ))}
    </div>
  );
}
