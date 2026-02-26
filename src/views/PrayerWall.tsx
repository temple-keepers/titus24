import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { timeAgo, cn } from '@/lib/utils';
import { POINT_VALUES } from '@/lib/devotionals';
import {
  Plus, Sparkles, Hand, MessageCircle, Send, ChevronDown, ChevronUp,
  PartyPopper, CheckCircle2, Circle, Heart,
} from 'lucide-react';
import { validateTextField, sanitizeText, checkRateLimit, MAX_LENGTHS } from '@/lib/validation';
import type { PrayerCategory, Testimony, TestimonyCelebration, TestimonyCategory } from '@/types';

// ─── Constants ──────────────────────────────────────────────
const prayerCategories: PrayerCategory[] = [
  'General', 'Family', 'Health', 'Work', 'Spiritual Growth',
  'Relationships', 'Marriage', 'Finances', 'Other',
];

const testimonyCategories: TestimonyCategory[] = [
  'Answered Prayer', 'Engagement', 'Marriage', 'Breakthrough', 'Healing', 'Provision', 'Growth', 'Other',
];

const categoryEmojis: Record<string, string> = {
  'Answered Prayer': '🙏', Engagement: '💍', Marriage: '💒', Breakthrough: '🌟',
  Healing: '💚', Provision: '🎁', Growth: '🌱', Other: '✨',
};

// ─── Comment types (local) ──────────────────────────────────
interface PrayerComment {
  id: string;
  prayer_request_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

interface TestimonyComment {
  id: string;
  testimony_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

// ─── Tabs ───────────────────────────────────────────────────
type Tab = 'prayers' | 'testimonies';

export default function PrayerWall() {
  const {
    user, profile, profiles, prayerRequests, prayerResponses,
    addPrayerRequest, markPrayerAnswered, togglePrayerResponse, addToast,
    loadMorePrayers, hasMorePrayers, loadingMorePrayers,
  } = useApp();

  const [tab, setTab] = useState<Tab>('prayers');

  // ─── Prayer state ───────────────────────────────────────
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [prayerContent, setPrayerContent] = useState('');
  const [prayerCategory, setPrayerCategory] = useState<PrayerCategory>('General');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [prayerFilter, setPrayerFilter] = useState<'all' | 'active' | 'answered'>('all');
  const [submittingPrayer, setSubmittingPrayer] = useState(false);

  // "Prayer Answered" flow — optional testimony prompt
  const [showAnsweredModal, setShowAnsweredModal] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answeredTestimony, setAnsweredTestimony] = useState('');

  // Prayer comments
  const [prayerComments, setPrayerComments] = useState<PrayerComment[]>([]);
  const [expandedPrayer, setExpandedPrayer] = useState<string | null>(null);
  const [prayerCommentText, setPrayerCommentText] = useState<Record<string, string>>({});
  const [sendingPrayerComment, setSendingPrayerComment] = useState(false);

  // ─── Testimony state ────────────────────────────────────
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [celebrations, setCelebrations] = useState<TestimonyCelebration[]>([]);
  const [showTestimonyForm, setShowTestimonyForm] = useState(false);
  const [testimonyContent, setTestimonyContent] = useState('');
  const [testimonyCategory, setTestimonyCategory] = useState<TestimonyCategory>('Answered Prayer');
  const [testimonyAnonymous, setTestimonyAnonymous] = useState(false);
  const [savingTestimony, setSavingTestimony] = useState(false);

  // Testimony comments
  const [testimonyComments, setTestimonyComments] = useState<TestimonyComment[]>([]);
  const [expandedTestimony, setExpandedTestimony] = useState<string | null>(null);
  const [testimonyCommentText, setTestimonyCommentText] = useState<Record<string, string>>({});
  const [sendingTestimonyComment, setSendingTestimonyComment] = useState(false);

