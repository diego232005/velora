import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { apiRequest } from '../api/client';
import { AppLayout } from '../components/layout/AppLayout';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';
import { mediaUrl } from '../utils/mediaUrl';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { isAuthenticated, token, user, patchUser, refreshBalance } = useAuth();
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      const res = await apiRequest('/api/auth/me', { token });
      if (cancelled) return;
      if (res.ok) {
        setProfile(res.data.user);
        patchUser(res.data.user);
      } else {
        setMessage(res.data.error || 'No se pudo cargar el perfil.');
      }
      await refreshBalance();
    })();
    return () => {
      cancelled = true;
    };
  }, [token, patchUser, refreshBalance]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const data = profile || user;

  const onPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage('Subiendo foto a Drive / Perfil…');
    const body = new FormData();
    body.append('photo', file);
    const res = await apiRequest('/api/drive/profile-photo', {
      method: 'POST',
      token,
      body,
    });
    setUploading(false);
    if (!res.ok) {
      setMessage(res.data.error || 'No se pudo subir la foto.');
      return;
    }
    const avatarUrl = res.data.avatarUrl;
    setProfile((prev) => ({ ...(prev || {}), avatarUrl }));
    patchUser({ avatarUrl });
    setMessage(
      res.data.note ||
        'Foto de perfil actualizada (se muestra en Velora; Drive Mi unidad no acepta subidas con service account).',
    );
  };

  return (
    <AppLayout>
      <section className={styles.wrap}>
        <header className={styles.head}>
          <h1>Mi perfil</h1>
          <p>Datos de cuenta y foto (carpeta Drive «Perfil»).</p>
        </header>

        <div className={styles.card}>
          <div className={styles.avatarBlock}>
            {data?.avatarUrl ? (
              <img
                className={styles.avatar}
                src={mediaUrl(data.avatarUrl)}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={styles.avatarPlaceholder}>
                <UserRound size={40} />
              </span>
            )}
            <label className={styles.fileBtn}>
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploading}
                onChange={onPhoto}
              />
            </label>
          </div>

          <dl className={styles.meta}>
            <div>
              <dt>Nombre</dt>
              <dd>
                {data?.firstName} {data?.lastName}
              </dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{data?.email}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{data?.roleLabel || (data?.isAdmin ? 'admin' : 'cliente')}</dd>
            </div>
            <div>
              <dt>Saldo</dt>
              <dd>{formatMoney(data?.balance ?? 0, data?.currency || 'COP')}</dd>
            </div>
          </dl>

          {message ? <p className={styles.msg}>{message}</p> : null}

          <div className={styles.actions}>
            <PrimaryButton to="/billetera">Ir a billetera</PrimaryButton>
            <Link to="/mis-apuestas" className={styles.link}>
              Mis apuestas
            </Link>
            {data?.isAdmin ? (
              <Link to="/admin" className={styles.link}>
                Panel admin
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
