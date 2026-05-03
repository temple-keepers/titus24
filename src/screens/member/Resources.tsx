import { useEffect, useMemo, useState } from 'react';
import { Library, ExternalLink } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { LoadingPage } from '../../components/LoadingPage';
import { listResources } from '../../data/queries';
import type { Resource } from '../../lib/database.types';

export default function Resources() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listResources().then((r) => {
      setItems(r);
      setLoading(false);
    });
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, Resource[]>();
    items.forEach((r) => {
      const k = r.category || 'Other';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl">Resources</h1>
      {grouped.length === 0 ? (
        <EmptyState title="No resources yet" body="Books, podcasts, sermons — they'll show up here." icon={<Library size={28} />} />
      ) : (
        grouped.map(([cat, list]) => (
          <section key={cat}>
            <SectionTitle>{cat}</SectionTitle>
            <div className="space-y-2">
              {list.map((r) => (
                <Card key={r.id}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3">
                    {r.cover_url && <img src={r.cover_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />}
                    <div className="flex-1">
                      <h3 className="font-display text-lg">{r.title}</h3>
                      {r.description && <p className="text-sm text-app-muted">{r.description}</p>}
                    </div>
                    <ExternalLink size={16} className="text-app-muted shrink-0" />
                  </a>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