  // ─── Fetch testimony + comment data ─────────────────────
  useEffect(() => {
    const load = async () => {
      const [tRes, cRes, pcRes, tcRes] = await Promise.all([
        supabase.from('testimonies').select('*').order('created_at', { ascending: false }),
        supabase.from('testimony_celebrations').select('*'),
        supabase.from('prayer_comments').select('*').order('created_at', { ascending: true }),
        supabase.from('testimony_comments').select('*').order('created_at', { ascending: true }),
      ]);
      if (tRes.data) setTestimonies(tRes.data);
      if (cRes.data) setCelebrations(cRes.data);
      if (pcRes.data) setPrayerComments(pcRes.data);
      if (tcRes.data) setTestimonyComments(tcRes.data);
    };
    load();
  }, []);

  // ─── Prayer filters ─────────────────────────────────────
  const filteredPrayers = useMemo(() => {
    if (prayerFilter === 'active') return prayerRequests.filter((p) => !p.is_answered);
    if (prayerFilter === 'answered') return prayerRequests.filter((p) => p.is_answered);
    return prayerRequests;
  }, [prayerRequests, prayerFilter]);

  // ─── Prayer actions ─────────────────────────────────────
  const handleSubmitPrayer = async () => {
    if (!prayerContent.trim()) return;
    setSubmittingPrayer(true);
    try {
      await addPrayerRequest(prayerContent.trim(), prayerCategory, isAnonymous);
      setPrayerContent('');
      setPrayerCategory('General');
      setIsAnonymous(false);
      setShowPrayerModal(false);
    } catch {
      addToast('error', 'Failed to submit prayer request');
    } finally {
      setSubmittingPrayer(false);
    }
  };

  // "Prayer Answered" — opens modal to optionally share testimony
  const handlePrayerAnsweredClick = (requestId: string) => {
    setAnsweringId(requestId);
    setAnsweredTestimony('');
    setShowAnsweredModal(true);
  };

  const confirmPrayerAnswered = async () => {
    if (!answeringId) return;
    await markPrayerAnswered(answeringId);

    // If they wrote a testimony, save it too
    if (answeredTestimony.trim() && user) {
      const tv = validateTextField(answeredTestimony, MAX_LENGTHS.TESTIMONY_CONTENT, 'Testimony');
      if (!tv.valid) { addToast('error', tv.error!); setShowAnsweredModal(false); setAnsweringId(null); return; }
      try {
        const { data, error } = await supabase.from('testimonies').insert({
          author_id: user.id,
          content: sanitizeText(answeredTestimony),
          category: 'Answered Prayer' as TestimonyCategory,
          is_anonymous: false,
        }).select().single();
        if (!error && data) {
          setTestimonies((prev) => [data, ...prev]);
          try {
            const pv = POINT_VALUES.testimony_shared;
            await supabase.rpc('award_points', {
              p_user_id: user.id, p_action: 'testimony_shared',
              p_points: pv.points, p_description: pv.label,
            });
          } catch { /* points are non-critical */ }
          addToast('success', 'Testimony shared! +15 points 🎉');
        }
      } catch {
        addToast('error', 'Prayer marked answered but testimony failed to save');
      }
    }
    setShowAnsweredModal(false);
    setAnsweringId(null);
  };

  // Prayer comment
  const addPrayerComment = async (requestId: string) => {
    const text = prayerCommentText[requestId]?.trim();
    if (!text || !user) return;
    const v = validateTextField(text, MAX_LENGTHS.PRAYER_COMMENT, 'Comment');
    if (!v.valid) { addToast('error', v.error!); return; }
    const rl = checkRateLimit('prayerComment', 2000);
    if (!rl.valid) { addToast('error', rl.error!); return; }
    setSendingPrayerComment(true);
    try {
      const { data, error } = await supabase.from('prayer_comments').insert({
        prayer_request_id: requestId, author_id: user.id, content: sanitizeText(text),
      }).select().single();
      if (error) throw error;
      if (data) setPrayerComments((prev) => [...prev, data]);
      setPrayerCommentText((prev) => ({ ...prev, [requestId]: '' }));
    } catch {
      addToast('error', 'Failed to add comment');
    } finally {
      setSendingPrayerComment(false);
    }
  };

