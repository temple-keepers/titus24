import { useEffect, useState, type FormEvent } from 'react';
import { Award, Flame, CheckCircle2 } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { todayLocalISO } from '../../lib/dates';
import { cn } from '../../lib/cn';
import type { Profile } from '../../lib/database.types';

const MOODS: Array<{ value: string; emoji: string; label: string }> = [
  { value: 'joyful',     emoji: '😊', label: 'Joyful' },
  { value: 'peaceful',   emoji: '🕊️', label: 'Peaceful' },
  { value: 'grateful',   emoji: '🙏', label: 'Grateful' },
  { value: 'hopeful',    emoji: '🌸', label: 'Hopeful' },
  { value: 'excited',    emoji: '✨', label: 'Excited' },
  { value: 'anxious',    emoji: '😰', label: 'Anxious' },
  { value: 'struggling', emoji: '💔', label: 'Struggling' },
  { value: 'lonely',     emoji: '🥀', label: 'Lonely' },
];

interface Row {
  user: Profile;
  points: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [streak, setStreak] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkInOpen, setCheckInOpen] = useState(false);

  async function refresh() {
    const today = todayLocalISO();
    const [pointsRes, profilesRes, myRes] = await Promise.all([
      supabase.from('points').select('user_id, points').limit(5000),
      supabase.from('profiles').select('*').eq('status', 'active'),
      user
        ? supabase
            .from('daily_checkins')
            .select('date')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(60)
        : Promise.resolve({ data: [] as Array<{ date: string }> }),
    ]);

    const totals = new Map<string, number>();
    ((pointsRes.data as Array<{ user_id: string; points: number }> | null) ?? []).forEach((p) => {
      totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + p.points);
    });
    const profiles = (profilesRes.data as Profile[] | null) ?? [];
    const ranked: Row[] = profiles
      .map((p) => ({ user: p, points: totals.get(p.id) ?? 0 }))
      .filter((r) => r.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 50);
    setRows(ranked);

    const dates = ((myRes.data as Array<{ date: string }> | null) ?? []).map((r) => r.date);
    setCheckedIn(dates[0] === today);
    let s = 0;
    let cursor = new Date(today);
    for (const d of dates) {
      if (d === cursor.toISOString().slice(0, 10)) {
        s++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    setStreak(s);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function submitCheckIn(payload: {
    mood: string;
    gratitude: string;
    prayer_need: string;
    read_scripture: boolean;
  }) {
    if (!user) return;
    const today = todayLocalISO();
    const { error } = await supabase.from('daily_checkins').upsert(
      {
        user_id: user.id,
        date: today,
        mood: payload.mood || null,
        gratitude: payload.gratitude.trim() || null,
        prayer_need: payload.prayer_need.trim() || null,
        read_scripture: payload.read_scripture,
      },
      { onConflict: 'user_id,date' }
    );
    if (failIfError(error, 'check in', addToast)) return;
    addToast({ kind: 'success', title: "You're here, sister", body: '+2 points' });
    setCheckInOpen(false);
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Leaderboard</h1>
      <Card className="bg-surface-raised">
        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-2xl bg-brand-100 p-3 text-brand-600">
            <Flame size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-app-muted">Daily check-in</p>
            <p className="font-display text-xl"><span className="font-sans tabular-nums">{streak}</span> day streak</p>
          </div>
          {checkedIn ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-sage-700">
              <CheckCircle2 size={16} /> Checked in
            </span>
          ) : (
            <Button onClick={() => setCheckInOpen(true)}>Check in today</Button>
          )}
        </div>
      </Card>

      <Modal open={checkInOpen} onClose={() => setCheckInOpen(false)} title="Today's check-in">
        <CheckInForm onSubmit={submitCheckIn} />
      </Modal>

      <SectionTitle>Top sisters</SectionTitle>
      {rows.length === 0 ? (
        <EmptyState title="Leaderboard is loading" body="Earn points by reading devotionals, praying, posting, and showing up." icon={<Award size={24} />} />
      ) : (
        rows.map((r, i) => (
          <Card key={r.user.id}>
            <div className="flex items-center gap-3">
              <span className="w-6 shrink-0 font-sans text-xl font-semibold text-app-muted tabular-nums">{i + 1}</span>
              <Avatar size={36} url={r.user.avatar_url} name={r.user.display_name ?? r.user.first_name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{r.user.display_name ?? r.user.first_name}</div>
                <div className="truncate text-[11px] text-app-muted">{[r.user.city, r.user.country].filter(Boolean).join(', ')}</div>
              </div>
              <span className="font-sans text-xl font-semibold text-brand-600 tabular-nums">{r.points}</span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function CheckInForm({
  onSubmit,
}: {
  onSubmit: (payload: { mood: string; gratitude: string; prayer_need: string; read_scripture: boolean }) => Promise<void>;
}) {
  const [mood, setMood] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [prayerNeed, setPrayerNeed] = useState('');
  const [readScripture, setReadScripture] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await onSubmit({ mood, gratitude, prayer_need: prayerNeed, read_scripture: readScripture });
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-app-muted">
          How are you today, sister?
        </span>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((m) => (
            <button
              type="button"
              key={m.value}
              onClick={() => setMood(m.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-xs',
                mood === m.value
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-app text-app-muted hover:bg-surface-raised'
              )}
            >
              <span className="text-xl">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        label="What are you grateful for? (optional)"
        rows={2}
        value={gratitude}
        onChange={(e) => setGratitude(e.target.value)}
      />
      <Textarea
        label="What can your sisters pray about? (optional)"
        rows={2}
        value={prayerNeed}
        onChange={(e) => setPrayerNeed(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={readScripture}
          onChange={(e) => setReadScripture(e.target.checked)}
        />
        I read scripture today
      </label>
      <Button type="submit" loading={busy} fullWidth>
        Save check-in
      </Button>
    </form>
  );
}
