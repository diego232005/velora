import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { heroSlides } from '../../data/promotions';
import { PrimaryButton } from '../common/PrimaryButton';
import styles from './HeroBanner.module.css';

export function HeroBanner() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const slide = heroSlides[index];

  return (
    <section className={`${styles.hero} ${styles[slide.tone]}`} aria-label="Promoción principal">
      <div className={styles.shapes} aria-hidden="true">
        <span className={styles.ring} />
        <span className={styles.slash} />
      </div>
      <div className={styles.copy}>
        <p className={styles.kicker}>{slide.kicker}</p>
        <h1>{slide.title}</h1>
        <p className={styles.text}>{slide.text}</p>
        <PrimaryButton onClick={() => navigate('/register')}>{slide.cta}</PrimaryButton>
      </div>
      <div className={styles.dots} role="tablist" aria-label="Promociones del banner">
        {heroSlides.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={itemIndex === index}
            className={itemIndex === index ? styles.active : ''}
            onClick={() => setIndex(itemIndex)}
            aria-label={`Mostrar ${item.kicker}`}
          />
        ))}
      </div>
    </section>
  );
}
