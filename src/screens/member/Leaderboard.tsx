import { useEffect, useState } from 'react';
import { Award, Flame, CheckCircle2 } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { todayLocalISO } from '../../lib/dates';
import type { Profile } from '../../lib/database.types';

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

  async function refresh() {
    const today = todayLocalISO();
    const [lbRes, myRes] = await Promise.all([
      supabase
        .from('leaderboard')
        .select('user_id, points, profile:profiles(*)')
        .order('points', { ascending: false })
        .limit(50),
      user
        ? supabase
            .from('daily_checkins')
            .select('date')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(60)
        : Promise.resolve({ data: [] as Array<{ date: string }> }),
    ]);

    setRows(((lbRes.data as Array<{ points: number; profile: Profile }> | null) ?? []).map((r) => ({ user: r.profile, points: r.points })));

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

  async function checkIn() {
    if (!user) return;
    const today = todayLocalISO();
    const { error } = await supabase
      .from('daily_checkins')
      .upsert({ user_id: user.id, date: today }, { onConflict: 'user_id,date', ignoreDuplicates: true });
    if (failIfError(error, 'check in', addToast)) return;
    addToast({ kind: 'success', title: "You're here, sister", body: '+2 points' });
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Leaderboard</h1>
      <Card className="bg-surface-raised">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-brand-100 p-3 text-brand-600">
            <Flame size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-app-muted">Daily check-in</p>
            <p className="font-display text-xl">{streak} day streak</p>
          </div>
          {checkedIn ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-sage-700">
              <CheckCircle2 size={16} /> Checked in
            </span>
          ) : (
            <Button onClick={checkIn}>Check in today</Button>
          )}
        </div>
      </Card>

      <SectionTitle>Top sisters</SectionTitle>
      {rows.length === 0 ? (
        <EmptyState title="Leaderboard is loading" body="Earn points by reading devotionals, praying, posting, and showing up." icon={<Award size={24} />} />
      ) : (
        rows.map((r, i) => (
          <Card key={r.user.id}>
            <div className="flex items-center gap-3">
              <span className="font-display text-xl text-app-muted w-6">{i + 1}</span>
              <Avatar size={36} url={r.user.avatar_url} name={r.user.display_name ?? r.user.first_name} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{r.user.display_name ?? r.user.first_name}</div>
                <div className="text-[11px] text-app-muted">{[r.user.city, r.user.country].filter(Boolean).join(', ')}</div>
              </div>
              <span className="font-display text-xl text-brand-600">{r.points}</span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
