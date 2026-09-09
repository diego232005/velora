import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormMessage } from '../components/common/FormMessage';
import { PasswordInput } from '../components/common/PasswordInput';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { TextInput } from '../components/common/TextInput';
import { AuthLayout } from '../components/layout/AuthLayout';
import { apiRequest } from '../api/client';
import { getPasswordStrength, isValidEmail } from '../utils/validation';
import styles from './AuthPages.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);

  const handleFindAccount = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!isValidEmail(email)) {
      setError('Introduce un correo electrónico válido.');
      return;
    }

    const result = await apiRequest('/api/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!result.ok) {
      setError(result.data.error || 'No se pudo buscar la cuenta.');
      return;
    }

    setError('');
    setStep(2);
    setMessage(result.data.message);
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setMessage('');

    if (String(documentNumber).replace(/\D/g, '').length < 6) {
      setError('Escribe el número de documento de la cuenta.');
      return;
    }
    if (getPasswordStrength(password).score < 2) {
      setError('La contraseña nueva debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const result = await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, documentNumber, password }),
    });

    if (!result.ok) {
      setError(result.data.error || 'No se pudo cambiar la contraseña.');
      return;
    }

    setError('');
    setStep(3);
    setMessage(result.data.message);
  };

  return (
    <AuthLayout
      title="Recupera tu acceso"
      subtitle="No se envía correo. Confirmamos el documento en MySQL y actualizamos la contraseña."
    >
      {step === 1 && (
        <form className={styles.form} onSubmit={handleFindAccount} noValidate>
          <TextInput
            id="recovery-email"
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="laura.gomez@correo.com"
            autoComplete="email"
            required
            error={error}
          />
          <PrimaryButton type="submit" fullWidth>
            Buscar cuenta
          </PrimaryButton>
          <aside className={styles.demoHint}>
            <p>Para probar con Laura</p>
            <ul>
              <li>correo: laura.gomez@correo.com</li>
              <li>documento: 3030303030</li>
            </ul>
          </aside>
          <p className={styles.switch}>
            <Link to="/login">Volver al inicio de sesión</Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form className={styles.form} onSubmit={handleResetPassword} noValidate>
          <FormMessage tone="info">{message}</FormMessage>
          <TextInput
            id="recovery-document"
            label="Número de documento"
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
            autoComplete="off"
            required
          />
          <PasswordInput
            id="recovery-password"
            label="Nueva contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <PasswordInput
            id="recovery-confirm"
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <PrimaryButton type="submit" fullWidth>
            Guardar contraseña
          </PrimaryButton>
          <p className={styles.switch}>
            <Link to="/login">Volver al inicio de sesión</Link>
          </p>
        </form>
      )}

      {step === 3 && (
        <div className={styles.form}>
          <FormMessage tone="success">{message}</FormMessage>
          <p className={styles.switch}>
            <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
