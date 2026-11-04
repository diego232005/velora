import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { Checkbox } from '../components/common/Checkbox';
import { FormMessage } from '../components/common/FormMessage';
import { PasswordInput } from '../components/common/PasswordInput';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { TextInput } from '../components/common/TextInput';
import { AuthLayout } from '../components/layout/AuthLayout';
import { brand } from '../config/brand';
import { useAuth } from '../context/AuthContext';
import { useUi } from '../context/UiContext';
import { apiRequest } from '../api/client';
import {
  getAgeFromDate,
  getPasswordStrength,
  isValidEmail,
  isValidPhone,
} from '../utils/validation';
import fieldStyles from '../components/common/Field.module.css';
import styles from './AuthPages.module.css';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  cityId: '',
  documentTypeId: '',
  documentNumber: '',
  birthDate: '',
  password: '',
  confirmPassword: '',
  photo: null,
  terms: false,
  ofAge: false,
  marketing: false,
};

export function RegisterPage() {
  const { setLegalDialog } = useUi();
  const { isAuthenticated, register, patchUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [cities, setCities] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      const [citiesResult, typesResult] = await Promise.all([
        apiRequest('/api/catalog/ciudades'),
        apiRequest('/api/catalog/tipos-documento'),
      ]);

      if (!active) return;

      if (citiesResult.ok) setCities(citiesResult.data.items || []);
      if (typesResult.ok) setDocumentTypes(typesResult.data.items || []);
      if (!citiesResult.ok || !typesResult.ok) {
        setMessage(citiesResult.data.error || typesResult.data.error);
      }
      setLoadingCatalog(false);
    };

    loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const update = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Indica tu nombre.';
    if (!form.lastName.trim()) next.lastName = 'Indica tu apellido.';
    if (!isValidEmail(form.email)) next.email = 'El correo no tiene un formato válido.';
    if (!isValidPhone(form.phone)) next.phone = 'Introduce un teléfono de 8 a 15 dígitos.';
    if (!form.cityId) next.cityId = 'Selecciona una ciudad.';
    if (!form.documentTypeId) next.documentTypeId = 'Selecciona el tipo de documento.';
    if (String(form.documentNumber).replace(/\D/g, '').length < 6) {
      next.documentNumber = 'El documento debe tener al menos 6 dígitos.';
    }
    const age = getAgeFromDate(form.birthDate);
    if (!form.birthDate) {
      next.birthDate = 'Indica tu fecha de nacimiento.';
    } else if (age < brand.minAge) {
      next.birthDate = `Debes tener al menos ${brand.minAge} años.`;
    }
    if (strength.score < 2) {
      next.password = 'Usa una contraseña más segura, de al menos 8 caracteres.';
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Las contraseñas no coinciden.';
    }
    if (!form.terms) next.terms = 'Debes aceptar los términos para continuar.';
    if (!form.ofAge) next.ofAge = `Confirma que eres mayor de ${brand.minAge} años.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!validate()) return;

    const result = await register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      cityId: Number(form.cityId),
      documentTypeId: Number(form.documentTypeId),
      documentNumber: form.documentNumber,
      birthDate: form.birthDate,
      password: form.password,
      terms: form.terms,
      ofAge: form.ofAge,
    });

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    if (form.photo && result.token) {
      const body = new FormData();
      body.append('photo', form.photo);
      const up = await apiRequest('/api/drive/profile-photo', {
        method: 'POST',
        token: result.token,
        body,
      });
      if (up.ok && up.data.avatarUrl) {
        patchUser({ avatarUrl: up.data.avatarUrl });
      } else if (!up.ok) {
        setMessage(
          up.data.error ||
            'Cuenta creada, pero la foto no se subió a Drive (comparte Perfil con el service account como Editor).',
        );
      }
    }

    navigate('/', { replace: true });
  };

  return (
    <AuthLayout
      wide
      title="Crea tu cuenta"
      subtitle={`Exclusivo para mayores de ${brand.minAge} años. La cuenta se guarda en MySQL.`}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.grid}>
          <TextInput
            id="firstName"
            label="Nombre"
            value={form.firstName}
            onChange={update('firstName')}
            autoComplete="given-name"
            required
            error={errors.firstName}
          />
          <TextInput
            id="lastName"
            label="Apellido"
            value={form.lastName}
            onChange={update('lastName')}
            autoComplete="family-name"
            required
            error={errors.lastName}
          />
        </div>
        <TextInput
          id="email"
          label="Correo electrónico"
          type="email"
          value={form.email}
          onChange={update('email')}
          autoComplete="email"
          required
          error={errors.email}
        />
        <div className={fieldStyles.field}>
          <label className={fieldStyles.label} htmlFor="photo">
            Foto de perfil (Drive / Perfil)
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            className={fieldStyles.control}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                photo: event.target.files?.[0] || null,
              }))
            }
          />
        </div>
        <TextInput
          id="phone"
          label="Número de teléfono"
          type="tel"
          value={form.phone}
          onChange={update('phone')}
          autoComplete="tel"
          required
          error={errors.phone}
        />
        <div className={styles.grid}>
          <div className={fieldStyles.field}>
            <label className={fieldStyles.label} htmlFor="documentTypeId">
              Tipo de documento <span className={fieldStyles.required}>*</span>
            </label>
            <select
              id="documentTypeId"
              className={`${fieldStyles.control} ${errors.documentTypeId ? fieldStyles.invalid : ''}`}
              value={form.documentTypeId}
              onChange={update('documentTypeId')}
              disabled={loadingCatalog}
              required
            >
              <option value="">Selecciona un tipo</option>
              {documentTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
            {errors.documentTypeId && (
              <p className={fieldStyles.error} role="alert">
                {errors.documentTypeId}
              </p>
            )}
          </div>
          <TextInput
            id="documentNumber"
            label="Número de documento"
            value={form.documentNumber}
            onChange={update('documentNumber')}
            autoComplete="off"
            required
            error={errors.documentNumber}
          />
        </div>
        <div className={fieldStyles.field}>
          <label className={fieldStyles.label} htmlFor="cityId">
            Ciudad <span className={fieldStyles.required}>*</span>
          </label>
          <select
            id="cityId"
            className={`${fieldStyles.control} ${errors.cityId ? fieldStyles.invalid : ''}`}
            value={form.cityId}
            onChange={update('cityId')}
            disabled={loadingCatalog}
            required
          >
            <option value="">Selecciona una ciudad de Colombia</option>
            {cities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
          {errors.cityId && (
            <p className={fieldStyles.error} role="alert">
              {errors.cityId}
            </p>
          )}
        </div>
        <TextInput
          id="birthDate"
          label="Fecha de nacimiento"
          type="date"
          value={form.birthDate}
          onChange={update('birthDate')}
          autoComplete="bday"
          required
          error={errors.birthDate}
        />
        <PasswordInput
          id="password"
          label="Contraseña"
          value={form.password}
          onChange={update('password')}
          autoComplete="new-password"
          required
          error={errors.password}
        />
        <PasswordStrength strength={strength} />
        <PasswordInput
          id="confirmPassword"
          label="Confirmar contraseña"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
        />
        <Checkbox
          id="terms"
          label="Acepto los términos y condiciones."
          checked={form.terms}
          onChange={update('terms')}
          required
          error={errors.terms}
        />
        <button
          type="button"
          className={styles.inlineLink}
          onClick={() => setLegalDialog('terms')}
        >
          Leer términos y condiciones
        </button>
        <Checkbox
          id="ofAge"
          label={`Confirmo que soy mayor de ${brand.minAge} años y que el servicio está sujeto a las regulaciones aplicables.`}
          checked={form.ofAge}
          onChange={update('ofAge')}
          required
          error={errors.ofAge}
        />
        <Checkbox
          id="marketing"
          label="Quiero recibir comunicaciones promocionales (opcional)."
          checked={form.marketing}
          onChange={update('marketing')}
        />
        <PrimaryButton type="submit" fullWidth>
          Crear cuenta
        </PrimaryButton>
        <FormMessage tone="error">{message}</FormMessage>
        <p className={styles.switch}>
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
