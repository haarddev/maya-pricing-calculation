import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, LogOut, Route, Activity, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/SettingsContext';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { Button } from '../ui/Button';
import { showSuccess } from '../../utils/toast';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-brand-600 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { appName } = useAppSettings();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
                <Route className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900 sm:text-lg">
                  {appName}
                </p>
                {user && (
                  <p className="hidden truncate text-xs text-slate-500 sm:block">
                    {t('auth.welcome', { name: user.name })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  showSuccess('toast.logoutSuccess');
                }}
                className="!px-3 sm:!px-4"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('app.logout')}</span>
              </Button>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-3">
            <NavLink to="/templates" className={navClass}>
              {t('nav.templates')}
            </NavLink>
            <NavLink to="/catalogs" className={navClass}>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {t('nav.catalogs')}
              </span>
            </NavLink>
            <NavLink to="/monitoring" className={navClass}>
              <span className="inline-flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                {t('nav.monitoring')}
              </span>
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              <span className="inline-flex items-center gap-1.5">
                <Settings className="h-4 w-4" />
                {t('nav.settings')}
              </span>
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
