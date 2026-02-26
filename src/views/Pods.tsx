import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { NavLink } from 'react-router-dom';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { timeAgo } from '@/lib/utils';
import { Users, Send, Settings, Crown } from 'lucide-react';

export default function Pods() {
  const {
    user, profile, profiles, pods, podMembers, podCheckins,
    addPodCheckin, addToast,
  } = useApp();

  const [checkinText, setCheckinText] = useState('');
  const [posting, setPosting] = useState(false);

  // Find the user's pod
  const myMembership = podMembers.find((m) => m.user_id === user?.id);
  const myPod = myMembership ? pods.find((p) => p.id === myMembership.pod_id && p.is_active) : null;

  // Pod members for the user's pod
  const myPodMembers = useMemo(() => {
    if (!myPod) return [];
    return podMembers
      .filter((m) => m.pod_id === myPod.id)
      .map((m) => ({
        ...m,
        profile: profiles.find((p) => p.id === m.user_id),
      }))
      .sort((a, b) => {
        if (a.role === 'leader' && b.role !== 'leader') return -1;
        if (b.role === 'leader' && a.role !== 'leader') return 1;
        return (a.profile?.first_name ?? '').localeCompare(b.profile?.first_name ?? '');
      });
  }, [myPod, podMembers, profiles]);

  // Check-ins for the user's pod (last 7 days)
  const myPodCheckins = useMemo(() => {
    if (!myPod) return [];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return podCheckins
      .filter((c) => c.pod_id === myPod.id && c.created_at >= weekAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [myPod, podCheckins]);

  const handleCheckin = async () => {
    if (!checkinText.trim() || !myPod) return;
    setPosting(true);
    try {
      await addPodCheckin(myPod.id, checkinText.trim());
      setCheckinText('');
    } catch {
      addToast('error', 'Failed to post check-in');
    } finally {
      setPosting(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            My Pod
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Accountability group
          </p>
        </div>
        {isAdmin && (
          <NavLink to="/admin" className="btn btn-secondary btn-sm no-underline">
            <Settings size={14} /> Manage
          </NavLink>
        )}
      </div>

      {myPod ? (
        <>
          {/* Pod Info */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-sage-soft, rgba(130,168,130,0.08)) 100%)',
              borderColor: 'rgba(130,168,130,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                  {myPod.name}
                </h2>
                {myPod.description && (
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {myPod.description}
                  </p>
                )}
              </div>
              <div className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--color-sage-soft)', color: 'var(--color-sage)' }}>
                {myPodMembers.length}/{myPod.max_members}
              </div>
            </div>

            {/* Members */}
            <div className="flex flex-wrap gap-3 mt-4">
              {myPodMembers.map((m) => (
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
                    {m.user_id === user?.id ? 'You' : m.profile?.first_name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Check-in Input */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              Weekly Check-In
            </h3>
            <textarea
              className="input"
              placeholder="How are you doing this week? Share your highs, lows, and prayer needs..."
              value={checkinText}
              onChange={(e) => setCheckinText(e.target.value)}
              rows={3}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCheckin}
              disabled={posting || !checkinText.trim()}
            >
              <Send size={14} />
              {posting ? 'Posting...' : 'Share with Pod'}
            </button>
          </div>

          {/* Recent Check-ins */}
          {myPodCheckins.length > 0 ? (
            <div className="space-y-3">
              <h3 className="section-label">Recent Check-Ins</h3>
              {myPodCheckins.map((c) => {
                const author = profiles.find((p) => p.id === c.user_id);
                return (
                  <div key={c.id} className="card">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar src={author?.photo_url ?? null} name={author?.first_name ?? 'U'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                          {c.user_id === user?.id ? 'You' : author?.first_name}
                        </span>
                        <span className="text-xs ml-2" style={{ color: 'var(--color-text-faint)' }}>
                          {timeAgo(c.created_at)} · {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                      {c.content}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                No check-ins this week yet. Be the first to share!
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12">
          <Users size={48} style={{ color: 'var(--color-text-faint)', margin: '0 auto 16px' }} />
          <h2 className="font-bold text-base mb-2" style={{ color: 'var(--color-text)' }}>
            Not in a Pod Yet
          </h2>
          <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Accountability pods are created by your elders. Check back soon!
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ background: 'var(--color-sage-soft)', borderColor: 'rgba(130,168,130,0.2)' }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--color-sage)' }}>
          Pod Tips
        </h3>
        <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <p>Check in with your pod weekly to stay accountable</p>
          <p>Share both your highs and lows — vulnerability builds trust</p>
          <p>Pray for each other throughout the week</p>
          <p>Celebrate each other's wins, big and small</p>
        </div>
      </div>
    </div>
  );
}
