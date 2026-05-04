import { useState, type FormEvent } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Post, PrayerRequest, Profile, EventRow } from '../../lib/database.types';
import { timeAgo } from '../../lib/dates';

interface Results {
  posts: Post[];
  prayers: PrayerRequest[];
  profiles: Profile[];
  events: EventRow[];
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    const term = `%${q.trim()}%`;
    const [posts, prayers, profiles, events] = await Promise.all([
      supabase.from('posts').select('*').ilike('content', term).limit(20),
      supabase.from('prayer_requests').select('*').ilike('content', term).eq('is_anonymous', false).limit(20),
      supabase.from('profiles').select('*').or(`display_name.ilike.${term},first_name.ilike.${term},city.ilike.${term}`).limit(20),
      supabase.from('events').select('*').or(`title.ilike.${term},description.ilike.${term}`).limit(20),
    ]);
    setResults({
      posts: (posts.data as Post[] | null) ?? [],
      prayers: (prayers.data as PrayerRequest[] | null) ?? [],
      profiles: (profiles.data as Profile[] | null) ?? [],
      events: (events.data as EventRow[] | null) ?? [],
    });
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Search</h1>
      <form onSubmit={onSearch} className="flex gap-2">
        <Input name="q" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" loading={busy}>Search</Button>
      </form>

      {!results ? null : (
        <>
          {results.profiles.length > 0 && (
            <section>
              <SectionTitle>Sisters</SectionTitle>
              {results.profiles.map((p) => (
                <Link key={p.id} to={`/profile/${p.id}`}>
                  <Card className="mb-2 hover:bg-surface-raised">
                    <div className="flex items-center gap-3">
                      <Avatar size={36} url={p.avatar_url} name={p.display_name ?? p.first_name} />
                      <div>
                        <div className="text-sm font-semibold">{p.display_name ?? p.first_name}</div>
                        <div className="text-xs text-app-muted">{[p.city, p.country].filter(Boolean).join(', ')}</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          )}
          {results.posts.length > 0 && (
            <section>
              <SectionTitle>Posts</SectionTitle>
              {results.posts.map((p) => (
                <Card key={p.id} className="mb-2">
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">{p.content}</p>
                  <div className="text-[11px] text-app-muted mt-1">{timeAgo(p.created_at)}</div>
                </Card>
              ))}
            </section>
          )}
          {results.prayers.length > 0 && (
            <section>
              <SectionTitle>Prayer Wall</SectionTitle>
              {results.prayers.map((p) => (
                <Card key={p.id} className="mb-2">
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">{p.content}</p>
                  <div className="text-[11px] text-app-muted mt-1 capitalize">{p.category}</div>
                </Card>
              ))}
            </section>
          )}
          {results.events.length > 0 && (
            <section>
              <SectionTitle>Events</SectionTitle>
              {results.events.map((e) => (
                <Card key={e.id} className="mb-2">
                  <h3 className="font-display text-lg">{e.title}</h3>
                  <p className="text-xs text-app-muted">{e.date}</p>
                </Card>
              ))}
            </section>
          )}
          {results.profiles.length + results.posts.length + results.prayers.length + results.events.length === 0 && (
            <EmptyState title="No matches" body="Try a different word, sister." icon={<SearchIcon size={24} />} />
          )}
        </>
      )}
    </div>
  );
}
