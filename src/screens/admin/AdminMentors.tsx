import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Trash2, HandHeart } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';
import { isLeadership, publicRole } from '../../lib/roles';
import { timeAgo } from '../../lib/dates';

interface Assignment {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'active' | 'pending' | 'inactive';
  notes: string | null;
  assigned_at: string;
}

export default function AdminMentors() {
  const { addToast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [mentorId, setMentorId] = useState('');
  const [menteeId, setMenteeId] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from('mentor_assignments').select('*').order('assigned_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('status', 'active').order('display_name'),
    ]);
    setAssignments((a as Assignment[] | null) ?? []);
    setProfiles((p as Profile[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const profileById = useMemo(() => {
    const m = new Map<string, Profile>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);

  const mentorOptions = profiles.filter((p) => isLeadership(p.role));
  const menteeOptions = profiles.filter((p) => p.role === 'member');

  async function assign(e: FormEvent) {
    e.preventDefault();
    if (!mentorId || !menteeId) {
      addToast({ kind: 'error', title: 'Pick both a mentor and a mentee, sister.' });
      return;
    }
    if (mentorId === menteeId) {
      addToast({ kind: 'error', title: 'A sister cannot mentor herself.' });
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from('mentor_assignments')
      .insert({ mentor_id: mentorId, mentee_id: menteeId, status: 'active', notes: notes.trim() || null });
    setBusy(false);
    if (failIfError(error, 'create the pairing', addToast)) return;
    addToast({ kind: 'success', title: 'Pairing created' });
    setMentorId('');
    setMenteeId('');
    setNotes('');
    refresh();
  }

  async function remove(id: string) {
    if (!confirm('Remove this pairing?')) return;
    const { error } = await supabase.from('mentor_assignments').delete().eq('id', id);
    if (failIfError(error, 'remove pairing', addToast)) return;
    refresh();
  }

  async function toggleStatus(a: Assignment) {
    const next = a.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('mentor_assignments')
      .update({ status: next })
      .eq('id', a.id);
    if (failIfError(error, 'change status', addToast)) return;
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Pair a sister with a mentor</SectionTitle>
        <form onSubmit={assign} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">
              Mentor (Elder / Admin)
            </span>
            <select
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              required
              className="w-full rounded-2xl border border-app bg-surface px-4 py-3 text-sm"
            >
              <option value="">Choose a mentor…</option>
              {mentorOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name ?? p.first_name ?? p.email} ({publicRole(p.role)})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">
              Mentee (member)
            </span>
            <select
              value={menteeId}
              onChange={(e) => setMenteeId(e.target.value)}
              required
              className="w-full rounded-2xl border border-app bg-surface px-4 py-3 text-sm"
            >
              <option value="">Choose a mentee…</option>
              {menteeOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name ?? p.first_name ?? p.email}
                  {p.city ? ` · ${p.city}` : ''}
                </option>
              ))}
            </select>
          </label>
          <Textarea
            label="Notes (private to leadership)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <Button type="submit" loading={busy} leadingIcon={<HandHeart size={16} />}>
            Create pairing
          </Button>
        </form>
      </Card>

      <SectionTitle>All pairings</SectionTitle>
      {assignments.length === 0 ? (
        <EmptyState
          title="No pairings yet"
          body="Pair leadership with members so they have someone to walk with them."
          icon={<HandHeart size={28} />}
        />
      ) : (
        assignments.map((a) => {
          const mentor = profileById.get(a.mentor_id);
          const mentee = profileById.get(a.mentee_id);
          return (
            <Card key={a.id}>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center text-xs text-app-muted">
                  <span className="font-semibold uppercase tracking-wide text-brand-600">Mentor</span>
                  <Avatar size={48} url={mentor?.avatar_url} name={mentor?.display_name ?? mentor?.first_name ?? '?'} />
                  <span className="mt-1 text-sm font-semibold text-app">
                    {mentor?.display_name ?? mentor?.first_name ?? 'Unknown'}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center text-xl text-brand-400">→</div>
                <div className="flex flex-col items-center text-xs text-app-muted">
                  <span className="font-semibold uppercase tracking-wide text-sage-600">Mentee</span>
                  <Avatar size={48} url={mentee?.avatar_url} name={mentee?.display_name ?? mentee?.first_name ?? '?'} />
                  <span className="mt-1 text-sm font-semibold text-app">
                    {mentee?.display_name ?? mentee?.first_name ?? 'Unknown'}
                  </span>
                </div>
              </div>
              {a.notes && (
                <p className="mt-3 rounded-2xl bg-surface-raised p-3 text-xs text-app-muted whitespace-pre-wrap">
                  Notes: {a.notes}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-app-muted">
                <span>
                  {a.status === 'active' ? 'Active' : a.status === 'pending' ? 'Pending' : 'Inactive'}
                  {' · '}paired {timeAgo(a.assigned_at)}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => toggleStatus(a)}>
                    {a.status === 'active' ? 'Mark inactive' : 'Reactivate'}
                  </Button>
                  <Button size="sm" variant="danger" leadingIcon={<Trash2 size={14} />} onClick={() => remove(a.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
