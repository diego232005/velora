import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { EmptyState } from '../components/common/EmptyState';
import { formatDateTime, formatMoney, formatOdd } from '../utils/format';
import styles from './MyBetsPage.module.css';

const STATUS_LABEL = {
  pendiente: 'Pendiente',
  ganada: 'Ganada',
  perdida: 'Perdida',
  anulada: 'Anulada',
  liquidado: 'Liquidada',
};

export function MyBetsPage() {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await apiRequest('/api/bets/mine', { token });
      if (cancelled) return;
      if (!result.ok) {
        setError(result.data.error || 'No se pudieron cargar tus apuestas.');
        setItems([]);
      } else {
        setError('');
        setWarning(result.data.warning || '');
        setItems(result.data.items || []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <EmptyState
          icon={Ticket}
          title="Inicia sesión"
          text="Debes autenticarte para ver el historial de cupones."
        />
        <p className={styles.centerLink}>
          <Link to="/login">Ir a iniciar sesión</Link>
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Cuenta</p>
            <h1>Mis apuestas</h1>
            <p className={styles.lead}>
              Historial de cupones registrados en el motor (PostgreSQL).
            </p>
          </div>
          <Link to="/" className={styles.back}>
            Seguir apostando
          </Link>
        </header>

        {loading && <p className={styles.meta}>Cargando cupones…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {warning && <p className={styles.warn}>{warning}</p>}

        {!loading && !items.length && !error && (
          <EmptyState
            icon={Ticket}
            title="Aún no tienes apuestas"
            text="Elige cuotas en el home y confirma desde el cupón."
          />
        )}

        <ul className={styles.list}>
          {items.map((bet) => (
            <li key={bet.id_cupon || bet.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <p className={styles.cupon}>Cupón #{bet.id_cupon || bet.id}</p>
                  <span className={styles.tipo}>{bet.tipo}</span>
                </div>
                <span
                  className={`${styles.badge} ${styles[`st_${bet.estado}`] || ''}`}
                >
                  {STATUS_LABEL[bet.estado] || bet.estado}
                </span>
              </div>

              <div className={styles.metrics}>
                <div>
                  <small>Importe</small>
                  <strong>
                    {formatMoney(
                      bet.stake ?? Number(bet.monto_centavos || 0) / 100,
                    )}
                  </strong>
                </div>
                <div>
                  <small>Cuota</small>
                  <strong>
                    {formatOdd(
                      bet.totalOdd ?? Number(bet.cuota_total_millis || 1000) / 1000,
                    )}
                  </strong>
                </div>
                <div>
                  <small>Ganancia potencial</small>
                  <strong className={styles.win}>
                    {formatMoney(
                      bet.potentialWin ??
                        Number(bet.ganancia_potencial_centavos || 0) / 100,
                    )}
                  </strong>
                </div>
              </div>

              {!!bet.legs?.length && (
                <ul className={styles.legs}>
                  {bet.legs.map((leg) => (
                    <li key={`${bet.id_cupon}-${leg.selectionId}`}>
                      <span>
                        {leg.matchLabel || leg.market} · {leg.label}
                        {leg.code ? ` (${leg.code})` : ''}
                      </span>
                      <strong>{formatOdd(leg.odd)}</strong>
                    </li>
                  ))}
                </ul>
              )}

              <p className={styles.meta}>
                {bet.creado_en ? formatDateTime(bet.creado_en) : '—'}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
}
