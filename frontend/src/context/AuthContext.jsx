import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'velora.session';

function storageKind() {
  return localStorage.getItem(STORAGE_KEY) ? 'local' : 'session';
}

function readStoredSession() {
  try {
    const raw =
      sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session, remember) {
  const raw = JSON.stringify(session);
  if (remember) {
    localStorage.setItem(STORAGE_KEY, raw);
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, raw);
  localStorage.removeItem(STORAGE_KEY);
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());

  const applySession = (next, remember = false) => {
    setSession(next);
    if (next) saveSession(next, remember);
    else clearSession();
  };

  const patchUser = useCallback((partial) => {
    setSession((prev) => {
      if (!prev?.user) return prev;
      const next = { ...prev, user: { ...prev.user, ...partial } };
      saveSession(next, storageKind() === 'local');
      return next;
    });
  }, []);

  /** Sincroniza el saldo del header con PostgreSQL (`/api/wallet/me`). */
  const refreshBalance = useCallback(async () => {
    const token = session?.token;
    if (!token) return null;
    const result = await apiRequest('/api/wallet/me', { token });
    if (!result.ok || result.data?.wallet == null) return null;
    const { balance, currency } = result.data.wallet;
    patchUser({ balance, currency: currency || 'COP' });
    return balance;
  }, [session?.token, patchUser]);

  const login = async (identifier, password, remember = false) => {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (!result.ok) {
      return { ok: false, error: result.data.error || 'No se pudo iniciar sesión.' };
    }

    applySession(
      { user: result.data.user, token: result.data.token },
      remember,
    );
    return { ok: true, user: result.data.user };
  };

  const register = async (payload) => {
    const result = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      return { ok: false, error: result.data.error || 'No se pudo crear la cuenta.' };
    }

    applySession({ user: result.data.user, token: result.data.token }, false);
    return {
      ok: true,
      user: result.data.user,
      token: result.data.token,
    };
  };

  const logout = () => {
    applySession(null);
  };

  const completeOAuth = (token, user, remember = true) => {
    if (!token || !user) {
      return { ok: false, error: 'Respuesta OAuth incompleta.' };
    }
    applySession({ user, token }, remember);
    return { ok: true, user };
  };

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || null,
      isAuthenticated: Boolean(session?.user),
      login,
      register,
      logout,
      completeOAuth,
      refreshBalance,
      patchUser,
    }),
    [session, refreshBalance, patchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
