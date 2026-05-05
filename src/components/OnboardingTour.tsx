import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  MessageCircle,
  Heart,
  Users,
  User,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';

interface Step {
  title: string;
  body: string;
  Icon: typeof Sparkles;
  cta?: { label: string; to: string };
}

const STEPS: Step[] = [
  {
    title: 'Welcome to the sisterhood, sister.',
    body: 'A digital home for women who love the Lord. Let me walk you through the essentials in five quick stops.',
    Icon: Sparkles,
  },
  {
    title: "Today's devotional",
    body: 'A fresh devotional every day — scripture, reflection, an affirmation, and a prayer. You can read it, mark it complete, or have it read aloud while you cook.',
    Icon: BookOpen,
    cta: { label: 'Show me', to: '/devotional' },
  },
  {
    title: 'Community',
    body: 'Share what is on your heart, react and comment on what others share. Real sisters, real support.',
    Icon: MessageCircle,
    cta: { label: 'See it', to: '/community' },
  },
  {
    title: 'Prayer Wall',
    body: 'Carry one another\'s burdens. Share what you need prayer for — anonymously if you want — and stand with sisters when they share theirs.',
    Icon: Heart,
    cta: { label: 'Open it', to: '/prayer' },
  },
  {
    title: 'Groups',
    body: 'Smaller circles within the sisterhood — for studying, supporting, walking life out together.',
    Icon: Users,
    cta: { label: 'Browse', to: '/groups' },
  },
  {
    title: 'Your profile',
    body: 'Add a photo, your skills, what you do — sisters can find one another more easily. Settings for read receipts, quiet hours, and notifications also live here.',
    Icon: User,
    cta: { label: 'Take me there', to: '/profile' },
  },
];

/**
 * Five-step welcome tour shown to a sister the first time she lands on
 * Home after sign-up. Records completion on the profile so she's never
 * shown again. Skip closes immediately. The card sits in a darkened
 * overlay so it owns attention without breaking the route underneath.
 */
export function OnboardingTour() {
  const { user, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Only show on Home (the post-login landing page) and only when the
  // sister has never finished or skipped the tour.
  const eligible =
    !!profile &&
    !profile.tour_completed_at &&
    location.pathname === '/' &&
    !dismissed;

  // Reset when route changes back to Home — e.g. after the sister taps
  // a CTA, navigates somewhere, then returns. Picking up where she left
  // off would be confusing, so just close.
  useEffect(() => {
    if (location.pathname !== '/') setDismissed(true);
  }, [location.pathname]);

  if (!eligible) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = s.Icon;

  async function finish() {
    setDismissed(true);
    if (user) {
      void supabase
        .from('profiles')
        .update({ tour_completed_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(() => refreshProfile());
    }
  }

  function next() {
    if (isLast) {
      void finish();
    } else {
      setStep((i) => i + 1);
    }
  }

  function takeMe() {
    if (!s.cta) return;
    void finish();
    navigate(s.cta.to);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 sm:items-center"
      role="dialog"
      aria-labelledby="tour-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-surface shadow-soft-lg">
        <div
          className="px-6 pt-6 pb-5"
          style={{
            background: 'linear-gradient(135deg, var(--soft-pink), var(--rose))',
            color: 'white',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <Icon size={20} />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-90">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
          <h2 id="tour-title" className="mt-3 font-display text-2xl">
            {s.title}
          </h2>
          <p className="mt-2 text-sm opacity-95">{s.body}</p>
        </div>
        <div className="flex items-center justify-between gap-2 px-6 py-4">
          <button
            type="button"
            onClick={() => void finish()}
            className="text-xs font-semibold text-app-muted hover:text-app"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {s.cta && (
              <button
                type="button"
                onClick={takeMe}
                className="rounded-full border border-app px-4 py-2 text-xs font-semibold text-app-muted hover:bg-surface-raised"
              >
                {s.cta.label}
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-brand-600"
            >
              {isLast ? 'Finish' : 'Next'}
              {!isLast && <ArrowRight size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
