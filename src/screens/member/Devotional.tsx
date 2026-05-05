import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Card, ScripturePill, TipCard, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { getTodayDevotional, hasReadToday } from '../../data/queries';
import { supabase } from '../../lib/supabase';
import { todayLocalISO, relativeDayLabel } from '../../lib/dates';
import type { DailyDevotional } from '../../lib/database.types';

export default function Devotional() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [devotional, setDevotional] = useState<DailyDevotional | null>(null);
  const [readToday, setReadToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const today = todayLocalISO();

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([getTodayDevotional(today), hasReadToday(user.id, today)]).then(([dev, read]) => {
      if (!active) return;
      setDevotional(dev);
      setReadToday(read);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, today]);

  async function markRead() {
    if (!user) return;
    setBusy(true);
    // Upsert with ignoreDuplicates so a double-tap doesn't 23505. (Brief §8.)
    const { error } = await supabase
      .from('devotional_reads')
      .upsert({ user_id: user.id, date: today }, { onConflict: 'user_id,date', ignoreDuplicates: true });
    setBusy(false);
    if (failIfError(error, "mark today's devotional as read", addToast)) return;
    setReadToday(true);
    addToast({ kind: 'success', title: 'Marked as read', body: '+5 points' });
  }

  if (loading) return <LoadingPage />;

  if (!devotional) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState title="No devotional today" body="Check back tomorrow, sister." />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-brand-600">{relativeDayLabel(today)} · Devotional</p>
          <h1 className="font-display text-3xl mt-1">{devotional.theme}</h1>
        </div>
        <ReadAloudButton devotional={devotional} />
      </header>
      <ScripturePill reference={devotional.scripture_ref}>{devotional.scripture_text}</ScripturePill>
      <Card>
        <h2 className="font-display text-xl mb-2">Reflection</h2>
        <p className="leading-7 whitespace-pre-wrap">{devotional.reflection}</p>
      </Card>
      <TipCard title="Affirmation">
        <p
          className="font-display text-lg italic font-semibold"
          style={{ color: 'var(--wine)' }}
        >
          {devotional.affirmation}
        </p>
      </TipCard>
      <Card>
        <h2 className="font-display text-xl mb-2">A prayer</h2>
        <p className="leading-7 whitespace-pre-wrap italic font-display">{devotional.prayer}</p>
      </Card>
      <div className="pt-2">
        {readToday ? (
          <>
            <Button variant="sage" disabled fullWidth>
              ✓ Read today
            </Button>
            <p className="mt-2 text-center text-xs text-app-muted">
              You've already marked today's devotional as read. See you tomorrow, sister.
            </p>
          </>
        ) : (
          <Button onClick={markRead} loading={busy} fullWidth>
            I've read today's devotional
          </Button>
        )}
      </div>
    </article>
  );
}

/**
 * Browser SpeechSynthesis read-aloud button. Reads theme → scripture →
 * reflection → affirmation → prayer in sequence so a sister can listen
 * while driving, cooking, or feeding a baby. Stops cleanly when the
 * component unmounts so a navigation away doesn't leave the voice
 * trailing.
 */
function ReadAloudButton({ devotional }: { devotional: DailyDevotional }) {
  const [supported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  );
  const [speaking, setSpeaking] = useState(false);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  function start() {
    const synth = window.speechSynthesis;
    synth.cancel();
    const lines: string[] = [
      devotional.theme,
      `Today's reading is from ${devotional.scripture_ref}.`,
      devotional.scripture_text,
      'Reflection.',
      devotional.reflection,
      'Affirmation.',
      devotional.affirmation,
      'And a prayer.',
      devotional.prayer,
    ].filter(Boolean) as string[];

    // Pick a softer female voice if the OS has one available.
    const voices = synth.getVoices();
    const preferred =
      voices.find((v) => /female|samantha|karen|victoria|tessa|joanna/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith('en')) ??
      null;

    const utterances = lines.map((line, i) => {
      const u = new SpeechSynthesisUtterance(line);
      if (preferred) u.voice = preferred;
      u.rate = 0.95;
      u.pitch = 1.0;
      if (i === lines.length - 1) {
        u.onend = () => setSpeaking(false);
      }
      return u;
    });

    utterancesRef.current = utterances;
    setSpeaking(true);
    utterances.forEach((u) => synth.speak(u));
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <button
      type="button"
      onClick={speaking ? stop : start}
      aria-label={speaking ? 'Stop reading aloud' : 'Read aloud'}
      className="shrink-0 rounded-full border border-app bg-surface p-2 text-brand-600 hover:bg-surface-raised"
    >
      {speaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}
