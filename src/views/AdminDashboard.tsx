import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import Modal from '@/components/Modal';
import { timeAgo, cn } from '@/lib/utils';
import {
  FileText, Heart, Users, Calendar, ChevronRight,
  Pin, Trash2, ArrowLeft, HelpCircle, BookOpen,
  Library, Megaphone, Plus, X, HeartHandshake,
} from 'lucide-react';
import type { FollowUpStatus, ResourceCategory, ResourceType, MentorAssignment, MentorRequest } from '@/types';

type AdminSection =
  | 'home' | 'posts' | 'prayers' | 'attendance' | 'followup'
  | 'bible-study' | 'resources' | 'events' | 'announcements' | 'devotionals' | 'members' | 'mentoring';

const tiles = [
  { key: 'announcements' as const, icon: Megaphone, label: 'Announcements', desc: 'Post an announcement that appears on the home page for everyone.', color: 'var(--color-brand)' },
  { key: 'posts' as const, icon: FileText, label: 'Manage Posts', desc: 'Pin important posts or remove inappropriate ones.', color: 'var(--color-brand)' },
  { key: 'prayers' as const, icon: Heart, label: 'Manage Prayers', desc: 'Review and remove prayer requests if needed.', color: 'var(--color-brand)' },
  { key: 'devotionals' as const, icon: BookOpen, label: 'Manage Devotionals', desc: 'Create and edit daily devotional content.', color: 'var(--color-sage)' },
  { key: 'events' as const, icon: Calendar, label: 'Create Event', desc: 'Add a new gathering, meeting, or activity.', color: 'var(--color-sage)' },
  { key: 'bible-study' as const, icon: BookOpen, label: 'Create Bible Study', desc: 'Set up a multi-day Bible study for the sisters.', color: 'var(--color-sage)' },
  { key: 'resources' as const, icon: Library, label: 'Add Resource', desc: 'Share a teaching article or video link.', color: 'var(--color-sage)' },
  { key: 'attendance' as const, icon: Calendar, label: 'Record Attendance', desc: 'After an event, tick off who attended.', color: 'var(--color-gold)' },
  { key: 'followup' as const, icon: Users, label: 'Follow-Up Notes', desc: 'Keep private notes about sisters who need pastoral care.', color: 'var(--color-gold)' },
  { key: 'members' as const, icon: Users, label: 'Manage Members', desc: 'View all members, change roles, and track activity.', color: 'var(--color-brand)' },
  { key: 'mentoring' as const, icon: HeartHandshake, label: 'Mentoring', desc: 'Assign mentors to ladies and manage requests.', color: 'var(--color-brand)' },
];

const followUpStatuses: FollowUpStatus[] = ['Texted', 'Called', 'Prayed', 'Needs Support', 'Doing Better'];
const resourceCategories: ResourceCategory[] = ['Teaching', 'Guide', 'Inspiration'];

