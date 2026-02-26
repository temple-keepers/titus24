import { useState, useMemo, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import PullToRefresh from '@/components/PullToRefresh';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/lib/utils';
import { getTodaysDevotional } from '@/lib/devotionals';
import {
  Users, Heart, Calendar, BookOpen, Camera, Search,
  MessageCircle, Library, Megaphone, Sparkles,
  PartyPopper, HelpCircle, Trophy, HeartHandshake,
  ChevronRight, ChevronDown, Bell, Award, Mail,
} from 'lucide-react';
import type { Profile, NotificationType } from '@/types';

type TileDef = { path: string; icon: typeof Heart; label: string; desc: string; accent: string };

const tileGroups: { title: string; tiles: TileDef[] }[] = [
  {
    title: 'Daily Spiritual Life',
    tiles: [
      { path: '/check-in', icon: Heart, label: 'Check-In', desc: 'Daily heart check', accent: 'var(--color-brand)' },
      { path: '/devotional', icon: Sparkles, label: 'Devotional', desc: "Read today's word", accent: 'var(--color-brand)' },
      { path: '/prayer', icon: Heart, label: 'Prayer & Praise', desc: 'Prayers & testimonies', accent: 'var(--color-brand)' },
    ],
  },
  {
    title: 'Community',
    tiles: [
      { path: '/community', icon: Users, label: 'Community', desc: 'Share & encourage', accent: 'var(--color-brand)' },
      { path: '/messages', icon: MessageCircle, label: 'Messages', desc: 'Chat with sisters', accent: 'var(--color-brand)' },
      { path: '/prayer-partners', icon: HeartHandshake, label: 'Prayer Partner', desc: 'Weekly prayer pair', accent: 'var(--color-brand)' },
      { path: '/pods', icon: Users, label: 'My Pod', desc: 'Accountability group', accent: 'var(--color-sage)' },
      { path: '/ask-elders', icon: HelpCircle, label: 'Ask Elders', desc: 'Anonymous Q&A', accent: 'var(--color-sage)' },
      { path: '/directory', icon: Users, label: 'Directory', desc: 'Meet the sisters', accent: 'var(--color-gold)' },
    ],
  },
  {
    title: 'Events & Growth',
    tiles: [
      { path: '/events', icon: Calendar, label: 'Events', desc: 'Upcoming gatherings', accent: 'var(--color-sage)' },
      { path: '/study', icon: BookOpen, label: 'Bible Study', desc: 'Grow in the Word', accent: 'var(--color-sage)' },
      { path: '/leaderboard', icon: Trophy, label: 'Leaderboard', desc: 'Points & streaks', accent: 'var(--color-gold)' },
      { path: '/gallery', icon: Camera, label: 'Gallery', desc: 'Shared memories', accent: 'var(--color-gold)' },
      { path: '/resources', icon: Library, label: 'Resources', desc: 'Teachings & links', accent: 'var(--color-sage)' },
      { path: '/guide', icon: BookOpen, label: 'User Guide', desc: 'How to use the app', accent: 'var(--color-sage)' },
    ],
  },
];

export default function Home() {
  const { profile, profiles, posts, events, prayerRequests, dailyDevotionals, notifications, unreadMessageCount, refetchAll } = useApp();
  const handleRefresh = useCallback(() => refetchAll(), [refetchAll]);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const todaysDevotional = dailyDevotionals.find(d => d.date === today) || getTodaysDevotional();

  const recentPostCount = posts.length;
  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date()).length;
  const activePrayers = prayerRequests.filter((p) => !p.is_answered).length;
  const announcements = posts.filter((p) => p.is_pinned);

  // Celebrations: upcoming birthdays & anniversaries within 7 days
  const celebrations = useMemo(() => {
    const now = new Date();
    // Midnight today in local time — avoids time-of-day comparison issues
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const items: Array<{ profile: Profile; type: 'birthday' | 'anniversary'; daysAway: number }> = [];
    profiles.forEach(p => {
      if (!p.birthday_visible) return;
      [
        { date: p.birthday, type: 'birthday' as const },
        { date: p.wedding_anniversary, type: 'anniversary' as const },
      ].forEach(({ date, type }) => {
        if (!date) return;
        // Parse date parts manually to avoid UTC/local timezone mismatch
        const parts = date.substring(0, 10).split('-');
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);

        let thisYear = new Date(now.getFullYear(), month, day);
        // If it already passed this year (before today), use next year
        if (thisYear < todayMidnight) thisYear.setFullYear(thisYear.getFullYear() + 1);

        const diff = Math.round((thisYear.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 7) items.push({ profile: p, type, daysAway: diff });
      });
    });
    return items.sort((a, b) => a.daysAway - b.daysAway);
  }, [profiles]);

  // Activity feed: this week only, categorized, clickable
  type ActivityItem = {
    id: string;
    type: 'post' | 'prayer' | 'birthday' | 'anniversary' | 'notification' | 'event';
    notifType?: NotificationType;
    authorName: string;
    authorPhoto: string | null;
    content: string;
    createdAt: string;
    link: string;
  };

  // Notification types to show in feed (skip ones that duplicate post/prayer items)
  const feedNotifTypes: NotificationType[] = [
    'message', 'event_reminder', 'badge_earned', 'study_reminder', 'announcement', 'celebration',
  ];

  const weeklyActivity = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const items: ActivityItem[] = [];

    // Posts from this week
    posts
      .filter((p) => new Date(p.created_at) >= oneWeekAgo)
      .forEach((p) => {
        const author = profiles.find((pr) => pr.id === p.author_id);
        items.push({
          id: p.id,
          type: 'post',
          authorName: author?.first_name || 'Someone',
          authorPhoto: author?.photo_url ?? null,
          content: p.content,
          createdAt: p.created_at,
          link: '/community',
        });
      });

    // Prayers from this week
    prayerRequests
      .filter((p) => new Date(p.created_at) >= oneWeekAgo)
      .forEach((p) => {
        const author = profiles.find((pr) => pr.id === p.author_id);
        items.push({
          id: p.id,
          type: 'prayer',
          authorName: p.is_anonymous ? 'Anonymous' : (author?.first_name || 'Someone'),
          authorPhoto: p.is_anonymous ? null : (author?.photo_url ?? null),
          content: p.content,
          createdAt: p.created_at,
          link: '/prayer',
        });
      });

    // Today's celebrations as activity items
    celebrations
      .filter((c) => c.daysAway === 0)
      .forEach((c) => {
        items.push({
          id: `celeb-${c.profile.id}-${c.type}`,
          type: c.type === 'birthday' ? 'birthday' : 'anniversary',
          authorName: c.profile.first_name,
          authorPhoto: c.profile.photo_url,
          content: c.type === 'birthday'
            ? `Happy Birthday, ${c.profile.first_name}!`
            : `Happy Anniversary, ${c.profile.first_name}!`,
          createdAt: new Date().toISOString(),
          link: `/member/${c.profile.id}`,
        });
      });

    // Notifications from this week (filtered to non-duplicate types)
    notifications
      .filter((n) => new Date(n.created_at) >= oneWeekAgo && feedNotifTypes.includes(n.type))
      .forEach((n) => {
        items.push({
          id: `notif-${n.id}`,
          type: 'notification',
          notifType: n.type,
          authorName: n.title,
          authorPhoto: null,
          content: n.body,
          createdAt: n.created_at,
          link: n.link || '/notifications',
        });
      });

    // Upcoming events within 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    events
      .filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= now && eventDate <= threeDaysFromNow;
      })
      .forEach((e) => {
        const eventDate = new Date(e.date);
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const daysAway = Math.ceil((eventDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
        const timeLabel = daysAway <= 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`;
        items.push({
          id: `event-${e.id}`,
          type: 'event',
          authorName: e.title,
          authorPhoto: null,
          content: `${timeLabel} - ${e.location || 'Location TBD'}`,
          createdAt: now.toISOString(), // sort near top
          link: '/events',
        });
      });

    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [posts, prayerRequests, profiles, celebrations, notifications, events]);

  const badgeForType = (type: ActivityItem['type']) => {
    switch (type) {
      case 'post': return { label: 'Post', cls: 'badge-gold' };
      case 'prayer': return { label: 'Prayer', cls: 'badge-pink' };
      case 'birthday': return { label: 'Birthday', cls: 'badge-gold' };
      case 'anniversary': return { label: 'Anniversary', cls: 'badge-gold' };
      case 'notification': return { label: 'Update', cls: 'badge-sage' };
      case 'event': return { label: 'Event', cls: 'badge-sage' };
    }
  };

  const notifIcon = (notifType?: NotificationType) => {
    switch (notifType) {
      case 'message': return Mail;
      case 'event_reminder': return Calendar;
      case 'badge_earned': return Award;
      case 'study_reminder': return BookOpen;
      case 'announcement': return Megaphone;
      case 'celebration': return PartyPopper;
      default: return Bell;
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
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
              <button
                key={i}
                onClick={() => navigate(`/member/${c.profile.id}`)}
                className="flex items-center gap-2 text-sm w-full text-left transition-opacity hover:opacity-80"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Avatar src={c.profile.photo_url} name={c.profile.first_name} size="sm" />
                <span>
                  <strong style={{ color: 'var(--color-text)' }}>{c.profile.first_name}</strong>
                  {c.type === 'birthday' ? "'s birthday" : "'s anniversary"}{' '}
                  {c.daysAway === 0 ? 'is today!' : c.daysAway === 1 ? 'is tomorrow!' : `in ${c.daysAway} days`}
                </span>
                <span className="ml-auto text-base">{c.type === 'birthday' ? '🎂' : '💍'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed — This Week */}
      {weeklyActivity.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            This Week
          </h2>
          <div className="space-y-3">
            {weeklyActivity.map((item) => {
              const { label, cls } = badgeForType(item.type);
              const isCelebration = item.type === 'birthday' || item.type === 'anniversary';
              const isIconType = item.type === 'notification' || item.type === 'event';

              const renderLeading = () => {
                if (isCelebration) {
                  return <span className="text-xl mt-0.5">{item.type === 'birthday' ? '🎂' : '💍'}</span>;
                }
                if (isIconType) {
                  const Icon = item.type === 'event' ? Calendar : notifIcon(item.notifType);
                  return (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.type === 'event' ? 'rgba(130,168,130,0.15)' : 'rgba(245,176,65,0.1)' }}
                    >
                      <Icon size={14} style={{ color: item.type === 'event' ? 'var(--color-sage)' : 'var(--color-brand)' }} />
                    </div>
                  );
                }
                return <Avatar src={item.authorPhoto} name={item.authorName} size="sm" />;
              };

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.link)}
                  className="card p-3 w-full text-left transition-all active:scale-[0.98]"
                  style={isCelebration ? {
                    background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-gold-soft) 100%)',
                    borderColor: 'rgba(245,176,65,0.25)',
                  } : item.type === 'event' ? {
                    background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-sage-soft) 100%)',
                    borderColor: 'rgba(130,168,130,0.2)',
                  } : undefined}
                >
                  <div className="flex items-start gap-3">
                    {renderLeading()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                          {item.authorName}
                        </span>
                        <span className={`badge text-[9px] ${cls}`}>{label}</span>
                        <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-faint)' }}>
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.content}
                      </p>
                    </div>
                    <ChevronRight size={14} className="flex-shrink-0 mt-1" style={{ color: 'var(--color-text-faint)' }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Tiles — grouped */}
      {tileGroups.map((group) => (
        <TileGroup key={group.title} title={group.title} tiles={group.tiles} unreadMessageCount={unreadMessageCount} />
      ))}
    </div>
    </PullToRefresh>
  );
}

function TileGroup({ title, tiles, unreadMessageCount }: { title: string; tiles: TileDef[]; unreadMessageCount: number }) {
  const [expanded, setExpanded] = useState(tiles.length <= 3);
  const visible = expanded ? tiles : tiles.slice(0, 3);

  return (
    <div>
      <h2 className="font-display text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {visible.map(({ path, icon: Icon, label, accent }) => (
          <NavLink
            key={path}
            to={path}
            className="card flex flex-col items-center text-center py-4 px-2 no-underline transition-all hover:border-[var(--color-brand)] hover:shadow-soft-lg active:scale-[0.97] relative"
          >
            {path === '/messages' && unreadMessageCount > 0 && (
              <span
                className="absolute top-2 right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                style={{ background: 'var(--color-brand)' }}
              >
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
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
      {tiles.length > 3 && !expanded && (
        <button
          className="btn btn-ghost btn-sm w-full mt-2"
          onClick={() => setExpanded(true)}
        >
          See all <ChevronDown size={14} />
        </button>
      )}
    </div>
  );
}
