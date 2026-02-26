import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { timeAgo, cn } from '@/lib/utils';
import {
  FileText, Heart, Users, Calendar, ChevronRight,
  Pin, Trash2, ArrowLeft, HelpCircle, BookOpen,
  Library, Megaphone, Plus, X, HeartHandshake, Eye, Mail, Send, Pencil, Download,
} from 'lucide-react';
import type { FollowUpStatus, ResourceCategory, ResourceType, MentorAssignment, MentorRequest, Pod, PodMember, GuideSectionCategory, EmailAudience, EmailLog } from '@/types';

type AdminSection =
  | 'home' | 'posts' | 'prayers' | 'attendance' | 'followup'
  | 'bible-study' | 'resources' | 'events' | 'announcements' | 'devotionals' | 'members' | 'mentoring' | 'pods' | 'guide' | 'email';

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
  { key: 'mentoring' as const, icon: HeartHandshake, label: 'Eldership', desc: 'Assign elders to members and manage requests.', color: 'var(--color-brand)' },
  { key: 'pods' as const, icon: Users, label: 'Manage Pods', desc: 'Create accountability groups and assign members.', color: 'var(--color-sage)' },
  { key: 'guide' as const, icon: HelpCircle, label: 'User Guide', desc: 'Manage help content, tutorials, and FAQ.', color: 'var(--color-sage)' },
  { key: 'email' as const, icon: Mail, label: 'Send Email', desc: 'Email members individually or in bulk via Resend.', color: 'var(--color-brand)' },
];

