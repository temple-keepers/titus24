import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Heart, User, Bell, Shield } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ToastContainer from '@/components/ToastContainer';
import InstallPrompt from '@/components/InstallPrompt';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/prayer', icon: Heart, label: 'Prayer' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const { profile, unreadNotificationCount, toasts, removeToast } = useApp();
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: 'var(--gradient-body)' }}>
      {/* ─── Header ──────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 glass"
        style={{ borderBottom: '1px solid var(--color-glass-border)' }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-16">
          <NavLink to="/" className="flex items-center gap-3 no-underline">
            <img
              src="/logo.png"
              alt="Titus 2:4 Logo"
              className="w-9 h-9 object-contain"
            />
            <span
              className="font-display text-lg font-semibold tracking-tight"
              style={{ color: 'var(--color-text)' }}
            >
              Titus 2:4
            </span>
          </NavLink>

          <div className="flex items-center gap-1">
            {profile?.role === 'admin' && (
              <NavLink
                to="/admin"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors no-underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Shield size={18} />
                <span className="text-xs font-bold hidden sm:inline">Admin</span>
              </NavLink>
            )}
            <NavLink
              to="/notifications"
              className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors no-underline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Bell size={18} />
              {unreadNotificationCount > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                  style={{ background: 'var(--color-brand)' }}
                >
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </NavLink>
          </div>
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-28">
        <Outlet />
      </main>

      {/* ─── Bottom Nav — Large, clear labels ────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 glass pb-safe"
        style={{ borderTop: '1px solid var(--color-glass-border)' }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around h-[72px] px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                className="flex flex-col items-center justify-center gap-1 w-20 py-2 rounded-2xl transition-all no-underline"
                style={{
                  background: isActive ? 'var(--color-brand-soft)' : 'transparent',
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.3 : 1.7}
                  style={{
                    color: isActive ? 'var(--color-brand)' : 'var(--color-text-faint)',
                    transition: 'color 0.2s',
                  }}
                />
                <span
                  className="text-[11px] font-bold"
                  style={{
                    color: isActive ? 'var(--color-brand)' : 'var(--color-text-faint)',
                    transition: 'color 0.2s',
                  }}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ─── Toasts ──────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ─── Install Prompt ──────────────────────────────── */}
      <InstallPrompt />
    </div>
  );
}
