const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value || '').trim());
}

export function isValidPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
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

export async function nextId(connection, table, column) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(MAX(${column}), 0) + 1 AS next_id FROM ${table}`,
  );
  return Number(rows[0].next_id);
}

export function toPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    balance: row.balance === null || row.balance === undefined ? 0 : Number(row.balance),
    currency: row.currency || 'COP',
  };
}
