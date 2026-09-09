export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json();
    return { ok: Boolean(response.ok && data.ok), status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: {
        ok: false,
        error: 'No hay conexión con el servidor. Revisa que el backend esté encendido.',
      },
    };
  }
}
