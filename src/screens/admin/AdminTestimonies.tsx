import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';
import type { Profile } from '../../lib/database.types';

interface Row {
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

type Tab = 'pending' | 'live';

export default function AdminTestimonies() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { data } = await supabase
      .from('testimonies')
      .select(
        '*, author:profiles!testimonies_author_id_fkey(id, display_name, first_name, avatar_url)'
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
      .from('testimonies')
      .update({ is_published: true, approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', r.id);
    if (failIfError(error, 'approve testimony', addToast)) return;

    if (r.author_id) {
      void supabase.from('notifications').insert({
        user_id: r.author_id,
        type: 'general',
        title: 'Your testimony is on the wall',
        body: r.title ?? 'A leader has approved what you shared.',
        link: '/testimonies',
        is_read: false,
      });
    }
    addToast({ kind: 'success', title: 'Approved' });
    void refresh();
  }

  async function reject(r: Row) {
    if (!confirm(`Reject this testimony? It will be deleted.`)) return;
    const { error } = await supabase.from('testimonies').delete().eq('id', r.id);
    if (failIfError(error, 'reject', addToast)) return;
    addToast({ kind: 'info', title: 'Rejected and removed' });
    void refresh();
  }

  async function unpublish(r: Row) {
    if (!confirm(`Unpublish this testimony?`)) return;
    const { error } = await supabase
      .from('testimonies')
      .update({ is_published: false })
      .eq('id', r.id);
    if (failIfError(error, 'unpublish', addToast)) return;
    void refresh();
  }

  if (loading) return <LoadingPage />;

  const pending = rows.filter((r) => !r.is_published);
  const live = rows.filter((r) => r.is_published);
  const list = tab === 'pending' ? pending : live;

  return (
    <div className="space-y-4">
      <SectionTitle>
        <span className="inline-flex items-center gap-2">
          <Sparkles size={16} className="text-brand-500" /> Testimonies
        </span>
      </SectionTitle>

      <div className="flex gap-2 rounded-2xl bg-surface-raised p-1 text-sm font-semibold">
        <button
          onClick={() => setTab('pending')}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2',
            tab === 'pending' ? 'bg-surface text-app shadow-soft' : 'text-app-muted'
          )}
        >
          <Clock size={14} /> Pending
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
          title={tab === 'pending' ? 'No testimonies waiting' : 'Nothing on the wall yet'}
          body={
            tab === 'pending'
              ? 'When sisters share, they show up here for review.'
              : 'Approve a pending testimony to put it on the wall.'
          }
          icon={<Sparkles size={24} />}
        />
      ) : (
        list.map((r) => (
          <Card key={r.id}>
            <header className="mb-2 flex items-center gap-3">
              <Avatar
                size={32}
                url={r.author?.avatar_url ?? null}
                name={r.author?.display_name ?? r.author?.first_name}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {r.author?.display_name ?? r.author?.first_name ?? 'A sister'}
                  {r.is_anonymous && (
                    <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                      will be anonymous
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-app-muted">{timeAgo(r.created_at)}</p>
              </div>
            </header>
            {r.title && <h3 className="mb-1 font-display text-lg">{r.title}</h3>}
            <p className="text-sm leading-7 whitespace-pre-wrap break-words">{r.content}</p>
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
                    onClick={() => void reject(r)}
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
