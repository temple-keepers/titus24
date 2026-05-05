import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Filter, X, Send, MessageCircle } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { Modal } from '../../components/Modal';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { isLeadership } from '../../lib/roles';
import { cn } from '../../lib/cn';
import type { Profile, Role, Status, MaritalStatus } from '../../lib/database.types';

type RoleFilter = 'any' | 'elder' | 'member';
type Stage = 'any' | '20s' | '30s' | '40s' | '50s' | '60s+';
type MaritalFilter = MaritalStatus | 'any';
type StatusFilter = 'any' | 'active' | 'banned' | 'removed';

export default function AdminMembers() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [members, setMembers] = useState<Profile[]>([]);
  const [q, setQ] = useState('');
  const [country, setCountry] = useState<string>('any');
  const [role, setRole] = useState<RoleFilter>('any');
  const [marital, setMarital] = useState<MaritalFilter>('any');
  const [skill, setSkill] = useState<string>('any');
  const [stage, setStage] = useState<Stage>('any');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('any');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noteTarget, setNoteTarget] = useState<Profile | null>(null);

  async function refresh() {
    const { data } = await supabase.from('profiles').select('*').order('display_name');
    setMembers((data as Profile[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.country && set.add(m.country));
    return Array.from(set).sort();
  }, [members]);
  const skills = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => (m.skills ?? []).forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return members.filter((m) => {
      if (lower) {
        const hay = [m.display_name, m.first_name, m.last_name, m.email, m.city, m.country, m.profession]
          .filter(Boolean)
          .map((v) => v!.toLowerCase());
        if (!hay.some((v) => v.includes(lower))) return false;
      }
      if (country !== 'any' && m.country !== country) return false;
      if (role === 'elder' && !isLeadership(m.role)) return false;
      if (role === 'member' && isLeadership(m.role)) return false;
      if (marital !== 'any' && m.marital_status !== marital) return false;
      if (skill !== 'any' && !(m.skills ?? []).includes(skill)) return false;
      if (stage !== 'any' && stageOfLife(m.birthday) !== stage) return false;
      if (statusFilter !== 'any' && m.status !== statusFilter) return false;
      return true;
    });
  }, [members, q, country, role, marital, skill, stage, statusFilter]);

  const activeFilters =
    (country !== 'any' ? 1 : 0) +
    (role !== 'any' ? 1 : 0) +
    (marital !== 'any' ? 1 : 0) +
    (skill !== 'any' ? 1 : 0) +
    (stage !== 'any' ? 1 : 0) +
    (statusFilter !== 'any' ? 1 : 0);

  function clearFilters() {
    setCountry('any');
    setRole('any');
    setMarital('any');
    setSkill('any');
    setStage('any');
    setStatusFilter('any');
  }

  async function setMemberRole(m: Profile, r: Role) {
    const { error } = await supabase.from('profiles').update({ role: r }).eq('id', m.id);
    if (failIfError(error, 'change role', addToast)) return;
    addToast({ kind: 'success', title: `Role updated to ${r}` });
    void refresh();
  }

  async function setStatus(m: Profile, s: Status, reason?: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ status: s, banned_reason: reason ?? null })
      .eq('id', m.id);
    if (failIfError(error, 'update status', addToast)) return;
    addToast({ kind: 'success', title: `Member ${s}` });
    void refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            name="q"
            placeholder="Search by name, email, city, profession"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'shrink-0 rounded-2xl border px-3 py-2 text-sm font-semibold',
            activeFilters > 0
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-app text-app-muted hover:bg-surface-raised'
          )}
        >
          <Filter size={16} className="inline" /> Filters
          {activeFilters > 0 && (
            <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <Card className="space-y-3">
          <FilterRow label="Country">
            <ChipGroup
              options={[{ label: 'Any', value: 'any' }, ...countries.map((c) => ({ label: c, value: c }))]}
              value={country}
              onChange={(v) => setCountry(v)}
            />
          </FilterRow>
          <FilterRow label="Role">
            <ChipGroup
              options={[
                { label: 'Any', value: 'any' },
                { label: 'Elders', value: 'elder' },
                { label: 'Members', value: 'member' },
              ]}
              value={role}
              onChange={(v) => setRole(v as RoleFilter)}
            />
          </FilterRow>
          <FilterRow label="Marital status">
            <ChipGroup
              options={[
                { label: 'Any', value: 'any' },
                { label: 'Single', value: 'single' },
                { label: 'Married', value: 'married' },
                { label: 'Divorced', value: 'divorced' },
                { label: 'Widowed', value: 'widowed' },
              ]}
              value={marital}
              onChange={(v) => setMarital(v as MaritalFilter)}
            />
          </FilterRow>
          {skills.length > 0 && (
            <FilterRow label="Skill">
              <ChipGroup
                options={[{ label: 'Any', value: 'any' }, ...skills.map((s) => ({ label: s, value: s }))]}
                value={skill}
                onChange={(v) => setSkill(v)}
              />
            </FilterRow>
          )}
          <FilterRow label="Decade of life">
            <ChipGroup
              options={[
                { label: 'Any', value: 'any' },
                { label: '20s', value: '20s' },
                { label: '30s', value: '30s' },
                { label: '40s', value: '40s' },
                { label: '50s', value: '50s' },
                { label: '60s+', value: '60s+' },
              ]}
              value={stage}
              onChange={(v) => setStage(v as Stage)}
            />
          </FilterRow>
          <FilterRow label="Account status">
            <ChipGroup
              options={[
                { label: 'Any', value: 'any' },
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'banned' },
                { label: 'Removed', value: 'removed' },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
            />
          </FilterRow>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </Card>
      )}

      <p className="text-xs text-app-muted">
        Showing <span className="font-semibold tabular-nums">{filtered.length}</span> of{' '}
        <span className="tabular-nums">{members.length}</span>.
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="No matches" body="Try a different search or clear filters." />
      ) : (
        filtered.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center gap-3">
              <Avatar size={40} url={m.avatar_url} name={m.display_name ?? m.first_name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{m.display_name ?? m.first_name ?? m.email}</div>
                <div className="truncate text-[11px] text-app-muted">
                  {m.email}
                  {(m.city || m.country) && ` · ${[m.city, m.country].filter(Boolean).join(', ')}`}
                  {m.profession && ` · ${m.profession}`}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-app pt-3">
              <button
                onClick={() => setNoteTarget(m)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
              >
                <Send size={12} /> Send note
              </button>
              <select
                value={m.role}
                onChange={(e) => setMemberRole(m, e.target.value as Role)}
                className="rounded-xl border border-app bg-surface px-2 py-1 text-xs"
              >
                <option value="member">member</option>
                <option value="elder">elder</option>
                <option value="admin">admin</option>
              </select>
              {m.status === 'active' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const reason = prompt('Reason for suspension?') ?? '';
                    void setStatus(m, 'banned', reason);
                  }}
                >
                  Suspend
                </Button>
              ) : (
                <Button size="sm" variant="sage" onClick={() => void setStatus(m, 'active')}>
                  Restore
                </Button>
              )}
            </div>
          </Card>
        ))
      )}

      <Modal
        open={!!noteTarget}
        onClose={() => setNoteTarget(null)}
        title={noteTarget ? `Send a note to ${noteTarget.display_name ?? noteTarget.first_name ?? 'sister'}` : ''}
      >
        {noteTarget && user && (
          <SendNoteForm
            from={user.id}
            to={noteTarget}
            onDone={() => setNoteTarget(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function SendNoteForm({
  to,
  from,
  onDone,
}: {
  to: Profile;
  from: string;
  onDone: () => void;
}) {
  const { addToast } = useToast();
  const [title, setTitle] = useState('A word of encouragement');
  const [body, setBody] = useState('');
  const [includeDm, setIncludeDm] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);

    // Drop a notification (bell + push).
    const { error: notifyErr } = await supabase.from('notifications').insert({
      user_id: to.id,
      type: 'general',
      title: title.trim() || 'A word of encouragement',
      body: body.trim().slice(0, 200),
      link: includeDm ? `/messages/${from}` : '/notifications',
      is_read: false,
    });

    let dmErr: { message: string } | null = null;
    if (includeDm) {
      // Also drop the full text into a DM so she can reply.
      const { error } = await supabase.from('messages').insert({
        sender_id: from,
        receiver_id: to.id,
        content: body.trim(),
      });
      dmErr = error;
    }

    setBusy(false);
    if (failIfError(notifyErr, 'send the note', addToast)) return;
    if (failIfError(dmErr, 'send the message', addToast)) return;
    addToast({ kind: 'success', title: 'Note sent', body: 'She will see it in her bell.' });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Textarea
        label="Note"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        required
        placeholder="Write something to encourage her today, sister."
      />
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeDm}
          onChange={(e) => setIncludeDm(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          <span className="font-semibold">Also send as a private message</span>
          <span className="block text-xs text-app-muted">
            She'll see it in her bell AND in Messages — and she can reply.
          </span>
        </span>
      </label>
      <div className="flex gap-2">
        <Button type="submit" loading={busy} leadingIcon={includeDm ? <MessageCircle size={14} /> : <Send size={14} />}>
          {includeDm ? 'Send note + message' : 'Send note'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

function stageOfLife(birthday: string | null): Stage | null {
  if (!birthday) return null;
  const [y] = birthday.split('-').map(Number);
  if (!y) return null;
  const age = new Date().getFullYear() - y;
  if (age < 30) return '20s';
  if (age < 40) return '30s';
  if (age < 50) return '40s';
  if (age < 60) return '50s';
  return '60s+';
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-app-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-semibold',
            value === o.value
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-app text-app-muted hover:bg-surface-raised'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
