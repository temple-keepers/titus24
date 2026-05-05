import { useEffect, useState, type FormEvent } from 'react';
import { HandHeart } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Input';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';

const CATEGORIES = ['General', 'Marriage', 'Family', 'Faith', 'Work', 'Other'] as const;
type Category = (typeof CATEGORIES)[number];

interface Question {
  id: string;
  author_id: string;
  question: string;
  category: string;
  is_answered: boolean;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
}

export default function AskElders() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Question[]>([]);
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Category>('General');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!user) return;
    const { data } = await supabase
      .from('elder_questions')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    setItems(((data as Question[] | null) ?? []));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function ask(e: FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setBusy(true);
    const { error } = await supabase
      .from('elder_questions')
      .insert({ author_id: user.id, question: text.trim(), category });
    setBusy(false);
    if (failIfError(error, 'send your question', addToast)) return;
    addToast({ kind: 'success', title: 'Sent privately to leadership' });
    setText('');
    setCategory('General');
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Ask Elders</h1>
      <p className="text-sm text-app-muted">Your question goes privately to leadership.</p>
      <Card>
        <form onSubmit={ask} className="space-y-3">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">
              Category
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold',
                    category === c
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'border-app text-app-muted hover:bg-surface-raised'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Your question"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            required
          />
          <Button type="submit" loading={busy} leadingIcon={<HandHeart size={16} />}>
            Send privately
          </Button>
        </form>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No questions yet" body="Anything you've asked will appear here once it does." />
      ) : (
        items.map((q) => (
          <Card key={q.id}>
            <p className="text-xs uppercase tracking-wide text-app-muted">You asked · {timeAgo(q.created_at)}</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{q.question}</p>
            {q.answer ? (
              <div className="mt-3 rounded-2xl bg-sage-50 p-3 border border-sage-200">
                <p className="text-xs uppercase tracking-wide text-sage-700">Reply · {q.answered_at && timeAgo(q.answered_at)}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{q.answer}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs italic text-app-muted">Awaiting reply.</p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
