import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import { countries } from '@/lib/countries';
import type { Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { Camera, Sun, Moon, LogOut, Award, Edit3, Save, BookOpen, ChevronRight, Lock } from 'lucide-react';

export default function Profile() {
  const { profile, updateProfile, uploadAvatar, signOut, userBadges, badges, addToast } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    phone_number: profile?.phone_number ?? '',
    city: profile?.city ?? '',
    country: profile?.country ?? '',
    about: profile?.about ?? '',
    prayer_focus: profile?.prayer_focus ?? '',
    birthday: profile?.birthday ?? '',
    birthday_visible: profile?.birthday_visible ?? false,
    marital_status: profile?.marital_status ?? '',
    husband_name: profile?.husband_name ?? '',
    wedding_anniversary: profile?.wedding_anniversary ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const isDark = profile?.theme === 'dark';

  const handleSave = async () => {
    setSaving(true);
    try {
      const isMarried = form.marital_status === 'married';
      await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number || null,
        city: form.city || null,
        country: form.country || null,
        area: form.city && form.country ? `${form.city}, ${form.country}` : form.city || form.country || null,
        about: form.about || null,
        prayer_focus: form.prayer_focus || null,
        birthday: form.birthday || null,
        birthday_visible: form.birthday_visible,
        marital_status: (form.marital_status || null) as Profile['marital_status'],
        husband_name: isMarried ? (form.husband_name || null) : null,
        wedding_anniversary: isMarried ? (form.wedding_anniversary || null) : null,
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

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      addToast('error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      addToast('success', 'Password updated successfully');
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
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
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {profile?.city && profile?.country ? `${profile.city}, ${profile.country}` : profile?.area ?? 'No location'}
        </p>
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

      {/* Change Password */}
      {!showPasswordChange ? (
        <button className="card flex items-center gap-3 w-full text-left" onClick={() => setShowPasswordChange(true)}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-brand-soft)' }}>
            <Lock size={18} style={{ color: 'var(--color-brand)' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Change Password</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Update your account password</div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--color-text-faint)' }} />
        </button>
      ) : (
        <div className="card space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Lock size={16} style={{ color: 'var(--color-brand)' }} /> Change Password
          </h3>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Min 6 characters" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" className="input" placeholder="Re-enter new password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={handlePasswordChange}
              disabled={savingPassword || !newPassword || !confirmPassword}>
              <Save size={14} /> {savingPassword ? 'Saving...' : 'Update Password'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowPasswordChange(false); setNewPassword(''); setConfirmPassword(''); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

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
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            Not all fields are required — fill in only what you're comfortable sharing.
          </p>
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
            <label className="label">Phone Number</label>
            <input className="input" type="tel" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="e.g. +1 876 555 1234" />
          </div>
          <div>
            <label className="label">Country</label>
            <select className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              <option value="">Select country...</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">City / Town</label>
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Kingston" />
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
            <input type="date" className="input" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} max={new Date().toLocaleDateString('en-CA')} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.birthday_visible} onChange={(e) => setForm({ ...form, birthday_visible: e.target.checked })} className="w-4 h-4 rounded accent-brand-500" />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Show birthday to community</span>
          </label>
          <div>
            <label className="label">Marital Status</label>
            <select className="input" value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
          {form.marital_status === 'married' && (
            <>
              <div>
                <label className="label">Husband's Name</label>
                <input className="input" value={form.husband_name} onChange={(e) => setForm({ ...form, husband_name: e.target.value })} placeholder="e.g. Michael" />
              </div>
              <div>
                <label className="label">Wedding Anniversary</label>
                <input type="date" className="input" value={form.wedding_anniversary} onChange={(e) => setForm({ ...form, wedding_anniversary: e.target.value })} max={new Date().toLocaleDateString('en-CA')} />
              </div>
            </>
          )}
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Help & Guide */}
      <NavLink
        to="/guide"
        className="card flex items-center gap-3 no-underline transition-all hover:border-[var(--color-brand)]"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-sage-soft)' }}
        >
          <BookOpen size={18} style={{ color: 'var(--color-sage)' }} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Help & Guide</div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Learn how to use the app</div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--color-text-faint)' }} />
      </NavLink>

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
