import { useEffect, useMemo, useState } from 'react';
import {
  HelpCircle,
  Heart,
  HandHeart,
  Home,
  User,
  Users,
  BookOpen,
  Calendar,
  MessageCircle,
  Image as ImageIcon,
  Library,
  Bell,
  Award,
  Flame,
  Shield,
  Smartphone,
  KeyRound,
  Lock,
  Sparkles,
  Mail,
  FileText,
} from 'lucide-react';
import { EmptyState, ScripturePill } from '../../components/Card';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { isAdmin, isLeadership } from '../../lib/roles';
import { cn } from '../../lib/cn';

type Category = 'getting_started' | 'features' | 'faq' | 'admin';

interface Section {
  id: string;
  title: string;
  icon: string;
  description: string | null;
  content: string;
  category: Category;
  display_order: number;
  is_active: boolean;
}

/** Icon name → component map. Falls back to HelpCircle. */
const ICONS: Record<string, typeof Heart> = {
  Heart, HandHeart, Home, User, Users, BookOpen, Calendar, MessageCircle,
  Image: ImageIcon, Library, Bell, Award, Flame, Shield, Smartphone, KeyRound,
  Lock, Sparkles, Mail, FileText, HelpCircle,
};

const CATEGORY_LABELS: Record<Category, string> = {
  getting_started: 'Getting started',
  features: 'Using the app',
  faq: 'Common questions',
  admin: 'For leadership',
};

const CATEGORY_TINTS: Record<Category, { bg: string; iconBg: string; pill: string }> = {
  getting_started: {
    bg: 'linear-gradient(135deg, #FCE7EE, #FFFFFF)',
    iconBg: 'linear-gradient(135deg, #F78DA7, #E8668A)',
    pill: '#E8668A',
  },
  features: {
    bg: 'linear-gradient(135deg, #FFF0EB, #FFFFFF)',
    iconBg: 'linear-gradient(135deg, #FFB0A0, #F78DA7)',
    pill: '#D44D73',
  },
  faq: {
    bg: 'linear-gradient(135deg, #EDF3ED, #FFFFFF)',
    iconBg: 'linear-gradient(135deg, #AAC4AA, #82A882)',
    pill: '#5E8C5E',
  },
  admin: {
    bg: 'linear-gradient(135deg, #FFF5F1, #FFFFFF)',
    iconBg: 'linear-gradient(135deg, #C9A45A, #B8923D)',
    pill: '#C99225',
  },
};

const CATEGORY_ORDER: Category[] = ['getting_started', 'features', 'faq', 'admin'];

export default function Guide() {
  const { profile } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<Category>('getting_started');

  useEffect(() => {
    supabase
      .from('guide_sections')
      .select('id, title, icon, description, content, category, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        setSections((data as Section[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const visibleSections = useMemo(() => {
    return sections.filter((s) => s.category !== 'admin' || isLeadership(profile?.role));
  }, [sections, profile]);

  const grouped = useMemo(() => {
    const m = new Map<Category, Section[]>();
    visibleSections.forEach((s) => {
      if (!m.has(s.category)) m.set(s.category, []);
      m.get(s.category)!.push(s);
    });
    return m;
  }, [visibleSections]);

  const availableCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => grouped.has(c)),
    [grouped]
  );

  // Default to first available category if current isn't present.
  useEffect(() => {
    if (availableCategories.length && !availableCategories.includes(activeCat)) {
      setActiveCat(availableCategories[0]);
    }
  }, [availableCategories, activeCat]);

  if (loading) return <LoadingPage />;

  const sectionsForActive = grouped.get(activeCat) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--rose)' }}>
          A walkthrough
        </p>
        <h1 className="font-display text-3xl mt-1">The Titus 2:4 Guide</h1>
        <p className="text-sm text-app-muted mt-1">
          Everything you need to find your way around the sisterhood — start at the top and read what you need.
        </p>
      </header>

      <ScripturePill reference="Titus 2:3-4">
        That they may teach the young women to be sober, to love their husbands, to love their children…
      </ScripturePill>

      {sections.length === 0 ? (
        <EmptyState
          title="The Guide is being written"
          body="Leadership will fill this in soon."
          icon={<HelpCircle size={24} />}
        />
      ) : (
        <>
          {/* Category tabs */}
          <nav className="flex flex-wrap gap-2">
            {availableCategories.map((cat) => {
              const isActive = activeCat === cat;
              const count = grouped.get(cat)?.length ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-xs font-semibold transition',
                    isActive
                      ? 'bg-brand-500 text-white border-brand-500 shadow-soft'
                      : 'border-app text-app-muted hover:bg-surface-raised'
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                  <span className={cn('ml-1.5', isActive ? 'opacity-80' : 'opacity-60')}>· {count}</span>
                </button>
              );
            })}
          </nav>

          {/* Sections in the active category */}
          <div className="space-y-4">
            {sectionsForActive.map((s) => (
              <SectionCard key={s.id} section={s} />
            ))}
          </div>
        </>
      )}

      <footer className="pt-6 text-center text-xs text-app-muted">
        Something missing or unclear?{' '}
        {isAdmin(profile?.role)
          ? 'Edit this guide at Admin → Guide.'
          : 'Tell an elder — leadership keeps this page up to date.'}
      </footer>
    </div>
  );
}

function SectionCard({ section }: { section: Section }) {
  const Icon = ICONS[section.icon] ?? HelpCircle;
  const tint = CATEGORY_TINTS[section.category];
  const paragraphs = section.content.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <article className="rounded-3xl border border-app bg-surface shadow-soft overflow-hidden">
      <div className="p-5 sm:p-6" style={{ background: tint.bg }}>
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ background: tint.iconBg }}
          >
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl leading-tight">{section.title}</h2>
            {section.description && (
              <p className="mt-1 text-sm" style={{ color: tint.pill }}>
                {section.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {paragraphs.map((p, i) => (
          <Paragraph key={i} text={p} />
        ))}
      </div>
    </article>
  );
}

/**
 * Render a paragraph of guide content. Lines that all start with "• " or
 * "- " become a bullet list; "1. ", "2. " lines become an ordered list.
 * Anything else renders as a plain <p>.
 */
function Paragraph({ text }: { text: string }) {
  const lines = text.split('\n');
  const isBullets = lines.length > 1 && lines.every((l) => /^\s*[•\-]\s+/.test(l));
  const isNumbered = lines.length > 1 && lines.every((l) => /^\s*\d+\.\s+/.test(l));

  if (isBullets) {
    return (
      <ul className="mb-4 space-y-1.5 pl-4 text-sm leading-7">
        {lines.map((l, i) => (
          <li key={i} className="list-disc list-outside">
            {l.replace(/^\s*[•\-]\s+/, '')}
          </li>
        ))}
      </ul>
    );
  }
  if (isNumbered) {
    return (
      <ol className="mb-4 space-y-1.5 pl-5 text-sm leading-7">
        {lines.map((l, i) => (
          <li key={i} className="list-decimal list-outside">
            {l.replace(/^\s*\d+\.\s+/, '')}
          </li>
        ))}
      </ol>
    );
  }
  return <p className="mb-4 text-sm leading-7 last:mb-0">{text}</p>;
}
