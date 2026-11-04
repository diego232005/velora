import { useEffect, useState } from 'react';
import { Inbox, Radio } from 'lucide-react';
import { apiRequest } from '../api/client';
import { AiInsights } from '../components/home/AiInsights';
import { HeroBanner } from '../components/home/HeroBanner';
import { LeagueHighlights } from '../components/home/LeagueHighlights';
import { PromotionalBanner } from '../components/home/PromotionalBanner';
import { EmptyState } from '../components/common/EmptyState';
import { SectionHeader } from '../components/common/SectionHeader';
import { AppLayout } from '../components/layout/AppLayout';
import { LeagueSection } from '../components/sports/LeagueSection';
import { LiveEventCard } from '../components/sports/LiveEventCard';
import { SportsNavigation } from '../components/sports/SportsNavigation';
import { useUi } from '../context/UiContext';
import { useOddsSocket } from '../hooks/useOddsSocket';
import styles from './HomePage.module.css';

function groupByLeague(events) {
  return events.reduce((groups, event) => {
    const key = event.leagueName || 'Liga BetPlay';
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
    return groups;
  }, {});
}

export function HomePage() {
  const { copy } = useUi();
  const { connected } = useOddsSocket(['odds', 'matches']);
  const [live, setLive] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [liveRes, upRes] = await Promise.all([
          apiRequest('/api/sports/matches?status=live'),
          apiRequest('/api/sports/matches?status=upcoming'),
        ]);
        if (cancelled) return;
        if (!liveRes.ok && !upRes.ok) {
          setError(
            liveRes.data.error || upRes.data.error || 'No se pudieron cargar partidos.',
          );
          setLive([]);
          setUpcoming([]);
        } else {
          setError('');
          setLive(liveRes.data.items || []);
          setUpcoming(upRes.data.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Error de red.');
          setLive([]);
          setUpcoming([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = groupByLeague(upcoming);

  return (
    <AppLayout>
      <HeroBanner />

      <div className={styles.liveStatus} aria-live="polite">
        <Radio size={14} aria-hidden />
        <span>{connected ? 'Feed en tiempo real conectado' : 'Feed WS en espera'}</span>
      </div>

      <section className={styles.mobileSports}>
        <SportsNavigation orientation="horizontal" />
      </section>

      <section className={styles.block}>
        <SectionHeader eyebrow="Cobertura" title={copy.featuredLeagues} />
        <LeagueHighlights />
      </section>

      <AiInsights />

      <section className={styles.block} id="en-vivo">
        <SectionHeader eyebrow="Directo" title={copy.live} />
        {loading ? (
          <EmptyState icon={Inbox} title="Cargando partidos…" text="Consultando la API Velora." />
        ) : error ? (
          <EmptyState icon={Inbox} title="Sin conexión a partidos" text={error} />
        ) : live.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No hay partidos en vivo"
            text="Datos Liga BetPlay vía MySQL. Ningún partido en estado En vivo."
          />
        ) : (
          <div className={styles.liveRail}>
            {live.map((event) => (
              <LiveEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className={styles.block}>
        <SectionHeader eyebrow="Calendario" title={copy.upcoming} />
        {!loading && !error && upcoming.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No hay próximos partidos programados"
            text="Revisa el seed MySQL o sincroniza el motor PostgreSQL."
          />
        ) : (
          Object.entries(grouped).map(([leagueName, events]) => (
            <LeagueSection key={leagueName} title={leagueName} events={events} />
          ))
        )}
      </section>

      <section className={styles.block}>
        <SectionHeader eyebrow="Ofertas" title={copy.promotions} />
        <PromotionalBanner />
      </section>
    </AppLayout>
  );
}
