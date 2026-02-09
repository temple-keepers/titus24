import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import { BookOpen, Check, ChevronRight, Users as UsersIcon } from 'lucide-react';

export default function BibleStudy() {
  const {
    user, bibleStudies, studyDays, studyProgress, studyEnrollments,
    enrollInStudy, unenrolFromStudy, completeStudyDay, addToast,
  } = useApp();

  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');

  const study = selectedStudy ? bibleStudies.find((s) => s.id === selectedStudy) : null;
  const days = selectedStudy ? studyDays.filter((d) => d.study_id === selectedStudy) : [];
  const myProgress = selectedStudy ? studyProgress.filter((p) => p.study_id === selectedStudy) : [];
  const isEnrolled = selectedStudy ? studyEnrollments.some((e) => e.user_id === user?.id && e.study_id === selectedStudy) : false;

  if (selectedStudy && study) {
    return (
      <div className="space-y-6">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSelectedStudy(null)}
        >
          ← Back to studies
        </button>

        <div>
          <h1 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            {study.title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{study.description}</p>
        </div>

        {!isEnrolled ? (
          <button className="btn btn-primary w-full" onClick={() => enrollInStudy(selectedStudy)}>
            <BookOpen size={16} /> Enrol in Study
          </button>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm text-rose-400" onClick={() => unenrolFromStudy(selectedStudy)}>
              Unenrol
            </button>

            <div className="space-y-3 stagger">
              {days.map((day) => {
                const completed = myProgress.some((p) => p.day_number === day.day_number);
                return (
                  <div
                    key={day.id}
                    className={cn('card', completed && 'card-glow')}
                    style={completed ? { borderColor: 'rgba(16, 185, 129, 0.3)' } : undefined}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                        Day {day.day_number}: {day.title}
                      </h3>
                      {completed && <Check size={16} className="text-emerald-400" />}
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-brand)' }}>{day.scripture_ref}</p>
                    {day.scripture_text && (
                      <p className="text-sm italic mb-3" style={{ color: 'var(--color-text-muted)' }}>
                        "{day.scripture_text}"
                      </p>
                    )}
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text)' }}>
                      {day.reflection_prompt}
                    </p>
                    {!completed && (
                      <div className="space-y-2">
                        <textarea
                          className="input text-sm"
                          placeholder="Your reflection…"
                          value={reflection}
                          onChange={(e) => setReflection(e.target.value)}
                          rows={2}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            await completeStudyDay(selectedStudy, day.day_number, reflection || undefined);
                            setReflection('');
                          }}
                        >
                          <Check size={14} /> Complete Day
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Bible Study
      </h1>

      {bibleStudies.length === 0 ? (
        <EmptyState message="No studies available yet" />
      ) : (
        <div className="space-y-4 stagger">
          {bibleStudies.map((s) => {
            const enrollCount = studyEnrollments.filter((e) => e.study_id === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStudy(s.id)}
                className="card w-full text-left flex items-center gap-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(212, 148, 28, 0.1)' }}
                >
                  <BookOpen size={20} style={{ color: 'var(--color-brand)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{s.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.total_days} days</p>
                  <div className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                    <UsersIcon size={10} /> {enrollCount} enrolled
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-faint)' }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
