import { useEffect, useState, type FormEvent } from 'react';
import { Mail, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { LoadingPage } from '../../components/LoadingPage';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';

type Audience = 'all' | 'leaders' | 'members' | 'individual';

interface BroadcastLog {
  id: string;
  audience: Audience;
  subject: string;
  body: string;
  recipient_count: number;
  status: 'pending' | 'sent' | 'failed' | 'partial';
  error_message: string | null;
  created_at: string;
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: 'All sisters',
  leaders: 'Elders / admins',
  members: 'Members only',
  individual: 'Specific email(s)',
};

export default function AdminEmail() {
  const { addToast } = useToast();
  const [audience, setAudience] = useState<Audience>('all');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emails, setEmails] = useState('');
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { data } = await supabase
      .from('email_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    setLogs((data as BroadcastLog[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (audience === 'individual' && !emails.trim()) {
      addToast({ kind: 'error', title: 'Add at least one email address.' });
      return;
    }
    if (
      !confirm(
        `Send "${subject.trim()}" to ${audience === 'individual' ? emails.trim() : AUDIENCE_LABELS[audience]}?`
      )
    ) {
      return;
    }

    setBusy(true);
    const recipientList =
      audience === 'individual'
        ? emails.split(/[\s,;]+/).map((e) => e.trim()).filter((e) => e.includes('@'))
        : undefined;

    const { data, error } = await supabase.functions.invoke('send-broadcast', {
      body: {
        audience,
        subject: subject.trim(),
        body: body.trim(),
        recipient_emails: recipientList,
      },
    });

    setBusy(false);

    if (error) {
      // Edge Function returned non-2xx; the function still logged a 'failed' row.
      const msg = (error as { message?: string }).message ?? 'Unknown error';
      // The body of the error response carries detail; supabase-js puts it on context.
      const detail = (data as { error?: string } | null)?.error ?? msg;
      if (failIfError({ message: detail }, 'send the broadcast', addToast)) {
        refresh();
        return;
      }
    }

    if (data && (data as { ok?: boolean }).ok) {
      const sent = (data as { sent?: number }).sent ?? 0;
      addToast({ kind: 'success', title: 'Sent', body: `${sent} email${sent === 1 ? '' : 's'} dispatched.` });
      setSubject('');
      setBody('');
      setEmails('');
      refresh();
    } else if (data && (data as { error?: string }).error) {
      addToast({ kind: 'error', title: 'Send failed', body: (data as { error: string }).error });
      refresh();
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>New broadcast</SectionTitle>
        <p className="text-xs text-app-muted mb-4">
          Sends one email per sister via Resend. Each recipient sees only her own address.
        </p>
        <form onSubmit={send} className="space-y-3">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">Audience</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold',
                    audience === a ? 'bg-brand-500 text-white border-brand-500' : 'border-app text-app-muted'
                  )}
                >
                  {AUDIENCE_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {audience === 'individual' && (
            <Textarea
              label="Email addresses"
              hint="Separate multiple addresses with commas, spaces, or new lines."
              rows={2}
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
          )}

          <Input label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea
            label="Message"
            rows={8}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            hint="Plain text. Line breaks are preserved."
          />
          <Button type="submit" loading={busy} leadingIcon={<Send size={16} />}>
            Send broadcast
          </Button>
        </form>
      </Card>

      <SectionTitle>Recent broadcasts</SectionTitle>
      {logs.length === 0 ? (
        <EmptyState title="No broadcasts yet" body="Your sent emails will appear here." icon={<Mail size={28} />} />
      ) : (
        logs.map((log) => (
          <Card key={log.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                      log.status === 'sent' && 'bg-sage-100 text-sage-800',
                      log.status === 'failed' && 'bg-red-100 text-red-700',
                      log.status === 'pending' && 'bg-pink-wash text-brand-700',
                      log.status === 'partial' && 'bg-gold-400/20 text-gold-700'
                    )}
                  >
                    {log.status === 'sent' && <CheckCircle2 size={12} />}
                    {log.status === 'failed' && <AlertCircle size={12} />}
                    {log.status}
                  </span>
                  <span className="text-xs text-app-muted">
                    {AUDIENCE_LABELS[log.audience]} · {log.recipient_count} recipient
                    {log.recipient_count === 1 ? '' : 's'} · {timeAgo(log.created_at)}
                  </span>
                </div>
                <h3 className="font-display text-lg mt-1">{log.subject}</h3>
                <p className="mt-1 text-sm text-app-muted whitespace-pre-wrap line-clamp-3">{log.body}</p>
                {log.error_message && (
                  <p className="mt-2 rounded-2xl bg-red-50 p-2 text-xs text-red-700">
                    {log.error_message}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
