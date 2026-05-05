import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Users, MessageCircle, HandHeart, Calendar, BookOpen, Library, Layers, CalendarHeart, FileText, ClipboardList, Mail, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { isAdmin } from '../../lib/roles';
import { cn } from '../../lib/cn';

const ADMIN_NAV = [
  { to: '/admin', end: true, label: 'Overview', Icon: Layers },
  { to: '/admin/members', label: 'Members', Icon: Users },
  { to: '/admin/follow-up', label: 'Follow-up notes', Icon: FileText },
  { to: '/admin/posts', label: 'Posts', Icon: MessageCircle },
  { to: '/admin/prayers', label: 'Prayers', Icon: HandHeart },
  { to: '/admin/events', label: 'Events', Icon: Calendar },
  { to: '/admin/attendance', label: 'Attendance', Icon: ClipboardList },
  { to: '/admin/devotionals', label: 'Devotionals', Icon: BookOpen },
  { to: '/admin/studies', label: 'Bible studies', Icon: BookOpen },
  { to: '/admin/resources', label: 'Resources', Icon: Library },
  { to: '/admin/pods', label: 'Groups', Icon: Users },
  { to: '/admin/mentors', label: 'Mentor pairings', Icon: HandHeart },
  { to: '/admin/elder-qa', label: 'Elder Q&A', Icon: HandHeart },
  { to: '/admin/email', label: 'Email broadcast', Icon: Mail },
  { to: '/admin/celebrations', label: 'Celebrations', Icon: CalendarHeart },
  { to: '/admin/gallery', label: 'Gallery', Icon: ImageIcon },
  { to: '/admin/guide', label: 'Guide', Icon: FileText },
];

export default function AdminLayout() {
  const { profile } = useAuth();
  if (!isAdmin(profile?.role)) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-app-muted">Leadership</p>
        <h1 className="font-display text-2xl sm:text-3xl">Admin Dashboard</h1>
      </header>
      {/* Mobile: horizontal scrolling chip bar so admins on phones can
          actually reach every section. */}
      <nav className="no-scrollbar -mx-3 overflow-x-auto px-3 sm:hidden">
        <div className="flex w-max gap-2 whitespace-nowrap pb-1">
          {ADMIN_NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
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
      </nav>

      <div className="flex gap-4">
        <aside className="hidden w-56 shrink-0 sm:block">
          <nav className="flex flex-col gap-1">
            {ADMIN_NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-app-muted hover:bg-surface-raised'
                  )
                }
              >
                <n.Icon size={18} />
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
