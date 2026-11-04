import { Sparkles, TrendingUp } from 'lucide-react';
import styles from './AiInsights.module.css';

/** Panel visual de demostración — no son predicciones reales ni modelo entrenado. */
const DEMO_INSIGHTS = [
  {
    id: 'i1',
    title: 'Momentum local',
    text: 'Señal visual de ejemplo sobre partidos BetPlay en vivo.',
    confidence: 'Demo',
  },
  {
    id: 'i2',
    title: 'Volatilidad de cuota',
    text: 'Indicador simulado; las cuotas reales vienen del backend.',
    confidence: 'Demo',
  },
];

export function AiInsights() {
  return (
    <section className={styles.panel} aria-labelledby="ai-insights-title">
      <header className={styles.header}>
        <Sparkles size={18} aria-hidden />
        <div>
          <p className={styles.eyebrow}>Neural desk</p>
          <h2 id="ai-insights-title">AI Insights</h2>
        </div>
        <span className={styles.badge}>Solo demostración UI</span>
      </header>
      <ul className={styles.list}>
        {DEMO_INSIGHTS.map((item) => (
          <li key={item.id} className={styles.card}>
            <TrendingUp size={16} aria-hidden />
            <div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
            <em>{item.confidence}</em>
          </li>
        ))}
      </ul>
    </section>
  );
}
