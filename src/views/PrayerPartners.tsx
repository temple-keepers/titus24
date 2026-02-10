import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import { Heart, RefreshCw, Users, MessageCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { PrayerPartnership } from '@/types';

export default function PrayerPartners() {
  const { user, profile, profiles, addToast } = useApp();
  const [partnership, setPartnership] = useState<PrayerPartnership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('prayer_partnerships')
      .select('*')
      .eq('is_active', true)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setPartnership(data);
        setLoading(false);
      });
  }, [user]);

  const partnerId = partnership
    ? (partnership.user_a_id === user?.id ? partnership.user_b_id : partnership.user_a_id)
    : null;
  const partner = partnerId ? profiles.find(p => p.id === partnerId) : null;

  const daysLeft = partnership
    ? Math.max(0, Math.ceil((new Date(partnership.period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Leader: manually trigger a new round of partnerships
  const shufflePartners = async () => {
    if (profile?.role !== 'admin') return;

    try {
      // Check if we have enough profiles
      if (profiles.length < 2) {
        addToast('error', 'Need at least 2 members to create partnerships');
        return;
      }

      // Deactivate old partnerships
      const { error: deactivateError } = await supabase
        .from('prayer_partnerships')
        .update({ is_active: false })
        .eq('is_active', true);

      if (deactivateError) throw deactivateError;

      // Shuffle all active profiles
      const shuffled = [...profiles].sort(() => Math.random() - 0.5);
      const pairs: Array<{ user_a_id: string; user_b_id: string; period_start: string; period_end: string }> = [];
      const start = new Date().toISOString().split('T')[0];
      const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Pair members (skip last one if odd number)
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        pairs.push({
          user_a_id: shuffled[i].id,
          user_b_id: shuffled[i + 1].id,
          period_start: start,
          period_end: end,
        });
      }

      if (pairs.length > 0) {
        const { error: insertError } = await supabase.from('prayer_partnerships').insert(pairs);
        if (insertError) throw insertError;
      }

      const unpaired = shuffled.length % 2 === 1 ? 1 : 0;
      if (unpaired) {
        addToast('success', `${pairs.length} partnerships created! (${unpaired} member unpaired)`);
      } else {
        addToast('success', `${pairs.length} prayer partnerships created!`);
      }

      // Reload
      const { data } = await supabase.from('prayer_partnerships')
        .select('*').eq('is_active', true)
        .or(`user_a_id.eq.${user?.id},user_b_id.eq.${user?.id}`)
        .limit(1).maybeSingle();
      setPartnership(data);
    } catch (err) {
      console.error('Failed to shuffle partners:', err);
      addToast('error', 'Failed to shuffle partners');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Prayer Partner</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Paired to pray for each other this week
          </p>
        </div>
        {profile?.role === 'admin' && (
          <button className="btn btn-secondary btn-sm" onClick={shufflePartners}>
            <RefreshCw size={16} /> Shuffle
          </button>
        )}
      </div>

      {partnership && partner ? (
        <div className="card text-center py-8 space-y-5" style={{
          background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-brand-soft) 100%)',
          borderColor: 'rgba(232,102,138,0.2)',
        }}>
          <div className="flex items-center justify-center gap-4">
            <Avatar src={profile?.photo_url ?? null} name={profile?.first_name ?? 'You'} size="lg" />
            <div className="flex flex-col items-center">
              <Heart size={24} style={{ color: 'var(--color-brand)' }} className="animate-pulse-soft" />
              <span className="text-[10px] font-bold mt-1" style={{ color: 'var(--color-brand)' }}>PRAYING</span>
            </div>
            <Avatar src={partner.photo_url} name={partner.first_name} size="lg" />
          </div>

          <div>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {partner.first_name} {partner.last_name}
            </h2>
            {partner.area && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{partner.area}</p>
            )}
          </div>

          {partner.prayer_focus && (
            <div className="px-5 py-4 rounded-2xl mx-4" style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-brand)' }}>
                Prayer Focus
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {partner.prayer_focus}
              </p>
            </div>
          )}

          <div className="text-xs font-bold" style={{ color: 'var(--color-text-faint)' }}>
            {daysLeft} days remaining in this pairing
          </div>

          <NavLink to="/messages" className="btn btn-sage w-full max-w-[200px] mx-auto no-underline">
            <MessageCircle size={18} /> Send a Message
          </NavLink>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Users size={48} style={{ color: 'var(--color-text-faint)', margin: '0 auto 16px' }} />
          <h2 className="font-bold text-base mb-2" style={{ color: 'var(--color-text)' }}>
            No Prayer Partner Yet
          </h2>
          <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Prayer partners are assigned weekly by your leaders. Check back soon!
          </p>
          {profile?.role === 'admin' && (
            <button className="btn btn-primary mt-5" onClick={shufflePartners}>
              <RefreshCw size={18} /> Create First Partnerships
            </button>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ background: 'var(--color-sage-soft)', borderColor: 'rgba(130,168,130,0.2)' }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--color-sage)' }}>
          Prayer Partner Tips
        </h3>
        <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <p>💬 Reach out to your partner this week and introduce yourself</p>
          <p>🙏 Pray for their specific prayer focus daily</p>
          <p>📱 Send an encouraging scripture or message mid-week</p>
          <p>✨ Share any answered prayers at the end of the week</p>
        </div>
      </div>
    </div>
  );
}
