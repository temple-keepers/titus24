import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getTodaysDevotional, POINT_VALUES } from '@/lib/devotionals';
import { supabase } from '@/lib/supabase';
import { BookOpen, Check } from 'lucide-react';

export default function DailyDevotional() {
  const { user, dailyDevotionals, addToast } = useApp();
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
  const devotional = dailyDevotionals.find(d => d.date === today) || getTodaysDevotional();

  const [devotionalRead, setDevotionalRead] = useState(false);

  // Check if devotional was read
  useEffect(() => {
    if (!user) return;

    const checkStatus = async () => {
      const { data: readData } = await supabase
        .from('devotional_reads')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (readData) {
        setDevotionalRead(true);
      }
    };

    checkStatus();
  }, [user, today]);

  const awardPoints = async (action: string) => {
    if (!user) return;
    const pv = POINT_VALUES[action];
    if (!pv) return;

    try {
      // Use atomic function to prevent race conditions
      const { error } = await supabase.rpc('award_points', {
        p_user_id: user.id,
        p_action: action,
        p_points: pv.points,
        p_description: pv.label,
      });

      if (error) {
        console.error('Failed to award points:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error awarding points:', err);
      // Don't throw - allow the main action to succeed even if points fail
    }
  };

  const handleDevotionalRead = async () => {
    if (devotionalRead || !user) return;

    try {
      // Check if already read today using database (rate limiting)
      const { data: existing } = await supabase
        .from('devotional_reads')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        setDevotionalRead(true);
        addToast('info', 'Already marked as read today');
        return;
      }

      // Insert read record
      const { error } = await supabase
        .from('devotional_reads')
        .insert({ user_id: user.id, date: today });

      if (error) throw error;

      setDevotionalRead(true);
      await awardPoints('devotional_read');
      addToast('success', 'Devotional read! +5 points');
    } catch (err) {
      console.error('Failed to mark devotional as read:', err);
      addToast('error', 'Failed to record devotional read');
    }
  };

  return (
    <div className="space-y-6 stagger">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Daily Devotional
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Devotional Card */}
      <div
        className="card space-y-5"
        style={{
          background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-brand-soft) 100%)',
          borderColor: 'rgba(232,102,138,0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={18} style={{ color: 'var(--color-brand)' }} />
          <span className="badge badge-pink">{devotional.theme}</span>
        </div>

        {/* Scripture */}
        {devotional.scripture_text && (
          <div className="px-4 py-5 rounded-2xl" style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}>
            <p className="font-display text-lg italic leading-relaxed text-center" style={{ color: 'var(--color-text)' }}>
              "{devotional.scripture_text}"
            </p>
            {devotional.scripture_ref && (
              <p className="text-xs font-bold text-center mt-3" style={{ color: 'var(--color-brand)' }}>
                {devotional.scripture_ref}
              </p>
            )}
          </div>
        )}

        {/* Reflection */}
        {devotional.reflection && (
          <div>
            <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--color-text)' }}>Reflection</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {devotional.reflection}
            </p>
          </div>
        )}

        {/* Affirmation */}
        {devotional.affirmation && (
          <div className="px-4 py-4 rounded-2xl" style={{ background: 'var(--color-gold-soft)', border: '1px solid rgba(230,173,62,0.2)' }}>
            <p className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-gold)' }}>
              Today's Affirmation
            </p>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--color-text)' }}>
              {devotional.affirmation}
            </p>
          </div>
        )}

        {/* Prayer */}
        {devotional.prayer && (
          <div>
            <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--color-text)' }}>Prayer</h3>
            <p className="text-sm italic leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {devotional.prayer}
            </p>
          </div>
        )}

        {!devotionalRead && (
          <button className="btn btn-sage btn-lg w-full" onClick={handleDevotionalRead}>
            <BookOpen size={18} /> I've Read Today's Devotional (+5 pts)
          </button>
        )}
        {devotionalRead && (
          <div className="text-center text-sm font-bold" style={{ color: 'var(--color-sage)' }}>
            <Check size={16} className="inline mr-1" /> Devotional completed today
          </div>
        )}
      </div>
    </div>
  );
}
