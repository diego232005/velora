import { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'velora.session';

function readStoredSession() {
  try {
    const raw =
      sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user, remember) {
  const raw = JSON.stringify(user);
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
  const [user, setUser] = useState(() => readStoredSession());

  const applyUser = (nextUser, remember = false) => {
    setUser(nextUser);
    saveSession(nextUser, remember);
  };

  const login = async (identifier, password, remember = false) => {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (!result.ok) {
      return { ok: false, error: result.data.error || 'No se pudo iniciar sesión.' };
    }

    applyUser(result.data.user, remember);
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

    applyUser(result.data.user, false);
    return { ok: true, user: result.data.user };
  };

  const logout = () => {
    setUser(null);
    clearSession();
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user],
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
