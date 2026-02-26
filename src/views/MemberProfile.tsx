import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { timeAgo, cn } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import Modal from '@/components/Modal';
import {
  ArrowLeft, MapPin, Heart, BookOpen, MessageCircle, Award,
  Calendar, Sparkles, Users, Flame, Shield, ClipboardList, CheckCircle2, Mail, Send,
} from 'lucide-react';

// Admins are also elders — publicly they display as Elder
const publicRole = (role: string) => role === 'admin' ? 'elder' : role;

const roleBadgeClass = (role: string) => {
  if (publicRole(role) === 'elder') return 'badge-gold';
  return 'badge-sage';
};

const roleLabel = (role: string) => {
  if (publicRole(role) === 'elder') return 'Elder';
  return 'Member';
};

const roleIcon = (role: string) => {
  if (publicRole(role) === 'elder') return <Sparkles size={12} />;
  return <Heart size={12} />;
};

const roleGradient = (role: string) => {
  if (publicRole(role) === 'elder') return 'linear-gradient(135deg, #FFD98F 0%, #E6AD3E 100%)';
  return 'var(--gradient-sage)';
};

export default function MemberProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const {
    user, profile, profiles, posts, prayerRequests, comments,
    badges, userBadges, followUpNotes, events, addToast,
  } = useApp();

  const isLeader = profile?.role === 'admin' || profile?.role === 'elder';
  const isAdmin = profile?.role === 'admin';

  const memberProfile = profiles.find((p) => p.id === userId);

  // Fetch attendance records for this member (leaders only)
  const [memberAttendance, setMemberAttendance] = useState<Array<{ event_id: string; date: string; recorded_by?: string }>>([]);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    if (isLeader && userId && !attendanceLoaded) {
      supabase
        .from('attendance')
        .select('event_id, date, recorded_by')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .then(({ data }) => {
          if (data) setMemberAttendance(data);
          setAttendanceLoaded(true);
        });
    }
  }, [isLeader, userId, attendanceLoaded]);

  // Redirect to own profile page if viewing self (must be in useEffect, not during render)
  const isSelf = userId === user?.id;
  useEffect(() => {
    if (isSelf) navigate('/profile', { replace: true });
  }, [isSelf, navigate]);

  if (isSelf) return null;

  if (!memberProfile) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Member not found</p>
        </div>
      </div>
    );
  }

  const userPosts = posts.filter((p) => p.author_id === memberProfile.id).length;
  const userPrayers = prayerRequests.filter((p) => p.author_id === memberProfile.id && !p.is_anonymous).length;
  const userComments = comments.filter((c) => c.author_id === memberProfile.id).length;

  const earnedBadges = userBadges
    .filter((ub) => ub.user_id === memberProfile.id)
    .map((ub) => badges.find((b) => b.id === ub.badge_id))
    .filter(Boolean);

  const recentPosts = posts
    .filter((p) => p.author_id === memberProfile.id)
    .slice(0, 3);

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim() || !memberProfile.email) return;
    setEmailSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: [memberProfile.email],
          subject: emailSubject.trim(),
          html: emailBody.trim().replace(/\n/g, '<br>'),
          audience: 'individual',
          sent_by: user!.id,
        },
      });
      if (error) throw error;
      if (data?.success) {
        addToast('success', `Email sent to ${memberProfile.first_name}!`);
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailBody('');
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
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header card */}
      <div className="card flex flex-col items-center text-center pt-8 pb-6">
        {/* Avatar with role-colored ring */}
        <div
          className="rounded-full p-[3px]"
          style={{ background: roleGradient(memberProfile.role) }}
        >
          <div className="rounded-full p-[2px]" style={{ background: 'var(--color-bg-raised)' }}>
            <Avatar src={memberProfile.photo_url} name={memberProfile.first_name} size="xl" />
          </div>
        </div>

        <h1 className="font-display text-xl font-bold mt-4" style={{ color: 'var(--color-text)' }}>
          {memberProfile.first_name} {memberProfile.last_name}
        </h1>

        {/* Role badge */}
        <span className={cn('badge mt-2 flex items-center gap-1', roleBadgeClass(memberProfile.role))}>
          {roleIcon(memberProfile.role)}
          {roleLabel(memberProfile.role)}
        </span>

        {(memberProfile.city || memberProfile.area) && (
          <div className="flex items-center gap-1 text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            <MapPin size={13} /> {memberProfile.city && memberProfile.country
              ? `${memberProfile.city}, ${memberProfile.country}`
              : memberProfile.area}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => navigate('/messages', { state: { toUserId: memberProfile.id } })}
            className="btn btn-primary"
          >
            <MessageCircle size={16} />
            Send Message
          </button>
          {isLeader && memberProfile.email && (
            <button
              onClick={() => addToast('info', 'Email is coming soon!')}
              className="btn btn-secondary opacity-60"
            >
              <Mail size={16} />
              Email
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="card text-center py-3 px-1">
          <div className="text-lg font-bold" style={{ color: 'var(--color-brand)' }}>{userPosts}</div>
          <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Posts</div>
        </div>
        <div className="card text-center py-3 px-1">
          <div className="text-lg font-bold" style={{ color: 'var(--color-sage)' }}>{userComments}</div>
          <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Comments</div>
        </div>
        <div className="card text-center py-3 px-1">
          <div className="text-lg font-bold" style={{ color: 'var(--color-gold)' }}>{userPrayers}</div>
          <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Prayers</div>
        </div>
        <div className="card text-center py-3 px-1">
          <div className="text-lg font-bold" style={{ color: 'var(--color-brand)' }}>
            {memberProfile.checkin_streak ?? 0}
          </div>
          <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Streak</div>
        </div>
      </div>

      {/* About */}
      {memberProfile.about && (
        <div className="card">
          <h3 className="section-label">About</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {memberProfile.about}
          </p>
        </div>
      )}

      {/* Prayer Focus */}
      {memberProfile.prayer_focus && (
        <div className="card">
          <h3 className="flex items-center gap-1.5 section-label">
            <Heart size={11} /> Prayer Focus
          </h3>
          <p className="text-sm leading-relaxed italic" style={{ color: 'var(--color-text-muted)' }}>
            "{memberProfile.prayer_focus}"
          </p>
        </div>
      )}

      {/* Birthday */}
      {memberProfile.birthday_visible && memberProfile.birthday && (
        <div className="card">
          <h3 className="flex items-center gap-1.5 section-label">
            <Calendar size={11} /> Birthday
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            {new Date(memberProfile.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="card">
          <h3 className="flex items-center gap-1.5 section-label">
            <Award size={11} /> Badges ({earnedBadges.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge) => badge && (
              <span key={badge.id} className="badge badge-pink text-xs">
                {badge.icon} {badge.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <div className="card">
          <h3 className="flex items-center gap-1.5 section-label">
            <Flame size={11} /> Recent Posts
          </h3>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="rounded-xl p-3" style={{ background: 'var(--color-bg-overlay)' }}>
                <p className="text-sm line-clamp-3 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                  {post.content}
                </p>
                {post.image_url && (
                  <img src={post.image_url} alt="" className="w-full rounded-lg mt-2 max-h-32 object-cover" />
                )}
              </div>
            ))}
            {posts.filter((p) => p.author_id === memberProfile.id).length > 3 && (
              <button
                onClick={() => navigate('/community')}
                className="text-xs font-semibold"
                style={{ color: 'var(--color-brand)' }}
              >
                View all in Community →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Leader-Only: Attendance & Follow-Up Records ──── */}
      {isLeader && (
        <>
          {/* Attendance History */}
          <div className="card">
            <h3 className="flex items-center gap-1.5 section-label">
              <CheckCircle2 size={11} /> Attendance Records
            </h3>
            {!attendanceLoaded ? (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
            ) : (() => {
              const visible = isAdmin
                ? memberAttendance
                : memberAttendance.filter((a) => a.recorded_by === user?.id);
              if (visible.length === 0) {
                return (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {isAdmin ? 'No attendance recorded' : 'No attendance recorded by you'}
                  </p>
                );
              }
              return (
                <div className="space-y-2">
                  {visible.slice(0, 10).map((a, i) => {
                    const ev = events.find((e) => e.id === a.event_id);
                    const recorder = a.recorded_by ? profiles.find((p) => p.id === a.recorded_by) : null;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ background: 'var(--color-bg-overlay)' }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                            {ev?.title ?? 'Unknown Event'}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                            {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isAdmin && recorder ? ` · by ${recorder.first_name}` : ''}
                          </p>
                        </div>
                        <CheckCircle2 size={14} style={{ color: 'var(--color-sage)' }} />
                      </div>
                    );
                  })}
                  {visible.length > 10 && (
                    <p className="text-[10px] text-center" style={{ color: 'var(--color-text-faint)' }}>
                      + {visible.length - 10} more
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Follow-Up Notes */}
          {(() => {
            const memberNotes = followUpNotes.filter((n) => n.user_id === userId);
            const visible = isAdmin
              ? memberNotes
              : memberNotes.filter((n) => n.leader_id === user?.id);
            return (
              <div className="card">
                <h3 className="flex items-center gap-1.5 section-label">
                  <ClipboardList size={11} /> Follow-Up Notes
                </h3>
                {visible.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {isAdmin ? 'No follow-up notes' : 'No follow-up notes by you'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {visible.slice(0, 10).map((note) => {
                      const leader = profiles.find((p) => p.id === note.leader_id);
                      return (
                        <div
                          key={note.id}
                          className="rounded-lg px-3 py-2"
                          style={{ background: 'var(--color-bg-overlay)' }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="badge badge-sage text-[10px]">{note.status}</span>
                            <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                              {timeAgo(note.created_at)}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text)' }}>{note.note}</p>
                          {isAdmin && leader && (
                            <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
                              by {leader.first_name} {leader.last_name}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {visible.length > 10 && (
                      <p className="text-[10px] text-center" style={{ color: 'var(--color-text-faint)' }}>
                        + {visible.length - 10} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* Email Modal */}
      <Modal isOpen={showEmailModal && !!memberProfile.email} title={`Email ${memberProfile.first_name}`} onClose={() => setShowEmailModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="label">To</label>
            <input className="input" value={memberProfile.email ?? ''} disabled />
          </div>
          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="e.g. Following up with you"
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              className="input"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={6}
              placeholder="Write your message..."
            />
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={handleSendEmail}
            disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
          >
            <Send size={16} />
            {emailSending ? 'Sending…' : 'Send Email'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
