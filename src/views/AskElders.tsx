import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import { SkeletonList } from '@/components/Skeleton';
import { timeAgo } from '@/lib/utils';
import { HelpCircle, Send, Plus, MessageSquare, CheckCircle } from 'lucide-react';
import { validateTextField, sanitizeText, checkRateLimit, MAX_LENGTHS } from '@/lib/validation';
import type { ElderQuestion } from '@/types';

const questionCategories = ['Relationships', 'Marriage', 'Faith', 'Purity', 'Boundaries', 'Family', 'Healing', 'General'];

export default function AskElders() {
  const { user, profile, profiles, addToast } = useApp();
  const [questions, setQuestions] = useState<ElderQuestion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('General');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [loading, setLoading] = useState(true);

  // Elder answer state
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerSaving, setAnswerSaving] = useState(false);

  const fetchQuestions = async () => {
    const { data } = await supabase.from('elder_questions').select('*').order('created_at', { ascending: false });
    if (data) setQuestions(data);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleSubmit = async () => {
    if (!user || !questionText.trim()) return;
    const v = validateTextField(questionText, MAX_LENGTHS.ELDER_QUESTION, 'Question');
    if (!v.valid) { addToast('error', v.error!); return; }
    const rl = checkRateLimit('elderQuestion', 5000);
    if (!rl.valid) { addToast('error', rl.error!); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from('elder_questions').insert({
        author_id: user.id, question: sanitizeText(questionText), category,
      }).select().single();
      if (error) throw error;
      if (data) setQuestions(prev => [data, ...prev]);
      setQuestionText('');
      setCategory('General');
      setShowForm(false);
      addToast('success', 'Question submitted anonymously!');
    } catch (err) {
      console.error('Failed to submit question:', err);
      addToast('error', 'Failed to submit question');
    } finally {
      setSaving(false);
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!user || !answerText.trim()) return;
    const v = validateTextField(answerText, MAX_LENGTHS.ELDER_ANSWER, 'Answer');
    if (!v.valid) { addToast('error', v.error!); return; }
    setAnswerSaving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('elder_questions').update({
        is_answered: true, answer: sanitizeText(answerText), answered_by: user.id, answered_at: now,
      }).eq('id', questionId);

      if (error) throw error;

      setQuestions(prev => prev.map(q => q.id === questionId ? {
        ...q, is_answered: true, answer: answerText.trim(), answered_by: user.id, answered_at: now,
      } : q));
      setAnswerText('');
      setAnsweringId(null);
      addToast('success', 'Answer published!');
    } catch (err) {
      console.error('Failed to answer question:', err);
      addToast('error', 'Failed to answer question');
    } finally {
      setAnswerSaving(false);
    }
  };

  const filtered = questions.filter(q => {
    if (filter === 'answered') return q.is_answered;
    if (filter === 'unanswered') return !q.is_answered;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Ask the Elders</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Submit questions anonymously. Elders answer publicly.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Ask
        </button>
      </div>

      {/* Note */}
      <div className="card flex items-start gap-3" style={{ background: 'var(--color-sage-soft)', borderColor: 'rgba(130,168,130,0.2)' }}>
        <HelpCircle size={18} style={{ color: 'var(--color-sage)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Your identity is kept completely private. Only your question and category are visible. Elders can see and answer questions.
        </p>
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="card space-y-4" style={{ borderColor: 'rgba(232,102,138,0.2)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Your Question (Anonymous)</h3>
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {questionCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Question</label>
            <textarea className="input" rows={3} placeholder="What would you like to ask the elders?"
              value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-lg w-full" disabled={!questionText.trim() || saving} onClick={handleSubmit}>
            <Send size={18} /> {saving ? 'Submitting...' : 'Submit Anonymously'}
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'answered', 'unanswered'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="btn btn-sm capitalize"
            style={{
              background: filter === f ? 'var(--color-brand-soft)' : 'transparent',
              color: filter === f ? 'var(--color-brand)' : 'var(--color-text-muted)',
              border: `1.5px solid ${filter === f ? 'var(--color-brand)' : 'var(--color-border)'}`,
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Questions */}
      {loading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={40} style={{ color: 'var(--color-text-faint)', margin: '0 auto 12px' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>No questions yet.</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {filtered.map(q => {
            const answerer = q.answered_by ? profiles.find(p => p.id === q.answered_by) : null;
            return (
              <div key={q.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-pink">{q.category}</span>
                  {q.is_answered && (
                    <span className="badge badge-success"><CheckCircle size={10} className="mr-1" /> Answered</span>
                  )}
                </div>
                <p className="text-sm font-semibold leading-relaxed mb-3" style={{ color: 'var(--color-text)' }}>
                  {q.question}
                </p>
                <div className="text-xs mb-3" style={{ color: 'var(--color-text-faint)' }}>{timeAgo(q.created_at)}</div>

                {q.is_answered && q.answer && (
                  <div className="px-4 py-4 rounded-2xl mt-2" style={{ background: 'var(--color-sage-soft)', border: '1px solid rgba(130,168,130,0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      {answerer && <Avatar src={answerer.photo_url} name={answerer.first_name} size="sm" />}
                      <span className="text-xs font-bold" style={{ color: 'var(--color-sage)' }}>
                        {answerer?.first_name || 'Elder'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>{q.answer}</p>
                  </div>
                )}

                {/* Elder answer form */}
                {!q.is_answered && (profile?.role === 'admin' || profile?.role === 'elder') && (
                  answeringId === q.id ? (
                    <div className="mt-3 space-y-3">
                      <textarea className="input" rows={3} placeholder="Write your answer..."
                        value={answerText} onChange={(e) => setAnswerText(e.target.value)} />
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm flex-1" onClick={() => { setAnsweringId(null); setAnswerText(''); }}>
                          Cancel
                        </button>
                        <button className="btn btn-sage btn-sm flex-1" disabled={!answerText.trim() || answerSaving}
                          onClick={() => handleAnswer(q.id)}>
                          {answerSaving ? 'Publishing...' : 'Publish Answer'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-sage btn-sm w-full mt-2" onClick={() => setAnsweringId(q.id)}>
                      Answer this Question
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
