import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { EmptyState } from '../components/common/EmptyState';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { formatMoney } from '../utils/format';
import { bounceTunnelToLocalhost, isTunnelHost } from '../utils/publicHost';
import styles from './WalletPage.module.css';

const WOMPI_WIDGET_SRC = 'https://checkout.wompi.co/widget.js';
const LOCAL_APP_ORIGIN =
  import.meta.env.VITE_LOCAL_ORIGIN || 'http://localhost:5173';

function loadWompiScript() {
  return new Promise((resolve, reject) => {
    if (window.WidgetCheckout) {
      resolve(window.WidgetCheckout);
      return;
    }
    const existing = document.querySelector(`script[src^="${WOMPI_WIDGET_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.WidgetCheckout));
      existing.addEventListener('error', () =>
        reject(new Error('No se pudo cargar widget.js de Wompi.')),
      );
      return;
    }
    const script = document.createElement('script');
    script.src = WOMPI_WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve(window.WidgetCheckout);
    script.onerror = () => reject(new Error('No se pudo cargar widget.js de Wompi.'));
    document.body.appendChild(script);
  });
}

/**
 * Widget & Web Checkout Wompi (Sandbox)
 * @see https://docs.wompi.co/docs/colombia/widget-checkout-web/
 */
export function WalletPage() {
  const { token, isAuthenticated, user, refreshBalance } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [movements, setMovements] = useState([]);
  const [amount, setAmount] = useState('50000');
  const [message, setMessage] = useState('');
  const [bets, setBets] = useState([]);
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(false);
  const checkoutRef = useRef(null);

  const load = async () => {
    if (!token) return;
    const [w, m, b] = await Promise.all([
      apiRequest('/api/wallet/me', { token }),
      apiRequest('/api/wallet/movements', { token }),
      apiRequest('/api/bets/mine', { token }),
    ]);
    if (w.ok) {
      setWallet(w.data.wallet);
      if (w.data.wallet?.warning) setMessage(w.data.wallet.warning);
      await refreshBalance();
    } else {
      setMessage(w.data.error || 'No se pudo cargar la billetera.');
    }
    if (m.ok) {
      setMovements(m.data.items || []);
      if (m.data.warning) setMessage(m.data.warning);
    }
    if (b.ok) {
      setBets(b.data.items || []);
      if (b.data.warning) setMessage(b.data.warning);
    }
  };

  // Retorno Wompi llega al túnel (sin sesión). Rebote a localhost donde sí hay login.
  useEffect(() => {
    if (!isTunnelHost()) return undefined;
    const params = new URLSearchParams(window.location.search);
    const fromWompi = params.has('id');
    if (fromWompi || !isAuthenticated) {
      bounceTunnelToLocalhost(LOCAL_APP_ORIGIN);
    }
    return undefined;
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    if (isTunnelHost()) return undefined;
    const params = new URLSearchParams(window.location.search);
    const txId = params.get('id');
    if (!txId || !token) return undefined;

    let cancelled = false;
    (async () => {
      setMessage(`Confirmando pago Wompi ${txId}…`);
      let savedRef = '';
      try {
        const raw = sessionStorage.getItem('velora.wompiCheckout');
        if (raw) savedRef = JSON.parse(raw)?.reference || '';
      } catch {
        /* ignore */
      }
      const synced = await apiRequest('/api/payments/wompi/sync-transaction', {
        method: 'POST',
        token,
        body: JSON.stringify({
          transactionId: txId,
          reference: savedRef || undefined,
        }),
      });
      if (cancelled) return;
      window.history.replaceState({}, '', '/billetera');
      try {
        sessionStorage.removeItem('velora.wompiCheckout');
      } catch {
        /* ignore */
      }
      if (!synced.ok) {
        setMessage(
          synced.data.error ||
            `No se pudo confirmar ${txId}. Revisa el webhook o usa simulación local.`,
        );
      } else if (synced.data.status && synced.data.status !== 'APPROVED' && !synced.data.credited) {
        setMessage(
          `Wompi: ${synced.data.status}. Ref ${synced.data.reference || '—'}. Aún no se acredita.`,
        );
      } else {
        setMessage(
          synced.data.duplicate
            ? `Pago ya acreditado. Ref ${synced.data.reference}`
            : `Pago acreditado (+${formatMoney(synced.data.amount || 0)}). Ref ${synced.data.reference}`,
        );
      }
      await load();
      await refreshBalance();
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const openWidget = async (session) => {
    try {
      const WidgetCheckout = await loadWompiScript();
      if (!WidgetCheckout) {
        throw new Error('WidgetCheckout no disponible tras cargar el script.');
      }

      const config = {
        currency: session.currency,
        amountInCents: Number(session.amountInCents),
        reference: session.reference,
        publicKey: session.publicKey,
        signature: { integrity: session.signatureIntegrity },
        redirectUrl: session.redirectUrl,
      };
      if (user?.email) {
        config.customerData = {
          email: user.email,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        };
      }

      const instance = new WidgetCheckout(config);
      checkoutRef.current = instance;
      instance.open((result) => {
        const tx = result?.transaction;
        if (tx?.id) {
          setMessage(
            `Transacción ${tx.id} · estado ${tx.status || 'pendiente'}. Si es APPROVED, el webhook acreditará el saldo.`,
          );
          load();
        }
      });
    } catch (error) {
      setMessage(
        `${error.message || 'No se pudo abrir el widget.'} Prueba “Abrir Web Checkout”.`,
      );
    }
  };

  const prepareCheckout = async ({ open = true } = {}) => {
    setMessage('');
    setCheckout(null);
    setLoading(true);

    // Nunca mandar localhost a Wompi: CloudFront responde 403.
    // El backend sustituye por WOMPI_REDIRECT_URL (túnel HTTPS) si hace falta.
    const publicOrigin =
      import.meta.env.VITE_PUBLIC_ORIGIN ||
      (window.location.protocol === 'https:'
        ? window.location.origin
        : '');
    const redirectUrl = publicOrigin
      ? `${publicOrigin.replace(/\/$/, '')}/billetera`
      : undefined;

    const result = await apiRequest('/api/payments/wompi/checkout-session', {
      method: 'POST',
      token,
      body: JSON.stringify({
        amount: Number(amount),
        ...(redirectUrl ? { redirectUrl } : {}),
      }),
    });
    setLoading(false);

    if (!result.ok) {
      setMessage(
        result.data.error ||
          `No se pudo preparar el checkout (HTTP ${result.status}).`,
      );
      return null;
    }

    setCheckout(result.data);
    try {
      sessionStorage.setItem(
        'velora.wompiCheckout',
        JSON.stringify({
          reference: result.data.reference,
          amountInCents: result.data.amountInCents,
          at: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
    setMessage(
      `Checkout listo. Ref ${result.data.reference}. Redirect: ${result.data.redirectUrl}`,
    );
    if (open) {
      await openWidget(result.data);
    }
    return result.data;
  };

  const openWebCheckout = (session = checkout) => {
    if (!session) return;
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = session.checkoutAction || 'https://checkout.wompi.co/p/';
    const fields = {
      'public-key': session.publicKey,
      currency: session.currency,
      'amount-in-cents': String(session.amountInCents),
      reference: session.reference,
      'signature:integrity': session.signatureIntegrity,
      'redirect-url': session.redirectUrl,
    };
    if (user?.email) fields['customer-data:email'] = user.email;
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const payWithWidget = async () => {
    const session = await prepareCheckout({ open: true });
    if (!session) return;
  };

  const payWithWebCheckout = async () => {
    const session = checkout || (await prepareCheckout({ open: false }));
    if (session) openWebCheckout(session);
  };

  const simulateOnly = async () => {
    setMessage('');
    setLoading(true);
    const created = await apiRequest('/api/payments/wompi/deposits', {
      method: 'POST',
      token,
      body: JSON.stringify({ amount: Number(amount), localOnly: true }),
    });
    if (!created.ok) {
      setLoading(false);
      setMessage(created.data.error || 'No se pudo crear el depósito.');
      return;
    }

    const approved = await apiRequest('/api/payments/wompi/simulate-approval', {
      method: 'POST',
      token,
      body: JSON.stringify({ reference: created.data.reference }),
    });
    setMessage(
      approved.ok
        ? `Acreditación local (simulación). Ref ${created.data.reference}`
        : approved.data.error ||
            'Simulación no disponible (¿PostgreSQL arriba? ¿ALLOW_WOMPI_SIMULATION?).',
    );
    setLoading(false);
    await load();
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <EmptyState
          icon={Wallet}
          title="Inicia sesión"
          text="La billetera de simulación requiere autenticación."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className={styles.card}>
        <h1>Billetera de prueba</h1>
        <p className={styles.lead}>
          Saldo simulado en COP. Wompi Sandbox: el botón abre el widget con la API oficial
          (WidgetCheckout). Si falla, usa Web Checkout.
        </p>
        <p className={styles.balance}>
          {wallet ? formatMoney(wallet.balance, wallet.currency) : '…'}
        </p>

        <div className={styles.amountField}>
          <label className={styles.amountLabel} htmlFor="deposit-amount">
            Depósito
          </label>
          <div className={styles.amountControl}>
            <span className={styles.currency} aria-hidden="true">
              COP
            </span>
            <input
              id="deposit-amount"
              className={styles.amountInput}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="50000"
            />
          </div>
          <p className={styles.amountHint}>Mínimo sugerido sandbox: 50.000 COP</p>
        </div>

        <div className={styles.actions}>
          <PrimaryButton type="button" onClick={payWithWidget} disabled={loading}>
            {loading ? 'Preparando…' : 'Pagar con Widget Wompi'}
          </PrimaryButton>

          <PrimaryButton type="button" onClick={payWithWebCheckout} disabled={loading}>
            Abrir Web Checkout Wompi
          </PrimaryButton>

          {checkout && (
            <p className={styles.meta}>
              Ref: {checkout.reference} · {checkout.amountInCents} centavos COP
            </p>
          )}

          <button
            type="button"
            className={styles.simButton}
            onClick={simulateOnly}
            disabled={loading}
          >
            Solo acreditar en local (simulación, sin widget)
          </button>
        </div>

        {message && <p className={styles.message}>{message}</p>}

        <h2 className={styles.sectionTitle}>Movimientos</h2>
        <ul className={styles.list}>
          {movements.map((item) => (
            <li key={item.id}>
              {item.tipo} · {formatMoney(item.monto)} · {item.referencia}
            </li>
          ))}
        </ul>

        <h2 className={styles.sectionTitle}>Mis apuestas</h2>
        <p className={styles.meta}>
          <Link to="/mis-apuestas">Abrir historial completo de cupones →</Link>
        </p>
        <ul className={styles.list}>
          {bets.slice(0, 5).map((bet) => (
            <li key={bet.id_cupon}>
              #{bet.id_cupon} · {bet.estado} ·{' '}
              {formatMoney(bet.stake ?? Number(bet.monto_centavos) / 100)}
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
}
