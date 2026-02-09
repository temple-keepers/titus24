import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/lib/utils';
import { POINT_VALUES } from '@/lib/devotionals';
import { PartyPopper, Send, Plus } from 'lucide-react';
import type { Testimony, TestimonyCelebration, TestimonyCategory } from '@/types';

const categories: TestimonyCategory[] = [
  'Answered Prayer', 'Engagement', 'Marriage', 'Breakthrough', 'Healing', 'Provision', 'Growth', 'Other',
];

const categoryEmojis: Record<string, string> = {
  'Answered Prayer': '🙏', 'Engagement': '💍', 'Marriage': '💒', 'Breakthrough': '🌟',
  'Healing': '💚', 'Provision': '🎁', 'Growth': '🌱', 'Other': '✨',
};

export default function Testimonies() {
  const { user, profile, profiles, addToast } = useApp();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [celebrations, setCelebrations] = useState<TestimonyCelebration[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<TestimonyCategory>('Answered Prayer');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [tRes, cRes] = await Promise.all([
      supabase.from('testimonies').select('*').order('created_at', { ascending: false }),
      supabase.from('testimony_celebrations').select('*'),
    ]);
    if (tRes.data) setTestimonies(tRes.data);
    if (cRes.data) setCelebrations(cRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('testimonies').insert({
        author_id: user.id, content: content.trim(), category, is_anonymous: isAnonymous,
      }).select().single();
      if (error) throw error;
      if (data) setTestimonies(prev => [data, ...prev]);

      // Award points using atomic function
      try {
        const pv = POINT_VALUES.testimony_shared;
        await supabase.rpc('award_points', {
          p_user_id: user.id,
          p_action: 'testimony_shared',
          p_points: pv.points,
          p_description: pv.label,
        });
      } catch (pointsErr) {
        console.error('Failed to award points:', pointsErr);
        // Continue anyway - testimony was saved
      }

      setContent('');
      setCategory('Answered Prayer');
      setIsAnonymous(false);
      setShowForm(false);
      addToast('success', 'Testimony shared! +15 points');
    } catch (err) {
      console.error('Failed to share testimony:', err);
      addToast('error', 'Failed to share testimony');
    } finally {
      setSaving(false);
    }
  };

  const toggleCelebrate = async (testimonyId: string) => {
    if (!user) return;

    try {
      const existing = celebrations.find(c => c.testimony_id === testimonyId && c.user_id === user.id);

      if (existing) {
        // Remove celebration - trigger will update count
        const { error } = await supabase.from('testimony_celebrations').delete().eq('id', existing.id);
        if (error) throw error;

        setCelebrations(prev => prev.filter(c => c.id !== existing.id));
        // Optimistically update UI
        setTestimonies(prev => prev.map(t =>
          t.id === testimonyId ? { ...t, celebration_count: Math.max(0, t.celebration_count - 1) } : t
        ));
      } else {
        // Add celebration - trigger will update count
        const { data, error } = await supabase.from('testimony_celebrations').insert({
          testimony_id: testimonyId, user_id: user.id,
        }).select().single();

        if (error) throw error;
        if (data) {
          setCelebrations(prev => [...prev, data]);
          // Optimistically update UI
          setTestimonies(prev => prev.map(t =>
            t.id === testimonyId ? { ...t, celebration_count: t.celebration_count + 1 } : t
          ));
        }
      }
    } catch (err) {
      console.error('Failed to toggle celebration:', err);
      addToast('error', 'Failed to update celebration');
      // Refetch to sync with database
      fetchData();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Testimonies</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Celebrate what God is doing!</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Share
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4" style={{ borderColor: 'rgba(232,102,138,0.2)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Share Your Testimony</h3>
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all"
                  style={{
                    background: category === c ? 'var(--color-brand-soft)' : 'var(--color-bg-raised)',
                    border: `1.5px solid ${category === c ? 'var(--color-brand)' : 'var(--color-border)'}`,
                  }}>
                  <span className="text-lg">{categoryEmojis[c]}</span>
                  <span className="text-[9px] font-bold leading-tight" style={{ color: category === c ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
                    {c}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Your Testimony</label>
            <textarea className="input" rows={4} placeholder="Share what God has done in your life..."
              value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-5 h-5 rounded" />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Share anonymously</span>
          </label>
          <button className="btn btn-primary btn-lg w-full" disabled={!content.trim() || saving} onClick={handleSubmit}>
            <Send size={18} /> {saving ? 'Sharing...' : 'Share Testimony (+15 pts)'}
          </button>
        </div>
      )}

      {testimonies.length === 0 ? (
        <div className="text-center py-12">
          <PartyPopper size={40} style={{ color: 'var(--color-text-faint)', margin: '0 auto 12px' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>No testimonies yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {testimonies.map(t => {
            const author = t.is_anonymous ? null : profiles.find(p => p.id === t.author_id);
            const hasCelebrated = celebrations.some(c => c.testimony_id === t.id && c.user_id === user?.id);
            return (
              <div key={t.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {!t.is_anonymous && author ? (
                      <>
                        <Avatar src={author.photo_url} name={author.first_name} size="sm" />
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{author.first_name}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>Anonymous Sister</span>
                    )}
                  </div>
                  <span className="badge badge-gold">{categoryEmojis[t.category]} {t.category}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4" style={{ color: 'var(--color-text)' }}>
                  {t.content}
                </p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleCelebrate(t.id)}
                    className="btn btn-sm"
                    style={{
                      background: hasCelebrated ? 'var(--color-gold-soft)' : 'transparent',
                      color: hasCelebrated ? 'var(--color-gold)' : 'var(--color-text-muted)',
                      border: `1.5px solid ${hasCelebrated ? 'rgba(230,173,62,0.3)' : 'var(--color-border)'}`,
                    }}>
                    <PartyPopper size={16} /> Celebrate! ({t.celebration_count})
                  </button>
                  <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{timeAgo(t.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
