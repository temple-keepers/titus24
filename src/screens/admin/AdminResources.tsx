import { useEffect, useState, type FormEvent } from 'react';
import { Library, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { ImageUpload } from '../../components/ImageUpload';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';
import type { Resource, Profile } from '../../lib/database.types';

type Tab = 'pending' | 'live';

interface Row extends Resource {
  submitter:
    | Pick<Profile, 'id' | 'display_name' | 'first_name' | 'avatar_url'>
    | null;
}

export default function AdminResources() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    url: '',
    cover_url: '',
  });
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from('resources')
      .select(
        '*, submitter:profiles!resources_submitted_by_fkey(id, display_name, first_name, avatar_url)'
      )
      .order('created_at', { ascending: false });
    setRows(((data as unknown) as Row[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function approve(r: Row) {
    if (!user) return;
    const { error } = await supabase
      .from('resources')
      .update({ is_published: true, approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', r.id);
    if (failIfError(error, 'approve resource', addToast)) return;

    if (r.submitted_by) {
      void supabase.from('notifications').insert({
        user_id: r.submitted_by,
        title: 'Your resource was approved',
        body: r.title,
        link: '/resources',
        is_read: false,
      });
    }
    addToast({ kind: 'success', title: 'Approved' });
    void refresh();
  }

  async function reject(r: Row) {
    if (!confirm(`Reject "${r.title}"? It will be deleted.`)) return;
    const { error } = await supabase.from('resources').delete().eq('id', r.id);
    if (failIfError(error, 'reject resource', addToast)) return;
    addToast({ kind: 'info', title: 'Rejected and removed' });
    void refresh();
  }

  async function unpublish(r: Row) {
    if (!confirm(`Take "${r.title}" off the live library?`)) return;
    const { error } = await supabase
      .from('resources')
      .update({ is_published: false })
      .eq('id', r.id);
    if (failIfError(error, 'unpublish', addToast)) return;
    void refresh();
  }

  async function del(r: Row) {
    if (!confirm(`Delete "${r.title}"?`)) return;
    const { error } = await supabase.from('resources').delete().eq('id', r.id);
    if (failIfError(error, 'delete', addToast)) return;
    void refresh();
  }

  async function createDirectly(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('resources').insert({
      title: form.title.trim(),
      category: form.category.trim() || 'Other',
      description: form.description.trim() || null,
      url: form.url.trim(),
      cover_url: form.cover_url || null,
      is_published: true,
      submitted_by: user.id,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    });
    setBusy(false);
    if (failIfError(error, 'create resource', addToast)) return;
    addToast({ kind: 'success', title: 'Resource added' });
    setForm({ title: '', category: '', description: '', url: '', cover_url: '' });
    void refresh();
  }

  if (loading) return <LoadingPage />;

  const pending = rows.filter((r) => !r.is_published);
  const live = rows.filter((r) => r.is_published);
  const list = tab === 'pending' ? pending : live;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Add a resource directly</SectionTitle>
        <form onSubmit={createDirectly} className="space-y-3">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Category"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="URL"
            type="url"
            required
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">
              Cover image
            </span>
            {user && (
              <ImageUpload
                bucket="gallery"
                userId={user.id}
                value={form.cover_url}
                onChange={(url) => setForm({ ...form, cover_url: url })}
                buttonLabel="Upload cover"
                label="Optional. Up to 5 MB."
              />
            )}
          </div>
          <Button type="submit" loading={busy}>Add</Button>
        </form>
      </Card>

      <div className="flex gap-2 rounded-2xl bg-surface-raised p-1 text-sm font-semibold">
        <button
          onClick={() => setTab('pending')}
          className={cn(
            'flex-1 rounded-xl px-3 py-2 inline-flex items-center justify-center gap-2',
            tab === 'pending' ? 'bg-surface text-app shadow-soft' : 'text-app-muted'
          )}
        >
          <Clock size={14} /> Pending review
          {pending.length > 0 && (
            <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('live')}
          className={cn(
            'flex-1 rounded-xl px-3 py-2',
            tab === 'live' ? 'bg-surface text-app shadow-soft' : 'text-app-muted'
          )}
        >
          Live ({live.length})
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={tab === 'pending' ? 'No suggestions waiting' : 'No live resources'}
          body={
            tab === 'pending'
              ? 'When sisters suggest a resource, it shows up here for your review.'
              : 'Approve a pending suggestion or add one directly above.'
          }
          icon={tab === 'pending' ? <Clock size={24} /> : <Library size={24} />}
        />
      ) : (
        list.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start gap-3">
              {r.cover_url ? (
                <img
                  src={r.cover_url}
                  alt=""
                  className="hidden h-16 w-16 shrink-0 rounded-2xl object-cover sm:block"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg">{r.title}</h3>
                <p className="text-xs text-app-muted">
                  {r.category}
                  {r.submitter && ` · suggested by ${r.submitter.display_name ?? r.submitter.first_name ?? 'a sister'} · ${timeAgo(r.created_at)}`}
                </p>
                {r.description && (
                  <p className="mt-1 text-sm">{r.description}</p>
                )}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 break-all text-xs text-brand-600"
                >
                  <ExternalLink size={12} /> {r.url}
                </a>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {tab === 'pending' ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    leadingIcon={<XCircle size={14} />}
                    onClick={() => void reject(r)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    leadingIcon={<CheckCircle2 size={14} />}
                    onClick={() => void approve(r)}
                  >
                    Approve
                  </Button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => void unpublish(r)}
                    className="text-xs font-semibold text-app-muted hover:text-brand-600"
                  >
                    Unpublish
                  </button>
                  <button
                    onClick={() => void del(r)}
                    className="text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
