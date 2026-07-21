import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BookOpen,
  Calculator,
  LayoutGrid,
  LogOut,
  Route,
  Activity,
  Settings,
  Menu,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/SettingsContext';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { Button } from '../ui/Button';
import { showSuccess } from '../../utils/toast';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-brand-600 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

type NavItem = {
  to: string;
  labelKey: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/customers', labelKey: 'nav.customers', icon: Users },
  { to: '/templates', labelKey: 'nav.templates', icon: LayoutGrid },
  { to: '/catalogs', labelKey: 'nav.catalogs', icon: BookOpen },
  { to: '/pricing-check', labelKey: 'nav.pricingCheck', icon: Calculator },
  { to: '/monitoring', labelKey: 'nav.monitoring', icon: Activity },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { appName } = useAppSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showSuccess('toast.logoutSuccess');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
          <Route className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">{appName}</p>
          {user && (
            <p className="truncate text-xs text-slate-500">
              {t('auth.welcome', { name: user.name })}
            </p>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={navClass}
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-slate-200/80 px-4 py-4">
        <LanguageSwitcher />
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start !px-3">
          <LogOut className="h-4 w-4" />
          <span>{t('app.logout')}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-slate-200/80 bg-white lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-64 border-e border-slate-200/80 bg-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-lg lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={t('app.openMenu')}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Route className="h-4 w-4" />
            </div>
            <p className="truncate text-base font-bold text-slate-900">{appName}</p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Close button for mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed end-4 top-3 z-[60] flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-md transition hover:bg-slate-100 lg:hidden"
          aria-label={t('app.closeMenu')}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
