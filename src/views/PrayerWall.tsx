import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { timeAgo, cn } from '@/lib/utils';
import { Plus, Sparkles, Hand } from 'lucide-react';
import type { PrayerCategory } from '@/types';

const categories: PrayerCategory[] = [
  'General', 'Family', 'Health', 'Work', 'Spiritual Growth',
  'Relationships', 'Marriage', 'Finances', 'Other',
];

export default function PrayerWall() {
  const {
    user, profiles, prayerRequests, prayerResponses,
    addPrayerRequest, markPrayerAnswered, togglePrayerResponse, addToast,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('General');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'answered'>('all');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'active') return prayerRequests.filter((p) => !p.is_answered);
    if (filter === 'answered') return prayerRequests.filter((p) => p.is_answered);
    return prayerRequests;
  }, [prayerRequests, filter]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await addPrayerRequest(content.trim(), category, isAnonymous);
      setContent('');
      setCategory('General');
      setIsAnonymous(false);
      setShowModal(false);
    } catch {
      addToast('error', 'Failed to submit prayer request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Prayer Wall
        </h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={14} />
          Request
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'answered'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'btn btn-sm capitalize',
              filter === f ? 'btn-primary' : 'btn-secondary'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Requests */}
      {filtered.length === 0 ? (
        <EmptyState message="No prayer requests yet" />
      ) : (
        <div className="space-y-4 stagger">
          {filtered.map((req) => {
            const author = req.is_anonymous ? null : profiles.find((p) => p.id === req.author_id);
            const responses = prayerResponses.filter((r) => r.prayer_request_id === req.id);
            const isPraying = responses.some((r) => r.user_id === user?.id);
            const isOwner = req.author_id === user?.id;

            return (
              <div
                key={req.id}
                className={cn('card', req.is_answered && 'card-glow')}
                style={req.is_answered ? { borderColor: 'rgba(16, 185, 129, 0.3)' } : undefined}
              >
                {req.is_answered && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-emerald-400">
                    <Sparkles size={12} />
                    Answered Prayer
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  {req.is_anonymous ? (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
                      style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      🙏
                    </div>
                  ) : (
                    <Avatar src={author?.photo_url ?? null} name={author?.first_name ?? 'A'} size="sm" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {req.is_anonymous ? 'Anonymous' : `${author?.first_name} ${author?.last_name ?? ''}`}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      {timeAgo(req.created_at)}
                    </div>
                  </div>
                  <span className="badge badge-pink">{req.category}</span>
                </div>

                <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                  {req.content}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePrayerResponse(req.id)}
                    className={cn(
                      'btn btn-sm',
                      isPraying ? 'btn-primary' : 'btn-secondary'
                    )}
                  >
                    <Hand size={14} />
                    {isPraying ? "I'm praying" : 'Pray'}
                    {responses.length > 0 && ` · ${responses.length}`}
                  </button>
                  {isOwner && !req.is_answered && (
                    <button
                      onClick={() => markPrayerAnswered(req.id)}
                      className="btn btn-ghost btn-sm text-emerald-400"
                    >
                      <Sparkles size={14} />
                      Mark answered
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Prayer Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Prayer Request">
        <div className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as PrayerCategory)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Your Prayer Request</label>
            <textarea
              className="input"
              placeholder="Share what you'd like the sisters to pray for…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded accent-brand-500"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Submit anonymously
            </span>
          </label>
          <button
            className="btn btn-primary w-full"
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
          >
            {submitting ? 'Submitting…' : 'Submit Prayer Request'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
