import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HandHeart,
  HelpCircle,
  Library,
  Sparkles,
  Users,
  MessageCircle,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../../lib/dates';
import type { Profile } from '../../lib/database.types';

type AuthorMini = Pick<Profile, 'id' | 'display_name' | 'first_name' | 'avatar_url'> | null;

interface PrayerRow {
  id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  created_at: string;
  response_count: number;
  author: AuthorMini;
}

interface PostRow {
  id: string;
  content: string;
  created_at: string;
  author: AuthorMini;
}

interface ElderQRow {
  id: string;
  question: string;
  category: string;
  created_at: string;
  is_answered: boolean;
  author: AuthorMini;
}

interface ResourceRow {
  id: string;
  title: string;
  category: string;
  created_at: string;
  submitter: AuthorMini;
}

interface TestimonyRow {
  id: string;
  title: string | null;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  author: AuthorMini;
}

interface FollowUpRow {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
  member: AuthorMini;
}

export default function AdminActivity() {
  const [prayers, setPrayers] = useState<PrayerRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [questions, setQuestions] = useState<ElderQRow[]>([]);
  const [pendingResources, setPendingResources] = useState<ResourceRow[]>([]);
  const [pendingTestimonies, setPendingTestimonies] = useState<TestimonyRow[]>([]);
  const [needSupport, setNeedSupport] = useState<FollowUpRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

      const [
        pRes,
        postsRes,
        qRes,
        rRes,
        tRes,
        fuRes,
      ] = await Promise.all([
        // New prayer requests in the last 7 days
        supabase
          .from('prayer_requests')
          .select(
            'id, content, category, is_anonymous, created_at, author:profiles!prayer_requests_author_id_fkey(id, display_name, first_name, avatar_url), prayer_responses(count)'
          )
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(15),
        // Recent posts (last 7 days, top 10)
        supabase
          .from('posts')
          .select(
            'id, content, created_at, author:profiles!posts_author_id_fkey(id, display_name, first_name, avatar_url)'
          )
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(10),
        // Unanswered elder questions
        supabase
          .from('elder_questions')
          .select(
            'id, question, category, created_at, is_answered, author:profiles!elder_questions_author_id_fkey(id, display_name, first_name, avatar_url)'
          )
          .eq('is_answered', false)
          .order('created_at', { ascending: false })
          .limit(15),
        // Pending resource submissions
        supabase
          .from('resources')
          .select(
            'id, title, category, created_at, submitter:profiles!resources_submitted_by_fkey(id, display_name, first_name, avatar_url)'
          )
          .eq('is_published', false)
          .order('created_at', { ascending: false })
          .limit(15),
        // Pending testimonies
        supabase
          .from('testimonies')
          .select(
            'id, title, content, is_anonymous, created_at, author:profiles!testimonies_author_id_fkey(id, display_name, first_name, avatar_url)'
          )
          .eq('is_published', false)
          .order('created_at', { ascending: false })
          .limit(15),
        // Sisters whose latest follow-up flagged them as needing support
        supabase
          .from('follow_up_notes')
          .select(
            'id, status, note, created_at, member:profiles!follow_up_notes_user_id_fkey(id, display_name, first_name, avatar_url)'
          )
          .eq('status', 'needs_support')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (!active) return;

      setPrayers(
        ((pRes.data as Array<PrayerRow & { prayer_responses: Array<{ count: number }> }> | null) ?? []).map((r) => ({
          ...r,
          response_count: r.prayer_responses?.[0]?.count ?? 0,
        }))
      );
      setPosts((postsRes.data as PostRow[] | null) ?? []);
      setQuestions((qRes.data as ElderQRow[] | null) ?? []);
      setPendingResources((rRes.data as ResourceRow[] | null) ?? []);
      setPendingTestimonies((tRes.data as TestimonyRow[] | null) ?? []);
      setNeedSupport((fuRes.data as FollowUpRow[] | null) ?? []);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-5">
      <header>
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-brand-600">
          <Activity size={12} /> What needs you
        </p>
        <h1 className="font-display text-3xl">Recent activity</h1>
        <p className="mt-1 text-sm text-app-muted">
          Everything across the sisterhood that wants leadership eyes, in one place.
        </p>
      </header>

      <Section
        title="Unanswered questions"
        icon={<HelpCircle size={16} />}
        empty={questions.length === 0 && 'You are caught up. No questions waiting.'}
        viewAll={questions.length > 0 ? '/admin/elder-qa' : undefined}
      >
        {questions.map((q) => (
          <Card key={q.id}>
            <Header author={q.author} category={q.category} when={q.created_at} />
            <p className="mt-2 line-clamp-3 break-words text-sm">{q.question}</p>
            <Link
              to="/admin/elder-qa"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
            >
              Reply <ArrowRight size={12} />
            </Link>
          </Card>
        ))}
      </Section>

      <Section
        title="Resource submissions"
        icon={<Library size={16} />}
        empty={pendingResources.length === 0 && 'No suggestions waiting.'}
        viewAll={pendingResources.length > 0 ? '/admin/resources' : undefined}
      >
        {pendingResources.map((r) => (
          <Card key={r.id}>
            <Header author={r.submitter} category={r.category} when={r.created_at} />
            <h3 className="mt-2 font-display text-lg">{r.title}</h3>
            <Link
              to="/admin/resources"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
            >
              Review <ArrowRight size={12} />
            </Link>
          </Card>
        ))}
      </Section>

      <Section
        title="Testimony submissions"
        icon={<Sparkles size={16} />}
        empty={pendingTestimonies.length === 0 && 'No testimonies waiting.'}
        viewAll={pendingTestimonies.length > 0 ? '/admin/testimonies' : undefined}
      >
        {pendingTestimonies.map((t) => (
          <Card key={t.id}>
            <Header
              author={t.is_anonymous ? null : t.author}
              category={t.is_anonymous ? 'anonymous' : null}
              when={t.created_at}
            />
            {t.title && <h3 className="mt-2 font-display text-lg">{t.title}</h3>}
            <p className="mt-2 line-clamp-3 break-words text-sm">{t.content}</p>
            <Link
              to="/admin/testimonies"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
            >
              Review <ArrowRight size={12} />
            </Link>
          </Card>
        ))}
      </Section>

      <Section
        title="Sisters flagged for support"
        icon={<Users size={16} />}
        empty={needSupport.length === 0 && 'No sister currently flagged as needing support.'}
        viewAll={needSupport.length > 0 ? '/admin/follow-up' : undefined}
      >
        {needSupport.map((fu) => (
          <Card key={fu.id}>
            <Header author={fu.member} category="needs support" when={fu.created_at} />
            {fu.note && <p className="mt-2 line-clamp-3 break-words text-sm">{fu.note}</p>}
            <Link
              to="/admin/follow-up"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
            >
              Open <ArrowRight size={12} />
            </Link>
          </Card>
        ))}
      </Section>

      <Section
        title="New prayer requests (7 days)"
        icon={<HandHeart size={16} />}
        empty={prayers.length === 0 && 'A quiet week on the prayer wall.'}
        viewAll={prayers.length > 0 ? '/prayer' : undefined}
      >
        {prayers.map((p) => (
          <Card key={p.id}>
            <Header
              author={p.is_anonymous ? null : p.author}
              category={p.category + (p.is_anonymous ? ' · anonymous' : '')}
              when={p.created_at}
            />
            <p className="mt-2 line-clamp-3 break-words text-sm">{p.content}</p>
            <p className="mt-2 text-[11px] text-app-muted">
              {p.response_count} {p.response_count === 1 ? 'sister' : 'sisters'} prayed
            </p>
          </Card>
        ))}
      </Section>

      <Section
        title="Recent posts (7 days)"
        icon={<MessageCircle size={16} />}
        empty={posts.length === 0 && 'No new posts in the last week.'}
        viewAll={posts.length > 0 ? '/community' : undefined}
      >
        {posts.map((p) => (
          <Card key={p.id}>
            <Header author={p.author} when={p.created_at} />
            <p className="mt-2 line-clamp-3 break-words text-sm whitespace-pre-wrap">{p.content}</p>
          </Card>
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  icon,
  empty,
  viewAll,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty?: string | false;
  viewAll?: string;
  children: React.ReactNode;
}) {
  // If a section has children, render them; otherwise render an empty
  // state (still as a card so the page reads consistently).
  const childArr = Array.isArray(children) ? children : [children];
  const hasChildren = childArr.filter(Boolean).length > 0;
  return (
    <section>
      <SectionTitle
        action={
          viewAll ? (
            <Link to={viewAll} className="text-xs font-semibold text-brand-600">
              View all
            </Link>
          ) : undefined
        }
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-brand-500">{icon}</span> {title}
        </span>
      </SectionTitle>
      {hasChildren ? (
        <div className="space-y-2">{children}</div>
      ) : (
        empty && <EmptyState title={empty} />
      )}
    </section>
  );
}

function Header({
  author,
  category,
  when,
}: {
  author: AuthorMini;
  category?: string | null;
  when: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {author ? (
        <Avatar
          size={28}
          url={author.avatar_url ?? null}
          name={author.display_name ?? author.first_name}
        />
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-app-muted">
          <Sparkles size={12} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">
          {author ? author.display_name ?? author.first_name ?? 'A sister' : 'A sister (anonymous)'}
        </p>
        <p className="truncate text-[10px] text-app-muted capitalize">
          {category && <>{category} · </>}
          {timeAgo(when)}
        </p>
      </div>
    </div>
  );
}
