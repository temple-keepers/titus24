import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { Card, ScripturePill, SectionTitle, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingPage } from '../../components/LoadingPage';
import { PullToRefresh } from '../../components/PullToRefresh';
import { useAuth } from '../../auth/AuthProvider';
import { getTodayDevotional, hasReadToday, listPosts, listUpcomingEvents } from '../../data/queries';
import type { DailyDevotional, EventRow } from '../../lib/database.types';
import type { PostWithAuthor } from '../../data/queries';
import { todayLocalISO, relativeDayLabel, timeAgo } from '../../lib/dates';
import { Avatar } from '../../components/Avatar';

export default function Home() {
  const { user, profile } = useAuth();
  const [devotional, setDevotional] = useState<DailyDevotional | null>(null);
  const [readToday, setReadToday] = useState(false);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const today = todayLocalISO();

  const refresh = useCallback(async () => {
    if (!user) return;
    const [dev, read, ps, evs] = await Promise.all([
      getTodayDevotional(today),
      hasReadToday(user.id, today),
      listPosts(8),
      listUpcomingEvents(7),
    ]);
    setDevotional(dev);
    setReadToday(read);
    setPosts(ps);
    setEvents(evs);
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    let active = true;
    refresh().then(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  if (loading) return <LoadingPage />;

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="px-1">
        <p className="text-xs uppercase tracking-wide text-app-muted">{relativeDayLabel(today)}</p>
        <h1 className="font-display text-3xl">
          Hello, {profile?.first_name ?? 'sister'}.
        </h1>
      </header>

      {devotional ? (
        <Card className="bg-surface-raised">
          <p className="text-xs uppercase tracking-wide text-brand-600 mb-1">Today's devotional</p>
          <h2 className="font-display text-2xl mb-2">{devotional.theme}</h2>
          <ScripturePill reference={devotional.scripture_ref}>{devotional.scripture_text}</ScripturePill>
          <p className="mt-4 text-sm leading-6 line-clamp-4">{devotional.reflection}</p>
          <div className="mt-4 flex items-center gap-3">
            <Link to="/devotional">
              <Button variant="primary" size="sm" trailingIcon={<ArrowRight size={16} />}>
                Open today's devotional
              </Button>
            </Link>
            {readToday && <span className="text-xs text-sage-700 font-semibold">✓ Read today</span>}
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-app-muted">No devotional posted for today yet, sister. Check back soon.</p>
        </Card>
      )}

      <section>
        <SectionTitle action={<Link to="/events" className="text-sm font-semibold text-brand-600">All</Link>}>
          This week
        </SectionTitle>
        <div className="space-y-3">
          {events.length === 0 && (
            <EmptyState
              title="No events this week"
              body="When something is on the calendar, you'll see it here first."
              icon={<Calendar size={28} />}
            />
          )}
          {events.map((ev) => (
            <Card key={ev.id} className="flex items-start gap-3">
              <div className="rounded-2xl bg-brand-100 px-3 py-2 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                  {new Date(ev.date).toLocaleDateString(undefined, { month: 'short' })}
                </div>
                <div className="font-display text-2xl text-brand-700">
                  {new Date(ev.date).getDate()}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg">{ev.title}</h3>
                {ev.location && <p className="text-xs text-app-muted">{ev.location}</p>}
                {ev.description && <p className="mt-1 text-sm line-clamp-2">{ev.description}</p>}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle action={<Link to="/community" className="text-sm font-semibold text-brand-600">All</Link>}>
          From the sisterhood
        </SectionTitle>
        <div className="space-y-3">
          {posts.length === 0 && (
            <EmptyState title="The feed is quiet" body="Be the first to share something today." icon={<BookOpen size={28} />} />
          )}
          {posts.map((p) => (
            <Card key={p.id}>
              <header className="mb-2 flex items-center gap-3">
                <Avatar size={36} url={p.author?.avatar_url ?? null} name={p.author?.display_name ?? p.author?.first_name ?? 'Sister'} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.author?.display_name ?? p.author?.first_name ?? 'Sister'}</div>
                  <div className="text-[11px] text-app-muted">{timeAgo(p.created_at)}</div>
                </div>
              </header>
              <p className="text-sm leading-6 whitespace-pre-wrap">{p.content}</p>
              {p.image_url && (
                <img src={p.image_url} alt="" className="mt-3 w-full rounded-2xl object-cover" loading="lazy" />
              )}
              <div className="mt-3 flex gap-4 text-xs text-app-muted">
                <span>{p.reaction_count} reactions</span>
                <span>{p.comment_count} comments</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
    </PullToRefresh>
  );
}