const followUpStatuses: FollowUpStatus[] = ['Texted', 'Called', 'Prayed', 'Needs Support', 'Doing Better'];
const resourceCategories: ResourceCategory[] = ['Teaching', 'Guide', 'Inspiration'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    user, profile,
    profiles, posts, comments, reactions,
    prayerRequests, prayerResponses, events,
    followUpNotes, dailyDevotionals,
    deletePost, togglePin, deletePrayerRequest,
    recordAttendance, addFollowUpNote,
    addEvent, updateEvent, deleteEvent, addBibleStudy, addResource, addPost,
    addDevotional, updateDevotional, deleteDevotional,
    updateUserRole, banUser, unbanUser, removeUser,
    pods, podMembers, addPod, deletePod, addPodMember, removePodMember,
    guideSections, addGuideSection, updateGuideSection, deleteGuideSection,
    addToast,
  } = useApp();

  const isAdmin = profile?.role === 'admin';
  const isElder = profile?.role === 'elder';

  const [section, setSection] = useState<AdminSection>('home');

  // ─── Shared state ────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null);

  // Attendance
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [attendanceIds, setAttendanceIds] = useState<string[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<Array<{ event_id: string; user_id: string; date: string; recorded_by?: string }>>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceFetched, setAttendanceFetched] = useState(false);

  // Follow-up
  const [noteUserId, setNoteUserId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteStatus, setNoteStatus] = useState<FollowUpStatus>('Texted');
  const [followUpFilter, setFollowUpFilter] = useState<string>('all');

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
  const [editingEvent, setEditingEvent] = useState<string | null>(null);

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
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'elder' | 'member'>('all');
  const [userActivityStats, setUserActivityStats] = useState<Record<string, { checkins: number; posts: number; prayers: number }>>({});
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<{ id: string; name: string; currentRole: string; newRole: 'admin' | 'elder' | 'member' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'banned' | 'removed' | 'all'>('active');
  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  // Mentoring
  const [mentorAssignments, setMentorAssignments] = useState<MentorAssignment[]>([]);
  const [mentorRequests, setMentorRequests] = useState<MentorRequest[]>([]);
  const [loadingMentoring, setLoadingMentoring] = useState(false);
  const [assignMentorId, setAssignMentorId] = useState('');
  const [assignMenteeId, setAssignMenteeId] = useState('');

  // Guide
  const [guideEditId, setGuideEditId] = useState<string | null>(null);
  const [guideTitle, setGuideTitle] = useState('');
  const [guideIcon, setGuideIcon] = useState('BookOpen');
  const [guideDesc, setGuideDesc] = useState('');
  const [guideContent, setGuideContent] = useState('');
  const [guideCategory, setGuideCategory] = useState<GuideSectionCategory>('getting_started');
  const [guideOrder, setGuideOrder] = useState(0);
  const [guideActive, setGuideActive] = useState(true);
  const [guideSaving, setGuideSaving] = useState(false);

  // Email
  const [emailAudience, setEmailAudience] = useState<EmailAudience>('all');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailIndividualId, setEmailIndividualId] = useState('');
  const [emailLog, setEmailLog] = useState<EmailLog[]>([]);
  const [emailLogLoaded, setEmailLogLoaded] = useState(false);

  const BackBtn = () => (
    <button className="btn btn-ghost mb-4" onClick={() => setSection('home')}>
      <ArrowLeft size={18} /> Back to Dashboard
    </button>
  );

  // Fetch activity stats when members section is opened (single RPC call)
  useEffect(() => {
    if (section === 'members' && profiles && Object.keys(userActivityStats).length === 0 && !loadingActivity) {
      setLoadingActivity(true);

      supabase.rpc('get_member_activity_stats').then(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch activity stats:', error);
        } else if (data) {
          const stats: Record<string, { checkins: number; posts: number; prayers: number }> = {};
          for (const row of data) {
            stats[row.user_id] = {
              checkins: Number(row.checkins),
              posts: Number(row.posts),
              prayers: Number(row.prayers),
            };
          }
          setUserActivityStats(stats);
        }
        setLoadingActivity(false);
      });
    }
  }, [section, profiles, userActivityStats, loadingActivity]);

  // Fetch attendance history when attendance section is opened
  useEffect(() => {
    if (section === 'attendance' && !attendanceFetched && !loadingAttendance) {
      setLoadingAttendance(true);
      supabase
        .from('attendance')
        .select('event_id, user_id, date, recorded_by')
        .order('date', { ascending: false })
        .then(({ data, error }) => {
          if (error) console.error('Attendance fetch error:', error);
          if (data) setAttendanceHistory(data);
          setAttendanceFetched(true);
          setLoadingAttendance(false);
        });
    }
  }, [section, attendanceFetched, loadingAttendance]);

  // Fetch email log when email section opens
  useEffect(() => {
    if (section === 'email' && !emailLogLoaded) {
      supabase
        .from('email_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          if (data) setEmailLog(data as EmailLog[]);
          setEmailLogLoaded(true);
        });
    }
  }, [section, emailLogLoaded]);

  // ─── Home ───────────────────────────────────────────────
  if (section === 'home') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {isAdmin ? 'Admin Dashboard' : 'Leadership Dashboard'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Tap any section below to manage your community.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 stagger">
          {tiles.filter((t) => isAdmin || ['attendance', 'followup'].includes(t.key)).map(({ key, icon: Icon, label, desc, color }) => (
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
                const newPost = await addPost(announcementText.trim());
                if (newPost) await togglePin(newPost.id, true);
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

        {/* Existing Events */}
        {events.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-text)' }}>Existing Events</h2>
            {events.map((evt) => (
              <div key={evt.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{evt.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {evt.date} at {evt.time} {evt.location && `· ${evt.location}`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditingEvent(evt.id);
                        setEvtTitle(evt.title);
                        setEvtDesc(evt.description);
                        setEvtDate(evt.date);
                        setEvtTime(evt.time);
                        setEvtLocation(evt.location || '');
                        setEvtBring(evt.what_to_bring || '');
                      }}
                      aria-label="Edit event"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#fb7185' }}
                      onClick={async () => {
                        await deleteEvent(evt.id);
                        addToast('success', 'Event deleted');
                      }}
                      aria-label="Delete event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Event Modal */}
        <Modal isOpen={!!editingEvent} onClose={() => setEditingEvent(null)} title="Edit Event">
          <div className="space-y-4">
            <div>
              <label className="label">Event Title *</label>
              <input className="input" value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={evtDesc} onChange={(e) => setEvtDesc(e.target.value)} />
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
              <input className="input" value={evtLocation} onChange={(e) => setEvtLocation(e.target.value)} />
            </div>
            <div>
              <label className="label">What to Bring</label>
              <input className="input" value={evtBring} onChange={(e) => setEvtBring(e.target.value)} />
            </div>
            <button
              className="btn btn-primary w-full"
              disabled={!evtTitle.trim() || !evtDate || !evtTime}
              onClick={async () => {
                if (!editingEvent) return;
                try {
                  await updateEvent(editingEvent, {
                    title: evtTitle.trim(),
                    description: evtDesc.trim(),
                    date: evtDate,
                    time: evtTime,
                    location: evtLocation.trim(),
                    what_to_bring: evtBring.trim() || null,
                  });
                  setEditingEvent(null);
                  setEvtTitle(''); setEvtDesc(''); setEvtDate(''); setEvtTime(''); setEvtLocation(''); setEvtBring('');
                } catch {
                  addToast('error', 'Failed to update event');
                }
              }}
            >
              Save Changes
            </button>
          </div>
        </Modal>
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
                onClick={async () => {
                  await recordAttendance(selectedEvent, attendanceIds);
                  // Refresh history
                  const { data } = await supabase
                    .from('attendance')
                    .select('event_id, user_id, date, recorded_by')
                    .order('date', { ascending: false });
                  if (data) setAttendanceHistory(data);
                }}
                disabled={attendanceIds.length === 0}>
                Save Attendance ({attendanceIds.length} {attendanceIds.length === 1 ? 'sister' : 'sisters'})
              </button>
            </div>
          </>
        )}

        {/* Attendance History */}
        {(() => {
          // Elders only see attendance they recorded; admins see all
          const visibleAttendance = isElder
            ? attendanceHistory.filter((a) => a.recorded_by === user?.id)
            : attendanceHistory;
          return (
        <div className="space-y-4 mt-2">
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {isElder ? 'My Recorded Attendance' : 'Attendance History'}
          </h2>
          {loadingAttendance ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>Loading history...</p>
          ) : visibleAttendance.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>No attendance records yet.</p>
          ) : (
            (() => {
              // Group by event
              const byEvent: Record<string, { eventId: string; date: string; userIds: string[] }> = {};
              visibleAttendance.forEach((a) => {
                if (!byEvent[a.event_id]) {
                  byEvent[a.event_id] = { eventId: a.event_id, date: a.date, userIds: [] };
                }
                byEvent[a.event_id].userIds.push(a.user_id);
              });
              const eventGroups = Object.values(byEvent).sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );

              return (
                <div className="space-y-3">
                  {eventGroups.map((group) => {
                    const event = events.find((e) => e.id === group.eventId);
                    return (
                      <div key={group.eventId} className="card">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                              {event?.title || 'Unknown Event'}
                            </h3>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {new Date(group.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <span className="badge badge-sage">{group.userIds.length} attended</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {group.userIds.map((uid) => {
                            const p = profiles.find((pr) => pr.id === uid);
                            return (
                              <div key={uid} className="flex items-center gap-1.5">
                                <Avatar src={p?.photo_url ?? null} name={p?.first_name ?? 'U'} size="sm" />
                                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {p?.first_name || 'Unknown'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
          );
        })()}
      </div>
    );
  }

  // ─── Follow-Up Notes ────────────────────────────────────
  if (section === 'followup') {
    // Elders only see notes they created; admins see all
    const visibleNotes = isElder
      ? followUpNotes.filter((n) => n.leader_id === user?.id)
      : followUpNotes;

    // Get unique members who have notes for the filter
    const membersWithNotes = [...new Set(visibleNotes.map((n) => n.user_id))];

    // Filter notes
    const filteredNotes = visibleNotes
      .filter((n) => {
        if (followUpFilter === 'all') return true;
        // Filter by status
        if (followUpStatuses.includes(followUpFilter as FollowUpStatus)) return n.status === followUpFilter;
        // Filter by member ID
        return n.user_id === followUpFilter;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Group notes by member for the grouped view
    const notesByMember: Record<string, typeof filteredNotes> = {};
    filteredNotes.forEach((n) => {
      if (!notesByMember[n.user_id]) notesByMember[n.user_id] = [];
      notesByMember[n.user_id].push(n);
    });

    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Follow-Up Notes</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Keep private notes about sisters who need care.
            {isElder ? ' You can see notes you created.' : ' Only leadership can see these.'}
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

        {/* Notes History */}
        {visibleNotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {isElder ? 'My Notes' : 'Notes History'} ({visibleNotes.length})
            </h2>

            {/* Filters */}
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <button
                  className={cn('btn btn-sm', followUpFilter === 'all' && 'btn-primary')}
                  onClick={() => setFollowUpFilter('all')}
                >
                  All
                </button>
                {followUpStatuses.map((s) => {
                  const count = visibleNotes.filter((n) => n.status === s).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={s}
                      className={cn('btn btn-sm', followUpFilter === s && 'btn-primary')}
                      onClick={() => setFollowUpFilter(s)}
                    >
                      {s} ({count})
                    </button>
                  );
                })}
              </div>
              {membersWithNotes.length > 1 && (
                <select
                  className="input text-sm"
                  value={followUpStatuses.includes(followUpFilter as FollowUpStatus) || followUpFilter === 'all' ? '' : followUpFilter}
                  onChange={(e) => setFollowUpFilter(e.target.value || 'all')}
                >
                  <option value="">Filter by member...</option>
                  {membersWithNotes.map((uid) => {
                    const p = profiles.find((pr) => pr.id === uid);
                    return (
                      <option key={uid} value={uid}>{p?.first_name} {p?.last_name}</option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Grouped by member */}
            <div className="space-y-4">
              {Object.entries(notesByMember).map(([userId, notes]) => {
                const member = profiles.find((p) => p.id === userId);
                const latestStatus = notes[0]?.status;
                return (
                  <div key={userId} className="card space-y-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={member?.photo_url ?? null} name={member?.first_name ?? 'U'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                          {member?.first_name} {member?.last_name}
                        </span>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                        </div>
                      </div>
                      <span className="badge badge-sage">{latestStatus}</span>
                    </div>
                    <div className="space-y-2 pl-12">
                      {notes.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-xl p-3"
                          style={{ background: 'var(--color-bg-overlay)' }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-faint)' }}>
                              {n.status}
                            </span>
                            <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text)' }}>{n.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
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
    const roleOrder = { admin: 0, elder: 1, member: 2 };
    const filteredUsers = profiles
      ?.filter(p => {
        const matchesSearch = searchTerm === '' ||
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || p.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || (p.status || 'active') === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const ra = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
        const rb = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
        if (ra !== rb) return ra - rb;
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      });

    const roleBadgeClass = (role: string) => {
      if (role === 'admin') return 'badge-pink';
      if (role === 'elder') return 'badge-gold';
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
          <button
            className="btn btn-secondary btn-sm mt-2"
            onClick={() => {
              const rows = [['Name', 'Role', 'City', 'Country', 'Check-ins', 'Posts', 'Prayers']];
              (filteredUsers || []).forEach((m) => {
                const s = userActivityStats[m.id] || { checkins: 0, posts: 0, prayers: 0 };
                rows.push([
                  `${m.first_name} ${m.last_name}`,
                  m.role,
                  m.city || '',
                  m.country || '',
                  String(s.checkins),
                  String(s.posts),
                  String(s.prayers),
                ]);
              });
              const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `titus24-members-${new Date().toLocaleDateString('en-CA')}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              addToast('success', 'Members exported to CSV');
            }}
          >
            <Download size={14} /> Export CSV
          </button>
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
            <button className={cn('btn btn-sm flex-1', roleFilter === 'elder' && 'btn-primary')} onClick={() => setRoleFilter('elder')}>
              Elders ({profiles?.filter(p => p.role === 'elder').length || 0})
            </button>
            <button className={cn('btn btn-sm flex-1', roleFilter === 'member' && 'btn-primary')} onClick={() => setRoleFilter('member')}>
              Members ({profiles?.filter(p => p.role === 'member').length || 0})
            </button>
          </div>
          <div className="flex gap-2">
            {(['active', 'banned', 'removed', 'all'] as const).map((s) => (
              <button key={s} className={cn('btn btn-sm flex-1', statusFilter === s && 'btn-primary')} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && ` (${profiles?.filter(p => (p.status || 'active') === s).length || 0})`}
              </button>
            ))}
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
                        {(member.status === 'banned') && (
                          <span className="badge badge-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Banned</span>
                        )}
                        {(member.status === 'removed') && (
                          <span className="badge badge-sm" style={{ background: 'rgba(107,114,128,0.15)', color: '#6b7280' }}>Removed</span>
                        )}
                      </div>
                      {(member.city || member.area) && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {member.city && member.country ? `${member.city}, ${member.country}` : member.area}
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

                  {/* View Profile & Change Role */}
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-secondary btn-sm flex-1"
                      onClick={() => navigate(`/member/${member.id}`)}
                    >
                      <Eye size={14} /> View Profile
                    </button>
                    <select
                      className="input text-sm"
                      value={member.role}
                      onChange={(e) => {
                        const newRole = e.target.value as 'admin' | 'elder' | 'member';
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
                      <option value="elder">Elder</option>
                      <option value="member">Member</option>
                    </select>
                  </div>

                  {/* Ban / Remove Actions */}
                  {member.id !== user?.id && (
                    <div className="flex gap-2">
                      {(member.status || 'active') === 'active' && (
                        <button
                          className="btn btn-sm flex-1 text-xs"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                          onClick={() => { setBanTarget({ id: member.id, name: `${member.first_name} ${member.last_name}` }); setBanReason(''); }}
                        >
                          Ban User
                        </button>
                      )}
                      {member.status === 'banned' && (
                        <button
                          className="btn btn-sm flex-1 text-xs btn-secondary"
                          onClick={async () => {
                            try { await unbanUser(member.id); } catch { addToast('error', 'Failed to unban user'); }
                          }}
                        >
                          Unban User
                        </button>
                      )}
                      {member.status !== 'removed' && (
                        <button
                          className="btn btn-sm flex-1 text-xs"
                          style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)' }}
                          onClick={() => setRemoveTarget({ id: member.id, name: `${member.first_name} ${member.last_name}` })}
                        >
                          Remove User
                        </button>
                      )}
                    </div>
                  )}
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

        {/* Ban User Modal */}
        <Modal isOpen={!!banTarget} onClose={() => setBanTarget(null)} title="Ban User" size="sm">
          {banTarget && (
            <>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Ban <strong>{banTarget.name}</strong> from the app? They will be signed out and unable to access any features.
              </p>
              <textarea
                className="input w-full mb-4"
                rows={3}
                placeholder="Reason for ban (required)..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setBanTarget(null)}>Cancel</button>
                <button
                  className="btn flex-1"
                  style={{ background: '#ef4444', color: '#fff' }}
                  disabled={!banReason.trim()}
                  onClick={async () => {
                    try {
                      await banUser(banTarget.id, banReason.trim());
                      setBanTarget(null);
                      setBanReason('');
                    } catch {
                      addToast('error', 'Failed to ban user');
                    }
                  }}
                >
                  Ban User
                </button>
              </div>
            </>
          )}
        </Modal>

        {/* Remove User Confirmation */}
        <ConfirmModal
          isOpen={!!removeTarget}
          title="Remove User"
          message={`Remove ${removeTarget?.name} from the app? This will soft-delete their account. They will be signed out and won't appear in the directory.`}
          confirmLabel="Remove"
          onConfirm={async () => {
            if (!removeTarget) return;
            try {
              await removeUser(removeTarget.id);
            } catch {
              addToast('error', 'Failed to remove user');
            }
            setRemoveTarget(null);
          }}
          onCancel={() => setRemoveTarget(null)}
        />
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

    const eldersList = profiles.filter(p => p.role === 'elder' || p.role === 'admin');
    const membersList = profiles.filter(p => p.role === 'member');

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
      addToast('success', 'Elder assigned!');
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
      addToast('success', 'Request approved and elder assigned!');
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
          <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Eldership</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Assign elders to members and manage elder requests.</p>
        </div>

        {/* Assign Elder */}
        <div className="card space-y-4">
          <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Assign an Elder</h3>
          <div>
            <label className="label">Elder</label>
            <select className="input" value={assignMentorId} onChange={(e) => setAssignMentorId(e.target.value)}>
              <option value="">Select an elder...</option>
              {eldersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Member</label>
            <select className="input" value={assignMenteeId} onChange={(e) => setAssignMenteeId(e.target.value)}>
              <option value="">Select a member...</option>
              {membersList.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-lg w-full" disabled={!assignMentorId || !assignMenteeId} onClick={handleAssign}>
            Assign Elder
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
                        {preferredMentor ? `Requested: ${preferredMentor.first_name}` : 'Any elder'}
                      </div>
                    </div>
                  </div>
                  {req.message && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{req.message}</p>}
                  <div className="space-y-2">
                    <select className="input text-sm" id={`mentor-select-${req.id}`} defaultValue={req.mentor_id || ''}>
                      <option value="">Choose elder to assign...</option>
                      {eldersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm flex-1" onClick={() => {
                        const select = document.getElementById(`mentor-select-${req.id}`) as HTMLSelectElement;
                        if (select.value) handleApproveRequest(req, select.value);
                        else addToast('error', 'Please select an elder first');
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

  // ─── Manage Guide ──────────────────────────────────────────
  if (section === 'guide') {
    const guideIconOptions = ['BookOpen', 'Heart', 'Users', 'Calendar', 'Camera', 'MessageCircle', 'HelpCircle', 'Sparkles', 'Trophy', 'HeartHandshake', 'Eye', 'Moon', 'Shield', 'PartyPopper'];
    const guideCategoryLabels: Record<GuideSectionCategory, string> = {
      getting_started: 'Getting Started',
      features: 'Features',
      faq: 'FAQ',
    };

    // Only show DB sections (non-default) for management
    const dbSections = guideSections.filter(s => !s.id.startsWith('default-'));

    const resetGuideForm = () => {
      setGuideEditId(null);
      setGuideTitle('');
      setGuideIcon('BookOpen');
      setGuideDesc('');
      setGuideContent('');
      setGuideCategory('getting_started');
      setGuideOrder(0);
      setGuideActive(true);
    };

    const handleGuideSave = async () => {
      if (!guideTitle.trim() || !guideContent.trim()) return;
      setGuideSaving(true);
      try {
        if (guideEditId) {
          await updateGuideSection(guideEditId, {
            title: guideTitle.trim(),
            icon: guideIcon,
            description: guideDesc.trim(),
            content: guideContent.trim(),
            category: guideCategory,
            display_order: guideOrder,
            is_active: guideActive,
          });
        } else {
          await addGuideSection({
            title: guideTitle.trim(),
            icon: guideIcon,
            description: guideDesc.trim(),
            content: guideContent.trim(),
            category: guideCategory,
            display_order: guideOrder,
            is_active: guideActive,
          });
        }
        resetGuideForm();
      } catch {
        addToast('error', 'Failed to save guide section');
      } finally {
        setGuideSaving(false);
      }
    };

    const handleGuideEdit = (s: typeof dbSections[0]) => {
      setGuideEditId(s.id);
      setGuideTitle(s.title);
      setGuideIcon(s.icon);
      setGuideDesc(s.description);
      setGuideContent(s.content);
      setGuideCategory(s.category as GuideSectionCategory);
      setGuideOrder(s.display_order);
      setGuideActive(s.is_active);
    };

    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {guideEditId ? 'Edit Guide Section' : 'Manage User Guide'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Add or edit help content. Default content is shown when no custom sections exist for a category.
          </p>
        </div>

        {/* Add/Edit Form */}
        <div className="card space-y-4">
          <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
            {guideEditId ? 'Edit Section' : 'Add New Section'}
          </h3>
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="e.g. How to Use Prayer Wall" value={guideTitle} onChange={(e) => setGuideTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={guideCategory} onChange={(e) => setGuideCategory(e.target.value as GuideSectionCategory)}>
                <option value="getting_started">Getting Started</option>
                <option value="features">Features</option>
                <option value="faq">FAQ</option>
              </select>
            </div>
            <div>
              <label className="label">Icon</label>
              <select className="input" value={guideIcon} onChange={(e) => setGuideIcon(e.target.value)}>
                {guideIconOptions.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Short Description *</label>
            <input className="input" placeholder="One-line summary shown before expanding" value={guideDesc} onChange={(e) => setGuideDesc(e.target.value)} />
          </div>
          <div>
            <label className="label">Content *</label>
            <textarea className="input" rows={6} placeholder="Full guide content (supports line breaks)" value={guideContent} onChange={(e) => setGuideContent(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Display Order</label>
              <input type="number" className="input" value={guideOrder} onChange={(e) => setGuideOrder(parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={guideActive} onChange={(e) => setGuideActive(e.target.checked)} className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Active</span>
              </label>
            </div>
          </div>
          <button
            className="btn btn-sage btn-lg w-full"
            disabled={!guideTitle.trim() || !guideContent.trim() || guideSaving}
            onClick={handleGuideSave}
          >
            {guideSaving ? 'Saving...' : guideEditId ? 'Update Section' : 'Add Section'}
          </button>
          {guideEditId && (
            <button className="btn btn-ghost w-full" onClick={resetGuideForm}>Cancel Edit</button>
          )}
        </div>

        {/* Existing DB Sections */}
        {dbSections.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Custom Sections ({dbSections.length})
            </h2>
            {(['getting_started', 'features', 'faq'] as GuideSectionCategory[]).map(cat => {
              const catSections = dbSections.filter(s => s.category === cat);
              if (catSections.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="section-label">{guideCategoryLabels[cat]}</h3>
                  <div className="space-y-3">
                    {catSections.sort((a, b) => a.display_order - b.display_order).map(s => (
                      <div key={s.id} className="card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{s.title}</h4>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.description}</p>
                          </div>
                          {!s.is_active && <span className="badge badge-sage text-xs">Inactive</span>}
                        </div>
                        <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>{s.content}</p>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm flex-1" onClick={() => handleGuideEdit(s)}>Edit</button>
                          <button
                            className="btn btn-sm flex-1"
                            style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1.5px solid rgba(244,63,94,0.2)' }}
                            onClick={() => setConfirmDelete({ type: 'guide', id: s.id })}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info about defaults */}
        <div className="card flex items-start gap-3" style={{ background: 'var(--color-sage-soft)', borderColor: 'rgba(130,168,130,0.2)' }}>
          <HelpCircle size={18} style={{ color: 'var(--color-sage)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Default content is shown for any category that has no custom sections. Once you add a custom section for a category, the defaults for that category are replaced.
          </p>
        </div>

        {/* Delete Modal */}
        <Modal isOpen={confirmDelete?.type === 'guide'} onClose={() => setConfirmDelete(null)} title="Delete Guide Section?" size="sm">
          <p className="text-sm mb-5" style={{ color: 'var(--color-text)' }}>
            This will permanently delete this guide section. Default content may reappear if no other custom sections exist for this category.
          </p>
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn flex-1" style={{ background: '#fb7185', color: '#fff' }}
              onClick={async () => {
                if (confirmDelete) {
                  await deleteGuideSection(confirmDelete.id);
                  setConfirmDelete(null);
                }
              }}>Yes, Delete</button>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── Send Email ───────────────────────────────────────────
  if (section === 'email') {
    const audiences: { key: EmailAudience; label: string; count: number }[] = [
      { key: 'all', label: 'All Members', count: profiles.filter((p) => p.email).length },
      { key: 'elders', label: 'Elders', count: profiles.filter((p) => p.email && (p.role === 'admin' || p.role === 'elder')).length },
      { key: 'members', label: 'Members Only', count: profiles.filter((p) => p.email && p.role === 'member').length },
      { key: 'individual', label: 'Individual', count: 1 },
    ];

    const recipientEmails = (() => {
      if (emailAudience === 'individual') {
        const p = profiles.find((pr) => pr.id === emailIndividualId);
        return p?.email ? [p.email] : [];
      }
      return profiles
        .filter((p) => {
          if (!p.email) return false;
          if (emailAudience === 'elders') return p.role === 'admin' || p.role === 'elder';
          if (emailAudience === 'members') return p.role === 'member';
          return true;
        })
        .map((p) => p.email!);
    })();

    const handleSendEmail = async () => {
      if (!emailSubject.trim() || !emailBody.trim() || recipientEmails.length === 0) {
        addToast('error', 'Please fill in subject, body, and select recipients.');
        return;
      }
      setEmailSending(true);
      try {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: recipientEmails,
            subject: emailSubject.trim(),
            html: emailBody.trim().replace(/\n/g, '<br>'),
            audience: emailAudience,
            sent_by: user!.id,
          },
        });
        if (error) throw error;
        if (data?.success) {
          addToast('success', `Email sent to ${data.recipient_count} recipient(s)!`);
          setEmailSubject('');
          setEmailBody('');
          setEmailLogLoaded(false); // re-fetch log
        } else {
          addToast('error', data?.error || 'Failed to send email');
        }
      } catch (err: any) {
        addToast('error', err.message || 'Failed to send email');
      } finally {
        setEmailSending(false);
      }
    };

    return (
      <div className="space-y-5">
        <BackBtn />
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Send Email</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Compose and send emails to members via Resend.
          </p>
        </div>

        {/* Audience selector */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Audience</h3>
          <div className="grid grid-cols-2 gap-2">
            {audiences.map(({ key, label, count }) => (
              <button
                key={key}
                className={cn('btn btn-sm text-left flex justify-between', emailAudience === key ? 'btn-primary' : 'btn-secondary')}
                onClick={() => setEmailAudience(key)}
              >
                <span>{label}</span>
                <span className="opacity-70">{count}</span>
              </button>
            ))}
          </div>

          {/* Individual picker */}
          {emailAudience === 'individual' && (
            <div>
              <label className="label">Select Recipient</label>
              <select
                className="input"
                value={emailIndividualId}
                onChange={(e) => setEmailIndividualId(e.target.value)}
              >
                <option value="">Choose a member...</option>
                {profiles
                  .filter((p) => p.email)
                  .sort((a, b) => a.first_name.localeCompare(b.first_name))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} — {p.email}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Recipient count */}
          <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            <Mail size={12} className="inline mr-1" />
            {recipientEmails.length} recipient{recipientEmails.length !== 1 ? 's' : ''} will receive this email
          </div>
        </div>

        {/* Compose */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Compose</h3>
          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="e.g. Weekly Update from Titus 2:4"
            />
          </div>
          <div>
            <label className="label">Body</label>
            <textarea
              className="input"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={8}
              placeholder="Write your email content here..."
            />
            <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
              Plain text — line breaks will be preserved in the email.
            </p>
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={handleSendEmail}
            disabled={emailSending || !emailSubject.trim() || !emailBody.trim() || recipientEmails.length === 0}
          >
            <Send size={16} />
            {emailSending ? 'Sending…' : `Send to ${recipientEmails.length} Recipient${recipientEmails.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Email History */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Email History</h3>
          {emailLog.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {emailLogLoaded ? 'No emails sent yet.' : 'Loading...'}
            </p>
          ) : (
            <div className="space-y-2">
              {emailLog.map((log) => {
                const sender = profiles.find((p) => p.id === log.sent_by);
                return (
                  <div
                    key={log.id}
                    className="rounded-xl px-3 py-2.5"
                    style={{ background: 'var(--color-bg-overlay)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--color-text)' }}>
                        {log.subject}
                      </span>
                      <span className={cn(
                        'badge text-[10px]',
                        log.status === 'sent' ? 'badge-sage' : log.status === 'partial' ? 'badge-gold' : 'badge-pink'
                      )}>
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                      <span>{log.audience}</span>
                      <span>·</span>
                      <span>{log.recipient_count} recipient{log.recipient_count !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{timeAgo(log.created_at)}</span>
                      {sender && (
                        <>
                          <span>·</span>
                          <span>by {sender.first_name}</span>
                        </>
                      )}
                    </div>
                    {log.error_message && (
                      <p className="text-[10px] mt-1 text-rose-400">{log.error_message}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Manage Pods ─────────────────────────────────────────
  if (section === 'pods') {
    return <PodsAdmin
      profiles={profiles}
      pods={pods}
      podMembers={podMembers}
      addPod={addPod}
      deletePod={deletePod}
      addPodMember={addPodMember}
      removePodMember={removePodMember}
      addToast={addToast}
      onBack={() => setSection('home')}
    />;
  }

  return null;
}

// ─── Pods Admin Sub-component ──────────────────────────────
function PodsAdmin({
  profiles, pods, podMembers, addPod, deletePod, addPodMember, removePodMember, addToast, onBack,
}: {
  profiles: any[];
  pods: Pod[];
  podMembers: PodMember[];
  addPod: (name: string, description: string | null, maxMembers: number) => Promise<void>;
  deletePod: (podId: string) => Promise<void>;
  addPodMember: (podId: string, userId: string, role?: 'leader' | 'member') => Promise<void>;
  removePodMember: (podId: string, userId: string) => Promise<void>;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onBack: () => void;
}) {
  const [podName, setPodName] = useState('');
  const [podDesc, setPodDesc] = useState('');
  const [podMaxMembers, setPodMaxMembers] = useState(5);
  const [creating, setCreating] = useState(false);
  const [expandedPod, setExpandedPod] = useState<string | null>(null);
  const [addMemberPodId, setAddMemberPodId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Users already in any active pod
  const assignedUserIds = new Set(
    podMembers
      .filter((m) => pods.some((p) => p.id === m.pod_id && p.is_active))
      .map((m) => m.user_id)
  );

  const unassignedUsers = profiles.filter((p) => !assignedUserIds.has(p.id));

  const handleCreatePod = async () => {
    if (!podName.trim()) return;
    setCreating(true);
    try {
      await addPod(podName.trim(), podDesc.trim() || null, podMaxMembers);
      setPodName('');
      setPodDesc('');
      setPodMaxMembers(5);
    } catch {
      addToast('error', 'Failed to create pod');
    } finally {
      setCreating(false);
    }
  };

  const handleAutoAssign = async () => {
    const activePods = pods.filter((p) => p.is_active);
    if (activePods.length === 0) {
      addToast('error', 'Create pods first before auto-assigning');
      return;
    }
    if (unassignedUsers.length === 0) {
      addToast('info', 'All users are already assigned to pods');
      return;
    }

    const shuffled = [...unassignedUsers].sort(() => Math.random() - 0.5);
    let assigned = 0;

    for (const user of shuffled) {
      // Find a pod with space
      const podWithSpace = activePods.find((p) => {
        const memberCount = podMembers.filter((m) => m.pod_id === p.id).length + assigned;
        // Rough check — re-count per pod
        const currentCount = podMembers.filter((m) => m.pod_id === p.id).length;
        return currentCount < p.max_members;
      });

      if (podWithSpace) {
        try {
          await addPodMember(podWithSpace.id, user.id);
          assigned++;
        } catch {
          // Skip duplicates
        }
      }
    }

    if (assigned > 0) {
      addToast('success', `${assigned} members assigned to pods!`);
    } else {
      addToast('info', 'All pods are full. Create more pods or increase the max size.');
    }
  };

  const handleAddMember = async () => {
    if (!addMemberPodId || !selectedUserId) return;
    try {
      await addPodMember(addMemberPodId, selectedUserId);
      setSelectedUserId('');
      setAddMemberPodId(null);
    } catch {
      addToast('error', 'Failed to add member (may already be in this pod)');
    }
  };

  return (
    <div className="space-y-5">
      <button className="btn btn-ghost mb-4" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Admin
      </button>
      <div>
        <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Manage Pods</h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Create accountability groups and assign members. {unassignedUsers.length} unassigned.
        </p>
      </div>

      {/* Create Pod */}
      <div className="card space-y-4">
        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Create New Pod</h3>
        <div>
          <label className="label">Pod Name</label>
          <input className="input" placeholder="e.g. Faith Warriors" value={podName} onChange={(e) => setPodName(e.target.value)} />
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <input className="input" placeholder="Brief description..." value={podDesc} onChange={(e) => setPodDesc(e.target.value)} />
        </div>
        <div>
          <label className="label">Max Members</label>
          <input type="number" className="input" min={2} max={20} value={podMaxMembers} onChange={(e) => setPodMaxMembers(parseInt(e.target.value) || 5)} />
        </div>
        <button className="btn btn-primary btn-lg w-full" disabled={!podName.trim() || creating} onClick={handleCreatePod}>
          {creating ? 'Creating...' : 'Create Pod'}
        </button>
      </div>

      {/* Auto-assign */}
      {unassignedUsers.length > 0 && pods.filter((p) => p.is_active).length > 0 && (
        <button className="btn btn-secondary w-full" onClick={handleAutoAssign}>
          Auto-Assign {unassignedUsers.length} Unassigned Members
        </button>
      )}

      {/* Pod List */}
      <div className="space-y-3">
        <h3 className="section-label">
          Pods ({pods.filter((p) => p.is_active).length})
        </h3>
        {pods.filter((p) => p.is_active).length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No pods yet. Create one above.</p>
          </div>
        ) : (
          pods.filter((p) => p.is_active).map((pod) => {
            const members = podMembers.filter((m) => m.pod_id === pod.id);
            const isExpanded = expandedPod === pod.id;

            return (
              <div key={pod.id} className="card space-y-3">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedPod(isExpanded ? null : pod.id)}
                >
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{pod.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {members.length}/{pod.max_members} members
                      {pod.description && ` · ${pod.description}`}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--color-text-faint)', transform: isExpanded ? 'rotate(90deg)' : undefined, transition: 'transform 0.2s' }} />
                </div>

                {isExpanded && (
                  <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    {/* Members */}
                    {members.length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No members yet.</p>
                    ) : (
                      members.map((m) => {
                        const p = profiles.find((pr) => pr.id === m.user_id);
                        return (
                          <div key={m.id} className="flex items-center gap-3">
                            <Avatar src={p?.photo_url ?? null} name={p?.first_name ?? 'U'} size="sm" />
                            <div className="flex-1">
                              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {p?.first_name} {p?.last_name}
                              </span>
                              {m.role === 'leader' && (
                                <span className="badge badge-gold badge-sm ml-2">Leader</span>
                              )}
                            </div>
                            <button
                              className="btn btn-ghost btn-sm text-rose-400"
                              onClick={() => removePodMember(pod.id, m.user_id)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}

                    {/* Add member */}
                    {members.length < pod.max_members && (
                      <div className="flex gap-2">
                        <select
                          className="input flex-1 text-sm"
                          value={addMemberPodId === pod.id ? selectedUserId : ''}
                          onChange={(e) => { setAddMemberPodId(pod.id); setSelectedUserId(e.target.value); }}
                        >
                          <option value="">Add member...</option>
                          {profiles
                            .filter((p) => !members.some((m) => m.user_id === p.id))
                            .map((p) => (
                              <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                            ))}
                        </select>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!selectedUserId || addMemberPodId !== pod.id}
                          onClick={handleAddMember}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}

                    {/* Delete pod */}
                    <button
                      className="btn btn-ghost btn-sm text-rose-400 w-full"
                      onClick={() => { if (confirm('Delete this pod and all its data?')) deletePod(pod.id); }}
                    >
                      <Trash2 size={14} /> Delete Pod
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
