import { useEffect, useState, type FormEvent } from 'react';
import { Sparkles, Plus, Clock } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../../lib/dates';
import type { Profile } from '../../lib/database.types';

interface Testimony {
  id: string;
  author_id: string | null;
  title: string | null;
  content: string;
  is_anonymous: boolean;
  is_published: boolean;
  approved_at: string | null;
  created_at: string;
  author: Pick<Profile, 'id' | 'display_name' | 'first_name' | 'avatar_url'> | null;
}

export default function Testimonies() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Testimony[]>([]);
  const [myDrafts, setMyDrafts] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', anonymous: false });
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [pubRes, mineRes] = await Promise.all([
      supabase
        .from('testimonies')
        .select(
          'id, author_id, title, content, is_anonymous, is_published, approved_at, created_at, author:profiles!testimonies_author_id_fkey(id, display_name, first_name, avatar_url)'
        )
        .eq('is_published', true)
        .order('approved_at', { ascending: false })
        .limit(50),
      user
        ? supabase
            .from('testimonies')
            .select('*')
            .eq('author_id', user.id)
            .eq('is_published', false)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as Testimony[] }),
    ]);
    setItems(((pubRes.data as unknown) as Testimony[] | null) ?? []);
    setMyDrafts(((mineRes.data as unknown) as Testimony[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || !form.content.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('testimonies').insert({
      author_id: user.id,
      title: form.title.trim() || null,
      content: form.content.trim(),
      is_anonymous: form.anonymous,
      is_published: false,
    });
    setBusy(false);
    if (failIfError(error, 'submit your testimony', addToast)) return;
    addToast({
      kind: 'success',
      title: 'Sent for review',
      body: "A leader will read your story before it goes on the wall.",
    });
    setForm({ title: '', content: '', anonymous: false });
    setShowCompose(false);
    void refresh();
  }

  async function deleteDraft(id: string) {
    if (!confirm('Delete this draft?')) return;
    const { error } = await supabase.from('testimonies').delete().eq('id', id);
    if (failIfError(error, 'delete', addToast)) return;
    void refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Testimonies</h1>
          <p className="text-sm text-app-muted">
            Stories of God's faithfulness, sister to sister.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<Plus size={14} />}
          onClick={() => setShowCompose((v) => !v)}
        >
          Share
        </Button>
      </header>

      {showCompose && (
        <Card>
          <SectionTitle>Share your story</SectionTitle>
          <p className="mb-3 text-xs text-app-muted">
            What has the Lord done for you? A line, a paragraph, a chapter — whatever you can. A
            leader will read it before it goes on the wall.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <Input
              label="Title (optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="From striving to peace"
            />
            <Textarea
              label="Your testimony"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              required
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <span className="font-semibold">Share anonymously</span>
                <span className="block text-xs text-app-muted">
                  Sisters won't see your name. Leaders still see it for moderation.
                </span>
              </span>
            </label>
            <div className="flex gap-2">
              <Button type="submit" loading={busy}>Send for review</Button>
              <Button type="button" variant="ghost" onClick={() => setShowCompose(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* My pending drafts */}
      {myDrafts.length > 0 && (
        <section>
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <Clock size={14} className="text-app-muted" /> Awaiting review
            </span>
          </SectionTitle>
          <div className="space-y-2">
            {myDrafts.map((t) => (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {t.title && <h3 className="font-display text-lg">{t.title}</h3>}
                    <p className="mt-1 line-clamp-3 text-sm whitespace-pre-wrap">{t.content}</p>
                    {t.is_anonymous && (
                      <p className="mt-1 text-[11px] text-app-muted">Will publish anonymously.</p>
                    )}
                  </div>
                  <button
                    onClick={() => void deleteDraft(t.id)}
                    className="text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No testimonies yet"
          body="Be the first to tell of God's faithfulness."
          icon={<Sparkles size={28} />}
        />
      ) : (
        items.map((t) => <TestimonyCard key={t.id} item={t} />)
      )}
    </div>
  );
}

function TestimonyCard({ item }: { item: Testimony }) {
  const author = item.is_anonymous ? null : item.author;
  return (
    <Card as="article">
      <header className="mb-2 flex items-center gap-3">
        {author ? (
          <Avatar size={36} url={author.avatar_url ?? null} name={author.display_name ?? author.first_name} />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-app-muted">
            <Sparkles size={16} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {author ? author.display_name ?? author.first_name ?? 'A sister' : 'A sister (anonymous)'}
          </div>
          <div className="text-[11px] text-app-muted">
            {item.approved_at ? timeAgo(item.approved_at) : timeAgo(item.created_at)}
          </div>
        </div>
      </header>
      {item.title && <h2 className="font-display text-xl mb-1">{item.title}</h2>}
      <p className="break-words text-sm leading-7 whitespace-pre-wrap">{item.content}</p>
    </Card>
  );
}
