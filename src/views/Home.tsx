import { NavLink } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/lib/utils';
import { getTodaysDevotional } from '@/lib/devotionals';
import {
  Users, Heart, Calendar, BookOpen, Camera, Search,
  MessageCircle, Library, Pin, Megaphone, Sparkles,
  PartyPopper, HelpCircle, Trophy, HeartHandshake,
  ChevronRight,
} from 'lucide-react';

const tiles = [
  { path: '/check-in', icon: Heart, label: 'Check-In', desc: 'Daily heart check', accent: 'var(--color-brand)' },
  { path: '/devotional', icon: Sparkles, label: 'Devotional', desc: 'Read today\'s word', accent: 'var(--color-brand)' },
  { path: '/community', icon: Users, label: 'Community', desc: 'Share & encourage', accent: 'var(--color-brand)' },
  { path: '/prayer', icon: Heart, label: 'Prayer Wall', desc: 'Lift up your sisters', accent: 'var(--color-brand)' },
  { path: '/prayer-partners', icon: HeartHandshake, label: 'Prayer Partner', desc: 'Weekly prayer pair', accent: 'var(--color-brand)' },
  { path: '/testimonies', icon: PartyPopper, label: 'Testimonies', desc: 'Celebrate God\'s work', accent: 'var(--color-gold)' },
  { path: '/ask-elders', icon: HelpCircle, label: 'Ask Elders', desc: 'Anonymous Q&A', accent: 'var(--color-sage)' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard', desc: 'Points & streaks', accent: 'var(--color-gold)' },
  { path: '/events', icon: Calendar, label: 'Events', desc: 'Upcoming gatherings', accent: 'var(--color-sage)' },
  { path: '/study', icon: BookOpen, label: 'Bible Study', desc: 'Grow in the Word', accent: 'var(--color-sage)' },
  { path: '/messages', icon: MessageCircle, label: 'Messages', desc: 'Chat with sisters', accent: 'var(--color-brand)' },
  { path: '/gallery', icon: Camera, label: 'Gallery', desc: 'Shared memories', accent: 'var(--color-gold)' },
  { path: '/resources', icon: Library, label: 'Resources', desc: 'Teachings & links', accent: 'var(--color-sage)' },
  { path: '/directory', icon: Users, label: 'Directory', desc: 'Meet the sisters', accent: 'var(--color-gold)' },
  { path: '/search', icon: Search, label: 'Search', desc: 'Find anything', accent: 'var(--color-text-muted)' },
];

export default function Home() {
  const { profile, profiles, posts, events, prayerRequests, dailyDevotionals } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const todaysDevotional = dailyDevotionals.find(d => d.date === today) || getTodaysDevotional();

  const recentPostCount = posts.length;
  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date()).length;
  const activePrayers = prayerRequests.filter((p) => !p.is_answered).length;
  const announcements = posts.filter((p) => p.is_pinned);

  // Celebrations: upcoming birthdays & anniversaries within 7 days
  const celebrations = (() => {
    const now = new Date();
    const items: Array<{ name: string; type: 'birthday' | 'anniversary'; daysAway: number }> = [];
    profiles.forEach(p => {
      if (!p.birthday_visible) return;
      [
        { date: p.birthday, type: 'birthday' as const },
        { date: p.wedding_anniversary, type: 'anniversary' as const },
      ].forEach(({ date, type }) => {
        if (!date) return;
        const d = new Date(date);
        const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
        if (thisYear < now) thisYear.setFullYear(thisYear.getFullYear() + 1);
        const diff = Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 7) items.push({ name: p.first_name, type, daysAway: diff });
      });
    });
    return items.sort((a, b) => a.daysAway - b.daysAway);
  })();

  return (
    <div className="space-y-7 stagger">
      {/* Welcome */}
      <div className="text-center pt-2">
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Hey, {profile?.first_name} 💐
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Welcome back, beautiful. What would you like to do?
        </p>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((post) => {
            const author = profiles.find((p) => p.id === post.author_id);
            return (
              <div
                key={post.id}
                className="card card-glow"
                style={{ borderColor: 'rgba(232,102,138,0.25)', background: 'var(--color-brand-soft)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone size={14} style={{ color: 'var(--color-brand)' }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-brand)' }}>
                    Announcement
                  </span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--color-text-faint)' }}>
                    {timeAgo(post.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                  {post.content}
                </p>
                {author && (
                  <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <Avatar src={author.photo_url} name={author.first_name} size="sm" />
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      {author.first_name}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Today's Devotional */}
      <NavLink
        to="/devotional"
        className="card no-underline block"
        style={{
          background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-brand-soft) 100%)',
          borderColor: 'rgba(232,102,138,0.2)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: 'var(--color-brand)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
              Today's Devotional
            </span>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <h3 className="font-display text-lg font-bold mb-2" style={{ color: 'var(--color-brand)' }}>
          {todaysDevotional.theme}
        </h3>
        {todaysDevotional.scripture_ref && (
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {todaysDevotional.scripture_ref}
          </p>
        )}
        {todaysDevotional.scripture_text && (
          <p className="text-sm italic line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
            "{todaysDevotional.scripture_text}"
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--color-brand)' }}>
          Read more <ChevronRight size={14} />
        </div>
      </NavLink>

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

      {/* Celebrations */}
      {celebrations.length > 0 && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-gold-soft, rgba(245,176,65,0.08)) 100%)',
            borderColor: 'rgba(245,176,65,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <PartyPopper size={18} style={{ color: 'var(--color-gold)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Celebrations This Week</span>
          </div>
          <div className="space-y-2">
            {celebrations.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span>{c.type === 'birthday' ? '🎂' : '💍'}</span>
                <span>
                  <strong style={{ color: 'var(--color-text)' }}>{c.name}</strong>
                  {c.type === 'birthday' ? "'s birthday" : "'s anniversary"}{' '}
                  {c.daysAway === 0 ? 'is today!' : c.daysAway === 1 ? 'is tomorrow!' : `in ${c.daysAway} days`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      {(posts.length > 0 || prayerRequests.length > 0) && (
        <div>
          <h2 className="font-display text-lg font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            Recent Activity
          </h2>
          <div className="space-y-3">
            {[...posts, ...prayerRequests]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 4)
              .map((item) => {
                const author = profiles.find((p) => p.id === item.author_id);
                const isPrayer = 'is_answered' in item;

                return (
                  <div key={item.id} className="card p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            {author?.first_name || 'Anonymous'}
                          </span>
                          {isPrayer ? (
                            <span className="badge badge-pink text-[9px]">Prayer</span>
                          ) : (
                            <span className="badge badge-gold text-[9px]">Post</span>
                          )}
                        </div>
                        <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Navigation Tiles — 3-column grid */}
      <div className="grid grid-cols-3 gap-3">
        {tiles.map(({ path, icon: Icon, label, accent }) => (
          <NavLink
            key={path}
            to={path}
            className="card flex flex-col items-center text-center py-4 px-2 no-underline transition-all hover:border-[var(--color-brand)] hover:shadow-soft-lg active:scale-[0.97]"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{ background: `${accent}15` }}
            >
              <Icon size={18} style={{ color: accent }} />
            </div>
            <div className="font-bold text-xs leading-tight" style={{ color: 'var(--color-text)' }}>
              {label}
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
