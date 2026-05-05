import { useEffect, useState, type FormEvent } from 'react';
import { Users, Lock, Globe } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Input';
import { LoadingPage } from '../../components/LoadingPage';
import { Avatar } from '../../components/Avatar';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { listPods } from '../../data/queries';
import type { PodWithStats } from '../../data/queries';
import type { Profile } from '../../lib/database.types';
import { isLeadership, publicRole } from '../../lib/roles';
import { cn } from '../../lib/cn';
import { timeAgo } from '../../lib/dates';

export default function Groups() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState<'mine' | 'browse'>('mine');
  const [pods, setPods] = useState<PodWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPodId, setOpenPodId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setPods(await listPods(user?.id ?? null));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const visible = pods.filter((p) =>
    tab === 'mine' ? p.is_member : !p.is_member && p.visibility === 'public'
  );

  async function join(p: PodWithStats) {
    if (!user) return;
    if (p.max_members && p.member_count >= p.max_members) {
      addToast({ kind: 'error', title: 'This group is full', body: 'Try another, sister.' });
      return;
    }
    const { error } = await supabase.from('pod_members').insert({
      pod_id: p.id,
      user_id: user.id,
      role: 'member',
    });
    if (failIfError(error, 'join this group', addToast)) return;
    addToast({ kind: 'success', title: `Welcome to ${p.name}` });
    refresh();
  }

  async function leave(p: PodWithStats) {
    if (!user) return;
    // Check if the user is the leader of this pod (per pod_members.role).
    const { data: myMembership } = await supabase
      .from('pod_members')
      .select('role')
      .eq('pod_id', p.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if ((myMembership as { role?: string } | null)?.role === 'leader') {
      addToast({
        kind: 'error',
        title: "Leaders can't leave their own group",
        body: 'Please ask an elder to remove you.',
      });
      return;
    }
    const { error } = await supabase
      .from('pod_members')
      .delete()
      .eq('pod_id', p.id)
      .eq('user_id', user.id);
    if (failIfError(error, 'leave this group', addToast)) return;
    addToast({ kind: 'info', title: `You've left ${p.name}` });
    refresh();
  }

  if (loading) return <LoadingPage />;

  if (openPodId) {
    const pod = pods.find((p) => p.id === openPodId);
    if (pod) return <PodDetail pod={pod} onBack={() => setOpenPodId(null)} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Groups</h1>
      <div className="flex gap-2 rounded-2xl bg-surface-raised p-1 text-sm font-semibold">
        {(['mine', 'browse'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn('flex-1 rounded-xl px-3 py-2', tab === t ? 'bg-surface text-app shadow-soft' : 'text-app-muted')}
          >
            {t === 'mine' ? 'My Groups' : 'Browse Groups'}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={tab === 'mine' ? "You're not in any groups yet" : 'No public groups available'}
          body={tab === 'mine' ? 'Browse to find one that suits you.' : 'Ask an elder to add one.'}
          icon={<Users size={28} />}
        />
      ) : (
        visible.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-2xl bg-sage-100 p-3 text-sage-700">
                <Users size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl flex items-center gap-2">
                  {p.name}
                  {p.visibility === 'private' ? (
                    <Lock size={14} className="text-app-muted" />
                  ) : (
                    <Globe size={14} className="text-app-muted" />
                  )}
                </h2>
                {p.description && <p className="text-sm text-app-muted">{p.description}</p>}
                <p className="mt-1 text-xs text-app-muted">
                  {p.member_count} {p.member_count === 1 ? 'sister' : 'sisters'}
                  {p.max_members ? ` of ${p.max_members}` : ''}
                </p>
              </div>
              {p.is_member ? (
                <Button size="sm" variant="secondary" onClick={() => setOpenPodId(p.id)}>
                  Open
                </Button>
              ) : (
                <Button size="sm" onClick={() => join(p)}>
                  Join
                </Button>
              )}
            </div>
            {p.is_member && (
              <div className="mt-3 flex justify-end border-t border-app pt-2">
                <button
                  onClick={() => {
                    if (confirm(`Leave ${p.name}?`)) leave(p);
                  }}
                  className="text-xs font-semibold text-app-muted hover:text-red-600"
                >
                  Leave group
                </button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

function PodDetail({ pod, onBack }: { pod: PodWithStats; onBack: () => void }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [checkins, setCheckins] = useState<Array<{ id: string; content: string; created_at: string; user_id: string; user: Pick<Profile, 'id' | 'display_name' | 'first_name' | 'avatar_url' | 'role'> | null }>>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [checkinsRes, membersRes] = await Promise.all([
      supabase
        .from('pod_checkins')
        .select('*, user:profiles!pod_checkins_user_id_fkey(id, display_name, first_name, avatar_url, role)')
        .eq('pod_id', pod.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('pod_members').select('*, user:profiles!pod_members_user_id_fkey(*)').eq('pod_id', pod.id),
    ]);
    setCheckins((checkinsRes.data as typeof checkins | null) ?? []);
    setMembers(((membersRes.data as Array<{ user: Profile }> | null) ?? []).map((m) => m.user));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // Live-update group discussion when sisters post check-ins.
    const channel = supabase
      .channel(`pod:${pod.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pod_checkins',
          filter: `pod_id=eq.${pod.id}`,
        },
        () => void refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pod.id]);

  async function onShare(e: FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('pod_checkins').insert({
      pod_id: pod.id,
      user_id: user.id,
      content: content.trim(),
    });
    setBusy(false);
    if (failIfError(error, 'share with the group', addToast)) return;
    setContent('');
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button onClick={onBack} className="text-sm text-brand-600 font-semibold">← All groups</button>
      <Card>
        <h1 className="font-display text-2xl">{pod.name}</h1>
        {pod.description && <p className="text-sm text-app-muted mt-1">{pod.description}</p>}
        <p className="mt-2 text-xs text-app-muted">{members.length} members</p>
      </Card>

      <Card>
        <form onSubmit={onShare} className="space-y-3">
          <Textarea
            label="Share with the group"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
          />
          <Button type="submit" loading={busy}>
            Post
          </Button>
        </form>
      </Card>

      <SectionTitle>Discussion</SectionTitle>
      {checkins.length === 0 ? (
        <EmptyState title="No check-ins yet" body="Be the first to share with the group." />
      ) : (
        checkins.map((c) => (
          <Card key={c.id}>
            <header className="mb-2 flex items-center gap-3">
              <Avatar size={32} url={c.user?.avatar_url ?? null} name={c.user?.display_name ?? c.user?.first_name} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{c.user?.display_name ?? c.user?.first_name ?? 'Sister'}</div>
                <div className="text-[11px] text-app-muted">{timeAgo(c.created_at)}</div>
              </div>
            </header>
            <p className="text-sm whitespace-pre-wrap">{c.content}</p>
          </Card>
        ))
      )}

      <SectionTitle>Members</SectionTitle>
      <Card>
        <ul className="divide-y divide-app">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2">
              <Avatar size={32} url={m.avatar_url} name={m.display_name ?? m.first_name} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{m.display_name ?? m.first_name}</div>
                <div className="text-[11px] text-app-muted">{m.city ?? m.country ?? ''}</div>
              </div>
              {isLeadership(m.role) && (
                <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[11px] font-semibold text-gold-600">
                  {publicRole(m.role)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
