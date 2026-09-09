import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { brand } from '../config/brand';
import { messages } from '../config/i18n';

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [language, setLanguage] = useState(brand.defaultLanguage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalDialog, setLegalDialog] = useState(null);
  const [activeSport, setActiveSport] = useState('all');

  const copy = messages[language] || messages.es;

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
