import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { NavLink } from 'react-router-dom';
import { Search as SearchIcon, FileText, User, Calendar, BookOpen, Heart } from 'lucide-react';
import { truncate } from '@/lib/utils';

type ResultType = 'post' | 'user' | 'event' | 'resource' | 'prayer';

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  subtitle: string;
  link: string;
  image?: string | null;
}

const typeIcons: Record<ResultType, typeof FileText> = {
  post: FileText,
  user: User,
  event: Calendar,
  resource: BookOpen,
  prayer: Heart,
};

export default function SearchView() {
  const { posts, profiles, events, resources, prayerRequests, user } = useApp();
  const [query, setQuery] = useState('');

  const results = useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const res: SearchResult[] = [];

    // Posts
    posts.forEach((p) => {
      if (p.content.toLowerCase().includes(q)) {
        res.push({ type: 'post', id: p.id, title: 'Community Post', subtitle: truncate(p.content, 80), link: '/community', image: p.image_url });
      }
    });

    // Users
    profiles.forEach((p) => {
      if (p.id === user?.id) return;
      const name = `${p.first_name} ${p.last_name ?? ''}`.toLowerCase();
      const area = (p.area ?? '').toLowerCase();
      if (name.includes(q) || area.includes(q)) {
        res.push({ type: 'user', id: p.id, title: `${p.first_name} ${p.last_name ?? ''}`, subtitle: p.area ?? '', link: '/directory', image: p.photo_url });
      }
    });

    // Events
    events.forEach((e) => {
      if (e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)) {
        res.push({ type: 'event', id: e.id, title: e.title, subtitle: e.date, link: '/events' });
      }
    });

    // Resources
    resources.forEach((r) => {
      if (r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) {
        res.push({ type: 'resource', id: r.id, title: r.title, subtitle: r.category, link: '/resources', image: r.thumbnail });
      }
    });

    // Prayers
    prayerRequests.forEach((p) => {
      if (p.content.toLowerCase().includes(q)) {
        res.push({ type: 'prayer', id: p.id, title: `${p.category} Prayer`, subtitle: truncate(p.content, 80), link: '/prayer' });
      }
    });

    return res.slice(0, 20);
  }, [query, posts, profiles, events, resources, prayerRequests, user]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Search</h1>
      <div className="relative">
        <SearchIcon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-faint)' }}
        />
        <input
          className="input pl-11"
          placeholder="Search posts, people, events…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {query.trim() && results.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-faint)' }}>
          No results for "{query}"
        </p>
      )}

      <div className="space-y-2 stagger">
        {results.map((r) => {
          const Icon = typeIcons[r.type];
          return (
            <NavLink
              key={`${r.type}-${r.id}`}
              to={r.link}
              className="card flex items-center gap-3 no-underline"
            >
              {r.image ? (
                <img src={r.image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-border)' }}
                >
                  <Icon size={16} style={{ color: 'var(--color-text-faint)' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{r.title}</div>
                <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{r.subtitle}</div>
              </div>
              <span className="badge badge-pink text-[10px] capitalize">{r.type}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
