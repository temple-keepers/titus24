import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Card, EmptyState, ScripturePill, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { listStudies, listStudyDays } from '../../data/queries';
import type { BibleStudy as Study, StudyDay } from '../../lib/database.types';

export default function BibleStudy() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [studies, setStudies] = useState<Study[]>([]);
  const [open, setOpen] = useState<Study | null>(null);
  const [days, setDays] = useState<StudyDay[]>([]);
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listStudies().then((s) => {
      setStudies(s);
      setLoading(false);
    });
  }, []);

  async function openStudy(s: Study) {
    setOpen(s);
    setDays(await listStudyDays(s.id));
    if (user) {
      const { data } = await supabase
        .from('study_progress')
        .select('study_day_id')
        .eq('user_id', user.id);
      setProgress(new Set(((data as Array<{ study_day_id: string }> | null) ?? []).map((r) => r.study_day_id)));
    }
  }

  async function markDay(dayId: string) {
    if (!user) return;
    const { error } = await supabase
      .from('study_progress')
      .upsert({ user_id: user.id, study_day_id: dayId, completed_at: new Date().toISOString() }, { onConflict: 'user_id,study_day_id', ignoreDuplicates: true });
    if (failIfError(error, 'mark this day complete', addToast)) return;
    setProgress((prev) => new Set([...prev, dayId]));
    addToast({ kind: 'success', title: 'Day marked complete' });
  }

  if (loading) return <LoadingPage />;

  if (open) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <button onClick={() => setOpen(null)} className="text-sm font-semibold text-brand-600">← All studies</button>
        <Card>
          <h1 className="font-display text-3xl">{open.title}</h1>
          {open.description && <p className="text-sm text-app-muted mt-1">{open.description}</p>}
          <p className="mt-2 text-xs text-app-muted">{open.duration_days} days</p>
        </Card>
        <SectionTitle>Days</SectionTitle>
        {days.map((d) => (
          <Card key={d.id}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-sage-100 px-3 py-2 text-sage-700 font-display text-xl">
                {d.day_number}
              </div>
              <div className="flex-1">
                <ScripturePill reference={d.scripture_ref}>{d.scripture_text}</ScripturePill>
                <p className="mt-3 text-sm leading-7 whitespace-pre-wrap">{d.reflection}</p>
                {d.journal_prompt && (
                  <p className="mt-2 text-xs italic text-app-muted">Journal: {d.journal_prompt}</p>
                )}
                <div className="mt-3">
                  {progress.has(d.id) ? (
                    <span className="text-xs font-semibold text-sage-700">✓ Completed</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => markDay(d.id)}>
                      Mark complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Bible Study</h1>
      {studies.length === 0 ? (
        <EmptyState title="No studies yet" body="Check back when leadership posts a study." icon={<BookOpen size={28} />} />
      ) : (
        studies.map((s) => (
          <Card key={s.id}>
            <h2 className="font-display text-xl">{s.title}</h2>
            {s.description && <p className="text-sm text-app-muted mt-1">{s.description}</p>}
            <div className="mt-3">
              <Button onClick={() => openStudy(s)}>Open study</Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
