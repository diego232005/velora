const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value).trim());
}

export function getPasswordStrength(password) {
  const value = password || '';
  let score = 0;

  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (!value) {
    return { score: 0, label: 'Sin contraseña', tone: 'muted' };
  }
  if (score <= 2) {
    return { score: 1, label: 'Débil', tone: 'error' };
  }
  if (score <= 3) {
    return { score: 2, label: 'Media', tone: 'warning' };
  }
  return { score: 3, label: 'Fuerte', tone: 'success' };
}

export function getAgeFromDate(value) {
  if (!value) return 0;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function isValidPhone(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}
