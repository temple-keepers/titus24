import { useEffect, useMemo, useState } from 'react';
import { Card, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { Profile, Role, Status } from '../../lib/database.types';

export default function AdminMembers() {
  const { addToast } = useToast();
  const [members, setMembers] = useState<Profile[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { data } = await supabase.from('profiles').select('*').order('display_name');
    setMembers((data as Profile[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return members;
    const lower = q.toLowerCase();
    return members.filter((m) =>
      [m.display_name, m.first_name, m.last_name, m.email, m.city, m.country]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(lower))
    );
  }, [members, q]);

  async function setRole(m: Profile, role: Role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', m.id);
    if (failIfError(error, 'change role', addToast)) return;
    addToast({ kind: 'success', title: `Role updated to ${role}` });
    refresh();
  }

  async function setStatus(m: Profile, status: Status, reason?: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ status, banned_reason: reason ?? null })
      .eq('id', m.id);
    if (failIfError(error, 'update status', addToast)) return;
    addToast({ kind: 'success', title: `Member ${status}` });
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-3">
      <Input name="q" placeholder="Search by name, email, city" value={q} onChange={(e) => setQ(e.target.value)} />
      {filtered.length === 0 ? (
        <EmptyState title="No members" />
      ) : (
        filtered.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center gap-3">
              <Avatar size={40} url={m.avatar_url} name={m.display_name ?? m.first_name} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{m.display_name ?? m.first_name ?? m.email}</div>
                <div className="text-[11px] text-app-muted truncate">{m.email} · {m.city ?? m.country}</div>
              </div>
              <select
                value={m.role}
                onChange={(e) => setRole(m, e.target.value as Role)}
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
                    setStatus(m, 'banned', reason);
                  }}
                >
                  Suspend
                </Button>
              ) : (
                <Button size="sm" variant="sage" onClick={() => setStatus(m, 'active')}>
                  Restore
                </Button>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
