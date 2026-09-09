import { LogOut, Menu, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { formatMoney } from '../../utils/format';
import { LanguageSelector } from '../common/LanguageSelector';
import { Logo } from '../common/Logo';
import { PrimaryButton } from '../common/PrimaryButton';
import { SearchButton } from '../common/SearchButton';
import { SecondaryButton } from '../common/SecondaryButton';
import styles from './Header.module.css';

export function Header() {
  const { copy, setMobileMenuOpen } = useUi();
  const { user, isAuthenticated, logout } = useAuth();

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
            {user.balance != null && (
              <div
                className={styles.balance}
                aria-label={`${copy.demoBalance}: ${formatMoney(user.balance, undefined, user.currency)}`}
              >
                <Wallet size={16} aria-hidden="true" />
                <span>
                  <small>{copy.demoBalance}</small>
                  <strong>{formatMoney(user.balance, undefined, user.currency)}</strong>
                </span>
              </div>
            )}
            <p className={styles.userName}>Hola, {user.firstName}</p>
            <LanguageSelector compact />
            <SecondaryButton onClick={logout} ariaLabel={copy.logout}>
              <LogOut size={16} aria-hidden="true" />
              <span className={styles.logoutLabel}>{copy.logout}</span>
            </SecondaryButton>
          </>
        ) : (
          <>
            <LanguageSelector compact />
            <SecondaryButton to="/login">{copy.login}</SecondaryButton>
            <PrimaryButton to="/register">{copy.register}</PrimaryButton>
          </>
        )}
      </div>
    </header>
  );
}
