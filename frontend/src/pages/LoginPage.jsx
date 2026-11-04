import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Checkbox } from '../components/common/Checkbox';
import { FormMessage } from '../components/common/FormMessage';
import { PasswordInput } from '../components/common/PasswordInput';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { TextInput } from '../components/common/TextInput';
import { AuthLayout } from '../components/layout/AuthLayout';
import { API_URL } from '../api/client';
import { brand } from '../config/brand';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/validation';
import styles from './AuthPages.module.css';

function decodeOAuthUser(value) {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    return JSON.parse(atob(padded + pad));
  } catch {
    return null;
  }
}

export function LoginPage() {
  const { isAuthenticated, login, completeOAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const [googleNote, setGoogleNote] = useState('');

  useEffect(() => {
    const oauthError = searchParams.get('oauth_error');
    const token = searchParams.get('token');
    const userB64 = searchParams.get('user');
    if (oauthError) {
      setMessage(`OAuth: ${oauthError}`);
      setSearchParams({}, { replace: true });
      return;
    }
    if (token && userB64) {
      const user = decodeOAuthUser(userB64);
      const result = completeOAuth(token, user, true);
      setSearchParams({}, { replace: true });
      if (result.ok) {
        navigate('/', { replace: true });
      } else {
        setMessage(result.error);
      }
    }
  }, [searchParams, completeOAuth, navigate, setSearchParams]);

  useEffect(() => {
    fetch(`${API_URL}/api/oauth/providers`)
      .then((r) => r.json())
      .then((data) => {
        setGoogleReady(Boolean(data?.providers?.google?.configured));
        setGoogleNote(data?.note || '');
      })
      .catch(() => {
        setGoogleReady(false);
        setGoogleNote('No se pudo consultar el estado OAuth.');
      });
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const update = (field) => (event) => {
    const value = field === 'remember' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.identifier.trim()) {
      next.identifier = 'Introduce tu correo o usuario.';
    } else if (form.identifier.includes('@') && !isValidEmail(form.identifier)) {
      next.identifier = 'El formato del correo no es válido.';
    }
    if (!form.password) {
      next.password = 'Introduce tu contraseña.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!validate()) {
      return;
    }

    const result = await login(form.identifier, form.password, form.remember);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <AuthLayout
      title={`Bienvenido a ${brand.name}`}
      subtitle="El inicio de sesión consulta MySQL a través de la API de Node."
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextInput
          id="identifier"
          label="Correo electrónico o usuario"
          value={form.identifier}
          onChange={update('identifier')}
          placeholder="cliente@velora.example"
          autoComplete="username"
          required
          error={errors.identifier}
        />
        <PasswordInput
          id="password"
          label="Contraseña"
          value={form.password}
          onChange={update('password')}
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <div className={styles.row}>
          <Checkbox
            id="remember"
            label="Recordarme"
            checked={form.remember}
            onChange={update('remember')}
          />
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </div>
        <PrimaryButton type="submit" fullWidth>
          Iniciar sesión
        </PrimaryButton>

        <div className={styles.oauthBlock}>
          <p className={styles.oauthDivider}>o continúa con</p>
          <a
            className={`${styles.oauthButton} ${!googleReady ? styles.oauthDisabled : ''}`}
            href={googleReady ? `${API_URL}/api/oauth/google/start` : undefined}
            aria-disabled={!googleReady}
            onClick={(event) => {
              if (!googleReady) {
                event.preventDefault();
                setMessage(
                  googleNote ||
                    'Falta GOOGLE_CLIENT_SECRET en backend/.env (Google Cloud Console).',
                );
              }
            }}
          >
            Continuar con Google
          </a>
          {!googleReady && (
            <small className={styles.oauthHint}>
              {googleNote || 'Google OAuth pendiente de Client Secret.'}
            </small>
          )}
        </div>

        <FormMessage tone="error">{message}</FormMessage>
        <aside className={styles.demoHint}>
          <p>Cuentas de prueba (MySQL local)</p>
          <ul>
            <li>cliente@velora.example / clave_demo_123</li>
            <li>admin@velora.example / clave_demo_admin</li>
          </ul>
        </aside>
        <p className={styles.switch}>
          ¿Aún no tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
