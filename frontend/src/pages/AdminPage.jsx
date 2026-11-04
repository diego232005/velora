import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Gavel, Inbox } from 'lucide-react';
import { apiRequest } from '../api/client';
import { AppLayout } from '../components/layout/AppLayout';
import { EmptyState } from '../components/common/EmptyState';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { TeamBadge } from '../components/sports/TeamBadge';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/format';
import styles from './AdminPage.module.css';

export function AdminPage() {
  const { token, isAuthenticated, user, refreshBalance } = useAuth();
  const [items, setItems] = useState([]);
  const [scores, setScores] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await apiRequest('/api/admin/matches', { token });
    if (!res.ok) {
      setMessage(res.data.error || 'No se pudieron cargar partidos.');
      setItems([]);
    } else {
      setMessage('');
      setItems(res.data.items || []);
      const next = {};
      for (const m of res.data.items || []) {
        next[m.id] = {
          home: m.homeScore ?? 0,
          away: m.awayScore ?? 0,
        };
      }
      setScores(next);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token && user?.isAdmin) load();
  }, [token, user?.isAdmin]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) {
    return (
      <AppLayout>
        <EmptyState
          icon={Gavel}
          title="Acceso admin"
          text="Inicia sesión con admin@velora.example para liquidar partidos."
        />
      </AppLayout>
    );
  }

  const settle = async (matchId) => {
    const sc = scores[matchId] || { home: 0, away: 0 };
    setBusyId(matchId);
    setMessage(`Liquidando partido #${matchId}…`);
    const res = await apiRequest(`/api/admin/matches/${matchId}/settle`, {
      method: 'POST',
      token,
      body: JSON.stringify({
        homeScore: Number(sc.home),
        awayScore: Number(sc.away),
      }),
    });
    setBusyId(null);
    if (!res.ok) {
      setMessage(res.data.error || 'Error al liquidar.');
      return;
    }
    setMessage(
      `OK #${matchId}: ${res.data.homeScore}-${res.data.awayScore} (${res.data.winnerLabel}). ` +
        `Ganadas ${res.data.paidCount}, perdidas ${res.data.lostCount}.`,
    );
    await load();
    await refreshBalance();
  };

  return (
    <AppLayout>
      <section className={styles.wrap}>
        <header className={styles.head}>
          <h1>Panel admin — liquidar partidos</h1>
          <p>
            Define el marcador final. Las apuestas 1X2 ganadoras reciben la ganancia
            potencial; las perdedoras ya tenían el stake descontado al apostar.
          </p>
        </header>

        {message ? <p className={styles.msg}>{message}</p> : null}

        {loading ? (
          <EmptyState icon={Inbox} title="Cargando…" text="Partidos desde MySQL." />
        ) : items.length === 0 ? (
          <EmptyState icon={Inbox} title="Sin partidos" text="No hay filas en partido." />
        ) : (
          <ul className={styles.list}>
            {items.map((m) => (
              <li key={m.id} className={styles.card}>
                <div className={styles.meta}>
                  <span>#{m.id}</span>
                  <span>{formatDateTime(m.startsAt)}</span>
                  <span className={styles.status}>{m.status}</span>
                </div>
                <div className={styles.teams}>
                  <div>
                    <TeamBadge team={m.homeTeam} size="sm" />
                    <span>{m.homeTeam.name}</span>
                  </div>
                  <div>
                    <TeamBadge team={m.awayTeam} size="sm" />
                    <span>{m.awayTeam.name}</span>
                  </div>
                </div>
                <div className={styles.scoreRow}>
                  <label>
                    Local
                    <input
                      type="number"
                      min="0"
                      value={scores[m.id]?.home ?? 0}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [m.id]: {
                            ...prev[m.id],
                            home: e.target.value,
                            away: prev[m.id]?.away ?? 0,
                          },
                        }))
                      }
                    />
                  </label>
                  <span>—</span>
                  <label>
                    Visitante
                    <input
                      type="number"
                      min="0"
                      value={scores[m.id]?.away ?? 0}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [m.id]: {
                            ...prev[m.id],
                            away: e.target.value,
                            home: prev[m.id]?.home ?? 0,
                          },
                        }))
                      }
                    />
                  </label>
                  <PrimaryButton
                    onClick={() => settle(m.id)}
                    disabled={busyId === m.id}
                  >
                    {busyId === m.id ? 'Liquidando…' : 'Liquidar'}
                  </PrimaryButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}
