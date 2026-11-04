import { useState } from 'react';
import {
  Award,
  ChevronDown,
  Heart,
  Layers,
  Plus,
  Star,
  Ticket,
  Trophy,
} from 'lucide-react';
import {
  allSportsDemo,
  favoriteCompetitions,
  quickAccess,
} from '../../data/sidebarDemo';
import { SportIcon } from './SportIcon';
import styles from './SportsSidebar.module.css';

const quickIcons = {
  ticket: Ticket,
  trophy: Trophy,
  special: Layers,
  medal: Award,
};

/**
 * Sidebar estilo Betano adaptado a Velora cyber-neon.
 * Favoritos y “todos los deportes” son solo visuales (demo UI).
 */
export function SportsSidebar({ onNavigate }) {
  const [favOpen, setFavOpen] = useState(true);
  const [sportsOpen, setSportsOpen] = useState(true);
  const [checked, setChecked] = useState(() => new Set(['primera-a']));
  const [activeQuick, setActiveQuick] = useState('top');
  const [activeSport, setActiveSport] = useState('football');

  const toggleCheck = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.root}>
      <section className={styles.quick} aria-label="Accesos rápidos">
        {quickAccess.map((item) => {
          const Icon = quickIcons[item.icon] || Ticket;
          const active = activeQuick === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.quickItem} ${active ? styles.quickActive : ''}`}
              onClick={() => {
                setActiveQuick(item.id);
                onNavigate?.(item.id);
              }}
            >
              <span className={styles.quickIcon}>
                <Icon size={18} aria-hidden />
              </span>
              <span className={styles.quickLabel}>{item.label}</span>
            </button>
          );
        })}
      </section>

      <section className={styles.block} aria-label="Competencias favoritas">
        <header className={styles.blockHead}>
          <button
            type="button"
            className={styles.blockToggle}
            aria-expanded={favOpen}
            onClick={() => setFavOpen((v) => !v)}
          >
            <span>
              <Star size={12} aria-hidden />
              Competencias favoritas
            </span>
            <ChevronDown
              size={16}
              className={favOpen ? styles.chevronOpen : styles.chevron}
              aria-hidden
            />
          </button>
          <button
            type="button"
            className={styles.plus}
            aria-label="Añadir favorito (demo)"
            title="Demo visual"
          >
            <Plus size={14} />
          </button>
        </header>

        {favOpen && (
          <ul className={styles.favList}>
            {favoriteCompetitions.map((comp, index) => {
              const on = checked.has(comp.id);
              return (
                <li
                  key={comp.id}
                  className={`${styles.favRow} ${index % 2 ? styles.favAlt : ''}`}
                >
                  <button
                    type="button"
                    className={styles.favMain}
                    onClick={() => onNavigate?.(comp.id)}
                  >
                    <span className={styles.favIcon}>
                      <SportIcon name={comp.sportIcon} size={16} />
                    </span>
                    <span className={styles.favText}>
                      <strong>{comp.name}</strong>
                      <small>{comp.region}</small>
                    </span>
                  </button>
                  <label className={styles.check} title="Solo visual">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleCheck(comp.id)}
                      aria-label={`Marcar ${comp.name} (demo)`}
                    />
                    <span />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={styles.block} aria-label="Todos los deportes">
        <header className={styles.blockHead}>
          <button
            type="button"
            className={styles.blockToggle}
            aria-expanded={sportsOpen}
            onClick={() => setSportsOpen((v) => !v)}
          >
            <span>
              <Heart size={12} aria-hidden />
              Deportes
            </span>
            <ChevronDown
              size={16}
              className={sportsOpen ? styles.chevronOpen : styles.chevron}
              aria-hidden
            />
          </button>
        </header>

        {sportsOpen && (
          <ul className={styles.sportList}>
            {allSportsDemo.map((sport) => {
              const selected = activeSport === sport.id;
              return (
                <li key={sport.id}>
                  <button
                    type="button"
                    className={`${styles.sportItem} ${selected ? styles.sportActive : ''}`}
                    onClick={() => {
                      setActiveSport(sport.id);
                      onNavigate?.(sport.id);
                    }}
                  >
                    <span className={styles.sportIcon}>
                      <SportIcon name={sport.icon} size={18} />
                    </span>
                    <span className={styles.sportName}>{sport.name}</span>
                    <span className={styles.sportCount}>{sport.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className={styles.demoHint}>Menú demo · sin filtro real</p>
    </div>
  );
}
