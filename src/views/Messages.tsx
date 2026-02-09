import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { timeAgo } from '@/lib/utils';
import { Send, ArrowLeft } from 'lucide-react';

export default function Messages() {
  const { user, profiles, messages, sendMessage, getConversations } = useApp();
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const msgEndRef = useRef<HTMLDivElement>(null);

  const conversations = getConversations();

  const partner = selectedPartner ? profiles.find((p) => p.id === selectedPartner) : null;
  const thread = selectedPartner
    ? messages.filter(
        (m) =>
          (m.sender_id === user?.id && m.receiver_id === selectedPartner) ||
          (m.sender_id === selectedPartner && m.receiver_id === user?.id)
      )
    : [];

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedPartner) return;
    await sendMessage(selectedPartner, newMsg.trim());
    setNewMsg('');
  };

  if (selectedPartner && partner) {
    return (
      <div className="flex flex-col h-[calc(100dvh-140px)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPartner(null)}>
            <ArrowLeft size={16} />
          </button>
          <Avatar src={partner.photo_url} name={partner.first_name} size="sm" />
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
            {partner.first_name} {partner.last_name}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {thread.map((m) => {
            const isMine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm"
                  style={{
                    background: isMine
                      ? 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-coral) 100%)'
                      : 'var(--color-bg-raised)',
                    color: isMine ? '#fff' : 'var(--color-text)',
                    border: isMine ? 'none' : '1px solid var(--color-border)',
                    borderBottomRightRadius: isMine ? '6px' : '20px',
                    borderBottomLeftRadius: isMine ? '20px' : '6px',
                  }}
                >
                  {m.content}
                  <div className="text-[10px] mt-1 opacity-60">{timeAgo(m.created_at)}</div>
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Type a message…"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={!newMsg.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Messages</h1>
      </div>

      {/* Start new conversation */}
      <div>
        <label className="label">Start a conversation</label>
        <select
          className="input"
          value=""
          onChange={(e) => setSelectedPartner(e.target.value)}
        >
          <option value="">Choose a sister…</option>
          {profiles.filter((p) => p.id !== user?.id).map((p) => (
            <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
          ))}
        </select>
      </div>

      {conversations.length === 0 ? (
        <EmptyState message="No conversations yet" />
      ) : (
        <div className="space-y-2 stagger">
          {conversations.map((c) => (
            <button
              key={c.partnerId}
              onClick={() => setSelectedPartner(c.partnerId)}
              className="card w-full text-left flex items-center gap-3"
            >
              <Avatar src={c.partner.photo_url} name={c.partner.first_name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {c.partner.first_name} {c.partner.last_name}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {c.lastMessage.content}
                </div>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {timeAgo(c.lastMessage.created_at)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
