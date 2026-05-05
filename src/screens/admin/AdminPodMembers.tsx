import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Users, Crown, UserPlus, Trash2 } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';

interface MemberRow {
  pod_id: string;
  user_id: string;
  role: 'leader' | 'member' | string;
  joined_at?: string;
  user: Profile | null;
}

interface PodSummary {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  max_members: number | null;
}

export default function AdminPodMembers() {
  const { podId } = useParams<{ podId: string }>();
  const { addToast } = useToast();
  const [pod, setPod] = useState<PodSummary | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [allSisters, setAllSisters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string>('');

  async function refresh() {
    if (!podId) return;
    const [podRes, memRes, sistersRes] = await Promise.all([
      supabase.from('pods').select('id, name, description, visibility, max_members').eq('id', podId).maybeSingle(),
      supabase
        .from('pod_members')
        .select('pod_id, user_id, role, user:profiles!pod_members_user_id_fkey(*)')
        .eq('pod_id', podId),
      supabase.from('profiles').select('*').eq('status', 'active').order('display_name'),
    ]);
    setPod((podRes.data as PodSummary | null) ?? null);
    setMembers(((memRes.data as unknown) as MemberRow[] | null) ?? []);
    setAllSisters((sistersRes.data as Profile[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podId]);

  async function setRole(m: MemberRow, role: 'leader' | 'member') {
    const { error } = await supabase
      .from('pod_members')
      .update({ role })
      .eq('pod_id', m.pod_id)
      .eq('user_id', m.user_id);
    if (failIfError(error, 'change role', addToast)) return;
    addToast({ kind: 'success', title: role === 'leader' ? 'Made co-leader' : 'Set to member' });
    void refresh();
  }

  async function remove(m: MemberRow) {
    if (!confirm(`Remove ${m.user?.display_name ?? m.user?.first_name ?? 'this sister'} from the group?`)) return;
    const { error } = await supabase
      .from('pod_members')
      .delete()
      .eq('pod_id', m.pod_id)
      .eq('user_id', m.user_id);
    if (failIfError(error, 'remove', addToast)) return;
    void refresh();
  }

  async function addMember() {
    if (!podId || !adding) return;
    const { error } = await supabase.from('pod_members').insert({
      pod_id: podId,
      user_id: adding,
      role: 'member',
    });
    if (failIfError(error, 'add to group', addToast)) return;
    addToast({ kind: 'success', title: 'Added' });
    setAdding('');
    void refresh();
  }

  if (loading) return <LoadingPage />;
  if (!pod) {
    return (
      <EmptyState
        title="Group not found"
        body="The group may have been deleted."
        action={
          <Link to="/admin/pods" className="text-sm font-semibold text-brand-600">
            ← All groups
          </Link>
        }
      />
    );
  }

  const memberIds = new Set(members.map((m) => m.user_id));
  const candidates = allSisters.filter((s) => !memberIds.has(s.id));
  const leaders = members.filter((m) => m.role === 'leader');
  const others = members.filter((m) => m.role !== 'leader');

  return (
    <div className="space-y-4">
      <Link to="/admin/pods" className="text-sm font-semibold text-brand-600">
        ← All groups
      </Link>
      <Card>
        <h1 className="font-display text-2xl">{pod.name}</h1>
        {pod.description && <p className="mt-1 text-sm text-app-muted">{pod.description}</p>}
        <p className="mt-2 text-xs text-app-muted">
          {pod.visibility} · {members.length} member{members.length === 1 ? '' : 's'}
          {pod.max_members ? ` of ${pod.max_members}` : ''}
        </p>
      </Card>

      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <UserPlus size={16} className="text-brand-500" /> Add a sister
          </span>
        </SectionTitle>
        {candidates.length === 0 ? (
          <p className="text-xs text-app-muted">Every active sister is already in this group.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <select
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              className="min-w-[200px] flex-1 rounded-2xl border border-app bg-surface px-3 py-2 text-sm"
            >
              <option value="">Choose a sister…</option>
              {candidates.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name ?? s.first_name ?? s.email ?? 'Sister'}
                </option>
              ))}
            </select>
            <Button onClick={() => void addMember()} disabled={!adding}>Add</Button>
          </div>
        )}
      </Card>

      <SectionTitle>
        <span className="inline-flex items-center gap-2">
          <Crown size={16} className="text-gold-600" /> Leaders ({leaders.length})
        </span>
      </SectionTitle>
      {leaders.length === 0 ? (
        <EmptyState title="No leaders yet" body="Promote a member below to give her leader rights." />
      ) : (
        leaders.map((m) => <MemberCard key={m.user_id} m={m} onRole={setRole} onRemove={remove} />)
      )}

      <SectionTitle>
        <span className="inline-flex items-center gap-2">
          <Users size={16} className="text-brand-500" /> Members ({others.length})
        </span>
      </SectionTitle>
      {others.length === 0 ? (
        <EmptyState title="No members yet" body="Add sisters above." />
      ) : (
        others.map((m) => <MemberCard key={m.user_id} m={m} onRole={setRole} onRemove={remove} />)
      )}
    </div>
  );
}

function MemberCard({
  m,
  onRole,
  onRemove,
}: {
  m: MemberRow;
  onRole: (m: MemberRow, role: 'leader' | 'member') => void;
  onRemove: (m: MemberRow) => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <Avatar
          size={40}
          url={m.user?.avatar_url ?? null}
          name={m.user?.display_name ?? m.user?.first_name}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {m.user?.display_name ?? m.user?.first_name ?? 'Sister'}
            {m.role === 'leader' && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold-400/20 px-2 py-0.5 text-[11px] font-semibold text-gold-700">
                <Crown size={10} /> Leader
              </span>
            )}
          </p>
          <p className="truncate text-[11px] text-app-muted">
            {[m.user?.city, m.user?.country].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-app pt-3">
        {m.role === 'leader' ? (
          <Button size="sm" variant="ghost" onClick={() => onRole(m, 'member')}>
            Step down to member
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            leadingIcon={<Crown size={14} />}
            onClick={() => onRole(m, 'leader')}
          >
            Make co-leader
          </Button>
        )}
        <button
          onClick={() => onRemove(m)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </Card>
  );
}
