import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import {
  Users, MessageCircle, HandHeart, Calendar, BookOpen, Library,
  Layers, CalendarHeart, FileText, ClipboardList, Mail, Image as ImageIcon,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { isAdmin } from '../../lib/roles';
import { cn } from '../../lib/cn';

interface NavItem {
  to: string;
  end?: boolean;
  label: string;
  Icon: typeof Users;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Admin sections grouped by what they're about, so a leader doesn't have
 * to scan 17 chips to find the one she wants.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Sisters',
    items: [
      { to: '/admin/members', label: 'Members', Icon: Users },
      { to: '/admin/follow-up', label: 'Follow-up notes', Icon: FileText },
      { to: '/admin/mentors', label: 'Mentor pairings', Icon: HandHeart },
      { to: '/admin/elder-qa', label: 'Elder Q&A', Icon: HandHeart },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/admin/posts', label: 'Posts', Icon: MessageCircle },
      { to: '/admin/prayers', label: 'Prayers', Icon: HandHeart },
      { to: '/admin/pods', label: 'Groups', Icon: Users },
      { to: '/admin/celebrations', label: 'Celebrations', Icon: CalendarHeart },
    ],
  },
  {
    label: 'Events',
    items: [
      { to: '/admin/events', label: 'Events', Icon: Calendar },
      { to: '/admin/attendance', label: 'Attendance', Icon: ClipboardList },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/devotionals', label: 'Devotionals', Icon: BookOpen },
      { to: '/admin/studies', label: 'Bible studies', Icon: BookOpen },
      { to: '/admin/resources', label: 'Resources', Icon: Library },
      { to: '/admin/gallery', label: 'Gallery', Icon: ImageIcon },
      { to: '/admin/guide', label: 'Guide', Icon: FileText },
    ],
  },
  {
    label: 'Comms',
    items: [
      { to: '/admin/email', label: 'Email broadcast', Icon: Mail },
    ],
  },
];

const OVERVIEW: NavItem = { to: '/admin', end: true, label: 'Overview', Icon: Layers };

export default function AdminLayout() {
  const { profile } = useAuth();
  if (!isAdmin(profile?.role)) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-app-muted">Leadership</p>
        <h1 className="font-display text-2xl sm:text-3xl">Admin Dashboard</h1>
      </header>

      {/* Mobile: compact dropdown menu — shows current section, tap to
          reveal a grouped list of every other section. */}
      <MobileNavDropdown />

      <div className="flex gap-4">
        {/* Desktop: same groups in a left-rail sidebar. */}
        <aside className="hidden w-56 shrink-0 sm:block">
          <nav className="space-y-4">
            <SidebarItem item={OVERVIEW} />
            {NAV_GROUPS.map((g) => (
              <div key={g.label}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-app-muted">
                  {g.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {g.items.map((it) => (
                    <SidebarItem key={it.to} item={it} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MobileNavDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Find the current section across overview + groups so the trigger button
  // can show its label and icon.
  const allItems = [OVERVIEW, ...NAV_GROUPS.flatMap((g) => g.items)];
  const current =
    allItems.find((it) =>
      it.end ? location.pathname === it.to : location.pathname.startsWith(it.to)
    ) ?? OVERVIEW;
  const Icon = current.Icon;

  // Close the menu on every route change so tapping a link collapses it.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-2xl border border-app bg-surface px-4 py-3 text-sm font-semibold shadow-soft"
      >
        <Icon size={18} className="text-brand-500" />
        <span className="flex-1 text-left">{current.label}</span>
        <ChevronDown
          size={18}
          className={cn('text-app-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          {/* Tap-anywhere-to-close backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-app bg-surface p-3 shadow-soft-lg"
          >
            <DropdownItem item={OVERVIEW} />
            {NAV_GROUPS.map((g) => (
              <div key={g.label} className="mt-3">
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-app-muted">
                  {g.label}
                </p>
                <div className="flex flex-col">
                  {g.items.map((it) => (
                    <DropdownItem key={it.to} item={it} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DropdownItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold',
          isActive ? 'bg-brand-50 text-brand-700' : 'text-app hover:bg-surface-raised'
        )
      }
    >
      <item.Icon size={16} className="text-app-muted" />
      {item.label}
    </NavLink>
  );
}

function SidebarItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold',
          isActive ? 'bg-brand-50 text-brand-700' : 'text-app-muted hover:bg-surface-raised'
        )
      }
    >
      <item.Icon size={18} />
      {item.label}
    </NavLink>
  );
}