export default function AdminDashboard() {
  const {
    profiles, posts, comments, reactions,
    prayerRequests, prayerResponses, events,
    followUpNotes, dailyDevotionals,
    deletePost, togglePin, deletePrayerRequest,
    recordAttendance, addFollowUpNote,
    addEvent, addBibleStudy, addResource, addPost,
    addDevotional, updateDevotional, deleteDevotional,
    updateUserRole,
    addToast,
  } = useApp();

  const [section, setSection] = useState<AdminSection>('home');

  // ─── Shared state ────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null);

  // Attendance
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [attendanceIds, setAttendanceIds] = useState<string[]>([]);

  // Follow-up
  const [noteUserId, setNoteUserId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteStatus, setNoteStatus] = useState<FollowUpStatus>('Texted');

  // Announcement
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  // Event creation
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtTime, setEvtTime] = useState('');
  const [evtLocation, setEvtLocation] = useState('');
  const [evtBring, setEvtBring] = useState('');
  const [evtSaving, setEvtSaving] = useState(false);

  // Bible Study creation
  const [studyTitle, setStudyTitle] = useState('');
  const [studyDesc, setStudyDesc] = useState('');
  const [studyTotalDays, setStudyTotalDays] = useState(7);
  const [studyDays, setStudyDays] = useState<Array<{ day_number: number; title: string; scripture_ref: string; reflection_prompt: string }>>([]);
  const [studySaving, setStudySaving] = useState(false);

  // Resource creation
  const [resTitle, setResTitle] = useState('');
  const [resCategory, setResCategory] = useState<ResourceCategory>('Teaching');
  const [resType, setResType] = useState<ResourceType>('article');
  const [resLink, setResLink] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resSaving, setResSaving] = useState(false);

  // Devotional creation/editing
  const [devId, setDevId] = useState<string | null>(null);
  const [devDate, setDevDate] = useState('');
  const [devTheme, setDevTheme] = useState('');
  const [devScriptureRef, setDevScriptureRef] = useState('');
  const [devScriptureText, setDevScriptureText] = useState('');
  const [devReflection, setDevReflection] = useState('');
  const [devAffirmation, setDevAffirmation] = useState('');
  const [devPrayer, setDevPrayer] = useState('');
  const [devSaving, setDevSaving] = useState(false);

  // User management
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'mentor' | 'lady'>('all');
  const [userActivityStats, setUserActivityStats] = useState<Record<string, { checkins: number; posts: number; prayers: number }>>({});
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<{ id: string; name: string; currentRole: string; newRole: 'admin' | 'mentor' | 'lady' } | null>(null);

  // Mentoring
  const [mentorAssignments, setMentorAssignments] = useState<MentorAssignment[]>([]);
  const [mentorRequests, setMentorRequests] = useState<MentorRequest[]>([]);
  const [loadingMentoring, setLoadingMentoring] = useState(false);
  const [assignMentorId, setAssignMentorId] = useState('');
  const [assignMenteeId, setAssignMenteeId] = useState('');

  const BackBtn = () => (
    <button className="btn btn-ghost mb-4" onClick={() => setSection('home')}>
      <ArrowLeft size={18} /> Back to Admin
    </button>
  );

  // Fetch activity stats when members section is opened
  useEffect(() => {
    if (section === 'members' && profiles && Object.keys(userActivityStats).length === 0 && !loadingActivity) {
      setLoadingActivity(true);

      const fetchActivityStats = async () => {
        const stats: Record<string, { checkins: number; posts: number; prayers: number }> = {};

        for (const profile of profiles) {
          try {
            const [checkinsRes, postsRes, prayersRes] = await Promise.all([
              supabase.from('daily_checkins').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
              supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
              supabase.from('prayer_requests').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
            ]);

            stats[profile.id] = {
              checkins: checkinsRes.count || 0,
              posts: postsRes.count || 0,
              prayers: prayersRes.count || 0,
            };
          } catch (error) {
            console.error(`Failed to fetch stats for ${profile.id}:`, error);
            stats[profile.id] = { checkins: 0, posts: 0, prayers: 0 };
          }
        }

        setUserActivityStats(stats);
        setLoadingActivity(false);
      };

      fetchActivityStats();
    }
  }, [section, profiles, userActivityStats, loadingActivity]);

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

        <div className="grid grid-cols-2 gap-3 stagger">
          {tiles.map(({ key, icon: Icon, label, desc, color }) => (
            <button
              key={key}
              onClick={() => {
                setSection(key);
                // Pre-populate study days when entering bible study
                if (key === 'bible-study' && studyDays.length === 0) {
                  setStudyDays(Array.from({ length: studyTotalDays }, (_, i) => ({
                    day_number: i + 1,
                    title: `Day ${i + 1}`,
                    scripture_ref: '',
                    reflection_prompt: '',
                  })));
                }
              }}
              className="card flex flex-col items-center text-center py-5 px-3 cursor-pointer transition-all hover:border-[var(--color-brand)] active:scale-[0.97]"
              style={{ minHeight: 120 }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: `${color}15` }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{label}</div>
              <div className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--color-text-muted)' }}>{desc}</div>
            </button>
          ))}
        </div>

        <div className="card flex items-start gap-3" style={{ background: 'var(--color-brand-soft)' }}>
          <HelpCircle size={20} style={{ color: 'var(--color-brand)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <strong>Tip:</strong> Only admins can see this page. Changes you make here are visible to the whole community.
          </p>
        </div>
      </div>
    );
  }

  // ─── Announcements ─────────────────────────────────────
  if (section === 'announcements') {
    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Post Announcement</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            This will appear as a <strong>pinned post</strong> at the top of the Community feed and on the Home page.
          </p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label">Announcement Message</label>
            <textarea
              className="input"
              rows={4}
              placeholder="e.g. Our next gathering is Saturday 1st March at 10am. Bring your favourite dish to share!"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary btn-lg w-full"
            disabled={!announcementText.trim() || announcementSaving}
            onClick={async () => {
              setAnnouncementSaving(true);
              try {
                await addPost(announcementText.trim());
                // Find the newly created post and pin it
                // We'll pin it after a short delay to allow state to update
                setTimeout(async () => {
                  const newest = posts[0];
                  if (newest) await togglePin(newest.id, true);
                }, 500);
                setAnnouncementText('');
                addToast('success', 'Announcement posted and pinned!');
                setSection('home');
              } catch {
                addToast('error', 'Failed to post announcement');
              } finally {
                setAnnouncementSaving(false);
              }
            }}
          >
            {announcementSaving ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>

        {/* Show existing pinned posts */}
        {posts.filter(p => p.is_pinned).length > 0 && (
          <div className="space-y-3">
            <h3 className="section-label">Current Announcements</h3>
            {posts.filter(p => p.is_pinned).map(post => (
              <div key={post.id} className="card">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold" style={{ color: 'var(--color-brand)' }}>
                  <Pin size={12} /> PINNED
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--color-text)' }}>{post.content}</p>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm flex-1" onClick={() => togglePin(post.id, false)}>
                    Unpin
                  </button>
                  <button
                    className="btn btn-sm flex-1"
                    style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1.5px solid rgba(244,63,94,0.2)' }}
                    onClick={() => setConfirmDelete({ type: 'post', id: post.id })}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Are you sure?" size="sm">
          <p className="text-sm mb-5" style={{ color: 'var(--color-text)' }}>
            This will permanently delete this announcement. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn flex-1" style={{ background: '#fb7185', color: '#fff' }}
              onClick={async () => {
                if (confirmDelete) { await deletePost(confirmDelete.id); setConfirmDelete(null); addToast('success', 'Deleted'); }
              }}>Yes, Delete</button>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── Create Event ──────────────────────────────────────
  if (section === 'events') {
    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Create Event</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Fill in the details below. All sisters will be able to see and RSVP.
          </p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label">Event Title *</label>
            <input className="input" placeholder="e.g. Monthly Sisterhood Gathering" value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="What is this event about?" value={evtDesc} onChange={(e) => setEvtDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={evtDate} onChange={(e) => setEvtDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Time *</label>
              <input className="input" type="time" value={evtTime} onChange={(e) => setEvtTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="e.g. Zoom / Church Hall / Online" value={evtLocation} onChange={(e) => setEvtLocation(e.target.value)} />
          </div>
          <div>
            <label className="label">What to Bring (optional)</label>
            <input className="input" placeholder="e.g. Bible, notebook, a dish to share" value={evtBring} onChange={(e) => setEvtBring(e.target.value)} />
          </div>

          <button
            className="btn btn-primary btn-lg w-full"
            disabled={!evtTitle.trim() || !evtDate || !evtTime || evtSaving}
            onClick={async () => {
              setEvtSaving(true);
              try {
                await addEvent({
                  title: evtTitle.trim(),
                  description: evtDesc.trim(),
                  date: evtDate,
                  time: evtTime,
                  location: evtLocation.trim(),
                  what_to_bring: evtBring.trim() || null,
                });
                setEvtTitle(''); setEvtDesc(''); setEvtDate(''); setEvtTime(''); setEvtLocation(''); setEvtBring('');
                addToast('success', 'Event created!');
                setSection('home');
              } catch {
                addToast('error', 'Failed to create event');
              } finally {
                setEvtSaving(false);
              }
            }}
          >
            {evtSaving ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Create Bible Study ────────────────────────────────
  if (section === 'bible-study') {
    // Ensure days array matches total
    const ensureDays = (total: number) => {
      setStudyTotalDays(total);
      setStudyDays(Array.from({ length: total }, (_, i) => ({
        day_number: i + 1,
        title: studyDays[i]?.title || `Day ${i + 1}`,
        scripture_ref: studyDays[i]?.scripture_ref || '',
        reflection_prompt: studyDays[i]?.reflection_prompt || '',
      })));
    };

    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Create Bible Study</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            <strong>Step 1:</strong> Set the title and number of days. <strong>Step 2:</strong> Fill in each day. <strong>Step 3:</strong> Save.
          </p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label">Study Title *</label>
            <input className="input" placeholder="e.g. Proverbs 31 Woman" value={studyTitle} onChange={(e) => setStudyTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} placeholder="What will the sisters learn?" value={studyDesc} onChange={(e) => setStudyDesc(e.target.value)} />
          </div>
          <div>
            <label className="label">Number of Days *</label>
            <select className="input" value={studyTotalDays} onChange={(e) => ensureDays(Number(e.target.value))}>
              {[3, 5, 7, 10, 14, 21, 30].map(n => <option key={n} value={n}>{n} days</option>)}
            </select>
          </div>
        </div>

        {/* Day-by-day content */}
        <div className="space-y-3">
          <h3 className="section-label">Daily Content ({studyDays.length} days)</h3>
          {studyDays.map((day, idx) => (
            <details key={idx} className="card">
              <summary className="font-bold text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
                Day {day.day_number}: {day.title || '(untitled)'}
              </summary>
              <div className="space-y-3 mt-4">
                <div>
                  <label className="label">Day Title</label>
                  <input className="input" placeholder="e.g. The Heart of a Virtuous Woman"
                    value={day.title}
                    onChange={(e) => {
                      const updated = [...studyDays];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      setStudyDays(updated);
                    }} />
                </div>
                <div>
                  <label className="label">Scripture Reference</label>
                  <input className="input" placeholder="e.g. Proverbs 31:10-12"
                    value={day.scripture_ref}
                    onChange={(e) => {
                      const updated = [...studyDays];
                      updated[idx] = { ...updated[idx], scripture_ref: e.target.value };
                      setStudyDays(updated);
                    }} />
                </div>
                <div>
                  <label className="label">Reflection Question</label>
                  <textarea className="input" rows={2} placeholder="e.g. What does virtue look like in your daily life?"
                    value={day.reflection_prompt}
                    onChange={(e) => {
                      const updated = [...studyDays];
                      updated[idx] = { ...updated[idx], reflection_prompt: e.target.value };
                      setStudyDays(updated);
                    }} />
                </div>
              </div>
            </details>
          ))}
        </div>

        <button
          className="btn btn-sage btn-lg w-full"
          disabled={!studyTitle.trim() || studySaving}
          onClick={async () => {
            setStudySaving(true);
            try {
              await addBibleStudy({
                title: studyTitle.trim(),
                description: studyDesc.trim(),
                totalDays: studyTotalDays,
                days: studyDays.map(d => ({ ...d, scripture_text: null })),
              });
              setStudyTitle(''); setStudyDesc(''); setStudyTotalDays(7);
              setStudyDays([]);
              addToast('success', 'Bible study created!');
              setSection('home');
            } catch {
              addToast('error', 'Failed to create study');
            } finally {
              setStudySaving(false);
            }
          }}
        >
          {studySaving ? 'Creating...' : 'Create Bible Study'}
        </button>
      </div>
    );
  }

  // ─── Add Resource ──────────────────────────────────────
  if (section === 'resources') {
    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Add Resource</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Share a helpful article or video with the community.
          </p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="e.g. How to Pray for Your Future Husband" value={resTitle} onChange={(e) => setResTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={resCategory} onChange={(e) => setResCategory(e.target.value as ResourceCategory)}>
                {resourceCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={resType} onChange={(e) => setResType(e.target.value as ResourceType)}>
                <option value="article">Article</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Link / URL *</label>
            <input className="input" type="url" placeholder="https://..." value={resLink} onChange={(e) => setResLink(e.target.value)} />
          </div>
          <div>
            <label className="label">Short Description</label>
            <textarea className="input" rows={2} placeholder="Why should the sisters read/watch this?" value={resDesc} onChange={(e) => setResDesc(e.target.value)} />
          </div>

          <button
            className="btn btn-sage btn-lg w-full"
            disabled={!resTitle.trim() || !resLink.trim() || resSaving}
            onClick={async () => {
              setResSaving(true);
              try {
                await addResource({
                  title: resTitle.trim(),
                  category: resCategory,
                  type: resType,
                  link: resLink.trim(),
                  description: resDesc.trim(),
                  thumbnail: null,
                  why_it_matters: null,
                  next_step: null,
                });
                setResTitle(''); setResLink(''); setResDesc('');
                addToast('success', 'Resource added!');
                setSection('home');
              } catch {
                addToast('error', 'Failed to add resource');
              } finally {
                setResSaving(false);
              }
            }}
          >
            {resSaving ? 'Saving...' : 'Add Resource'}
          </button>
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
                <div key={post.id} className={cn('card', post.is_pinned && 'card-glow')}
                  style={post.is_pinned ? { borderColor: 'rgba(232,102,138,0.3)' } : undefined}>
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
                      <Pin size={16} /> {post.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button className="btn btn-sm flex-1"
                      style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1.5px solid rgba(244,63,94,0.2)' }}
                      onClick={() => setConfirmDelete({ type: 'post', id: post.id })}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Are you sure?" size="sm">
          <p className="text-sm mb-5" style={{ color: 'var(--color-text)' }}>This will permanently delete this post and all its reactions and comments.</p>
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn flex-1" style={{ background: '#fb7185', color: '#fff' }}
              onClick={async () => {
                if (confirmDelete) { await deletePost(confirmDelete.id); setConfirmDelete(null); addToast('success', 'Deleted'); }
              }}>Yes, Delete</button>
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
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Review prayer requests. Tap <strong>"Delete"</strong> to remove if needed.</p>
        </div>
        {prayerRequests.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-faint)' }}>No prayer requests yet</p>
        ) : (
          <div className="space-y-3 stagger">
            {prayerRequests.map((req) => {
              const author = req.is_anonymous ? null : profiles.find((p) => p.id === req.author_id);
              const resps = prayerResponses.filter((r) => r.prayer_request_id === req.id);
              return (
                <div key={req.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                      {req.is_anonymous ? 'Anonymous' : author?.first_name}
                    </span>
                    <span className="badge badge-pink">{req.category}</span>
                  </div>
                  <p className="text-sm mb-2 line-clamp-3" style={{ color: 'var(--color-text)' }}>{req.content}</p>
                  <div className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{resps.length} sisters praying</div>
                  <button className="btn btn-sm w-full"
                    style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1.5px solid rgba(244,63,94,0.2)' }}
                    onClick={() => setConfirmDelete({ type: 'prayer', id: req.id })}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Are you sure?" size="sm">
          <p className="text-sm mb-5" style={{ color: 'var(--color-text)' }}>This will permanently delete this prayer request.</p>
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn flex-1" style={{ background: '#fb7185', color: '#fff' }}
              onClick={async () => {
                if (confirmDelete) { await deletePrayerRequest(confirmDelete.id); setConfirmDelete(null); addToast('success', 'Deleted'); }
              }}>Yes, Delete</button>
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
            <strong>Step 1:</strong> Choose the event. <strong>Step 2:</strong> Tick who attended. <strong>Step 3:</strong> Save.
          </p>
        </div>

        <div>
          <label className="label">Step 1 — Choose Event</label>
          <select className="input" value={selectedEvent ?? ''} onChange={(e) => { setSelectedEvent(e.target.value); setAttendanceIds([]); }}>
            <option value="">Tap here to choose...</option>
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
                    <input type="checkbox" checked={attendanceIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setAttendanceIds([...attendanceIds, p.id]);
                        else setAttendanceIds(attendanceIds.filter((id) => id !== p.id));
                      }}
                      className="w-5 h-5 rounded" />
                    <Avatar src={p.photo_url} name={p.first_name} size="sm" />
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{p.first_name} {p.last_name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Step 3 — Save</label>
              <button className="btn btn-primary btn-lg w-full"
                onClick={() => { recordAttendance(selectedEvent, attendanceIds); }}
                disabled={attendanceIds.length === 0}>
                Save Attendance ({attendanceIds.length} {attendanceIds.length === 1 ? 'sister' : 'sisters'})
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Follow-Up Notes ────────────────────────────────────
  if (section === 'followup') {
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
            <option value="">Tap to choose...</option>
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
            placeholder="What happened? What is the next step?" />
        </div>
        <button className="btn btn-sage btn-lg w-full"
          onClick={async () => {
            if (!noteUserId || !noteText.trim()) return;
            await addFollowUpNote(noteUserId, noteText.trim(), noteStatus);
            setNoteText(''); setNoteUserId('');
          }}
          disabled={!noteUserId || !noteText.trim()}>
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

  // Manage Devotionals
  if (section === 'devotionals') {
    const handleSaveDevotional = async () => {
      setDevSaving(true);
      try {
        if (devId) {
          await updateDevotional(devId, {
            date: devDate,
            theme: devTheme,
            scripture_ref: devScriptureRef,
            scripture_text: devScriptureText,
            reflection: devReflection,
            affirmation: devAffirmation,
            prayer: devPrayer,
          });
        } else {
          await addDevotional({
            date: devDate,
            theme: devTheme,
            scripture_ref: devScriptureRef,
            scripture_text: devScriptureText,
            reflection: devReflection,
            affirmation: devAffirmation,
            prayer: devPrayer,
          });
        }
        // Reset form
        setDevId(null);
        setDevDate('');
        setDevTheme('');
        setDevScriptureRef('');
        setDevScriptureText('');
        setDevReflection('');
        setDevAffirmation('');
        setDevPrayer('');
        addToast('success', devId ? 'Devotional updated!' : 'Devotional created!');
      } catch (err) {
        addToast('error', 'Failed to save devotional');
      } finally {
        setDevSaving(false);
      }
    };

    const handleEditDevotional = (dev: any) => {
      setDevId(dev.id);
      setDevDate(dev.date);
      setDevTheme(dev.theme);
      setDevScriptureRef(dev.scripture_ref);
      setDevScriptureText(dev.scripture_text);
      setDevReflection(dev.reflection);
      setDevAffirmation(dev.affirmation);
      setDevPrayer(dev.prayer);
    };

    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {devId ? 'Edit Devotional' : 'Create Devotional'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {devId ? 'Update the devotional content below.' : 'Create a new daily devotional for the community.'}
          </p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              className="input"
              value={devDate}
              onChange={(e) => setDevDate(e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              The devotional will be shown on this date
            </p>
          </div>

          <div>
            <label className="label">Theme *</label>
            <input
              className="input"
              placeholder="e.g. Your Identity in Christ"
              value={devTheme}
              onChange={(e) => setDevTheme(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Scripture Reference</label>
            <input
              className="input"
              placeholder="e.g. Song of Solomon 4:7"
              value={devScriptureRef}
              onChange={(e) => setDevScriptureRef(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Scripture Text</label>
            <textarea
              className="input"
              rows={3}
              placeholder="You are altogether beautiful, my darling; there is no flaw in you."
              value={devScriptureText}
              onChange={(e) => setDevScriptureText(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Reflection</label>
            <textarea
              className="input"
              rows={5}
              placeholder="Write a thoughtful reflection on the scripture..."
              value={devReflection}
              onChange={(e) => setDevReflection(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Affirmation</label>
            <textarea
              className="input"
              rows={2}
              placeholder="I am fearfully and wonderfully made..."
              value={devAffirmation}
              onChange={(e) => setDevAffirmation(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Prayer</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Lord, help me see myself the way You see me..."
              value={devPrayer}
              onChange={(e) => setDevPrayer(e.target.value)}
            />
          </div>

          <button
            className="btn btn-sage btn-lg w-full"
            disabled={!devDate || !devTheme || devSaving}
            onClick={handleSaveDevotional}
          >
            {devSaving ? 'Saving...' : devId ? 'Update Devotional' : 'Create Devotional'}
          </button>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Only Date and Theme are required. Fill in what you can.
          </p>

          {devId && (
            <button
              className="btn btn-ghost w-full"
              onClick={() => {
                setDevId(null);
                setDevDate('');
                setDevTheme('');
                setDevScriptureRef('');
                setDevScriptureText('');
                setDevReflection('');
                setDevAffirmation('');
                setDevPrayer('');
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Existing Devotionals */}
        {dailyDevotionals.length > 0 && (
          <div className="space-y-3">
            <h3 className="section-label">Existing Devotionals ({dailyDevotionals.length})</h3>
            {dailyDevotionals.map((dev) => (
              <div key={dev.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="badge badge-sage">{dev.date}</span>
                    <h4 className="font-bold text-sm mt-2" style={{ color: 'var(--color-text)' }}>
                      {dev.theme}
                    </h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {dev.scripture_ref}
                    </p>
                  </div>
                </div>
                <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  {dev.reflection}
                </p>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm flex-1"
                    onClick={() => handleEditDevotional(dev)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm flex-1"
                    style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1.5px solid rgba(244,63,94,0.2)' }}
                    onClick={async () => {
                      if (confirm('Delete this devotional?')) {
                        await deleteDevotional(dev.id);
                      }
                    }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Manage Members ─────────────────────────────────────
  if (section === 'members') {
    const roleOrder = { admin: 0, mentor: 1, lady: 2 };
    const filteredUsers = profiles
      ?.filter(p => {
        const matchesSearch = searchTerm === '' ||
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || p.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const ra = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
        const rb = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
        if (ra !== rb) return ra - rb;
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      });

    const roleBadgeClass = (role: string) => {
      if (role === 'admin') return 'badge-pink';
      if (role === 'mentor') return 'badge-gold';
      return 'badge-sage';
    };

    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Manage Members
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            View all members, change roles, and track activity.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <input
            type="text"
            className="input"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2">
            <button className={cn('btn btn-sm flex-1', roleFilter === 'all' && 'btn-primary')} onClick={() => setRoleFilter('all')}>
              All ({profiles?.length || 0})
            </button>
            <button className={cn('btn btn-sm flex-1', roleFilter === 'admin' && 'btn-primary')} onClick={() => setRoleFilter('admin')}>
              Admin ({profiles?.filter(p => p.role === 'admin').length || 0})
            </button>
            <button className={cn('btn btn-sm flex-1', roleFilter === 'mentor' && 'btn-primary')} onClick={() => setRoleFilter('mentor')}>
              Mentors ({profiles?.filter(p => p.role === 'mentor').length || 0})
            </button>
            <button className={cn('btn btn-sm flex-1', roleFilter === 'lady' && 'btn-primary')} onClick={() => setRoleFilter('lady')}>
              Ladies ({profiles?.filter(p => p.role === 'lady').length || 0})
            </button>
          </div>
        </div>

        {/* Member List */}
        {filteredUsers && filteredUsers.length > 0 ? (
          <div className="space-y-3">
            {filteredUsers.map((member) => {
              const stats = userActivityStats[member.id] || { checkins: 0, posts: 0, prayers: 0 };
              return (
                <div key={member.id} className="card space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar src={member.photo_url} name={`${member.first_name} ${member.last_name}`} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                          {member.first_name} {member.last_name}
                        </div>
                        <span className={cn('badge badge-sm', roleBadgeClass(member.role))}>
                          {member.role}
                        </span>
                      </div>
                      {member.area && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {member.area}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="flex gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <div><span className="font-bold" style={{ color: 'var(--color-text)' }}>{stats.checkins}</span> check-ins</div>
                    <div><span className="font-bold" style={{ color: 'var(--color-text)' }}>{stats.posts}</span> posts</div>
                    <div><span className="font-bold" style={{ color: 'var(--color-text)' }}>{stats.prayers}</span> prayers</div>
                  </div>

                  {/* Change Role */}
                  <div>
                    <select
                      className="input text-sm"
                      value={member.role}
                      onChange={(e) => {
                        const newRole = e.target.value as 'admin' | 'mentor' | 'lady';
                        if (newRole !== member.role) {
                          setRoleChangeUser({
                            id: member.id,
                            name: `${member.first_name} ${member.last_name}`,
                            currentRole: member.role,
                            newRole,
                          });
                        }
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="mentor">Mentor</option>
                      <option value="lady">Lady</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No members found.</p>
          </div>
        )}

        {/* Role Change Modal */}
        <Modal isOpen={!!roleChangeUser} onClose={() => setRoleChangeUser(null)} title="Change User Role" size="sm">
          {roleChangeUser && (
            <>
              <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                Change <strong>{roleChangeUser.name}</strong> from{' '}
                <strong>{roleChangeUser.currentRole}</strong> to <strong>{roleChangeUser.newRole}</strong>?
              </p>
              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setRoleChangeUser(null)}>Cancel</button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={async () => {
                    try {
                      await updateUserRole(roleChangeUser.id, roleChangeUser.newRole);
                      setRoleChangeUser(null);
                    } catch (error) {
                      console.error('Failed to update role:', error);
                      addToast('error', 'Failed to update role');
                    }
                  }}
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </Modal>
      </div>
    );
  }

  // ─── Mentoring ─────────────────────────────────────────
  if (section === 'mentoring') {
    const fetchMentoringData = async () => {
      if (loadingMentoring) return;
      setLoadingMentoring(true);
      const [assignRes, reqRes] = await Promise.all([
        supabase.from('mentor_assignments').select('*').order('assigned_at', { ascending: false }),
        supabase.from('mentor_requests').select('*').order('created_at', { ascending: false }),
      ]);
      if (assignRes.data) setMentorAssignments(assignRes.data);
      if (reqRes.data) setMentorRequests(reqRes.data);
      setLoadingMentoring(false);
    };

    if (mentorAssignments.length === 0 && mentorRequests.length === 0 && !loadingMentoring) {
      fetchMentoringData();
    }

    const mentors = profiles.filter(p => p.role === 'mentor');
    const ladies = profiles.filter(p => p.role === 'lady');

    const handleAssign = async () => {
      if (!assignMentorId || !assignMenteeId) return;
      const { error } = await supabase.from('mentor_assignments').insert({
        mentor_id: assignMentorId,
        mentee_id: assignMenteeId,
        status: 'active',
      });
      if (error) {
        addToast('error', error.message.includes('duplicate') ? 'This pairing already exists' : 'Failed to assign');
        return;
      }
      addToast('success', 'Mentor assigned!');
      setAssignMentorId('');
      setAssignMenteeId('');
      fetchMentoringData();
    };

    const handleApproveRequest = async (req: MentorRequest, mentorId: string) => {
      await supabase.from('mentor_requests').update({ status: 'approved' }).eq('id', req.id);
      await supabase.from('mentor_assignments').insert({
        mentor_id: mentorId,
        mentee_id: req.mentee_id,
        status: 'active',
      });
      addToast('success', 'Request approved and mentor assigned!');
      fetchMentoringData();
    };

    const handleDeclineRequest = async (reqId: string) => {
      await supabase.from('mentor_requests').update({ status: 'declined' }).eq('id', reqId);
      addToast('info', 'Request declined');
      fetchMentoringData();
    };

    const handleRemoveAssignment = async (id: string) => {
      await supabase.from('mentor_assignments').delete().eq('id', id);
      addToast('success', 'Assignment removed');
      fetchMentoringData();
    };

    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Mentoring</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Assign mentors to ladies and manage mentor requests.</p>
        </div>

        {/* Assign Mentor */}
        <div className="card space-y-4">
          <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Assign a Mentor</h3>
          <div>
            <label className="label">Mentor</label>
            <select className="input" value={assignMentorId} onChange={(e) => setAssignMentorId(e.target.value)}>
              <option value="">Select a mentor...</option>
              {mentors.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lady</label>
            <select className="input" value={assignMenteeId} onChange={(e) => setAssignMenteeId(e.target.value)}>
              <option value="">Select a lady...</option>
              {ladies.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-lg w-full" disabled={!assignMentorId || !assignMenteeId} onClick={handleAssign}>
            Assign Mentor
          </button>
        </div>

        {/* Pending Requests */}
        {mentorRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="space-y-3">
            <h3 className="section-label">Pending Requests</h3>
            {mentorRequests.filter(r => r.status === 'pending').map(req => {
              const mentee = profiles.find(p => p.id === req.mentee_id);
              const preferredMentor = req.mentor_id ? profiles.find(p => p.id === req.mentor_id) : null;
              return (
                <div key={req.id} className="card space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={mentee?.photo_url ?? null} name={mentee?.first_name ?? 'U'} size="sm" />
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{mentee?.first_name} {mentee?.last_name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {preferredMentor ? `Requested: ${preferredMentor.first_name}` : 'Any mentor'}
                      </div>
                    </div>
                  </div>
                  {req.message && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{req.message}</p>}
                  <div className="space-y-2">
                    <select className="input text-sm" id={`mentor-select-${req.id}`} defaultValue={req.mentor_id || ''}>
                      <option value="">Choose mentor to assign...</option>
                      {mentors.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm flex-1" onClick={() => {
                        const select = document.getElementById(`mentor-select-${req.id}`) as HTMLSelectElement;
                        if (select.value) handleApproveRequest(req, select.value);
                        else addToast('error', 'Please select a mentor first');
                      }}>Approve</button>
                      <button className="btn btn-secondary btn-sm flex-1" onClick={() => handleDeclineRequest(req.id)}>Decline</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Current Assignments */}
        <div className="space-y-3">
          <h3 className="section-label">Current Assignments ({mentorAssignments.filter(a => a.status === 'active').length})</h3>
          {mentorAssignments.filter(a => a.status === 'active').length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No active assignments yet.</p>
            </div>
          ) : (
            mentorAssignments.filter(a => a.status === 'active').map(assignment => {
              const mentor = profiles.find(p => p.id === assignment.mentor_id);
              const mentee = profiles.find(p => p.id === assignment.mentee_id);
              return (
                <div key={assignment.id} className="card">
                  <div className="flex items-center gap-3">
                    <Avatar src={mentor?.photo_url ?? null} name={mentor?.first_name ?? 'M'} size="sm" />
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        {mentor?.first_name} → {mentee?.first_name} {mentee?.last_name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Since {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm text-rose-400"
                      onClick={() => { if (confirm('Remove this assignment?')) handleRemoveAssignment(assignment.id); }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return null;
}
