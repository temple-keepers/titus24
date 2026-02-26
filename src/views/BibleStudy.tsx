import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import EmptyState from '@/components/EmptyState';
import Avatar from '@/components/Avatar';
import { cn } from '@/lib/utils';
import {
  BookOpen, Check, ChevronRight, Users as UsersIcon,
  ArrowLeft, Lock, Sparkles,
} from 'lucide-react';

export default function BibleStudy() {
  const {
    user, profiles, bibleStudies, studyDays, studyProgress, studyEnrollments,
    enrollInStudy, unenrolFromStudy, completeStudyDay, addToast,
  } = useApp();

  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [reflections, setReflections] = useState<Record<number, string>>({});
  const [completing, setCompleting] = useState<number | null>(null);

  const study = selectedStudy ? bibleStudies.find((s) => s.id === selectedStudy) : null;
  const days = selectedStudy ? studyDays.filter((d) => d.study_id === selectedStudy).sort((a, b) => a.day_number - b.day_number) : [];
  const myProgress = selectedStudy ? studyProgress.filter((p) => p.study_id === selectedStudy) : [];
  const isEnrolled = selectedStudy ? studyEnrollments.some((e) => e.user_id === user?.id && e.study_id === selectedStudy) : false;
  const completedCount = myProgress.length;
  const totalDays = days.length;
  const progressPct = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
  const isComplete = totalDays > 0 && completedCount >= totalDays;

  // Get enrolled member avatars for a study
  const getEnrolledMembers = (studyId: string) => {
    const enrolledIds = studyEnrollments.filter((e) => e.study_id === studyId).map((e) => e.user_id);
    return profiles.filter((p) => enrolledIds.includes(p.id)).slice(0, 5);
  };

  // ─── Study Detail View ─────────────────────────────────────
  if (selectedStudy && study) {
    return (
      <div className="space-y-5">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setSelectedStudy(null); setReflections({}); }}
        >
          <ArrowLeft size={14} /> Back to studies
        </button>

        {/* Study header */}
        <div className="card py-6 text-center" style={{
          background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-sage-soft) 100%)',
          borderColor: 'rgba(130,168,130,0.2)',
        }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-sage-soft)' }}>
            <BookOpen size={24} style={{ color: 'var(--color-sage)' }} />
          </div>
          <h1 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            {study.title}
          </h1>
          <p className="text-sm px-4" style={{ color: 'var(--color-text-muted)' }}>{study.description}</p>

          {/* Enrolled members */}
          {(() => {
            const members = getEnrolledMembers(selectedStudy);
            const totalEnrolled = studyEnrollments.filter((e) => e.study_id === selectedStudy).length;
            if (totalEnrolled === 0) return null;
            return (
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex -space-x-2">
                  {members.map((m) => (
                    <div key={m.id} className="w-6 h-6 rounded-full border-2 overflow-hidden" style={{ borderColor: 'var(--color-bg-raised)' }}>
                      <Avatar src={m.photo_url} name={m.first_name} size="xs" />
                    </div>
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {totalEnrolled} enrolled
                </span>
              </div>
            );
          })()}
        </div>

        {!isEnrolled ? (
          <div className="card text-center py-8 space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Join this {totalDays}-day study to begin your journey.
            </p>
            <button className="btn btn-primary" onClick={() => enrollInStudy(selectedStudy)}>
              <BookOpen size={16} /> Enrol in Study
            </button>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  Your Progress
                </span>
                <span className="text-sm font-bold" style={{ color: isComplete ? 'rgb(16,185,129)' : 'var(--color-brand)' }}>
                  {completedCount}/{totalDays} days
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-overlay)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: isComplete
                      ? 'linear-gradient(90deg, rgb(16,185,129), rgb(52,211,153))'
                      : 'linear-gradient(90deg, var(--color-brand), var(--color-coral))',
                  }}
                />
              </div>
              {/* Progress dots */}
              <div className="flex gap-1 flex-wrap">
                {days.map((day) => {
                  const done = myProgress.some((p) => p.day_number === day.day_number);
                  return (
                    <div
                      key={day.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                      title={`Day ${day.day_number}: ${day.title}`}
                      style={{
                        background: done ? 'rgba(16,185,129,0.15)' : 'var(--color-bg-overlay)',
                        color: done ? 'rgb(16,185,129)' : 'var(--color-text-faint)',
                        border: done ? '1.5px solid rgba(16,185,129,0.3)' : '1.5px solid transparent',
                      }}
                    >
                      {done ? <Check size={10} /> : day.day_number}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion celebration */}
            {isComplete && (
              <div className="card text-center py-6" style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04))',
                borderColor: 'rgba(16,185,129,0.3)',
              }}>
                <Sparkles size={32} style={{ color: 'rgb(16,185,129)', margin: '0 auto 8px' }} />
                <h2 className="font-display text-lg font-bold mb-1" style={{ color: 'rgb(16,185,129)' }}>
                  Study Complete!
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  You finished all {totalDays} days. Well done, faithful one!
                </p>
              </div>
            )}

            {/* Day cards */}
            <div className="space-y-3 stagger">
              {days.map((day, idx) => {
                const completed = myProgress.some((p) => p.day_number === day.day_number);
                const prevCompleted = idx === 0 || myProgress.some((p) => p.day_number === days[idx - 1].day_number);
                const isLocked = !prevCompleted && !completed;

                return (
                  <div
                    key={day.id}
                    className={cn('card', completed && 'card-glow')}
                    style={{
                      ...(completed ? { borderColor: 'rgba(16, 185, 129, 0.3)' } : {}),
                      ...(isLocked ? { opacity: 0.5 } : {}),
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: completed ? 'rgba(16,185,129,0.15)' : isLocked ? 'var(--color-bg-overlay)' : 'var(--color-brand-soft)',
                          color: completed ? 'rgb(16,185,129)' : isLocked ? 'var(--color-text-faint)' : 'var(--color-brand)',
                        }}
                      >
                        {completed ? <Check size={14} /> : isLocked ? <Lock size={12} /> : day.day_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                          {day.title}
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--color-brand)' }}>{day.scripture_ref}</p>
                      </div>
                      {completed && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: 'rgb(16,185,129)' }}>
                          Done
                        </span>
                      )}
                    </div>

                    {!isLocked && (
                      <>
                        {day.scripture_text && (
                          <div className="px-4 py-3 rounded-xl mb-3" style={{ background: 'var(--color-bg-overlay)', borderLeft: '3px solid var(--color-brand)' }}>
                            <p className="text-sm italic leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                              "{day.scripture_text}"
                            </p>
                          </div>
                        )}

                        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                          {day.reflection_prompt}
                        </p>

                        {!completed && (
                          <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                            <textarea
                              className="input text-sm"
                              placeholder="Write your reflection…"
                              value={reflections[day.day_number] || ''}
                              onChange={(e) => setReflections(prev => ({ ...prev, [day.day_number]: e.target.value }))}
                              rows={3}
                            />
                            <button
                              className="btn btn-primary btn-sm w-full"
                              disabled={completing === day.day_number}
                              onClick={async () => {
                                setCompleting(day.day_number);
                                try {
                                  await completeStudyDay(selectedStudy, day.day_number, reflections[day.day_number] || undefined);
                                  setReflections(prev => { const next = { ...prev }; delete next[day.day_number]; return next; });
                                } catch {
                                  addToast('error', 'Failed to complete day');
                                } finally {
                                  setCompleting(null);
                                }
                              }}
                            >
                              <Check size={14} />
                              {completing === day.day_number ? 'Saving...' : 'Complete Day'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-ghost btn-sm w-full"
              style={{ color: 'var(--color-error)' }}
              onClick={() => {
                if (window.confirm('Unenrol from this study? Your progress will be kept.')) {
                  unenrolFromStudy(selectedStudy);
                }
              }}
            >
              Unenrol from Study
            </button>
          </>
        )}
      </div>
    );
  }

  // ─── Browse All Studies ─────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Bible Study
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Guided studies to grow in faith together
        </p>
      </div>

      {bibleStudies.length === 0 ? (
        <EmptyState message="No studies available yet. Check back soon!" />
      ) : (
        <div className="space-y-4 stagger">
          {bibleStudies.map((s) => {
            const enrollCount = studyEnrollments.filter((e) => e.study_id === s.id).length;
            const myEnrolled = studyEnrollments.some((e) => e.study_id === s.id && e.user_id === user?.id);
            const sDays = studyDays.filter((d) => d.study_id === s.id);
            const sProgress = studyProgress.filter((p) => p.study_id === s.id);
            const sPct = sDays.length > 0 ? Math.round((sProgress.length / sDays.length) * 100) : 0;
            const members = getEnrolledMembers(s.id);

            return (
              <button
                key={s.id}
                onClick={() => setSelectedStudy(s.id)}
                className="card w-full text-left space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-sage-soft)' }}
                  >
                    <BookOpen size={20} style={{ color: 'var(--color-sage)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{s.title}</h3>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>{s.description}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--color-text-faint)' }} />
                </div>

                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  <span>{s.total_days} days</span>
                  <div className="flex items-center gap-2">
                    {members.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {members.map((m) => (
                          <div key={m.id} className="w-5 h-5 rounded-full border overflow-hidden" style={{ borderColor: 'var(--color-bg-raised)' }}>
                            <Avatar src={m.photo_url} name={m.first_name} size="xs" />
                          </div>
                        ))}
                      </div>
                    )}
                    <span><UsersIcon size={10} className="inline" /> {enrollCount}</span>
                  </div>
                </div>

                {/* Progress bar for enrolled studies */}
                {myEnrolled && (
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-overlay)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${sPct}%`,
                          background: sPct >= 100 ? 'rgb(16,185,129)' : 'var(--color-brand)',
                        }}
                      />
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: sPct >= 100 ? 'rgb(16,185,129)' : 'var(--color-brand)' }}>
                      {sPct >= 100 ? 'Completed!' : `${sPct}% complete`}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
