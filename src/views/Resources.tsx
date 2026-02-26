import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import EmptyState from '@/components/EmptyState';
import VideoEmbed from '@/components/VideoEmbed';
import { ExternalLink, BookOpen, Lightbulb, Sparkles, Play, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const catIcons: Record<string, typeof BookOpen> = {
  Teaching: BookOpen,
  Guide: Lightbulb,
  Inspiration: Sparkles,
};

export default function Resources() {
  const { resources } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(resources.map((r) => r.category));
    return ['all', ...Array.from(cats)];
  }, [resources]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return resources.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, search, categoryFilter]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Resources
      </h1>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
        <input
          className="input pl-11"
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn('btn btn-sm whitespace-nowrap', categoryFilter === cat && 'btn-primary')}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState message={search ? `No resources matching "${search}"` : 'No resources yet'} />
      ) : (
        <div className="space-y-5 stagger">
          {filtered.map((r) => {
            const Icon = catIcons[r.category] ?? BookOpen;
            const isVideo = r.type === 'video';

            return (
              <div key={r.id} className="card space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-pink text-[10px]">{r.category}</span>
                  <span className="badge badge-sage text-[10px] flex items-center gap-1">
                    {isVideo && <Play size={10} />}
                    {r.type}
                  </span>
                </div>

                <h3 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
                  {r.title}
                </h3>

                {r.description && (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {r.description}
                  </p>
                )}

                {/* Embed video or show thumbnail */}
                {isVideo ? (
                  <VideoEmbed url={r.link} title={r.title} />
                ) : (
                  r.thumbnail && (
                    <img src={r.thumbnail} alt={r.title} className="w-full rounded-xl object-cover" style={{ maxHeight: '200px' }} />
                  )
                )}

                {/* Link for articles */}
                {!isVideo && (
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost w-full no-underline"
                  >
                    <ExternalLink size={16} /> Read Article
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
