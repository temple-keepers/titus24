import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import Modal from '@/components/Modal';
import { timeAgo, cn } from '@/lib/utils';
import {
  FileText, Heart, Users, Calendar, ChevronRight,
  Pin, Trash2, ArrowLeft, HelpCircle,
} from 'lucide-react';
import type { FollowUpStatus } from '@/types';

type AdminSection = 'home' | 'posts' | 'prayers' | 'attendance' | 'followup';

const tiles = [
  {
    key: 'posts' as const, icon: FileText, label: 'Manage Posts',
    desc: 'Pin important posts to the top, or remove posts that are inappropriate.',
    color: 'var(--color-brand)',
  },
  {
    key: 'prayers' as const, icon: Heart, label: 'Manage Prayers',
    desc: 'Review and remove prayer requests if needed.',
    color: 'var(--color-brand)',
  },
  {
    key: 'attendance' as const, icon: Calendar, label: 'Record Attendance',
    desc: 'After an event, tick off who attended.',
    color: 'var(--color-sage)',
  },
  {
    key: 'followup' as const, icon: Users, label: 'Follow-Up Notes',
    desc: 'Keep private notes about sisters who need pastoral care.',
    color: 'var(--color-sage)',
  },
];

const followUpStatuses: FollowUpStatus[] = ['Texted', 'Called', 'Prayed', 'Needs Support', 'Doing Better'];

