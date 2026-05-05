import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Heart, MessageCircle, Users, Calendar, Bell, Search, BookOpen, Settings, Image as ImageIcon, Library, Shield, Award, HelpCircle, HandHeart } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { Avatar } from '../components/Avatar';
import { supabase } from '../lib/supabase';
import { isLeadership, isAdmin } from '../lib/roles';
import { cn } from '../lib/cn';

interface NavItem {
  to: string;
  label: string;
  Icon: typeof Home;
  showInBottom?: boolean;
  leadershipOnly?: boolean;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Home', Icon: Home, showInBottom: true },
  { to: '/community', label: 'Community', Icon: MessageCircle, showInBottom: true },
  { to: '/prayer', label: 'Prayer Wall', Icon: Heart, showInBottom: true },
  { to: '/groups', label: 'Groups', Icon: Users, showInBottom: true },
  { to: '/events', label: 'Events', Icon: Calendar },
  { to: '/messages', label: 'Messages', Icon: MessageCircle },
  { to: '/study', label: 'Bible Study', Icon: BookOpen },
  { to: '/gallery', label: 'Gallery', Icon: ImageIcon },
  { to: '/resources', label: 'Resources', Icon: Library },
  { to: '/directory', label: 'Directory', Icon: Users },
  { to: '/leaderboard', label: 'Leaderboard', Icon: Award },
  { to: '/elders', label: 'Ask Elders', Icon: HandHeart },
  { to: '/partners', label: 'Prayer Partners', Icon: Heart },
  { to: '/guide', label: 'Guide', Icon: HelpCircle },
  { to: '/settings', label: 'Settings', Icon: Settings },
  { to: '/admin', label: 'Admin', Icon: Shield, adminOnly: true },
];

export function AppShell() {
  const { profile } = useAuth();
  const items = NAV.filter((i) => {
    if (i.adminOnly && !isAdmin(profile?.role)) return false;
    if (i.leadershipOnly && !isLeadership(profile?.role)) return false;
    return true;
  });
  const bottomItems = items.filter((i) => i.showInBottom).slice(0, 4);
  const hasMore = items.length > bottomItems.length;
  if (hasMore) bottomItems.push({ to: '/more', label: 'More', Icon: Settings });

  // Pre-warm the most-clicked screens during idle time so the first
  // navigation away from Home feels instant (F-004 INP regression).
  useEffect(() => {
    const idle =
      'requestIdleCallback' in window
        ? (cb: () => void) =>
            (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(cb)
        : (cb: () => void) => window.setTimeout(cb, 400);
    idle(() => {
      void import('../screens/member/Community');
      void import('../screens/member/PrayerWall');
      void import('../screens/member/Groups');
      void import('../screens/member/Devotional');
      void import('../screens/member/Notifications');
      void import('../screens/member/More');
    });
    if (isAdmin(profile?.role)) {
      idle(() => {
        void import('../screens/admin/AdminLayout');
        void import('../screens/admin/AdminOverview');
      });
    }
  }, [profile?.role]);

  return (
    <div className="min-h-screen overflow-x-clip bg-app text-app">
      <TopBar />
      <div className="mx-auto flex max-w-7xl">
        <SideNav items={items} />
        <main className="min-w-0 flex-1 px-3 pt-4 pb-28 sm:px-6 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav items={bottomItems} />
    </div>
  );
}

function TopBar() {
  const { profile } = useAuth();
  const unread = useUnreadNotificationCount();
  return (
    <header className="sticky top-0 z-30 border-b border-app bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full font-display font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--soft-pink), var(--rose))' }}
          >
            T
          </span>
          <span className="font-display text-lg">Titus 2:4</span>
        </NavLink>
        <div className="flex items-center gap-1">
          <IconLink to="/search" label="Search"><Search size={20} /></IconLink>
          <IconLink to="/notifications" label="Notifications">
            <span className="relative inline-flex">
              <Bell size={20} />
              {unread > 0 && (
                <span
                  aria-label={`${unread} unread`}
                  className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold leading-none text-white"
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </span>
          </IconLink>
          <NavLink to="/profile" aria-label="Profile">
            <Avatar size={32} url={profile?.avatar_url} name={profile?.display_name ?? profile?.first_name} />
          </NavLink>
        </div>
      </div>
    </header>
  );
}

function useUnreadNotificationCount(): number {
  const { user } = useAuth();
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let active = true;
    async function refresh() {
      const { count: c } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (active) setCount(c ?? 0);
    }
    void refresh();

    const channel = supabase
      .channel(`unread-notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => void refresh()
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  // Also re-poll whenever the user navigates — e.g. away from /notifications
  // after marking some read — so the badge stays in sync if a write happened
  // outside the channel's filter window.
  useEffect(() => {
    if (!user) return;
    void supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count: c }) => setCount(c ?? 0));
  }, [user, location.pathname]);

  return count;
}

function IconLink({ to, label, children }: { to: string; label: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      className="rounded-full p-2 text-app-muted hover:bg-surface-raised hover:text-app"
    >
      {children}
    </NavLink>
  );
}

function SideNav({ items }: { items: NavItem[] }) {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-app py-4 lg:block">
      <nav className="flex flex-col gap-1 px-2">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-app-muted hover:bg-surface-raised hover:text-app'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-app bg-surface/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold',
                isActive ? 'text-brand-600' : 'text-app-muted'
              )
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
