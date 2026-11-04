// Vacío (prod same-origin vía Caddy) o http://localhost:4000 en desarrollo.
const raw = import.meta.env.VITE_API_URL;
export const API_URL = raw === undefined || raw === null ? 'http://localhost:4000' : String(raw);

export async function apiRequest(path, options = {}) {
  try {
    const { token, headers: extraHeaders, body, ...fetchOptions } = options;
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers = {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(extraHeaders || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      body,
      headers,
    });

    const data = await response.json().catch(() => ({
      ok: false,
      error: 'Respuesta no JSON del servidor.',
    }));
    return { ok: Boolean(response.ok && data.ok), status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: {
        ok: false,
        error:
          error?.message?.includes('Failed to fetch') || error?.name === 'TypeError'
            ? 'No hay conexión con el servidor. Revisa que el backend esté encendido.'
            : error?.message || 'Error de red al llamar la API.',
      },
    };
  }
}
