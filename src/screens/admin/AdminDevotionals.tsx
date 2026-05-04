import { startTransition, useEffect, useState, type FormEvent } from 'react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { DailyDevotional } from '../../lib/database.types';

export default function AdminDevotionals() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<DailyDevotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date: '',
    theme: '',
    scripture_text: '',
    scripture_ref: '',
    reflection: '',
    affirmation: '',
    prayer: '',
  });
  const [busy, setBusy] = useState(false);

  async function refresh() {
    // Only fetch summary columns for the list — full content (reflection,
    // prayer, scripture_text) is large and was bloating state for the 30-day
    // seed. The form upserts by date, so we don't need full rows here.
    const { data } = await supabase
      .from('daily_devotionals')
      .select('id, date, theme, scripture_ref')
      .order('date', { ascending: false })
      .limit(30);
    startTransition(() => {
      setItems((data as DailyDevotional[] | null) ?? []);
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = user ? { ...form, created_by: user.id } : form;
    const { error } = await supabase.from('daily_devotionals').upsert(payload, { onConflict: 'date' });
    setBusy(false);
    if (failIfError(error, 'save devotional', addToast)) return;
    addToast({ kind: 'success', title: 'Devotional saved' });
    setForm({ date: '', theme: '', scripture_text: '', scripture_ref: '', reflection: '', affirmation: '', prayer: '' });
    refresh();
  }

  async function del(id: string) {
    if (!confirm('Delete this devotional?')) return;
    const { error } = await supabase.from('daily_devotionals').delete().eq('id', id);
    if (failIfError(error, 'delete devotional', addToast)) return;
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Add or update a devotional</SectionTitle>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Date (YYYY-MM-DD)" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label="Theme" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Scripture reference" value={form.scripture_ref} onChange={(e) => setForm({ ...form, scripture_ref: e.target.value })} required />
            <Input label="Affirmation" value={form.affirmation} onChange={(e) => setForm({ ...form, affirmation: e.target.value })} required />
          </div>
          <Textarea label="Scripture text" value={form.scripture_text} onChange={(e) => setForm({ ...form, scripture_text: e.target.value })} required />
          <Textarea label="Reflection" rows={6} value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} required />
          <Textarea label="Prayer" rows={4} value={form.prayer} onChange={(e) => setForm({ ...form, prayer: e.target.value })} required />
          <Button type="submit" loading={busy}>Save devotional</Button>
        </form>
      </Card>

      <SectionTitle>Recent</SectionTitle>
      {items.length === 0 ? (
        <EmptyState title="No devotionals yet" />
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <Card key={d.id}>
              <div
                className="flex items-start justify-between gap-3"
                style={{ contentVisibility: 'auto', containIntrinsicSize: '64px' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wide text-app-muted">{d.date}</div>
                  <h3 className="font-display text-lg">{d.theme}</h3>
                  <p className="text-xs text-app-muted">{d.scripture_ref}</p>
                </div>
                <button onClick={() => del(d.id)} className="text-xs text-red-600 font-semibold">Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
