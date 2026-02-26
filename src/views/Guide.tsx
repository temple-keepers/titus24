import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import {
  Search, ChevronDown, BookOpen, Heart, Users, Calendar,
  Camera, MessageCircle, HelpCircle, Sparkles, Trophy,
  HeartHandshake, Eye, Moon, Shield, PartyPopper,
} from 'lucide-react';
import type { GuideSectionCategory } from '@/types';

const iconMap: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  BookOpen, Heart, Users, Calendar, Camera, MessageCircle,
  HelpCircle, Sparkles, Trophy, HeartHandshake, Eye, Moon,
  Shield, PartyPopper, User: Users,
};

const tabs: { key: GuideSectionCategory; label: string }[] = [
  { key: 'getting_started', label: 'Getting Started' },
  { key: 'features', label: 'Features' },
  { key: 'faq', label: 'FAQ' },
];

export default function Guide() {
  const { guideSections } = useApp();
  const [activeTab, setActiveTab] = useState<GuideSectionCategory>('getting_started');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return guideSections
      .filter(s => s.is_active)
      .filter(s => {
        if (search) {
          return s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.content.toLowerCase().includes(q);
        }
        return s.category === activeTab;
      })
      .sort((a, b) => a.display_order - b.display_order);
  }, [guideSections, activeTab, search]);

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          User Guide
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Everything you need to know about Titus 2:4
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search the guide..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs — hidden when searching */}
      {!search && (
        <div className="flex gap-2">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={cn('btn btn-sm flex-1', activeTab === key && 'btn-primary')}
              onClick={() => { setActiveTab(key); setExpandedId(null); }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Sections */}
      {filtered.length === 0 ? (
        <EmptyState message={search ? 'No results match your search' : 'No content available for this section'} />
      ) : (
        <div className="space-y-3 stagger">
          {filtered.map(section => {
            const isOpen = expandedId === section.id;
            const IconComponent = iconMap[section.icon] || BookOpen;

            return (
              <div key={section.id} className="card overflow-hidden">
                <button
                  onClick={() => toggle(section.id)}
                  className="w-full text-left flex items-start gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--color-brand-soft)' }}
                  >
                    <IconComponent size={18} style={{ color: 'var(--color-brand)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                      {section.title}
                    </h3>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                      {section.description}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className="flex-shrink-0 mt-1 transition-transform duration-200"
                    style={{
                      color: 'var(--color-text-faint)',
                      transform: isOpen ? 'rotate(180deg)' : undefined,
                    }}
                  />
                </button>

                {isOpen && (
                  <div
                    className="mt-4 pt-4 text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                      color: 'var(--color-text-secondary)',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
