/**
 * Respuestas JSON uniformes sin romper payloads existentes del frontend.
 * Éxito: { ok: true, ...fields }
 * Error: { ok: false, error, status }
 */
export function sendOk(response, payload = {}, status = 200) {
  return response.status(status).json({ ok: true, ...payload });
}

export function sendError(response, error, fallbackStatus = 500) {
  const status = Number(error?.status) || fallbackStatus;
  const isProd = process.env.NODE_ENV === 'production';
  const message =
    status >= 500 && isProd
      ? 'Error interno del servidor.'
      : error?.message || 'Error inesperado.';
  return response.status(status).json({
    ok: false,
    error: message,
    status,
  });
}

export function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}
