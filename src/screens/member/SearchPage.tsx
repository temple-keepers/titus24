import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Search as SearchIcon, Library, BookOpen, BookOpenCheck } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Post, PrayerRequest, Profile, EventRow, Resource, DailyDevotional } from '../../lib/database.types';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';
import { parseScriptureRef, scriptureSearchVariants } from '../../lib/scripture';

interface StudyDayHit {
  id: string;
  study_id: string;
  day_number: number;
  scripture_ref: string;
  scripture_text: string;
  reflection: string;
  study?: { title: string } | null;
}

type Filter = 'all' | 'sisters' | 'posts' | 'prayers' | 'events' | 'resources' | 'devotionals' | 'studies';

interface Results {
  posts: Post[];
  prayers: PrayerRequest[];
  profiles: Profile[];
  events: EventRow[];
  resources: Resource[];
  devotionals: DailyDevotional[];
  studyDays: StudyDayHit[];
}

const EMPTY: Results = { posts: [], prayers: [], profiles: [], events: [], resources: [], devotionals: [], studyDays: [] };

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [filter, setFilter] = useState<Filter>('all');
  const [results, setResults] = useState<Results | null>(null);
  const [busy, setBusy] = useState(false);

  async function runSearch(query: string) {
    if (!query.trim()) return;
    setBusy(true);
    const trimmed = query.trim();
    const term = `%${trimmed}%`;

    // If the query parses as a scripture reference (e.g. "Prov 3:5"),
    // also search for the canonical form ("Proverbs 3:5") so devotionals
    // stored with the long name still match. Build a Postgres OR clause
    // covering every variant.
    const variants = scriptureSearchVariants(trimmed);
    const refOr = variants.map((v) => `scripture_ref.ilike.%${v}%`).join(',');
    const textOr = variants.map((v) => `scripture_text.ilike.%${v}%`).join(',');

    const [posts, prayers, profiles, events, resources, devotionals, studyDays] = await Promise.all([
      supabase.from('posts').select('*').ilike('content', term).limit(20),
      supabase.from('prayer_requests').select('*').ilike('content', term).eq('is_anonymous', false).limit(20),
      supabase
        .from('profiles')
        .select('*')
        .or(
          `display_name.ilike.${term},first_name.ilike.${term},last_name.ilike.${term},city.ilike.${term},country.ilike.${term},profession.ilike.${term},about.ilike.${term}`
        )
        .limit(20),
      supabase.from('events').select('*').or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`).limit(20),
      supabase
        .from('resources')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.${term},description.ilike.${term},category.ilike.${term}`)
        .limit(20),
      supabase
        .from('daily_devotionals')
        .select('id, date, theme, scripture_ref, scripture_text, reflection, affirmation, prayer, created_by, created_at')
        .or(`theme.ilike.${term},${refOr},${textOr},reflection.ilike.${term}`)
        .order('date', { ascending: false })
        .limit(20),
      supabase
        .from('study_days')
        .select('id, study_id, day_number, scripture_ref, scripture_text, reflection, study:bible_studies!study_days_study_id_fkey(title)')
        .or(`${refOr},${textOr},reflection.ilike.${term}`)
        .limit(20),
    ]);
    setResults({
      posts: (posts.data as Post[] | null) ?? [],
      prayers: (prayers.data as PrayerRequest[] | null) ?? [],
      profiles: (profiles.data as Profile[] | null) ?? [],
      events: (events.data as EventRow[] | null) ?? [],
      resources: (resources.data as Resource[] | null) ?? [],
      devotionals: (devotionals.data as DailyDevotional[] | null) ?? [],
      studyDays: ((studyDays.data as unknown) as StudyDayHit[] | null) ?? [],
    });
    setBusy(false);
  }

  // Run an initial search if the URL already has ?q=…, e.g. when a sister
  // tapped a search link from elsewhere in the app.
  useEffect(() => {
    const initial = params.get('q');
    if (initial && !results) {
      void runSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setParams({ q: q.trim() });
    void runSearch(q);
  }

  const r = results ?? EMPTY;
  const total =
    r.profiles.length + r.posts.length + r.prayers.length + r.events.length + r.resources.length +
    r.devotionals.length + r.studyDays.length;

  const counts: Record<Filter, number> = {
    all: total,
    sisters: r.profiles.length,
    posts: r.posts.length,
    prayers: r.prayers.length,
    events: r.events.length,
    resources: r.resources.length,
    devotionals: r.devotionals.length,
    studies: r.studyDays.length,
  };

  const show = (kind: Exclude<Filter, 'all'>) => filter === 'all' || filter === kind;
  const parsed = q.trim() ? parseScriptureRef(q.trim()) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Search</h1>
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          name="q"
          placeholder="Search by name, topic, or scripture (e.g. Prov 3:5)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" loading={busy}>Search</Button>
      </form>

      {/* Scripture-reference hint: when the query parses as a Bible
          reference, surface that we'll search devotionals/study days
          for both the typed form and the canonical book name. */}
      {parsed && (
        <p className="rounded-2xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700">
          <BookOpenCheck size={12} className="mr-1 inline -mt-0.5" />
          Searching scripture for <strong>{parsed.book}{parsed.remainder ? ` ${parsed.remainder}` : ''}</strong>{' '}
          across devotionals and Bible studies.
        </p>
      )}

      {results && (
        <div className="flex flex-wrap gap-2">
          {(['all', 'sisters', 'posts', 'prayers', 'events', 'resources', 'devotionals', 'studies'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              disabled={counts[f] === 0 && f !== 'all'}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold capitalize',
                filter === f
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-app text-app-muted hover:bg-surface-raised',
                counts[f] === 0 && f !== 'all' && 'cursor-not-allowed opacity-40'
              )}
            >
              {f === 'all' ? 'All' : f}
              {' '}({counts[f]})
            </button>
          ))}
        </div>
      )}

      {!results ? null : total === 0 ? (
        <EmptyState title="No matches" body="Try a different word, sister." icon={<SearchIcon size={24} />} />
      ) : (
        <>
          {show('sisters') && r.profiles.length > 0 && (
            <section>
              <SectionTitle>Sisters</SectionTitle>
              {r.profiles.map((p) => (
                <Link key={p.id} to={`/profile/${p.id}`}>
                  <Card className="mb-2 hover:bg-surface-raised">
                    <div className="flex items-center gap-3">
                      <Avatar size={36} url={p.avatar_url} name={p.display_name ?? p.first_name} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          <Highlight text={p.display_name ?? p.first_name ?? ''} term={q} />
                        </div>
                        <div className="truncate text-xs text-app-muted">
                          <Highlight text={[p.city, p.country].filter(Boolean).join(', ')} term={q} />
                          {p.profession && (
                            <>
                              {' · '}
                              <Highlight text={p.profession} term={q} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          )}
          {show('posts') && r.posts.length > 0 && (
            <section>
              <SectionTitle>Posts</SectionTitle>
              {r.posts.map((p) => (
                <Card key={p.id} className="mb-2">
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">
                    <Highlight text={p.content} term={q} />
                  </p>
                  <div className="mt-1 text-[11px] text-app-muted">{timeAgo(p.created_at)}</div>
                </Card>
              ))}
            </section>
          )}
          {show('prayers') && r.prayers.length > 0 && (
            <section>
              <SectionTitle>Prayer Wall</SectionTitle>
              {r.prayers.map((p) => (
                <Link key={p.id} to="/prayer">
                  <Card className="mb-2 hover:bg-surface-raised">
                    <p className="text-sm whitespace-pre-wrap line-clamp-3">
                      <Highlight text={p.content} term={q} />
                    </p>
                    <div className="mt-1 text-[11px] capitalize text-app-muted">{p.category}</div>
                  </Card>
                </Link>
              ))}
            </section>
          )}
          {show('events') && r.events.length > 0 && (
            <section>
              <SectionTitle>Events</SectionTitle>
              {r.events.map((e) => (
                <Link key={e.id} to="/events">
                  <Card className="mb-2 hover:bg-surface-raised">
                    <h3 className="font-display text-lg">
                      <Highlight text={e.title} term={q} />
                    </h3>
                    <p className="text-xs text-app-muted">{e.date}{e.location ? ` · ${e.location}` : ''}</p>
                    {e.description && (
                      <p className="mt-1 text-sm line-clamp-2">
                        <Highlight text={e.description} term={q} />
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </section>
          )}
          {show('resources') && r.resources.length > 0 && (
            <section>
              <SectionTitle>
                <span className="inline-flex items-center gap-2">
                  <Library size={16} className="text-brand-500" /> Resources
                </span>
              </SectionTitle>
              {r.resources.map((res) => (
                <Link key={res.id} to="/resources">
                  <Card className="mb-2 hover:bg-surface-raised">
                    <h3 className="font-display text-lg">
                      <Highlight text={res.title} term={q} />
                    </h3>
                    <p className="text-xs text-app-muted">
                      <Highlight text={res.category} term={q} />
                    </p>
                    {res.description && (
                      <p className="mt-1 text-sm line-clamp-2">
                        <Highlight text={res.description} term={q} />
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </section>
          )}
          {show('studies') && r.studyDays.length > 0 && (
            <section>
              <SectionTitle>
                <span className="inline-flex items-center gap-2">
                  <BookOpenCheck size={16} className="text-brand-500" /> Bible studies
                </span>
              </SectionTitle>
              {r.studyDays.map((d) => (
                <Link key={d.id} to="/study">
                  <Card className="mb-2 hover:bg-surface-raised">
                    <p className="text-[11px] uppercase tracking-wide text-brand-600">
                      {d.study?.title ?? 'Bible study'} · Day {d.day_number}
                    </p>
                    <h3 className="font-display text-lg">
                      <Highlight text={d.scripture_ref} term={q} />
                    </h3>
                    <p className="text-xs italic text-app-muted line-clamp-2">
                      <Highlight text={d.scripture_text} term={q} />
                    </p>
                    <p className="mt-1 text-sm line-clamp-2">
                      <Highlight text={d.reflection} term={q} />
                    </p>
                  </Card>
                </Link>
              ))}
            </section>
          )}
          {show('devotionals') && r.devotionals.length > 0 && (
            <section>
              <SectionTitle>
                <span className="inline-flex items-center gap-2">
                  <BookOpen size={16} className="text-brand-500" /> Devotionals
                </span>
              </SectionTitle>
              {r.devotionals.map((d) => (
                <Card key={d.id} className="mb-2">
                  <p className="text-[11px] uppercase tracking-wide text-brand-600">{d.date}</p>
                  <h3 className="font-display text-lg">
                    <Highlight text={d.theme} term={q} />
                  </h3>
                  <p className="text-xs italic text-app-muted">
                    <Highlight text={d.scripture_ref} term={q} />
                  </p>
                  <p className="mt-1 text-sm line-clamp-2">
                    <Highlight text={d.reflection} term={q} />
                  </p>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Wraps every case-insensitive occurrence of `term` inside `text` with a
 * highlighted span. Splitting on a regex with a capture group keeps the
 * matching characters in their original casing.
 */
function Highlight({ text, term }: { text: string; term: string }): ReactNode {
  const t = term.trim();
  if (!t) return text;
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-brand-100 px-0.5 text-brand-800">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
