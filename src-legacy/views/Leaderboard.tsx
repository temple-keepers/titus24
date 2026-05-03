import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import { getRankTitle } from '@/lib/devotionals';
import { Trophy, Flame } from 'lucide-react';

const rankIcons: Record<string, string> = {
  'Virtuous Woman': '👑',
  'Prayer Warrior': '⚔️',
  'Faithful Sister': '💎',
  'Growing in Grace': '🌿',
  'Budding Rose': '🌹',
  'New Blossom': '🌸',
};

export default function Leaderboard() {
  const { profiles, profile: myProfile } = useApp();

  const leaderboard = useMemo(() => {
    return [...profiles]
      .filter(p => (p.total_points ?? 0) > 0)
      .sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0))
      .map((p, idx) => ({
        ...p,
        rank: idx + 1,
        title: getRankTitle(p.total_points ?? 0),
      }));
  }, [profiles]);

  const myRankIndex = leaderboard.findIndex(p => p.id === myProfile?.id);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;
  const myPoints = myProfile?.total_points ?? 0;
  const myTitle = getRankTitle(myPoints);

  return (
    <div className="space-y-6 stagger">
      <div className="text-center pt-2">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Leaderboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Celebrate faithfulness, not competition!
        </p>
      </div>

      {/* My rank card */}
      <div
        className="card text-center py-6"
        style={{
          background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-gold-soft) 100%)',
          borderColor: 'rgba(230,173,62,0.25)',
        }}
      >
        <Avatar src={myProfile?.photo_url ?? null} name={myProfile?.first_name ?? 'You'} size="lg" className="mx-auto mb-3" />
        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          {myProfile?.first_name}
        </h2>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-lg">{rankIcons[myTitle]}</span>
          <span className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>{myTitle}</span>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="font-display text-2xl font-bold" style={{ color: 'var(--color-brand)' }}>
              {myRank ? `#${myRank}` : '--'}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>Rank</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold" style={{ color: 'var(--color-gold)' }}>
              {myPoints}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>Points</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
              {myProfile?.checkin_streak ?? 0}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>Streak</div>
          </div>
        </div>
      </div>

      {/* How to earn points */}
      <details className="card">
        <summary className="font-bold text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
          How do I earn points?
        </summary>
        <div className="space-y-2 mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="flex justify-between"><span>Daily check-in</span><span className="font-bold" style={{ color: 'var(--color-brand)' }}>+5</span></div>
          <div className="flex justify-between"><span>Read devotional</span><span className="font-bold" style={{ color: 'var(--color-brand)' }}>+5</span></div>
          <div className="flex justify-between"><span>Create a post</span><span className="font-bold" style={{ color: 'var(--color-brand)' }}>+10</span></div>
          <div className="flex justify-between"><span>Leave a comment</span><span className="font-bold" style={{ color: 'var(--color-brand)' }}>+3</span></div>
          <div className="flex justify-between"><span>Submit prayer request</span><span className="font-bold" style={{ color: 'var(--color-brand)' }}>+10</span></div>
          <div className="flex justify-between"><span>Pray for a sister</span><span className="font-bold" style={{ color: 'var(--color-brand)' }}>+5</span></div>
          <div className="flex justify-between"><span>Share testimony</span><span className="font-bold" style={{ color: 'var(--color-brand)' }}>+15</span></div>
          <div className="flex justify-between"><span>Complete study day</span><span className="font-bold" style={{ color: 'var(--color-brand)' }}>+10</span></div>
          <div className="flex justify-between"><span>Attend event</span><span className="font-bold" style={{ color: 'var(--color-brand)' }}>+20</span></div>
          <div className="flex justify-between"><span>7-day streak bonus</span><span className="font-bold" style={{ color: 'var(--color-gold)' }}>+10</span></div>
        </div>
      </details>

      {/* Leaderboard list */}
      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Trophy size={40} style={{ color: 'var(--color-text-faint)', margin: '0 auto 12px' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
              No points earned yet. Be the first!
            </p>
          </div>
        ) : (
          leaderboard.map((p) => {
            const isMe = p.id === myProfile?.id;
            return (
              <div
                key={p.id}
                className="card flex items-center gap-3 py-3"
                style={isMe ? { borderColor: 'rgba(232,102,138,0.3)', background: 'var(--color-brand-soft)' } : undefined}
              >
                <div className="w-8 text-center font-display font-bold text-lg" style={{
                  color: p.rank === 1 ? '#F5C563' : p.rank === 2 ? '#C4C4C4' : p.rank === 3 ? '#CD7F32' : 'var(--color-text-faint)',
                }}>
                  {p.rank <= 3 ? (
                    <span>{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}</span>
                  ) : (
                    <span>#{p.rank}</span>
                  )}
                </div>
                <Avatar src={p.photo_url} name={p.first_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>
                    {p.first_name} {isMe && '(You)'}
                  </div>
                  <div className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    {rankIcons[p.title]} {p.title}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm" style={{ color: 'var(--color-brand)' }}>
                    {p.total_points ?? 0}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>pts</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
