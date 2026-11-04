import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { brand } from '../config/brand';
import { messages } from '../config/i18n';

const UiContext = createContext(null);
const THEME_KEY = 'velora.theme';

function readTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  return 'dark';
}

export function UiProvider({ children }) {
  const [language, setLanguage] = useState(brand.defaultLanguage);
  const [theme, setThemeState] = useState(readTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalDialog, setLegalDialog] = useState(null);
  const [activeSport, setActiveSport] = useState('all');

  const copy = messages[language] || messages.es;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next === 'light' ? 'light' : 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const closeOverlays = useCallback(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setLegalDialog(null);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      copy,
      theme,
      setTheme,
      toggleTheme,
      mobileMenuOpen,
      setMobileMenuOpen,
      searchOpen,
      setSearchOpen,
      legalDialog,
      setLegalDialog,
      activeSport,
      setActiveSport,
      closeOverlays,
    }),
    [
      language,
      copy,
      theme,
      setTheme,
      toggleTheme,
      mobileMenuOpen,
      searchOpen,
      legalDialog,
      activeSport,
      closeOverlays,
    ],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error('useUi debe usarse dentro de UiProvider');
  }
  return context;
}