  // ─── Testimony actions ──────────────────────────────────
  const handleSubmitTestimony = async () => {
    if (!user || !testimonyContent.trim()) return;
    const tv = validateTextField(testimonyContent, MAX_LENGTHS.TESTIMONY_CONTENT, 'Testimony');
    if (!tv.valid) { addToast('error', tv.error!); return; }
    const rl = checkRateLimit('testimony', 5000);
    if (!rl.valid) { addToast('error', rl.error!); return; }
    setSavingTestimony(true);
    try {
      const { data, error } = await supabase.from('testimonies').insert({
        author_id: user.id, content: sanitizeText(testimonyContent),
        category: testimonyCategory, is_anonymous: testimonyAnonymous,
      }).select().single();
      if (error) throw error;
      if (data) setTestimonies((prev) => [data, ...prev]);
      try {
        const pv = POINT_VALUES.testimony_shared;
        await supabase.rpc('award_points', {
          p_user_id: user.id, p_action: 'testimony_shared',
          p_points: pv.points, p_description: pv.label,
        });
      } catch { /* non-critical */ }
      setTestimonyContent('');
      setTestimonyCategory('Answered Prayer');
      setTestimonyAnonymous(false);
      setShowTestimonyForm(false);
      addToast('success', 'Testimony shared! +15 points 🎉');
    } catch {
      addToast('error', 'Failed to share testimony');
    } finally {
      setSavingTestimony(false);
    }
  };

  const toggleCelebrate = async (testimonyId: string) => {
    if (!user) return;
    try {
      const existing = celebrations.find((c) => c.testimony_id === testimonyId && c.user_id === user.id);
      if (existing) {
        await supabase.from('testimony_celebrations').delete().eq('id', existing.id);
        setCelebrations((prev) => prev.filter((c) => c.id !== existing.id));
        setTestimonies((prev) => prev.map((t) =>
          t.id === testimonyId ? { ...t, celebration_count: Math.max(0, t.celebration_count - 1) } : t,
        ));
      } else {
        const { data, error } = await supabase.from('testimony_celebrations').insert({
          testimony_id: testimonyId, user_id: user.id,
        }).select().single();
        if (error) throw error;
        if (data) {
          setCelebrations((prev) => [...prev, data]);
          setTestimonies((prev) => prev.map((t) =>
            t.id === testimonyId ? { ...t, celebration_count: t.celebration_count + 1 } : t,
          ));
          // Notify testimony author
          const testimony = testimonies.find(t => t.id === testimonyId);
          if (testimony && testimony.author_id !== user.id && !testimony.is_anonymous) {
            const name = profile?.first_name || 'Someone';
            supabase.from('notifications').insert({
              user_id: testimony.author_id,
              type: 'celebration',
              title: `${name} celebrated your testimony`,
              body: `${name} celebrated your ${testimony.category} testimony`,
              link: '/prayer',
            }).then(() => {});
          }
        }
      }
    } catch {
      addToast('error', 'Failed to update celebration');
    }
  };