export default function AdminDashboard() {
  const {
    profiles, posts, comments, reactions,
    prayerRequests, prayerResponses, events,
    followUpNotes,
    deletePost, togglePin, deletePrayerRequest,
    recordAttendance, addFollowUpNote,
    addToast,
  } = useApp();

  const [section, setSection] = useState<AdminSection>('home');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [attendanceIds, setAttendanceIds] = useState<string[]>([]);
  const [noteUserId, setNoteUserId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteStatus, setNoteStatus] = useState<FollowUpStatus>('Texted');
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null);

  const BackBtn = () => (
    <button className="btn btn-ghost mb-4" onClick={() => setSection('home')}>
      <ArrowLeft size={18} /> Back to Admin
    </button>
  );

  // ─── Home ───────────────────────────────────────────────
  if (section === 'home') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Tap any section below to manage your community.
          </p>
        </div>

        <div className="space-y-3 stagger">
          {tiles.map(({ key, icon: Icon, label, desc, color }) => (
            <button key={key} onClick={() => setSection(key)} className="nav-tile">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}12` }}
              >
                <Icon size={24} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                  {label}
                </div>
                <div className="text-sm mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {desc}
                </div>
              </div>
              <ChevronRight size={20} style={{ color: 'var(--color-text-faint)' }} />
            </button>
          ))}
        </div>

        {/* Help tip */}
        <div className="card flex items-start gap-3" style={{ background: 'var(--color-brand-soft)' }}>
          <HelpCircle size={20} style={{ color: 'var(--color-brand)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <strong>Tip:</strong> Only leaders can see this page. Changes you make here (pinning, deleting, attendance) are visible to the whole community.
          </p>
        </div>
      </div>
    );
  }

  // ─── Manage Posts ───────────────────────────────────────
  if (section === 'posts') {
    return (
      <div className="space-y-4">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Manage Posts</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Tap <strong>"Pin"</strong> to keep a post at the top. Tap <strong>"Delete"</strong> to remove it permanently.
          </p>
        </div>
        {posts.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-faint)' }}>No posts yet</p>
        ) : (
          <div className="space-y-3 stagger">
            {posts.map((post) => {
              const author = profiles.find((p) => p.id === post.author_id);
              const postReactions = reactions.filter((r) => r.post_id === post.id);
              const postComments = comments.filter((c) => c.post_id === post.id);
              return (
                <div
                  key={post.id}
                  className={cn('card', post.is_pinned && 'card-glow')}
                  style={post.is_pinned ? { borderColor: 'rgba(232,102,138,0.3)' } : undefined}
                >
                  {post.is_pinned && (
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-bold" style={{ color: 'var(--color-brand)' }}>
                      <Pin size={12} /> PINNED
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar src={author?.photo_url ?? null} name={author?.first_name ?? 'U'} size="sm" />
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{author?.first_name}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--color-text-faint)' }}>{timeAgo(post.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm mb-3 line-clamp-3" style={{ color: 'var(--color-text)' }}>{post.content}</p>
                  <div className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    {postReactions.length} reactions · {postComments.length} comments
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm flex-1" onClick={() => togglePin(post.id, !post.is_pinned)}>
                      <Pin size={16} /> {post.is_pinned ? 'Unpin Post' : 'Pin to Top'}
                    </button>
                    <button
                      className="btn btn-sm flex-1"
                      style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1.5px solid rgba(244,63,94,0.2)' }}
                      onClick={() => setConfirmDelete({ type: 'post', id: post.id })}
                    >
                      <Trash2 size={16} /> Delete Post
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Are you sure?" size="sm">
          <p className="text-sm mb-5" style={{ color: 'var(--color-text)' }}>
            This will <strong>permanently delete</strong> this {confirmDelete?.type} and all its reactions and comments. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button
              className="btn flex-1"
              style={{ background: '#fb7185', color: '#fff' }}
              onClick={async () => {
                if (!confirmDelete) return;
                if (confirmDelete.type === 'post') await deletePost(confirmDelete.id);
                if (confirmDelete.type === 'prayer') await deletePrayerRequest(confirmDelete.id);
                setConfirmDelete(null);
                addToast('success', 'Deleted successfully');
              }}
            >
              Yes, Delete
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── Manage Prayers ─────────────────────────────────────
  if (section === 'prayers') {
    return (
      <div className="space-y-4">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Manage Prayers</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Review prayer requests. Tap <strong>"Delete"</strong> to remove if needed.
          </p>
        </div>
        {prayerRequests.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-faint)' }}>No prayer requests yet</p>
        ) : (
          <div className="space-y-3 stagger">
            {prayerRequests.map((req) => {
              const author = req.is_anonymous ? null : profiles.find((p) => p.id === req.author_id);
              const resps = prayerResponses.filter((r) => r.prayer_request_id === req.id);
              return (
                <div key={req.id} className={cn('card', req.is_answered && 'card-glow')}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                      {req.is_anonymous ? 'Anonymous' : author?.first_name}
                    </span>
                    <span className="badge badge-pink">{req.category}</span>
                  </div>
                  <p className="text-sm mb-2 line-clamp-3" style={{ color: 'var(--color-text)' }}>{req.content}</p>
                  <div className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{resps.length} sisters praying</div>
                  <button
                    className="btn btn-sm w-full"
                    style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1.5px solid rgba(244,63,94,0.2)' }}
                    onClick={() => setConfirmDelete({ type: 'prayer', id: req.id })}
                  >
                    <Trash2 size={16} /> Delete Prayer Request
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Are you sure?" size="sm">
          <p className="text-sm mb-5" style={{ color: 'var(--color-text)' }}>
            This will permanently delete this prayer request and all prayer responses. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn flex-1" style={{ background: '#fb7185', color: '#fff' }}
              onClick={async () => {
                if (confirmDelete) { await deletePrayerRequest(confirmDelete.id); setConfirmDelete(null); addToast('success', 'Deleted'); }
              }}>
              Yes, Delete
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── Attendance ─────────────────────────────────────────
  if (section === 'attendance') {
    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Record Attendance</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            <strong>Step 1:</strong> Choose the event. <strong>Step 2:</strong> Tick who attended. <strong>Step 3:</strong> Tap "Save".
          </p>
        </div>

        <div>
          <label className="label">Step 1 — Choose Event</label>
          <select className="input" value={selectedEvent ?? ''} onChange={(e) => { setSelectedEvent(e.target.value); setAttendanceIds([]); }}>
            <option value="">Tap here to choose…</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title} ({e.date})</option>)}
          </select>
        </div>

        {selectedEvent && (
          <>
            <div>
              <label className="label">Step 2 — Tick who attended</label>
              <div className="space-y-2">
                {profiles.map((p) => (
                  <label key={p.id} className="card flex items-center gap-4 cursor-pointer py-4" style={{ minHeight: 64 }}>
                    <input
                      type="checkbox"
                      checked={attendanceIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setAttendanceIds([...attendanceIds, p.id]);
                        else setAttendanceIds(attendanceIds.filter((id) => id !== p.id));
                      }}
                      className="w-5 h-5 rounded accent-[var(--color-brand)]"
                    />
                    <Avatar src={p.photo_url} name={p.first_name} size="sm" />
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                      {p.first_name} {p.last_name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Step 3 — Save</label>
              <button
                className="btn btn-primary btn-lg w-full"
                onClick={() => { recordAttendance(selectedEvent, attendanceIds); }}
                disabled={attendanceIds.length === 0}
              >
                Save Attendance ({attendanceIds.length} {attendanceIds.length === 1 ? 'sister' : 'sisters'})
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Follow-Up Notes ────────────────────────────────────
  return (
    <div className="space-y-5">
      <BackBtn />
      <div>
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Follow-Up Notes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Keep private notes about sisters who need care. Only leaders can see these.
        </p>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Add a New Note</h3>
        <div>
          <label className="label">Which sister?</label>
          <select className="input" value={noteUserId} onChange={(e) => setNoteUserId(e.target.value)}>
            <option value="">Tap to choose…</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={noteStatus} onChange={(e) => setNoteStatus(e.target.value as FollowUpStatus)}>
            {followUpStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Your Note</label>
          <textarea className="input" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3}
            placeholder="What happened? What's the next step?" />
        </div>
        <button
          className="btn btn-sage btn-lg w-full"
          onClick={async () => {
            if (!noteUserId || !noteText.trim()) return;
            await addFollowUpNote(noteUserId, noteText.trim(), noteStatus);
            setNoteText(''); setNoteUserId('');
          }}
          disabled={!noteUserId || !noteText.trim()}
        >
          Save Note
        </button>
      </div>

      {followUpNotes.length > 0 && (
        <div className="space-y-3">
          <h3 className="section-label">Recent Notes</h3>
          {followUpNotes.map((n) => {
            const member = profiles.find((p) => p.id === n.user_id);
            return (
              <div key={n.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar src={member?.photo_url ?? null} name={member?.first_name ?? 'U'} size="sm" />
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{member?.first_name}</span>
                  </div>
                  <span className="badge badge-sage">{n.status}</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{n.note}</p>
                <div className="text-xs mt-2" style={{ color: 'var(--color-text-faint)' }}>{timeAgo(n.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
