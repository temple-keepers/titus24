import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, MessageCircle } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { listConversations, listMessagesWith, getProfile } from '../../data/queries';
import type { ConversationSummary } from '../../data/queries';
import type { Message, Profile } from '../../lib/database.types';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';

export function MessagesIndex() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listConversations(user.id).then((c) => {
      setConvos(c);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="font-display text-3xl">Messages</h1>
      {convos.length === 0 ? (
        <EmptyState
          title="No messages yet"
          body="Visit a sister's profile to start a conversation."
          icon={<MessageCircle size={28} />}
        />
      ) : (
        convos.map((c) => (
          <Link key={c.partnerId} to={`/messages/${c.partnerId}`}>
            <Card className="hover:bg-surface-raised">
              <div className="flex items-center gap-3">
                <Avatar size={44} url={c.partner?.avatar_url ?? null} name={c.partner?.display_name ?? c.partner?.first_name ?? 'Sister'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold truncate">
                      {c.partner?.display_name ?? c.partner?.first_name ?? 'Sister'}
                    </span>
                    <span className="text-[11px] text-app-muted shrink-0">{timeAgo(c.lastMessage.created_at)}</span>
                  </div>
                  <p className={cn('truncate text-sm', c.unread ? 'font-semibold text-app' : 'text-app-muted')}>
                    {c.lastMessage.content}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="rounded-full bg-brand-500 px-2 text-xs font-semibold text-white">{c.unread}</span>
                )}
              </div>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}

export function ConversationView() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const nav = useNavigate();
  const [partner, setPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !partnerId) return;
    let active = true;

    Promise.all([getProfile(partnerId), listMessagesWith(user.id, partnerId)]).then(([p, ms]) => {
      if (!active) return;
      setPartner(p);
      setMessages(ms);
      setLoading(false);
      // Mark unread received as read.
      void supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', user.id)
        .eq('sender_id', partnerId)
        .is('read_at', null);
    });

    const ch = supabase
      .channel(`messages:${user.id}:${partnerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as Message;
          const involves = (m.sender_id === user.id && m.receiver_id === partnerId) ||
            (m.sender_id === partnerId && m.receiver_id === user.id);
          if (involves) {
            setMessages((prev) => [...prev, m]);
            if (m.receiver_id === user.id) {
              void supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(ch);
    };
  }, [user, partnerId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!user || !partnerId || !text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: text.trim(),
    });
    setBusy(false);
    if (failIfError(error, 'send your message', addToast)) return;
    setText('');
  }

  if (loading) return <LoadingPage />;

  if (!partner) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          title="This sister isn't here"
          body="The conversation link may be broken or the account may have been removed."
          icon={<MessageCircle size={28} />}
          action={
            <Link to="/messages" className="text-sm font-semibold text-brand-600">
              ← Back to Messages
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-app pb-3 mb-3">
        <button onClick={() => nav('/messages')} className="text-sm text-brand-600 font-semibold">←</button>
        <Avatar size={40} url={partner?.avatar_url} name={partner?.display_name ?? partner?.first_name} />
        <div className="flex-1">
          <div className="font-semibold">{partner?.display_name ?? partner?.first_name ?? 'Sister'}</div>
          <div className="text-xs text-app-muted">{partner?.city ?? partner?.country ?? ''}</div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                  mine ? 'bg-brand-500 text-white rounded-br-md' : 'bg-surface-raised text-app rounded-bl-md'
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                <div className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-app-muted')}>
                  {timeAgo(m.created_at)}
                  {mine && m.read_at && ' · read'}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex items-center gap-2">
        <Input
          name="msg"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
        />
        <Button type="submit" loading={busy} leadingIcon={<Send size={16} />}>
          Send
        </Button>
      </form>
    </div>
  );
}
