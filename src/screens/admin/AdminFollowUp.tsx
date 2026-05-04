import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FileText } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';

interface Note {
  id: string;
  user_id: string;
  leader_id: string;
  note: string;
  status: 'Texted' | 'Called' | 'Prayed' | 'Needs Support' | 'Doing Better';
  created_at: string;
}

const STATUSES = ['Texted', 'Called', 'Prayed', 'Needs Support', 'Doing Better'] as const;

export default function AdminFollowUp() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [members, setMembers] = useState<Profile[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<typeof STATUSES[number]>('Texted');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [{ data: ms }, { data: ns }] = await Promise.all([
      supabase.from('profiles').select('*').eq('status', 'active').order('display_name'),
      supabase.from('follow_up_notes').select('*').order('created_at', { ascending: false }),
    ]);
    setMembers((ms as Profile[] | null) ?? []);
    setNotes((ns as Note[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const memberById = useMemo(() => {
    const m = new Map<string, Profile>();
    members.forEach((p) => m.set(p.id, p));
    return m;
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!q.trim()) return members;
    const lower = q.toLowerCase();
    return members.filter((m) =>
      [m.display_name, m.first_name, m.last_name, m.email, m.city]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(lower))
    );
  }, [members, q]);

  const memberNotes = selectedId ? notes.filter((n) => n.user_id === selectedId) : [];
  const lastNoteByMember = useMemo(() => {
    const m = new Map<string, Note>();
    notes.forEach((n) => {
      if (!m.has(n.user_id)) m.set(n.user_id, n);
    });
    return m;
  }, [notes]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!user || !selectedId || !note.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('follow_up_notes').insert({
      user_id: selectedId,
      leader_id: user.id,
      note: note.trim(),
      status,
    });
    setBusy(false);
    if (failIfError(error, 'save the note', addToast)) return;
    addToast({ kind: 'success', title: 'Note saved' });
    setNote('');
    refresh();
  }

  async function del(id: string) {
    if (!confirm('Delete this note?')) return;
    const { error } = await supabase.from('follow_up_notes').delete().eq('id', id);
    if (failIfError(error, 'delete note', addToast)) return;
    refresh();
  }

  if (loading) return <LoadingPage />;

  if (selectedId) {
    const m = memberById.get(selectedId);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedId(null)} className="text-sm font-semibold text-brand-600">
          ← All sisters
        </button>
        {m && (
          <Card>
            <div className="flex items-center gap-3">
              <Avatar size={56} url={m.avatar_url} name={m.display_name ?? m.first_name} />
              <div>
                <h2 className="font-display text-2xl">{m.display_name ?? m.first_name}</h2>
                <p className="text-sm text-app-muted">{[m.city, m.country].filter(Boolean).join(', ')}</p>
              </div>
            </div>
          </Card>
        )}
        <Card>
          <SectionTitle>Add note</SectionTitle>
          <form onSubmit={add} className="space-y-3">
            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">Status</span>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold',
                      status === s ? 'bg-brand-500 text-white border-brand-500' : 'border-app text-app-muted'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Textarea label="Note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} required />
            <Button type="submit" loading={busy}>
              Save note
            </Button>
          </form>
        </Card>

        <SectionTitle>History</SectionTitle>
        {memberNotes.length === 0 ? (
          <EmptyState title="No notes yet" />
        ) : (
          memberNotes.map((n) => (
            <Card key={n.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-brand-600">
                    {n.status} · {timeAgo(n.created_at)}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{n.note}</p>
                </div>
                <button onClick={() => del(n.id)} className="text-xs text-red-600 font-semibold">
                  Delete
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input name="q" placeholder="Search by name or city" value={q} onChange={(e) => setQ(e.target.value)} />
      {filteredMembers.length === 0 ? (
        <EmptyState title="No sisters" />
      ) : (
        filteredMembers.map((m) => {
          const last = lastNoteByMember.get(m.id);
          return (
            <Card key={m.id} className="cursor-pointer hover:bg-surface-raised">
              <button onClick={() => setSelectedId(m.id)} className="block w-full text-left">
                <div className="flex items-center gap-3">
                  <Avatar size={40} url={m.avatar_url} name={m.display_name ?? m.first_name} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{m.display_name ?? m.first_name}</div>
                    <div className="text-[11px] text-app-muted truncate">
                      {last
                        ? `${last.status} · ${timeAgo(last.created_at)}`
                        : 'No notes yet'}
                    </div>
                  </div>
                  <FileText size={16} className="text-app-muted" />
                </div>
              </button>
            </Card>
          );
        })
      )}
    </div>
  );
}
