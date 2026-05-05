import { useEffect, useState, type FormEvent } from 'react';
import { HandHeart, CheckCircle2 } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';
import type { Profile } from '../../lib/database.types';

interface Question {
  id: string;
  author_id: string;
  question: string;
  category: string;
  is_answered: boolean;
  answer: string | null;
  answered_at: string | null;
  answered_by: string | null;
  created_at: string;
  author: Pick<Profile, 'id' | 'display_name' | 'first_name' | 'avatar_url' | 'role'> | null;
}

export default function AdminElderQuestions() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Question[]>([]);
  const [tab, setTab] = useState<'awaiting' | 'answered'>('awaiting');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { data } = await supabase
      .from('elder_questions')
      .select(
        'id, author_id, question, category, is_answered, answer, answered_at, answered_by, created_at, author:profiles!elder_questions_author_id_fkey(id, display_name, first_name, avatar_url, role)'
      )
      .order('created_at', { ascending: false });
    setItems(((data as unknown) as Question[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function reply(q: Question, answer: string) {
    if (!user || !answer.trim()) return;
    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('elder_questions')
      .update({
        answer: answer.trim(),
        is_answered: true,
        answered_at: now,
        answered_by: user.id,
      })
      .eq('id', q.id);
    if (failIfError(updErr, 'send your reply', addToast)) return;

    // Notify the sister that her question has a reply.
    void supabase.from('notifications').insert({
      user_id: q.author_id,
      title: 'A leader replied to your question',
      body: q.question.slice(0, 80) + (q.question.length > 80 ? '…' : ''),
      link: '/elders',
      is_read: false,
    });

    addToast({ kind: 'success', title: 'Reply sent', body: 'She will see it in her notifications.' });
    void refresh();
  }

  async function del(id: string) {
    if (!confirm('Delete this question?')) return;
    const { error } = await supabase.from('elder_questions').delete().eq('id', id);
    if (failIfError(error, 'delete', addToast)) return;
    void refresh();
  }

  if (loading) return <LoadingPage />;

  const filtered = items.filter((q) => (tab === 'awaiting' ? !q.is_answered : q.is_answered));
  const awaitingCount = items.filter((q) => !q.is_answered).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-2xl bg-surface-raised p-1 text-sm font-semibold">
        <button
          onClick={() => setTab('awaiting')}
          className={cn(
            'flex-1 rounded-xl px-3 py-2',
            tab === 'awaiting' ? 'bg-surface text-app shadow-soft' : 'text-app-muted'
          )}
        >
          Awaiting reply{awaitingCount > 0 && ` · ${awaitingCount}`}
        </button>
        <button
          onClick={() => setTab('answered')}
          className={cn(
            'flex-1 rounded-xl px-3 py-2',
            tab === 'answered' ? 'bg-surface text-app shadow-soft' : 'text-app-muted'
          )}
        >
          Answered
        </button>
      </div>

      <SectionTitle>Elder Q&amp;A</SectionTitle>

      {filtered.length === 0 ? (
        <EmptyState
          title={tab === 'awaiting' ? 'No questions waiting' : 'Nothing answered yet'}
          body={tab === 'awaiting' ? 'You are all caught up, leader.' : 'Replies will appear here.'}
          icon={<HandHeart size={24} />}
        />
      ) : (
        filtered.map((q) => <QuestionCard key={q.id} q={q} onReply={reply} onDelete={del} />)
      )}
    </div>
  );
}

function QuestionCard({
  q,
  onReply,
  onDelete,
}: {
  q: Question;
  onReply: (q: Question, answer: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [answer, setAnswer] = useState(q.answer ?? '');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(!q.is_answered);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await onReply(q, answer);
    setBusy(false);
    setEditing(false);
  }

  return (
    <Card>
      <header className="flex items-center gap-3">
        <Avatar
          size={36}
          url={q.author?.avatar_url ?? null}
          name={q.author?.display_name ?? q.author?.first_name ?? 'Sister'}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {q.author?.display_name ?? q.author?.first_name ?? 'Sister'}{' '}
            <span className="font-normal text-app-muted">· {q.category}</span>
          </p>
          <p className="text-[11px] text-app-muted">{timeAgo(q.created_at)}</p>
        </div>
        {q.is_answered && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-semibold text-sage-700">
            <CheckCircle2 size={12} /> Answered
          </span>
        )}
      </header>

      <p className="mt-3 text-sm leading-7 whitespace-pre-wrap">{q.question}</p>

      {q.is_answered && !editing && q.answer && (
        <div className="mt-3 rounded-2xl bg-sage-50 p-3 border border-sage-200">
          <p className="text-xs uppercase tracking-wide text-sage-700">
            Reply · {q.answered_at && timeAgo(q.answered_at)}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{q.answer}</p>
          <button
            onClick={() => setEditing(true)}
            className="mt-2 text-xs font-semibold text-brand-600"
          >
            Edit reply
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <Textarea
            label="Your reply (private to her)"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            required
          />
          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => void onDelete(q.id)}
              className="text-xs font-semibold text-red-600"
            >
              Delete
            </button>
            <div className="flex gap-2">
              {q.is_answered && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button type="submit" size="sm" loading={busy}>
                {q.is_answered ? 'Update reply' : 'Send reply'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Card>
  );
}
