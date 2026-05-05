import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  Users, MessageCircle, HandHeart, Calendar, BookOpen, Library,
  Layers, CalendarHeart, FileText, ClipboardList, Mail, Image as ImageIcon,
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

      {/* Mobile: chips wrap, grouped under small section headers. */}
      <nav className="space-y-3 sm:hidden">
        <ChipRow items={[OVERVIEW]} />
        {NAV_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-app-muted">
              {g.label}
            </p>
            <ChipRow items={g.items} />
          </div>
        ))}
      </nav>

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

function ChipRow({ items }: { items: NavItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
              isActive
                ? 'border-brand-500 bg-brand-500 text-white shadow-soft'
                : 'border-app text-app-muted hover:bg-surface-raised'
            )
          }
        >
          <n.Icon size={14} />
          {n.label}
        </NavLink>
      ))}
    </div>
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
