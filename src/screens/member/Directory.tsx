import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { Input } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { listSisters } from '../../data/queries';
import type { Profile } from '../../lib/database.types';
import { isLeadership, publicRole } from '../../lib/roles';

export default function Directory() {
  const [sisters, setSisters] = useState<Profile[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSisters().then((s) => {
      setSisters(s);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return sisters;
    const lower = q.trim().toLowerCase();
    return sisters.filter((s) =>
      [s.display_name, s.first_name, s.last_name, s.city, s.country]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(lower))
    );
  }, [sisters, q]);

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="font-display text-3xl">Directory</h1>
      <Input
        name="q"
        placeholder="Search by name or city"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {filtered.length === 0 ? (
        <EmptyState title="No sisters found" body="Try a different search." icon={<Search size={24} />} />
      ) : (
        filtered.map((s) => (
          <Link key={s.id} to={`/profile/${s.id}`}>
            <Card className="hover:bg-surface-raised">
              <div className="flex items-center gap-3">
                <Avatar size={44} url={s.avatar_url} name={s.display_name ?? s.first_name} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {s.display_name ?? (`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || 'Sister')}
                  </div>
                  <div className="text-[11px] text-app-muted truncate">
                    {[s.city, s.country].filter(Boolean).join(', ')}
                  </div>
                </div>
                {isLeadership(s.role) && (
                  <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[11px] font-semibold text-gold-600">
                    {publicRole(s.role)}
                  </span>
                )}
              </div>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
