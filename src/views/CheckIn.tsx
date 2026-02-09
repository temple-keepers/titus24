import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { MOOD_OPTIONS, POINT_VALUES } from '@/lib/devotionals';
import { supabase } from '@/lib/supabase';
import { Heart, Send, Check, Flame, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import type { MoodType } from '@/types';

export default function CheckIn() {
  const { user, profile, addToast, updateProfile } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const [checkedIn, setCheckedIn] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [challenge, setChallenge] = useState('');
  const [victory, setVictory] = useState('');
  const [prayerNeed, setPrayerNeed] = useState('');
  const [readScripture, setReadScripture] = useState(false);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(profile?.checkin_streak ?? 0);

  // Check if already checked in today
  useEffect(() => {
    if (!user) return;

    const checkStatus = async () => {
      const { data: checkinData } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (checkinData) {
        setCheckedIn(true);
        setSelectedMood(checkinData.mood);
        setGratitude(checkinData.gratitude || '');
      }
    };

    checkStatus();
  }, [user, today]);

  const awardPoints = async (action: string) => {
    if (!user) return;
    const pv = POINT_VALUES[action];
    if (!pv) return;

    try {
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
    }
  };

  const handleCheckIn = async () => {
    if (!user || !selectedMood) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('daily_checkins').upsert({
        user_id: user.id,
        mood: selectedMood,
        gratitude: gratitude.trim() || null,
        date: today,
      }, { onConflict: 'user_id,date' });
      if (error) throw error;

      // Update streak
      const lastDate = profile?.last_checkin_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      if (lastDate === yesterdayStr) {
        newStreak = (profile?.checkin_streak ?? 0) + 1;
      } else if (lastDate === today) {
        newStreak = profile?.checkin_streak ?? 1;
      }

      await updateProfile({ checkin_streak: newStreak, last_checkin_date: today });
      setStreak(newStreak);
      setCheckedIn(true);

      // Award points
      if (lastDate !== today) {
        await awardPoints('daily_checkin');
        if (newStreak > 1 && newStreak % 7 === 0) {
          await awardPoints('streak_bonus');
          addToast('success', `${newStreak}-day streak! +10 bonus points`);
        } else {
          addToast('success', 'Check-in saved! +5 points');
        }
      } else {
        addToast('success', 'Check-in updated!');
      }
    } catch (err: any) {
      console.error('Check-in error:', err);
      addToast('error', 'Failed to save check-in');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 stagger">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Daily Check-In
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {streak > 0 && (
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'var(--color-gold-soft)', color: 'var(--color-gold)' }}>
            <Flame size={14} /> {streak}-day streak!
          </div>
        )}
      </div>

      {!checkedIn ? (
        <div className="space-y-5">
          {/* Mood Selection */}
          <div className="card space-y-4" style={{ borderColor: 'rgba(232,102,138,0.2)' }}>
            <div className="flex items-center gap-2">
              <Heart size={18} style={{ color: 'var(--color-brand)' }} />
              <h2 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                How is your heart today, {profile?.first_name}?
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {MOOD_OPTIONS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedMood(value as MoodType)}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
                  style={{
                    background: selectedMood === value ? 'var(--color-brand-soft)' : 'var(--color-bg-raised)',
                    border: `2px solid ${selectedMood === value ? 'var(--color-brand)' : 'var(--color-border)'}`,
                  }}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[10px] font-bold" style={{ color: selectedMood === value ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Reflection Questions */}
          <div className="card space-y-4">
            <div>
              <label className="label flex items-center gap-2">
                <TrendingUp size={16} style={{ color: 'var(--color-sage)' }} />
                What are you grateful for today?
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="One thing you are thankful for..."
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
              />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <AlertCircle size={16} style={{ color: 'var(--color-gold)' }} />
                Any challenges you're facing? (Optional)
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="Something you're struggling with today..."
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
              />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Check size={16} style={{ color: 'var(--color-brand)' }} />
                Any victories to celebrate? (Optional)
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="Something you're celebrating today..."
                value={victory}
                onChange={(e) => setVictory(e.target.value)}
              />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Heart size={16} style={{ color: 'var(--color-brand)' }} />
                What can we pray for you about? (Optional)
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="A prayer request for your sisters..."
                value={prayerNeed}
                onChange={(e) => setPrayerNeed(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="scripture"
                checked={readScripture}
                onChange={(e) => setReadScripture(e.target.checked)}
                className="w-5 h-5"
              />
              <label htmlFor="scripture" className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                <BookOpen size={16} />
                I've read Scripture today
              </label>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg w-full"
            disabled={!selectedMood || saving}
            onClick={handleCheckIn}
          >
            <Send size={18} /> {saving ? 'Saving...' : 'Complete Check-In'}
          </button>
        </div>
      ) : (
        <div className="card text-center py-8" style={{ background: 'var(--color-sage-soft)', borderColor: 'rgba(130,168,130,0.3)' }}>
          <Check size={32} style={{ color: 'var(--color-sage)', margin: '0 auto 12px' }} />
          <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-sage)' }}>
            You've Checked In Today!
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Feeling {selectedMood} {MOOD_OPTIONS.find(m => m.value === selectedMood)?.emoji}
          </p>
          {gratitude && (
            <div className="mt-4 p-4 rounded-xl text-left" style={{ background: 'var(--color-bg-raised)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Your gratitude:
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                {gratitude}
              </p>
            </div>
          )}
          <p className="text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
            Come back tomorrow to continue your streak!
          </p>
        </div>
      )}
    </div>
  );
}
