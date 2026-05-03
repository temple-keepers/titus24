import { useEffect, useMemo, useState } from 'react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { LoadingPage } from '../../components/LoadingPage';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AdminCelebrations() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('status', 'active')
      .then(({ data }) => {
        setMembers((data as Profile[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const byMonth = useMemo(() => {
    const buckets: Record<number, Array<{ name: string; date: string; kind: 'birthday' | 'anniversary' }>> = {};
    for (let i = 0; i < 12; i++) buckets[i] = [];
    members.forEach((m) => {
      const name = m.display_name ?? m.first_name ?? 'Sister';
      if (m.birthday) {
        const d = new Date(m.birthday);
        if (!isNaN(d.getTime())) buckets[d.getMonth()].push({ name, date: m.birthday, kind: 'birthday' });
      }
      if (m.anniversary) {
        const d = new Date(m.anniversary);
        if (!isNaN(d.getTime())) buckets[d.getMonth()].push({ name, date: m.anniversary, kind: 'anniversary' });
      }
    });
    return buckets;
  }, [members]);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-4">
      <SectionTitle>Celebrations calendar</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MONTHS.map((m, i) => (
          <Card key={m}>
            <h3 className="font-display text-lg mb-2">{m}</h3>
            {byMonth[i].length === 0 ? (
              <EmptyState title="—" body="No birthdays or anniversaries this month." />
            ) : (
              <ul className="space-y-1 text-sm">
                {byMonth[i]
                  .sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate())
                  .map((c, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{c.name}</span>
                      <span className="text-xs text-app-muted">
                        {new Date(c.date).getDate()} · {c.kind}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
