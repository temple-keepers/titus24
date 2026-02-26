import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { NavLink } from 'react-router-dom';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/lib/utils';
import {
  Users, Send, Settings, Crown, LogOut, UserPlus,
  Lock, Globe, ArrowLeft, MessageCircle, ChevronRight,
} from 'lucide-react';
import type { Pod, PodMember, PodCheckin } from '@/types';

type Tab = 'my-groups' | 'browse';

export default function Pods() {
  const {
    user, profile, profiles, pods, podMembers, podCheckins,
    addPodCheckin, joinPod, leavePod, addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('my-groups');
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  // All pods the user belongs to
  const myPods = useMemo(() => {
    if (!user) return [];
    const myMembershipPodIds = podMembers
      .filter((m) => m.user_id === user.id)
      .map((m) => m.pod_id);
    return pods.filter((p) => myMembershipPodIds.includes(p.id) && p.is_active);
  }, [user, podMembers, pods]);

  // Public pods the user is NOT in (for browse tab)
  const browsePods = useMemo(() => {
    if (!user) return [];
    const myPodIds = new Set(myPods.map((p) => p.id));
    return pods.filter((p) => p.is_active && p.visibility === 'public' && !myPodIds.has(p.id));
  }, [user, pods, myPods]);

  // Auto-switch to browse if user has no groups
  const effectiveTab = myPods.length === 0 ? 'browse' : activeTab;

  // Selected pod detail
  const selectedPod = selectedPodId ? pods.find((p) => p.id === selectedPodId) : null;

  // ─── Group Detail View ──────────────────────────────────
  if (selectedPod) {
    return (
      <GroupDetail
        pod={selectedPod}
        podMembers={podMembers}
        podCheckins={podCheckins}
        profiles={profiles}
        userId={user?.id}
        postText={postText}
        setPostText={setPostText}
        posting={posting}
        onPost={async () => {
          if (!postText.trim()) return;
          setPosting(true);
          try {
            await addPodCheckin(selectedPod.id, postText.trim());
            setPostText('');
          } catch {
            addToast('error', 'Failed to post');
          } finally {
            setPosting(false);
          }
        }}
        onLeave={() => {
          if (window.confirm('Leave this group? You can rejoin later if it\'s a public group.')) {
            leavePod(selectedPod.id);
            setSelectedPodId(null);
          }
        }}
        onBack={() => { setSelectedPodId(null); setPostText(''); }}
        membership={podMembers.find((m) => m.pod_id === selectedPod.id && m.user_id === user?.id)}
      />
    );
  }

  // ─── Main Groups View ───────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Groups
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Connect with your sisters in small groups
          </p>
        </div>
        {isAdmin && (
          <NavLink to="/admin" className="btn btn-secondary btn-sm no-underline">
            <Settings size={14} /> Manage
          </NavLink>
        )}
      </div>

      {/* Tabs */}
      {myPods.length > 0 && (
        <div className="flex rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-overlay)', border: '1px solid var(--color-border)' }}>
          {(['my-groups', 'browse'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-all"
              style={{
                background: effectiveTab === tab ? 'var(--color-brand-soft)' : 'transparent',
                color: effectiveTab === tab ? 'var(--color-brand)' : 'var(--color-text-faint)',
                borderBottom: effectiveTab === tab ? '2px solid var(--color-brand)' : '2px solid transparent',
              }}
            >
              {tab === 'my-groups' ? `My Groups (${myPods.length})` : `Browse (${browsePods.length})`}
            </button>
          ))}
        </div>
      )}

      {/* My Groups Tab */}
      {effectiveTab === 'my-groups' && (
        <div className="space-y-3 stagger">
          {myPods.map((pod) => {
            const members = podMembers.filter((m) => m.pod_id === pod.id);
            const lastPost = podCheckins
              .filter((c) => c.pod_id === pod.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            const lastAuthor = lastPost ? profiles.find((p) => p.id === lastPost.user_id) : null;
            const memberProfiles = members
              .map((m) => profiles.find((p) => p.id === m.user_id))
              .filter(Boolean)
              .slice(0, 4);

            return (
              <button
                key={pod.id}
                onClick={() => setSelectedPodId(pod.id)}
                className="card w-full text-left transition-all active:scale-[0.98] hover:border-[var(--color-brand)]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-sage-soft)', color: 'var(--color-sage)' }}
                  >
                    <Users size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{pod.name}</span>
                      {pod.visibility === 'private' && <Lock size={10} style={{ color: 'var(--color-text-faint)' }} />}
                      <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-faint)' }}>
                        {members.length}/{pod.max_members}
                      </span>
                    </div>
                    {pod.description && (
                      <p className="text-[11px] mb-1.5 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>{pod.description}</p>
                    )}
                    {/* Member avatars */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {memberProfiles.map((p) => (
                          <div key={p!.id} className="w-5 h-5 rounded-full border overflow-hidden" style={{ borderColor: 'var(--color-bg-raised)' }}>
                            <Avatar src={p!.photo_url} name={p!.first_name} size="xs" />
                          </div>
                        ))}
                      </div>
                      {members.length > 4 && (
                        <span className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>+{members.length - 4}</span>
                      )}
                    </div>
                    {/* Last post preview */}
                    {lastPost && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <MessageCircle size={10} style={{ color: 'var(--color-text-faint)' }} />
                        <span className="text-[10px] line-clamp-1" style={{ color: 'var(--color-text-faint)' }}>
                          <strong>{lastPost.user_id === user?.id ? 'You' : lastAuthor?.first_name}</strong>: {lastPost.content}
                        </span>
                        <span className="text-[9px] ml-auto flex-shrink-0" style={{ color: 'var(--color-text-faint)' }}>
                          {timeAgo(lastPost.created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 mt-2" style={{ color: 'var(--color-text-faint)' }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Browse Tab */}
      {effectiveTab === 'browse' && (
        <div className="space-y-3 stagger">
          {browsePods.length === 0 ? (
            <div className="card text-center py-10">
              <Users size={40} style={{ color: 'var(--color-text-faint)', margin: '0 auto 12px' }} />
              <h2 className="font-bold text-sm mb-1" style={{ color: 'var(--color-text)' }}>No Groups Available</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                No open groups right now. Check back soon!
              </p>
            </div>
          ) : (
            browsePods.map((pod) => {
              const members = podMembers.filter((m) => m.pod_id === pod.id);
              const memberCount = members.length;
              const isFull = memberCount >= pod.max_members;
              const memberProfiles = members
                .map((m) => profiles.find((p) => p.id === m.user_id))
                .filter(Boolean)
                .slice(0, 5);

              return (
                <div
                  key={pod.id}
                  className="card space-y-3"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-sage-soft, rgba(130,168,130,0.08)) 100%)',
                    borderColor: 'rgba(130,168,130,0.2)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-text)' }}>{pod.name}</h3>
                        <Globe size={12} style={{ color: 'var(--color-sage)' }} />
                      </div>
                      {pod.description && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{pod.description}</p>
                      )}
                    </div>
                    <div className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0" style={{
                      background: isFull ? 'rgba(239,68,68,0.1)' : 'var(--color-sage-soft)',
                      color: isFull ? 'rgb(239,68,68)' : 'var(--color-sage)',
                    }}>
                      {memberCount}/{pod.max_members}
                    </div>
                  </div>

                  {memberProfiles.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {memberProfiles.map((p) => (
                          <div key={p!.id} className="w-7 h-7 rounded-full border-2 overflow-hidden" style={{ borderColor: 'var(--color-bg-raised)' }}>
                            <Avatar src={p!.photo_url} name={p!.first_name} size="xs" />
                          </div>
                        ))}
                      </div>
                      {members.length > 5 && (
                        <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>+{members.length - 5} more</span>
                      )}
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-sm w-full"
                    disabled={isFull || joining === pod.id}
                    onClick={async () => {
                      setJoining(pod.id);
                      try {
                        await joinPod(pod.id);
                      } catch {
                        addToast('error', 'Failed to join group');
                      } finally {
                        setJoining(null);
                      }
                    }}
                  >
                    {joining === pod.id ? 'Joining...' : isFull ? 'Group is Full' : (
                      <><UserPlus size={14} /> Join Group</>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ background: 'var(--color-sage-soft)', borderColor: 'rgba(130,168,130,0.2)' }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--color-sage)' }}>
          Group Tips
        </h3>
        <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <p>Check in with your group weekly to stay accountable</p>
          <p>Share both your highs and lows — vulnerability builds trust</p>
          <p>Pray for each other throughout the week</p>
          <p>Celebrate each other's wins, big and small</p>
        </div>
      </div>
    </div>
  );
}

// ─── Group Detail View ──────────────────────────────────────
function GroupDetail({
  pod, podMembers, podCheckins, profiles, userId,
  postText, setPostText, posting, onPost, onLeave, onBack, membership,
}: {
  pod: Pod;
  podMembers: PodMember[];
  podCheckins: PodCheckin[];
  profiles: Array<{ id: string; first_name: string; last_name: string; photo_url: string | null; role: string }>;
  userId: string | undefined;
  postText: string;
  setPostText: (v: string) => void;
  posting: boolean;
  onPost: () => Promise<void>;
  onLeave: () => void;
  onBack: () => void;
  membership: PodMember | undefined;
}) {
  const members = useMemo(() => {
    return podMembers
      .filter((m) => m.pod_id === pod.id)
      .map((m) => ({
        ...m,
        profile: profiles.find((p) => p.id === m.user_id),
      }))
      .sort((a, b) => {
        if (a.role === 'leader' && b.role !== 'leader') return -1;
        if (b.role === 'leader' && a.role !== 'leader') return 1;
        return (a.profile?.first_name ?? '').localeCompare(b.profile?.first_name ?? '');
      });
  }, [pod.id, podMembers, profiles]);

  const posts = useMemo(() => {
    return podCheckins
      .filter((c) => c.pod_id === pod.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [pod.id, podCheckins]);

  const [showAllMembers, setShowAllMembers] = useState(false);
  const visibleMembers = showAllMembers ? members : members.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Groups
      </button>

      {/* Group Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-sage-soft, rgba(130,168,130,0.08)) 100%)',
          borderColor: 'rgba(130,168,130,0.2)',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-text)' }}>{pod.name}</h2>
              {pod.visibility === 'private' ? (
                <span className="badge badge-pink text-[9px]"><Lock size={8} /> Private</span>
              ) : (
                <span className="badge badge-sage text-[9px]"><Globe size={8} /> Public</span>
              )}
            </div>
            {pod.description && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{pod.description}</p>
            )}
          </div>
          <div className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--color-sage-soft)', color: 'var(--color-sage)' }}>
            {members.length}/{pod.max_members}
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-wrap gap-3">
          {visibleMembers.map((m) => (
            <div key={m.id} className="flex flex-col items-center gap-1">
              <div className="relative">
                <Avatar src={m.profile?.photo_url ?? null} name={m.profile?.first_name ?? 'U'} size="sm" />
                {m.role === 'leader' && (
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-gold)' }}
                  >
                    <Crown size={8} className="text-white" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                {m.user_id === userId ? 'You' : m.profile?.first_name}
              </span>
            </div>
          ))}
        </div>
        {members.length > 6 && !showAllMembers && (
          <button
            className="btn btn-ghost btn-sm w-full mt-2"
            onClick={() => setShowAllMembers(true)}
          >
            Show all {members.length} members
          </button>
        )}
      </div>

      {/* Compose Post */}
      <div className="card space-y-3">
        <div className="flex gap-3">
          <Avatar src={profiles.find((p) => p.id === userId)?.photo_url ?? null} name={profiles.find((p) => p.id === userId)?.first_name ?? 'U'} size="sm" />
          <textarea
            className="input flex-1"
            placeholder="Share with the group..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex justify-end">
          <button
            className="btn btn-primary btn-sm"
            onClick={onPost}
            disabled={posting || !postText.trim()}
          >
            <Send size={14} />
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Discussion Feed */}
      <div className="space-y-3">
        <h3 className="section-label flex items-center gap-2">
          <MessageCircle size={14} /> Discussion ({posts.length})
        </h3>
        {posts.length === 0 ? (
          <div className="card text-center py-8">
            <MessageCircle size={32} style={{ color: 'var(--color-text-faint)', margin: '0 auto 8px' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No posts yet. Start the conversation!
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const author = profiles.find((p) => p.id === post.user_id);
            return (
              <div key={post.id} className="card">
                <div className="flex items-start gap-3">
                  <Avatar src={author?.photo_url ?? null} name={author?.first_name ?? 'U'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        {post.user_id === userId ? 'You' : author?.first_name}
                      </span>
                      {author?.role === 'admin' || author?.role === 'elder' ? (
                        <span className="badge badge-gold text-[8px]">{author.role === 'admin' ? 'Admin' : 'Elder'}</span>
                      ) : null}
                      <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-faint)' }}>
                        {timeAgo(post.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                      {post.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Leave Group */}
      {membership && membership.role !== 'leader' && (
        <button
          className="btn btn-ghost btn-sm w-full"
          style={{ color: 'var(--color-error)' }}
          onClick={onLeave}
        >
          <LogOut size={14} /> Leave Group
        </button>
      )}
    </div>
  );
}
