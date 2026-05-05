import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogOut, MessageCircle, Sun, Moon, KeyRound, Mail, Heart, Cake, MapPin, Camera, Sparkles, X } from 'lucide-react';
import { Card, EmptyState, ScripturePill, SectionTitle } from '../../components/Card';
import { Input, Textarea } from '../../components/Input';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError, mapAuthError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { getProfile } from '../../data/queries';
import type { MaritalStatus, Profile as ProfileT } from '../../lib/database.types';
import { useTheme } from '../../theme/useTheme';
import { isLeadership, publicRole } from '../../lib/roles';
import { cn } from '../../lib/cn';

const MARITAL_OPTIONS: Array<{ value: MaritalStatus | ''; label: string }> = [
  { value: '', label: 'Prefer not to say' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

export default function Profile() {
  const { id } = useParams<{ id?: string }>();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { addToast } = useToast();
  const nav = useNavigate();

  const isOwn = !id || id === user?.id;
  const [target, setTarget] = useState<ProfileT | null>(isOwn ? profile : null);
  const [loading, setLoading] = useState(!isOwn);

  useEffect(() => {
    if (isOwn) {
      setTarget(profile);
      return;
    }
    if (!id) return;
    getProfile(id).then((p) => {
      setTarget(p);
      setLoading(false);
    });
  }, [id, isOwn, profile]);

  if (loading) return <LoadingPage />;

  if (!target) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          title="We couldn't find that sister"
          body="The profile may have been removed, or the link may be wrong."
          icon={<Heart size={28} />}
          action={
            <Link to="/directory" className="text-sm font-semibold text-brand-600">
              ← Back to Directory
            </Link>
          }
        />
      </div>
    );
  }

  if (isOwn) {
    return (
      <OwnProfileEditor
        profile={target}
        onSaved={refreshProfile}
        signOut={signOut}
        theme={theme}
        toggle={toggle}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <div className="flex items-start gap-4">
          <Avatar size={84} url={target.avatar_url} name={target.display_name ?? target.first_name} />
          <div className="flex-1">
            <h1 className="font-display text-3xl">{target.display_name ?? target.first_name}</h1>
            <p className="text-sm text-app-muted">
              {[target.city, target.country].filter(Boolean).join(', ')}
            </p>
            {isLeadership(target.role) && (
              <span className="mt-2 inline-block rounded-full bg-gold-400/20 px-2 py-1 text-[11px] font-semibold text-gold-600">
                {publicRole(target.role)}
              </span>
            )}
          </div>
        </div>
        {target.about && <p className="mt-4 text-sm leading-7 whitespace-pre-wrap">{target.about}</p>}
        {target.profession && (
          <p className="mt-4 text-sm">
            <span className="font-semibold">What I do:</span> {target.profession}
          </p>
        )}
        {target.skills && target.skills.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Skills</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {target.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {target.favourite_verse && (
          <div className="mt-4">
            <ScripturePill>{target.favourite_verse}</ScripturePill>
          </div>
        )}
        {target.prayer_focus && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-app-muted">Prayer focus</p>
            <p className="text-sm">{target.prayer_focus}</p>
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <Button leadingIcon={<MessageCircle size={16} />} onClick={() => nav(`/messages/${target.id}`)}>
            Send message
          </Button>
          <Link to="/directory">
            <Button variant="ghost">Directory</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

// ─── Own profile editor ──────────────────────────────────────────────

function OwnProfileEditor({
  profile,
  onSaved,
  signOut,
  theme,
  toggle,
}: {
  profile: ProfileT;
  onSaved: () => Promise<void> | void;
  signOut: () => Promise<void>;
  theme: 'light' | 'dark';
  toggle: () => void;
}) {
  const { addToast } = useToast();
  const [first, setFirst] = useState(profile.first_name ?? '');
  const [last, setLast] = useState(profile.last_name ?? '');
  const [display, setDisplay] = useState(profile.display_name ?? '');
  const [avatar, setAvatar] = useState(profile.avatar_url ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [country, setCountry] = useState(profile.country ?? '');
  const [area, setArea] = useState(profile.area ?? '');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState(profile.about ?? '');
  const [verse, setVerse] = useState(profile.favourite_verse ?? '');
  const [prayer, setPrayer] = useState(profile.prayer_focus ?? '');
  const [marital, setMarital] = useState<MaritalStatus | ''>(profile.marital_status ?? '');
  const [husband, setHusband] = useState(profile.husband_name ?? '');
  const [birthday, setBirthday] = useState(profile.birthday ?? '');
  const [birthdayVisible, setBirthdayVisible] = useState<boolean>(profile.birthday_visible ?? false);
  const [anniversary, setAnniversary] = useState(profile.anniversary ?? '');
  const [profession, setProfession] = useState(profile.profession ?? '');
  const [skills, setSkills] = useState<string[]>(profile.skills ?? []);
  const [readReceipts, setReadReceipts] = useState<boolean>(profile.read_receipts_enabled ?? true);
  const [busy, setBusy] = useState(false);

  // Phone number lives on contact_info (leader-only RLS), so we hydrate
  // it separately on mount.
  useEffect(() => {
    let active = true;
    void supabase
      .from('contact_info')
      .select('phone_number')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setPhone(((data as { phone_number: string | null } | null)?.phone_number) ?? '');
      });
    return () => {
      active = false;
    };
  }, [profile.id]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: first.trim() || null,
        last_name: last.trim() || null,
        display_name: display.trim() || null,
        avatar_url: avatar.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        area: area.trim() || null,
        about: about.trim() || null,
        favourite_verse: verse.trim() || null,
        prayer_focus: prayer.trim() || null,
        marital_status: marital || null,
        husband_name: husband.trim() || null,
        birthday: birthday || null,
        birthday_visible: birthdayVisible,
        anniversary: anniversary || null,
        profession: profession.trim() || null,
        skills,
        read_receipts_enabled: readReceipts,
      })
      .eq('id', profile.id);

    // Phone number lives in its own RLS-protected table.
    const phoneTrim = phone.trim();
    const { error: phoneErr } = await supabase
      .from('contact_info')
      .upsert(
        { user_id: profile.id, phone_number: phoneTrim || null, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    setBusy(false);
    if (failIfError(error, 'save your profile', addToast)) return;
    if (failIfError(phoneErr, 'save your phone number', addToast)) return;
    addToast({ kind: 'success', title: 'Profile saved' });
    await onSaved();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header card */}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar size={72} url={avatar || profile.avatar_url} name={display || first} />
          <div className="flex-1">
            <h1 className="font-display text-2xl">Your profile</h1>
            <p className="text-sm text-app-muted">Tell your sisters who you are.</p>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="rounded-full p-2 hover:bg-surface-raised"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
        <CompletionMeter
          fields={{
            avatar: !!avatar,
            firstName: !!first,
            cityOrCountry: !!(city || country),
            about: !!about,
            verse: !!verse,
            birthday: !!birthday,
          }}
        />
      </Card>

      <form onSubmit={save} className="space-y-4">
        {/* Basics */}
        <Card>
          <SectionTitle>Basics</SectionTitle>
          <AvatarUpload
            userId={profile.id}
            current={avatar}
            displayName={display || first}
            onUploaded={(url) => setAvatar(url)}
          />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="First name" value={first} onChange={(e) => setFirst(e.target.value)} />
            <Input label="Last name" value={last} onChange={(e) => setLast(e.target.value)} />
            <Input
              label="Display name"
              value={display}
              onChange={(e) => setDisplay(e.target.value)}
              hint="What sisters see in posts and messages."
            />
          </div>
        </Card>

        {/* Where */}
        <Card>
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-brand-500" /> Where you are
            </span>
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
            <Input
              label="Area / neighbourhood"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              hint="Optional. Helpful for local meetups."
            />
            <Input
              label="Phone number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              hint="Only visible to leadership."
            />
          </div>
        </Card>

        {/* About */}
        <Card>
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <Heart size={16} className="text-brand-500" /> About you
            </span>
          </SectionTitle>
          <Textarea
            label="About"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
          />
          <div className="h-3" />
          <Input
            label="Favourite verse"
            value={verse}
            onChange={(e) => setVerse(e.target.value)}
          />
          <div className="h-3" />
          <Textarea
            label="Prayer focus"
            value={prayer}
            onChange={(e) => setPrayer(e.target.value)}
            rows={3}
          />
        </Card>

        {/* Life details */}
        <Card>
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <Cake size={16} className="text-brand-500" /> Life details
            </span>
          </SectionTitle>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">
                Marital status
              </span>
              <div className="flex flex-wrap gap-2">
                {MARITAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value || 'none'}
                    type="button"
                    onClick={() => setMarital(opt.value)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold',
                      marital === opt.value
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-app text-app-muted'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </label>

            {marital === 'married' && (
              <Input
                label="Husband's name"
                value={husband}
                onChange={(e) => setHusband(e.target.value)}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
              <Input
                label="Wedding anniversary"
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={birthdayVisible}
                onChange={(e) => setBirthdayVisible(e.target.checked)}
              />
              Show my birthday on the celebrations calendar
            </label>
          </div>
        </Card>

        {/* What you bring */}
        <Card>
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <Sparkles size={16} className="text-brand-500" /> What you bring
            </span>
          </SectionTitle>
          <Input
            label="Profession or what you do"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            hint="E.g. teacher, nurse, full-time mum, business owner."
          />
          <div className="mt-3">
            <SkillsPicker value={skills} onChange={setSkills} />
          </div>
        </Card>

        {/* Privacy */}
        <Card>
          <SectionTitle>Privacy</SectionTitle>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={readReceipts}
              onChange={(e) => setReadReceipts(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="font-semibold">Send read receipts</span>
              <span className="block text-xs text-app-muted">
                When on, sisters can see "read" next to messages you've opened. Switch off and they
                only see "delivered". Your unread badges still clear for you.
              </span>
            </span>
          </label>
        </Card>

        <div className="flex flex-wrap justify-between gap-2">
          <Button type="submit" loading={busy}>
            Save changes
          </Button>
        </div>
      </form>

      {/* Account & security */}
      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <KeyRound size={16} className="text-brand-500" /> Account & security
          </span>
        </SectionTitle>
        <p className="mb-3 text-sm">
          <span className="text-app-muted">Email:</span>{' '}
          <span className="font-semibold inline-flex items-center gap-1">
            <Mail size={14} /> {profile.email}
          </span>
        </p>
        <ChangePasswordForm />
        <div className="mt-4 border-t border-app pt-4">
          <Button
            type="button"
            variant="ghost"
            leadingIcon={<LogOut size={16} />}
            onClick={signOut}
          >
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Completion meter ────────────────────────────────────────────────

function CompletionMeter({ fields }: { fields: Record<string, boolean> }) {
  const total = Object.keys(fields).length;
  const done = Object.values(fields).filter(Boolean).length;
  const pct = Math.round((done / total) * 100);
  const labels: Record<string, string> = {
    avatar: 'Photo',
    firstName: 'First name',
    cityOrCountry: 'Where you are',
    about: 'About you',
    verse: 'Favourite verse',
    birthday: 'Birthday',
  };
  const missing = Object.entries(fields)
    .filter(([, v]) => !v)
    .map(([k]) => labels[k] ?? k);

  return (
    <div className="mt-4 border-t border-app pt-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-app-muted">Profile complete</span>
        <span className="font-bold text-brand-700 tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--soft-pink), var(--rose))',
          }}
        />
      </div>
      {missing.length > 0 && (
        <p className="mt-2 text-[11px] text-app-muted">
          Add: <span className="font-semibold">{missing.join(' · ')}</span>
        </p>
      )}
    </div>
  );
}

// ─── Avatar upload ───────────────────────────────────────────────────

function AvatarUpload({
  userId,
  current,
  displayName,
  onUploaded,
}: {
  userId: string;
  current: string;
  displayName: string;
  onUploaded: (url: string) => void;
}) {
  const { addToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast({ kind: 'error', title: 'That photo is too big', body: 'Please use one under 5 MB.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      addToast({ kind: 'error', title: 'Not a photo', body: 'Please pick an image file.' });
      return;
    }

    setBusy(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;

    // Path is timestamped, so uniqueness is guaranteed — upsert:false avoids
    // the storage UPDATE policy check (which requires owner=auth.uid() and
    // 400s on a brand-new INSERT under PostgREST upsert semantics).
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

    if (upErr) {
      setBusy(false);
      addToast({ kind: 'error', title: 'Upload failed', body: upErr.message });
      return;
    }

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    // Cache-bust by appending a timestamp so the new image appears immediately.
    const bustUrl = `${pub.publicUrl}?t=${Date.now()}`;

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ avatar_url: bustUrl })
      .eq('id', userId);

    setBusy(false);

    if (updErr) {
      addToast({ kind: 'error', title: 'Could not save avatar', body: updErr.message });
      return;
    }
    onUploaded(bustUrl);
    addToast({ kind: 'success', title: 'Photo updated' });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size={72} url={current || null} name={displayName} />
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="secondary"
          leadingIcon={<Camera size={16} />}
          loading={busy}
          onClick={() => inputRef.current?.click()}
        >
          {current ? 'Change photo' : 'Upload photo'}
        </Button>
        <p className="mt-1 text-xs text-app-muted">JPG or PNG, up to 5 MB.</p>
      </div>
    </div>
  );
}

// ─── Change password ─────────────────────────────────────────────────

function ChangePasswordForm() {
  const { addToast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);

    // Re-verify current password before changing — supabase doesn't have a
    // dedicated "verify password" call, so we sign in again with the
    // existing session's email and the supplied current password.
    const { data: u } = await supabase.auth.getUser();
    if (!u.user?.email) {
      setBusy(false);
      setError('Could not load your account email.');
      return;
    }
    const verify = await supabase.auth.signInWithPassword({
      email: u.user.email,
      password: current,
    });
    if (verify.error) {
      setBusy(false);
      setError('Your current password is not correct.');
      return;
    }

    const { error: updErr } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (updErr) {
      setError(mapAuthError(updErr));
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    addToast({ kind: 'success', title: 'Password updated' });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        value={next}
        onChange={(e) => setNext(e.target.value)}
        hint="At least 8 characters."
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={busy} variant="secondary">
        Change password
      </Button>
    </form>
  );
}

// ─── Skills picker ───────────────────────────────────────────────────

/**
 * Curated list of skills sisters can pick from. Tap to toggle. The "Add
 * your own" input lets a sister add anything that isn't on the list.
 *
 * The columns are stored as text[] in the DB so a future Directory filter
 * can do a GIN intersection query for "find sisters with skill X".
 */
const SKILLS = [
  'Teaching', 'Counselling', 'Cooking', 'Hospitality', 'Music', 'Prayer',
  'Mentoring', 'Caregiving', 'Healthcare', 'Finance', 'Legal', 'Tech',
  'Writing', 'Languages', 'Crafts', 'Childcare', 'Pastoral', 'Admin',
  'Encouragement', 'Bible study', 'Worship', 'Photography', 'Design',
  'Event planning',
];

export function SkillsPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [other, setOther] = useState('');
  const valueSet = new Set(value);

  function toggle(skill: string) {
    if (valueSet.has(skill)) {
      onChange(value.filter((s) => s !== skill));
    } else {
      onChange([...value, skill]);
    }
  }

  function addOther() {
    const trimmed = other.trim();
    if (!trimmed) return;
    if (valueSet.has(trimmed)) {
      setOther('');
      return;
    }
    onChange([...value, trimmed]);
    setOther('');
  }

  // Custom skills: anything in `value` that's not in the curated list. Show
  // these as removable chips at the bottom so a sister can edit them later.
  const custom = value.filter((s) => !SKILLS.includes(s));

  return (
    <div>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-app-muted">
        What you're good at
      </span>
      <div className="flex flex-wrap gap-2">
        {SKILLS.map((s) => {
          const on = valueSet.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold',
                on
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-app text-app-muted hover:bg-surface-raised'
              )}
            >
              {s}
            </button>
          );
        })}
      </div>

      {custom.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {custom.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full border border-sage-300 bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-700"
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                aria-label={`Remove ${s}`}
                className="hover:text-red-600"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-end gap-2">
        <Input
          label="Add your own"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addOther();
            }
          }}
          hint="Anything not on the list — e.g. nursing, midwifery, accounting."
        />
        <Button type="button" variant="ghost" onClick={addOther}>
          Add
        </Button>
      </div>
    </div>
  );
}
