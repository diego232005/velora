import { Inbox } from 'lucide-react';
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
import { liveEvents } from '../data/liveEvents';
import { upcomingEvents } from '../data/upcomingEvents';
import styles from './HomePage.module.css';

function bySport(items, sportId) {
  if (sportId === 'all') return items;
  return items.filter((item) => item.sportId === sportId);
}

function groupByLeague(events) {
  return events.reduce((groups, event) => {
    const key = event.leagueName;
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
    return groups;
  }, {});
}

export function HomePage() {
  const { copy, activeSport } = useUi();
  const live = bySport(liveEvents, activeSport);
  const upcoming = bySport(upcomingEvents, activeSport);
  const grouped = groupByLeague(upcoming);

  return (
    <AppLayout>
      <HeroBanner />

      <section className={styles.mobileSports}>
        <SportsNavigation orientation="horizontal" />
      </section>

      <section className={styles.block}>
        <SectionHeader
          eyebrow="Cobertura"
          title={copy.featuredLeagues}
        />
        <LeagueHighlights />
      </section>

      <section className={styles.block} id="en-vivo">
        <SectionHeader eyebrow="Directo" title={copy.live} />
        {live.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No hay eventos en vivo en esta categoría"
            text="Prueba otro deporte o vuelve a Todos para ver la parrilla completa."
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
        {upcoming.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No hay próximos eventos en este filtro"
            text="Cambia de deporte para explorar otra parrilla de demostración."
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
