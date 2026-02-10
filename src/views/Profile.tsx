import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import { Camera, Sun, Moon, LogOut, Award, Edit3, Save } from 'lucide-react';

export default function Profile() {
  const { profile, updateProfile, uploadAvatar, signOut, userBadges, badges, addToast } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    area: profile?.area ?? '',
    about: profile?.about ?? '',
    prayer_focus: profile?.prayer_focus ?? '',
    birthday: profile?.birthday ?? '',
    birthday_visible: profile?.birthday_visible ?? false,
    wedding_anniversary: profile?.wedding_anniversary ?? '',
  });
  const [saving, setSaving] = useState(false);

  const isDark = profile?.theme === 'dark';

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        area: form.area || null,
        about: form.about || null,
        prayer_focus: form.prayer_focus || null,
        birthday: form.birthday || null,
        birthday_visible: form.birthday_visible,
        wedding_anniversary: form.wedding_anniversary || null,
      });
      setEditing(false);
    } catch {
      addToast('error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAvatar(file);
      await updateProfile({ photo_url: url });
    } catch {
      addToast('error', 'Upload failed');
    }
  };

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', newTheme === 'dark' ? '#1A1215' : '#FFFBF9');
    await updateProfile({ theme: newTheme });
  };

  const earnedBadges = userBadges
    .map((ub) => badges.find((b) => b.id === ub.badge_id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        My Profile
      </h1>

      {/* Avatar */}
      <div className="flex flex-col items-center">
        <label className="relative cursor-pointer">
          <Avatar src={profile?.photo_url ?? null} name={profile?.first_name ?? 'U'} size="xl" />
          <div
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-coral) 100%)' }}
          >
            <Camera size={14} className="text-white" />
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </label>
        <h2 className="font-display text-lg font-semibold mt-3" style={{ color: 'var(--color-text)' }}>
          {profile?.first_name} {profile?.last_name}
        </h2>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{profile?.area ?? 'No location'}</p>
      </div>

      {/* Theme */}
      <div className="card flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          {isDark ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Award size={16} style={{ color: 'var(--color-brand)' }} />
            Badges Earned ({earnedBadges.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((b: any) => (
              <span key={b.id} className="badge badge-pink">{b.title}</span>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile */}
      {!editing ? (
        <div className="card space-y-3">
          {profile?.about && (
            <div>
              <span className="label">About</span>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>{profile.about}</p>
            </div>
          )}
          {profile?.prayer_focus && (
            <div>
              <span className="label">Prayer Focus</span>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>{profile.prayer_focus}</p>
            </div>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Kingston, Jamaica" />
          </div>
          <div>
            <label className="label">About</label>
            <textarea className="input" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={3} />
          </div>
          <div>
            <label className="label">Prayer Focus</label>
            <textarea className="input" value={form.prayer_focus} onChange={(e) => setForm({ ...form, prayer_focus: e.target.value })} rows={2} />
          </div>
          <div>
            <label className="label">Birthday</label>
            <input type="date" className="input" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
          </div>
          <div>
            <label className="label">Wedding Anniversary</label>
            <input type="date" className="input" value={form.wedding_anniversary} onChange={(e) => setForm({ ...form, wedding_anniversary: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.birthday_visible} onChange={(e) => setForm({ ...form, birthday_visible: e.target.checked })} className="w-4 h-4 rounded accent-brand-500" />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Show birthday to community</span>
          </label>
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        className="btn btn-ghost w-full justify-center text-rose-400"
        onClick={signOut}
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
