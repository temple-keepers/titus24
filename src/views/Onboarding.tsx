import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Camera, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const { profile, updateProfile, uploadAvatar, addToast } = useApp();
  const [area, setArea] = useState('');
  const [about, setAbout] = useState('');
  const [prayerFocus, setPrayerFocus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      await updateProfile({ photo_url: url });
    } catch (err: any) {
      console.error('Photo upload error:', err);
      addToast('error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    if (!area.trim()) { setErrorMsg('Please enter your area'); return; }
    setSaving(true);
    setErrorMsg('');
    try {
      const updates: Record<string, any> = { area: area.trim() };
      if (about.trim()) updates.about = about.trim();
      if (prayerFocus.trim()) updates.prayer_focus = prayerFocus.trim();
      await updateProfile(updates);
      addToast('success', 'Welcome to Titus 2:4! 💐');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setErrorMsg(err?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--gradient-body)' }}
    >
      {/* Decorative */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(247,141,167,0.06) 0%, transparent 60%)' }}
      />

      <div className="w-full max-w-sm space-y-7">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Welcome, {profile?.first_name || 'Beautiful'} 💐
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Let's get you set up so the sisters can get to know you.
          </p>
        </div>

        {errorMsg && (
          <div className="px-4 py-3 rounded-2xl border text-sm font-semibold"
            style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.2)', color: '#fb7185' }}>
            {errorMsg}
          </div>
        )}

        {/* Photo */}
        <div className="flex justify-center">
          <label className="relative cursor-pointer">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-3 transition-colors"
              style={{ borderColor: 'var(--color-border-strong)', borderWidth: '3px', background: profile?.photo_url ? 'transparent' : 'var(--color-bg-raised)' }}
            >
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera size={32} style={{ color: 'var(--color-text-faint)' }} />
              )}
            </div>
            <div
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: 'var(--gradient-brand)' }}
            >
              +
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        </div>
        {uploading && <p className="text-center text-xs font-semibold" style={{ color: 'var(--color-brand)' }}>Uploading photo…</p>}
        <p className="text-center text-xs" style={{ color: 'var(--color-text-faint)' }}>Photo is optional — you can add it later</p>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="label">Where are you based? *</label>
            <input type="text" className="input" placeholder="e.g. Kingston, Jamaica" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div>
            <label className="label">Tell us about you</label>
            <textarea className="input" placeholder="A little about who you are…" value={about} onChange={(e) => setAbout(e.target.value)} rows={3} />
          </div>
          <div>
            <label className="label">Current prayer focus</label>
            <textarea className="input" placeholder="What's on your heart right now?" value={prayerFocus} onChange={(e) => setPrayerFocus(e.target.value)} rows={2} />
          </div>
        </div>

        <button onClick={handleComplete} className="btn btn-primary btn-lg w-full" disabled={saving || !area.trim()}>
          {saving ? 'Saving…' : 'Join the Sisterhood'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
