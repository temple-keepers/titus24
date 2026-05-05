import { useEffect, useState, type FormEvent } from 'react';
import { HandHeart, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { PullToRefresh } from '../../components/PullToRefresh';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { listPrayerRequests } from '../../data/queries';
import type { PrayerRequestWithAuthor } from '../../data/queries';
import type { PrayerCategory } from '../../lib/database.types';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';

const CATEGORIES: PrayerCategory[] = ['health', 'family', 'marriage', 'guidance', 'praise', 'other'];

export default function PrayerWall() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState<'open' | 'praise'>('open');
  const [items, setItems] = useState<PrayerRequestWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    const list = await listPrayerRequests(tab === 'praise');
    setItems(list.filter((p) => (tab === 'praise' ? p.is_answered : !p.is_answered)));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // Live-update prayer counts when sisters tap "I'm praying" or share a
    // new request. We refetch the list head — listPrayerRequests already
    // computes response counts and joins authors.
    const channel = supabase
      .channel(`prayer-wall:${tab}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prayer_requests' },
        () => void refresh()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'prayer_responses' },
        () => void refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">Prayer Wall</h1>
          <p className="text-sm text-app-muted">Carry one another's burdens, sister.</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>Share a request</Button>
      </header>

      <div className="flex gap-2 rounded-2xl bg-surface-raised p-1 text-sm font-semibold">
        {(['open', 'praise'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-xl px-3 py-2',
              tab === t ? 'bg-surface text-app shadow-soft' : 'text-app-muted'
            )}
          >
            {t === 'open' ? 'Praying' : 'Praise reports'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingPage label="Gathering prayers…" />
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === 'open' ? 'No active prayer requests' : 'No praise reports yet'}
          body={tab === 'open' ? 'Be the first to share what you need.' : 'Mark answered prayers to celebrate them here.'}
          icon={<HandHeart size={28} />}
        />
      ) : (
        items.map((p) => <PrayerCard key={p.id} item={p} onChange={refresh} />)
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Share a prayer request">
        <ComposeForm
          onDone={() => {
            setComposeOpen(false);
            refresh();
          }}
        />
      </Modal>
    </div>
    </PullToRefresh>
  );
}

function ComposeForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('guidance');
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('prayer_requests').insert({
      author_id: user.id,
      content: content.trim(),
      category,
      is_anonymous: anonymous,
    });
    setBusy(false);
    if (failIfError(error, 'share your prayer request', addToast)) return;
    addToast({ kind: 'success', title: 'Your sisters are praying' });
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Textarea
        label="What can we pray with you about?"
        name="content"
        rows={5}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">Category</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold capitalize',
                category === c ? 'bg-brand-500 text-white border-brand-500' : 'border-app text-app-muted'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        Post anonymously (your name won't be shown)
      </label>
      <Button type="submit" loading={busy} fullWidth>
        Share request
      </Button>
    </form>
  );
}

interface PrayerResponseRow {
  id: string;
  prayer_request_id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    first_name: string | null;
    avatar_url: string | null;
  } | null;
}

function PrayerCard({ item, onChange }: { item: PrayerRequestWithAuthor; onChange: () => void }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState<PrayerResponseRow[]>([]);
  const [encouragement, setEncouragement] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const isOwner = user?.id === item.author_id;

  async function loadResponses() {
    const { data } = await supabase
      .from('prayer_responses')
      .select('id, prayer_request_id, user_id, content, created_at, user:profiles!prayer_responses_user_id_fkey(id, display_name, first_name, avatar_url)')
      .eq('prayer_request_id', item.id)
      .order('created_at', { ascending: true });
    setResponses(((data as unknown) as PrayerResponseRow[] | null) ?? []);
  }

  useEffect(() => {
    if (showResponses) void loadResponses();
  }, [showResponses, item.id]);

  async function pray() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('prayer_responses').insert({
      prayer_request_id: item.id,
      user_id: user.id,
      content: encouragement.trim() || null,
    });
    setBusy(false);
    if (failIfError(error, 'send your prayer', addToast)) return;
    setEncouragement('');
    addToast({ kind: 'success', title: 'Your prayer was sent', body: 'Your sister will know you stood with her.' });
    if (showResponses) void loadResponses();
    onChange();
  }

  async function saveEdit(id: string) {
    setBusy(true);
    const { error } = await supabase
      .from('prayer_responses')
      .update({ content: editText.trim() || null })
      .eq('id', id);
    setBusy(false);
    if (failIfError(error, 'edit your encouragement', addToast)) return;
    setEditingId(null);
    setEditText('');
    void loadResponses();
  }

  async function deleteResponse(id: string) {
    if (!confirm('Delete your encouragement?')) return;
    const { error } = await supabase.from('prayer_responses').delete().eq('id', id);
    if (failIfError(error, 'delete your encouragement', addToast)) return;
    void loadResponses();
    onChange();
  }

  async function markAnswered() {
    setBusy(true);
    const { error } = await supabase
      .from('prayer_requests')
      .update({ is_answered: true, answered_at: new Date().toISOString() })
      .eq('id', item.id);
    setBusy(false);
    if (failIfError(error, 'mark this answered', addToast)) return;
    addToast({ kind: 'success', title: 'Praise the Lord!' });
    onChange();
  }

  const author = item.is_anonymous ? null : item.author;
  const myResponses = responses.filter((r) => r.user_id === user?.id);
  const alreadyPrayed = myResponses.length > 0;

  return (
    <Card>
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
            {author ? author.display_name ?? author.first_name ?? 'Sister' : 'A sister (anonymous)'}
          </div>
          <div className="text-[11px] text-app-muted">
            {timeAgo(item.created_at)} · <span className="capitalize">{item.category}</span>
          </div>
        </div>
        {item.is_answered && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-1 text-[11px] font-semibold text-sage-800">
            <CheckCircle2 size={12} /> Answered
          </span>
        )}
      </header>
      <p className="break-words text-sm leading-7 whitespace-pre-wrap">{item.content}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowResponses((v) => !v)}
          className="text-xs font-semibold text-brand-600"
        >
          {item.response_count === 0
            ? 'Be the first to pray'
            : item.response_count === 1
            ? '1 sister prayed'
            : `${item.response_count} sisters prayed`}
          {' · '}
          {showResponses ? 'Hide' : 'Show'}
        </button>
        {isOwner && !item.is_answered && (
          <button onClick={markAnswered} className="ml-auto text-xs font-semibold text-brand-600">
            Mark answered
          </button>
        )}
      </div>

      {showResponses && (
        <div className="mt-3 space-y-3 border-t border-app pt-3">
          {/* Compose / re-pray */}
          {!item.is_answered && (
            <div className="space-y-2">
              <Textarea
                label={alreadyPrayed ? 'Send another encouragement (optional)' : 'Pray with her — add an encouragement (optional)'}
                value={encouragement}
                onChange={(e) => setEncouragement(e.target.value)}
                rows={2}
              />
              <Button
                size="sm"
                variant="secondary"
                loading={busy}
                onClick={pray}
                leadingIcon={<HandHeart size={14} />}
              >
                {encouragement.trim() ? 'Send encouragement' : "I'm praying"}
              </Button>
            </div>
          )}

          {/* Existing encouragements */}
          {responses.length === 0 && (
            <p className="text-xs text-app-muted">No encouragements yet — be the first.</p>
          )}
          {responses.map((r) => {
            const mine = r.user_id === user?.id;
            const isEditing = editingId === r.id;
            return (
              <div key={r.id} className="flex items-start gap-2">
                <Avatar
                  size={24}
                  url={r.user?.avatar_url ?? null}
                  name={r.user?.display_name ?? r.user?.first_name}
                />
                <div className="min-w-0 flex-1 rounded-2xl bg-surface-raised px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="truncate font-semibold">
                      {r.user?.display_name ?? r.user?.first_name ?? 'Sister'}
                    </span>
                    <span className="text-[10px] text-app-muted">{timeAgo(r.created_at)}</span>
                  </div>
                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" loading={busy} onClick={() => saveEdit(r.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {r.content ? (
                        <p className="mt-0.5 break-words text-sm">{r.content}</p>
                      ) : (
                        <p className="mt-0.5 text-xs italic text-app-muted">Stood with her in prayer.</p>
                      )}
                      {mine && (
                        <div className="mt-1 flex gap-3 text-[11px] font-semibold">
                          <button
                            onClick={() => {
                              setEditingId(r.id);
                              setEditText(r.content ?? '');
                            }}
                            className="text-brand-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void deleteResponse(r.id)}
                            className="text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
