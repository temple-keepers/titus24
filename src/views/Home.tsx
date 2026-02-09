import { NavLink } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  Users, Heart, Calendar, BookOpen, Camera, Search,
  MessageCircle, Library, ChevronRight,
} from 'lucide-react';

const tiles = [
  { path: '/community', icon: Users, label: 'Community', desc: 'Share & encourage each other', accent: 'var(--color-brand)' },
  { path: '/prayer', icon: Heart, label: 'Prayer Wall', desc: 'Lift up your sisters in prayer', accent: 'var(--color-brand)' },
  { path: '/events', icon: Calendar, label: 'Events', desc: 'Upcoming gatherings', accent: 'var(--color-sage)' },
  { path: '/study', icon: BookOpen, label: 'Bible Study', desc: 'Grow in the Word together', accent: 'var(--color-sage)' },
  { path: '/messages', icon: MessageCircle, label: 'Messages', desc: 'Chat with your sisters', accent: 'var(--color-brand)' },
  { path: '/gallery', icon: Camera, label: 'Photo Gallery', desc: 'Shared memories', accent: 'var(--color-gold)' },
  { path: '/resources', icon: Library, label: 'Resources', desc: 'Teachings & inspiration', accent: 'var(--color-sage)' },
  { path: '/directory', icon: Users, label: 'Meet the Sisters', desc: 'Browse the community', accent: 'var(--color-gold)' },
  { path: '/search', icon: Search, label: 'Search', desc: 'Find anything quickly', accent: 'var(--color-text-muted)' },
];

export default function Home() {
  const { profile, posts, events, prayerRequests } = useApp();

  const recentPostCount = posts.slice(0, 5).length;
  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date()).length;
  const activePrayers = prayerRequests.filter((p) => !p.is_answered).length;

  return (
    <div className="space-y-8 stagger">
      {/* Welcome */}
      <div className="text-center pt-2">
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Hey, {profile?.first_name} 💐
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Welcome back, beautiful. What would you like to do?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Posts', value: recentPostCount, color: 'var(--color-brand)' },
          { label: 'Events', value: upcomingEvents, color: 'var(--color-sage)' },
          { label: 'Prayers', value: activePrayers, color: 'var(--color-gold)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-5 px-3">
            <div className="font-display text-3xl font-bold" style={{ color }}>
              {value}
            </div>
            <div className="text-xs font-bold mt-1 uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tiles — large, clear, easy to tap */}
      <div className="space-y-3">
        {tiles.map(({ path, icon: Icon, label, desc, accent }) => (
          <NavLink key={path} to={path} className="nav-tile">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${accent}12` }}
            >
              <Icon size={22} style={{ color: accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px]" style={{ color: 'var(--color-text)' }}>
                {label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {desc}
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--color-text-faint)' }} />
          </NavLink>
        ))}
      </div>
    </div>
  );
}
