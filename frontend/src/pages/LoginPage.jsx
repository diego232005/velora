import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Checkbox } from '../components/common/Checkbox';
import { FormMessage } from '../components/common/FormMessage';
import { PasswordInput } from '../components/common/PasswordInput';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { TextInput } from '../components/common/TextInput';
import { AuthLayout } from '../components/layout/AuthLayout';
import { brand } from '../config/brand';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/validation';
import styles from './AuthPages.module.css';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

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
          placeholder="laura.gomez@correo.com"
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
        <FormMessage tone="error">{message}</FormMessage>
        <aside className={styles.demoHint}>
          <p>Cuentas de prueba</p>
          <ul>
            <li>laura.gomez@correo.com / clave_demo_123</li>
            <li>andres.perez@correo.com / clave_demo_123</li>
            <li>sofia.ramos@correo.com / clave_demo_123</li>
          </ul>
        </aside>
        <p className={styles.switch}>
          ¿Aún no tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
