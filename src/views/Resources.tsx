import { useApp } from '@/context/AppContext';
import EmptyState from '@/components/EmptyState';
import { ExternalLink, BookOpen, Lightbulb, Sparkles } from 'lucide-react';

const catIcons: Record<string, typeof BookOpen> = {
  Teaching: BookOpen,
  Guide: Lightbulb,
  Inspiration: Sparkles,
};

export default function Resources() {
  const { resources } = useApp();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Resources
      </h1>
      {resources.length === 0 ? (
        <EmptyState message="No resources yet" />
      ) : (
        <div className="space-y-4 stagger">
          {resources.map((r) => {
            const Icon = catIcons[r.category] ?? BookOpen;
            return (
              <a
                key={r.id}
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card flex gap-4 no-underline group"
              >
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(212, 148, 28, 0.1)' }}
                  >
                    <Icon size={20} style={{ color: 'var(--color-brand)' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-pink text-[10px]">{r.category}</span>
                    <span className="badge badge-sage text-[10px]">{r.type}</span>
                  </div>
                  <h3 className="font-semibold text-sm group-hover:underline" style={{ color: 'var(--color-text)' }}>
                    {r.title}
                  </h3>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                    {r.description}
                  </p>
                </div>
                <ExternalLink size={14} className="flex-shrink-0 mt-1" style={{ color: 'var(--color-text-faint)' }} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
