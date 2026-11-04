import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Gavel,
  LogOut,
  Menu,
  Moon,
  Sun,
  Ticket,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { formatMoney } from '../../utils/format';
import { mediaUrl } from '../../utils/mediaUrl';
import { LanguageSelector } from '../common/LanguageSelector';
import { Logo } from '../common/Logo';
import { PrimaryButton } from '../common/PrimaryButton';
import { SearchButton } from '../common/SearchButton';
import { SecondaryButton } from '../common/SecondaryButton';
import styles from './Header.module.css';

export function Header() {
  const { copy, setMobileMenuOpen, theme, toggleTheme } = useUi();
  const { user, isAuthenticated, logout, token, refreshBalance } = useAuth();

  useEffect(() => {
    if (!token) return undefined;
    refreshBalance();
    const id = window.setInterval(() => {
      refreshBalance();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [token, refreshBalance]);


  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menu}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menú de deportes"
        >
          <Menu size={20} />
        </button>
        <Logo />
      </div>

      <div className={styles.search}>
        <SearchButton />
      </div>

      <div className={styles.actions}>
        {isAuthenticated ? (
          <>
            <div
              className={styles.balance}
              aria-label={`${copy.demoBalance}: ${formatMoney(user.balance ?? 0)}`}
            >
              <Wallet size={16} aria-hidden="true" />
              <span>
                <small>{copy.demoBalance}</small>
                <strong>{formatMoney(user.balance ?? 0)}</strong>
              </span>
            </div>
            <Link to="/billetera" className={styles.bulkLink}>
              <Wallet size={16} aria-hidden="true" />
              <span>Billetera</span>
            </Link>
            <Link to="/mis-apuestas" className={styles.bulkLink}>
              <Ticket size={16} aria-hidden="true" />
              <span>Mis apuestas</span>
            </Link>
            {user?.isAdmin ? (
              <>
                <Link to="/carga-masiva" className={styles.bulkLink}>
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  <span>Carga masiva</span>
                </Link>
                <Link to="/admin" className={styles.bulkLink}>
                  <Gavel size={16} aria-hidden="true" />
                  <span>Admin</span>
                </Link>
              </>
            ) : null}
            <Link to="/perfil" className={styles.profileLink} title="Mi perfil">
              {user?.avatarUrl ? (
                <img
                  className={styles.avatar}
                  src={mediaUrl(user.avatarUrl)}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className={styles.avatarFallback}>
                  <UserRound size={16} />
                </span>
              )}
              <span className={styles.userName}>Hola, {user.firstName}</span>
            </Link>
            <button
              type="button"
              className={styles.themeBtn}
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <LanguageSelector compact />
            <SecondaryButton onClick={logout} ariaLabel={copy.logout}>
              <LogOut size={16} aria-hidden="true" />
              <span className={styles.logoutLabel}>{copy.logout}</span>
            </SecondaryButton>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.themeBtn}
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <LanguageSelector compact />
            <SecondaryButton to="/login">{copy.login}</SecondaryButton>
            <PrimaryButton to="/register">{copy.register}</PrimaryButton>
          </>
        )}
      </div>
    </header>
  );
}
