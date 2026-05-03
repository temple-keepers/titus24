import { useEffect, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { EventRow } from '../../lib/database.types';
import { parseLocalDate } from '../../lib/dates';

const TIMEZONES = [
  'America/Port_of_Spain', // Trinidad/AST
  'Europe/London',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'UTC',
];

export default function AdminEvents() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    timezone: 'America/Port_of_Spain',
    location: '',
  });
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    setEvents((data as EventRow[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      date: form.date,
      time: form.time || null,
      timezone: form.timezone,
      location: form.location.trim() || null,
      created_by: user.id,
    });
    setBusy(false);
    if (failIfError(error, 'create event', addToast)) return;
    addToast({ kind: 'success', title: 'Event created' });
    setForm({ title: '', description: '', date: '', time: '', timezone: form.timezone, location: '' });
    refresh();
  }

  async function del(id: string) {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (failIfError(error, 'delete event', addToast)) return;
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>New event</SectionTitle>
        <form onSubmit={create} className="space-y-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">Timezone</span>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full rounded-2xl border border-app bg-surface px-4 py-3 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </label>
          </div>
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Button type="submit" loading={busy}>Create event</Button>
        </form>
      </Card>

      <SectionTitle>All events</SectionTitle>
      {events.length === 0 ? (
        <EmptyState title="No events" />
      ) : (
        events.map((ev) => (
          <Card key={ev.id}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-brand-100 px-3 py-2 text-center min-w-[56px]">
                <div className="text-[11px] font-semibold uppercase text-brand-700">
                  {parseLocalDate(ev.date).toLocaleDateString(undefined, { month: 'short' })}
                </div>
                <div className="font-display text-2xl text-brand-700">{parseLocalDate(ev.date).getDate()}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg">{ev.title}</h3>
                <p className="text-xs text-app-muted">{ev.time} · {ev.timezone}</p>
                {ev.location && <p className="text-xs text-app-muted">{ev.location}</p>}
              </div>
              <Button size="sm" variant="danger" leadingIcon={<Trash2 size={14} />} onClick={() => del(ev.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
