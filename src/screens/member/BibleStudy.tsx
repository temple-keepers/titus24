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
  /** Day count completed per study, keyed by study id, for the list view. */
  const [completedByStudy, setCompletedByStudy] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listStudies(),
      user
        ? supabase
            .from('study_progress')
            .select('study_day_id, study_days!inner(study_id)')
            .eq('user_id', user.id)
        : Promise.resolve({ data: [] as Array<{ study_day_id: string; study_days: { study_id: string } }> }),
    ]).then(([s, progRes]) => {
      setStudies(s);
      const counts: Record<string, number> = {};
      const completedDayIds = new Set<string>();
      const rows = (progRes.data as Array<{ study_day_id: string; study_days: { study_id: string } }> | null) ?? [];
      rows.forEach((r) => {
        completedDayIds.add(r.study_day_id);
        const sid = r.study_days?.study_id;
        if (sid) counts[sid] = (counts[sid] ?? 0) + 1;
      });
      setProgress(completedDayIds);
      setCompletedByStudy(counts);
      setLoading(false);
    });
  }, [user]);

  async function openStudy(s: Study) {
    setOpen(s);
    setDays(await listStudyDays(s.id));
  }

  async function markDay(dayId: string, studyId: string) {
    if (!user) return;
    const { error } = await supabase
      .from('study_progress')
      .upsert({ user_id: user.id, study_day_id: dayId, completed_at: new Date().toISOString() }, { onConflict: 'user_id,study_day_id', ignoreDuplicates: true });
    if (failIfError(error, 'mark this day complete', addToast)) return;
    setProgress((prev) => new Set([...prev, dayId]));
    setCompletedByStudy((prev) => ({ ...prev, [studyId]: (prev[studyId] ?? 0) + 1 }));
    addToast({ kind: 'success', title: 'Day marked complete', body: '+10 points' });
  }

  if (loading) return <LoadingPage />;

  if (open) {
    const completed = days.filter((d) => progress.has(d.id)).length;
    const totalDays = days.length || open.duration_days;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <button onClick={() => setOpen(null)} className="text-sm font-semibold text-brand-600">← All studies</button>
        <Card>
          <h1 className="font-display text-3xl">{open.title}</h1>
          {open.description && <p className="text-sm text-app-muted mt-1">{open.description}</p>}
          <p className="mt-2 text-xs text-app-muted">
            <span className="tabular-nums">{completed}</span> of <span className="tabular-nums">{totalDays}</span> days
          </p>
          <ProgressBar value={completed} max={totalDays} />
          {completed === totalDays && totalDays > 0 && (
            <p className="mt-3 text-sm font-semibold text-sage-700">
              ✓ Study complete. Praise God for staying with the Word, sister.
            </p>
          )}
        </Card>
        <SectionTitle>Days</SectionTitle>
        {days.map((d) => (
          <Card key={d.id}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-sage-100 px-3 py-2 text-sage-700 font-sans font-bold text-xl tabular-nums">
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
                    <Button size="sm" variant="secondary" onClick={() => markDay(d.id, open.id)}>
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
        studies.map((s) => {
          const done = completedByStudy[s.id] ?? 0;
          const total = s.duration_days || 0;
          return (
            <Card key={s.id}>
              <div className="flex items-start gap-3">
                {s.cover_url && (
                  <img
                    src={s.cover_url}
                    alt=""
                    className="hidden h-20 w-20 shrink-0 rounded-2xl object-cover sm:block"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl">{s.title}</h2>
                  {s.description && <p className="text-sm text-app-muted mt-1">{s.description}</p>}
                  <p className="mt-2 text-xs text-app-muted">
                    <span className="tabular-nums">{done}</span> of <span className="tabular-nums">{total}</span> days
                    {done === total && total > 0 && (
                      <span className="ml-1 font-semibold text-sage-700">· Complete</span>
                    )}
                  </p>
                  <ProgressBar value={done} max={total} />
                  <div className="mt-3">
                    <Button onClick={() => openStudy(s)}>
                      {done === 0 ? 'Start study' : done === total && total > 0 ? 'Revisit' : 'Continue'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--soft-pink), var(--rose))',
        }}
      />
    </div>
  );
}
