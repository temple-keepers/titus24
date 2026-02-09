import { useApp } from '@/context/AppContext';
import EmptyState from '@/components/EmptyState';
import VideoEmbed from '@/components/VideoEmbed';
import { ExternalLink, BookOpen, Lightbulb, Sparkles, Play } from 'lucide-react';

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
        <div className="space-y-5 stagger">
          {resources.map((r) => {
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