  // Testimony comment
  const addTestimonyComment = async (testimonyId: string) => {
    const text = testimonyCommentText[testimonyId]?.trim();
    if (!text || !user) return;
    const v = validateTextField(text, MAX_LENGTHS.TESTIMONY_COMMENT, 'Comment');
    if (!v.valid) { addToast('error', v.error!); return; }
    const rl = checkRateLimit('testimonyComment', 2000);
    if (!rl.valid) { addToast('error', rl.error!); return; }
    setSendingTestimonyComment(true);
    try {
      const { data, error } = await supabase.from('testimony_comments').insert({
        testimony_id: testimonyId, author_id: user.id, content: sanitizeText(text),
      }).select().single();
      if (error) throw error;
      if (data) setTestimonyComments((prev) => [...prev, data]);
      setTestimonyCommentText((prev) => ({ ...prev, [testimonyId]: '' }));
    } catch {
      addToast('error', 'Failed to add comment');
    } finally {
      setSendingTestimonyComment(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Prayer & Praise
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Lift each other up & celebrate God's work
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => tab === 'prayers' ? setShowPrayerModal(true) : setShowTestimonyForm(!showTestimonyForm)}
        >
          <Plus size={14} />
          {tab === 'prayers' ? 'Request' : 'Share'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--color-border)' }}>
        {([
          { key: 'prayers' as Tab, label: 'Prayer Wall', icon: Hand, count: prayerRequests.filter((p) => !p.is_answered).length },
          { key: 'testimonies' as Tab, label: 'Testimonies', icon: PartyPopper, count: testimonies.length },
        ]).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all"
            style={{
              background: tab === key ? 'var(--color-brand)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--color-text-muted)',
            }}
          >
            <Icon size={16} />
            {label}
            {count > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab === key ? 'rgba(255,255,255,0.25)' : 'var(--color-bg-overlay)',
                  color: tab === key ? '#fff' : 'var(--color-text-faint)',
                }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════ PRAYERS TAB ═══════════════════ */}
      {tab === 'prayers' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'active', 'answered'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setPrayerFilter(f)}
                className={cn('btn btn-sm capitalize', prayerFilter === f ? 'btn-primary' : 'btn-secondary')}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredPrayers.length === 0 ? (
            <EmptyState message="No prayer requests yet" />
          ) : (
            <div className="space-y-4 stagger">
              {filteredPrayers.map((req) => {

                const author = req.is_anonymous ? null : profiles.find((p) => p.id === req.author_id);
                const responses = prayerResponses.filter((r) => r.prayer_request_id === req.id);
                const isPraying = responses.some((r) => r.user_id === user?.id);
                const isOwner = req.author_id === user?.id;
                const reqComments = prayerComments.filter((c) => c.prayer_request_id === req.id);
                const isExpanded = expandedPrayer === req.id;

                return (
                  <div
                    key={req.id}
                    className={cn('card', req.is_answered && 'card-glow')}
                    style={req.is_answered ? { borderColor: 'rgba(16, 185, 129, 0.3)' } : undefined}
                  >
                    {/* Answered badge */}
                    {req.is_answered && (
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{ color: 'rgb(16, 185, 129)' }}>
                        <Sparkles size={12} />
                        Answered Prayer
                      </div>
                    )}

                    {/* Author row */}
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

                    {/* Content */}
                    <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                      {req.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => togglePrayerResponse(req.id)}
                        className={cn('btn btn-sm', isPraying ? 'btn-primary' : 'btn-secondary')}
                      >
                        <Hand size={14} />
                        {isPraying ? "I'm praying" : 'Pray'}
                        {responses.length > 0 && ` · ${responses.length}`}
                      </button>

                      <button
                        onClick={() => setExpandedPrayer(isExpanded ? null : req.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <MessageCircle size={14} />
                        {reqComments.length > 0 ? reqComments.length : ''}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {isOwner && !req.is_answered && (
                        <button
                          onClick={() => handlePrayerAnsweredClick(req.id)}
                          className="btn btn-sm ml-auto"
                          style={{
                            background: 'transparent',
                            color: 'var(--color-text-muted)',
                            border: '1.5px solid var(--color-border)',
                          }}
                        >
                          <Circle size={14} />
                          Mark as Answered
                        </button>
                      )}
                    </div>

                    {/* Comments section */}
                    {isExpanded && (
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                        {reqComments.length > 0 && (
                          <div className="space-y-3 mb-3">
                            {reqComments.map((c) => {
                              const cAuthor = profiles.find((p) => p.id === c.author_id);
                              return (
                                <div key={c.id} className="flex gap-2">
                                  <Avatar src={cAuthor?.photo_url ?? null} name={cAuthor?.first_name ?? '?'} size="xs" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                                        {cAuthor?.first_name ?? 'Unknown'}
                                      </span>
                                      <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                                        {timeAgo(c.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                      {c.content}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            className="input flex-1 text-sm"
                            placeholder="Write an encouragement…"
                            value={prayerCommentText[req.id] || ''}
                            onChange={(e) => setPrayerCommentText((prev) => ({ ...prev, [req.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') addPrayerComment(req.id); }}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!prayerCommentText[req.id]?.trim() || sendingPrayerComment}
                            onClick={() => addPrayerComment(req.id)}
                            aria-label="Send encouragement"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {hasMorePrayers && prayerFilter === 'all' && (
                <button
                  className="btn btn-secondary w-full"
                  onClick={loadMorePrayers}
                  disabled={loadingMorePrayers}
                >
                  {loadingMorePrayers ? 'Loading...' : 'Load older requests'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ TESTIMONIES TAB ═══════════════════ */}
      {tab === 'testimonies' && (
        <div className="space-y-4">
          {/* Inline form */}
          {showTestimonyForm && (
            <div className="card space-y-4" style={{ borderColor: 'rgba(232,102,138,0.2)' }}>
              <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Share Your Testimony</h3>
              <div>
                <label className="label">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {testimonyCategories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTestimonyCategory(c)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all"
                      style={{
                        background: testimonyCategory === c ? 'var(--color-brand-soft)' : 'var(--color-bg-raised)',
                        border: `1.5px solid ${testimonyCategory === c ? 'var(--color-brand)' : 'var(--color-border)'}`,
                      }}
                    >
                      <span className="text-lg">{categoryEmojis[c]}</span>
                      <span
                        className="text-[9px] font-bold leading-tight"
                        style={{ color: testimonyCategory === c ? 'var(--color-brand)' : 'var(--color-text-muted)' }}
                      >
                        {c}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Your Testimony</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Share what God has done in your life…"
                  value={testimonyContent}
                  onChange={(e) => setTestimonyContent(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testimonyAnonymous}
                  onChange={(e) => setTestimonyAnonymous(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Share anonymously</span>
              </label>
              <button
                className="btn btn-primary w-full"
                disabled={!testimonyContent.trim() || savingTestimony}
                onClick={handleSubmitTestimony}
              >
                <Send size={16} />
                {savingTestimony ? 'Sharing…' : 'Share Testimony (+15 pts)'}
              </button>
            </div>
          )}

          {testimonies.length === 0 ? (
            <div className="text-center py-12">
              <PartyPopper size={40} style={{ color: 'var(--color-text-faint)', margin: '0 auto 12px' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>No testimonies yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-4 stagger">
              {testimonies.map((t) => {
                const author = t.is_anonymous ? null : profiles.find((p) => p.id === t.author_id);
                const hasCelebrated = celebrations.some((c) => c.testimony_id === t.id && c.user_id === user?.id);
                const tComments = testimonyComments.filter((c) => c.testimony_id === t.id);
                const isExpanded = expandedTestimony === t.id;

                return (
                  <div
                    key={t.id}
                    className="card"
                    style={{
                      borderColor: 'rgba(245,176,65,0.15)',
                      background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, rgba(245,176,65,0.04) 100%)',
                    }}
                  >
                    {/* Author row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {!t.is_anonymous && author ? (
                          <>
                            <Avatar src={author.photo_url} name={author.first_name} size="sm" />
                            <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                              {author.first_name}
                            </span>
                          </>
                        ) : (
                          <>
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                              style={{ background: 'var(--color-border)' }}
                            >
                              ✨
                            </div>
                            <span className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>
                              Anonymous Sister
                            </span>
                          </>
                        )}
                      </div>
                      <span className="badge badge-gold">{categoryEmojis[t.category]} {t.category}</span>
                    </div>

                    {/* Content */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4" style={{ color: 'var(--color-text)' }}>
                      {t.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCelebrate(t.id)}
                        className="btn btn-sm"
                        style={{
                          background: hasCelebrated ? 'var(--color-gold-soft)' : 'transparent',
                          color: hasCelebrated ? 'var(--color-gold)' : 'var(--color-text-muted)',
                          border: `1.5px solid ${hasCelebrated ? 'rgba(230,173,62,0.3)' : 'var(--color-border)'}`,
                        }}
                      >
                        <PartyPopper size={14} />
                        Celebrate! ({t.celebration_count})
                      </button>

                      <button
                        onClick={() => setExpandedTestimony(isExpanded ? null : t.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <MessageCircle size={14} />
                        {tComments.length > 0 ? tComments.length : ''}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      <span className="text-xs ml-auto" style={{ color: 'var(--color-text-faint)' }}>
                        {timeAgo(t.created_at)}
                      </span>
                    </div>

                    {/* Comments section */}
                    {isExpanded && (
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                        {tComments.length > 0 && (
                          <div className="space-y-3 mb-3">
                            {tComments.map((c) => {
                              const cAuthor = profiles.find((p) => p.id === c.author_id);
                              return (
                                <div key={c.id} className="flex gap-2">
                                  <Avatar src={cAuthor?.photo_url ?? null} name={cAuthor?.first_name ?? '?'} size="xs" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                                        {cAuthor?.first_name ?? 'Unknown'}
                                      </span>
                                      <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                                        {timeAgo(c.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                      {c.content}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            className="input flex-1 text-sm"
                            placeholder="Leave a word of encouragement…"
                            value={testimonyCommentText[t.id] || ''}
                            onChange={(e) => setTestimonyCommentText((prev) => ({ ...prev, [t.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') addTestimonyComment(t.id); }}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!testimonyCommentText[t.id]?.trim() || sendingTestimonyComment}
                            onClick={() => addTestimonyComment(t.id)}
                            aria-label="Send comment"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ MODALS ═══════════════════ */}

      {/* New Prayer Request Modal */}
      <Modal isOpen={showPrayerModal} onClose={() => setShowPrayerModal(false)} title="New Prayer Request">
        <div className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={prayerCategory}
              onChange={(e) => setPrayerCategory(e.target.value as PrayerCategory)}
            >
              {prayerCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Your Prayer Request</label>
            <textarea
              className="input"
              placeholder="Share what you'd like the sisters to pray for…"
              value={prayerContent}
              onChange={(e) => setPrayerContent(e.target.value)}
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
            onClick={handleSubmitPrayer}
            disabled={submittingPrayer || !prayerContent.trim()}
          >
            {submittingPrayer ? 'Submitting…' : 'Submit Prayer Request'}
          </button>
        </div>
      </Modal>

      {/* Prayer Answered Modal — with optional testimony */}
      <Modal
        isOpen={showAnsweredModal}
        onClose={() => { setShowAnsweredModal(false); setAnsweringId(null); }}
        title="Praise God! 🙌"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            This prayer will be marked as answered. Would you like to share a testimony so the sisters can celebrate with you?
          </p>
          <textarea
            className="input"
            rows={4}
            placeholder="Share how God answered your prayer… (optional)"
            value={answeredTestimony}
            onChange={(e) => setAnsweredTestimony(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="btn btn-secondary flex-1"
              onClick={() => {
                setAnsweredTestimony('');
                confirmPrayerAnswered();
              }}
            >
              Just Mark Answered
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={confirmPrayerAnswered}
            >
              <PartyPopper size={16} />
              {answeredTestimony.trim() ? 'Mark & Share' : 'Just Mark Answered'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
