import { useEffect, useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';

interface FeaturedRow {
  id: string;
  profile_id: string;
  week_starts_on: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
  profile: Pick<Profile, 'id' | 'display_name' | 'first_name' | 'avatar_url' | 'city' | 'country'> | null;
}

/** Returns the Monday (UTC) of the current week as YYYY-MM-DD. */
function currentMondayISO(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun
  const offset = day === 0 ? -6 : 1 - day; // back to Monday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
  return monday.toISOString().slice(0, 10);
}

export default function AdminSisterOfWeek() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [members, setMembers] = useState<Profile[]>([]);
  const [history, setHistory] = useState<FeaturedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [{ data: m }, { data: h }] = await Promise.all([
      supabase.from('profiles').select('*').eq('status', 'active').order('display_name'),
      supabase
        .from('sister_of_the_week')
        .select(
          '*, profile:profiles!sister_of_the_week_profile_id_fkey(id, display_name, first_name, avatar_url, city, country)'
        )
        .order('week_starts_on', { ascending: false })
        .limit(20),
    ]);
    setMembers((m as Profile[] | null) ?? []);
    setHistory(((h as unknown) as FeaturedRow[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const thisWeek = currentMondayISO();
  const currentRow = history.find((h) => h.week_starts_on === thisWeek) ?? null;

  async function set(e: FormEvent) {
    e.preventDefault();
    if (!user || !selectedId) return;
    setBusy(true);
    const { error } = await supabase
      .from('sister_of_the_week')
      .upsert(
        {
          profile_id: selectedId,
          week_starts_on: thisWeek,
          note: note.trim() || null,
          created_by: user.id,
        },
        { onConflict: 'week_starts_on' }
      );
    setBusy(false);
    if (failIfError(error, 'set this week\'s sister', addToast)) return;
    addToast({ kind: 'success', title: 'Sister of the Week set' });
    setSelectedId('');
    setNote('');
    void refresh();
  }

  async function clearWeek() {
    if (!currentRow) return;
    if (!confirm('Clear the Sister of the Week for this week?')) return;
    const { error } = await supabase.from('sister_of_the_week').delete().eq('id', currentRow.id);
    if (failIfError(error, 'clear', addToast)) return;
    void refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-4">
      <SectionTitle>
        <span className="inline-flex items-center gap-2">
          <Sparkles size={16} className="text-brand-500" /> Sister of the Week
        </span>
      </SectionTitle>

      {currentRow ? (
        <Card className="bg-surface-raised">
          <p className="text-xs uppercase tracking-wide text-brand-600">
            Week of {currentRow.week_starts_on}
          </p>
          <div className="mt-2 flex items-start gap-3">
            <Avatar
              size={56}
              url={currentRow.profile?.avatar_url ?? null}
              name={currentRow.profile?.display_name ?? currentRow.profile?.first_name}
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl">
                {currentRow.profile?.display_name ?? currentRow.profile?.first_name ?? 'A sister'}
              </p>
              {currentRow.profile?.city || currentRow.profile?.country ? (
                <p className="text-xs text-app-muted">
                  {[currentRow.profile?.city, currentRow.profile?.country].filter(Boolean).join(', ')}
                </p>
              ) : null}
              {currentRow.note && <p className="mt-2 text-sm">{currentRow.note}</p>}
              <button
                type="button"
                onClick={clearWeek}
                className="mt-3 text-xs font-semibold text-red-600"
              >
                Clear this week
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No Sister of the Week yet"
          body={`Pick one for the week of ${thisWeek} below.`}
        />
      )}

      <Card>
        <SectionTitle>{currentRow ? 'Replace this week' : `Set this week (${thisWeek})`}</SectionTitle>
        <form onSubmit={set} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">
              Sister
            </span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              className="w-full rounded-2xl border border-app bg-surface px-3 py-2 text-sm"
            >
              <option value="">Choose a sister…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name ?? m.first_name ?? m.email ?? 'Sister'}
                </option>
              ))}
            </select>
          </label>
          <Textarea
            label="Why she's featured (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="A line or two about why this sister is a blessing this week."
          />
          <Button type="submit" loading={busy}>
            {currentRow ? 'Replace' : 'Set'}
          </Button>
        </form>
      </Card>

      {history.length > 1 && (
        <>
          <SectionTitle>Past weeks</SectionTitle>
          {history
            .filter((h) => h.week_starts_on !== thisWeek)
            .map((h) => (
              <Card key={h.id}>
                <div className="flex items-center gap-3">
                  <Avatar
                    size={36}
                    url={h.profile?.avatar_url ?? null}
                    name={h.profile?.display_name ?? h.profile?.first_name}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {h.profile?.display_name ?? h.profile?.first_name ?? 'Sister'}
                    </p>
                    <p className="text-[11px] text-app-muted">Week of {h.week_starts_on}</p>
                  </div>
                </div>
                {h.note && <p className="mt-2 text-sm">{h.note}</p>}
              </Card>
            ))}
        </>
      )}
    </div>
  );
}
