import { useEffect, useState } from 'react';
import { Card, SectionTitle } from '../../components/Card';
import { LoadingPage } from '../../components/LoadingPage';
import { supabase } from '../../lib/supabase';

interface Stats {
  members: number;
  active7d: number;
  posts7d: number;
  prayers_open: number;
  events_upcoming: number;
}

export default function AdminOverview() {
  const [s, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const wkAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [{ count: members }, { count: posts }, { count: prayersOpen }, { count: events }] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', wkAgo),
        supabase.from('prayer_requests').select('id', { count: 'exact', head: true }).eq('is_answered', false),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('date', today),
      ]);
      setStats({
        members: members ?? 0,
        active7d: 0,
        posts7d: posts ?? 0,
        prayers_open: prayersOpen ?? 0,
        events_upcoming: events ?? 0,
      });
    })();
  }, []);

  if (!s) return <LoadingPage />;

  return (
    <div className="space-y-4">
      <SectionTitle>This week</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Members" value={s.members} />
        <Stat label="Posts (7d)" value={s.posts7d} />
        <Stat label="Open prayers" value={s.prayers_open} />
        <Stat label="Upcoming events" value={s.events_upcoming} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-app-muted">{label}</p>
      <p className="font-display text-3xl text-brand-600">{value}</p>
    </Card>
  );
}
