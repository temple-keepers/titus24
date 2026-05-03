import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogOut, MessageCircle, Sun, Moon } from 'lucide-react';
import { Card, ScripturePill, SectionTitle } from '../../components/Card';
import { Input, Textarea } from '../../components/Input';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { getProfile } from '../../data/queries';
import type { Profile as ProfileT } from '../../lib/database.types';
import { useTheme } from '../../theme/useTheme';
import { isLeadership, publicRole } from '../../lib/roles';

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

  if (loading || !target) return <LoadingPage />;

  if (isOwn) return <OwnProfileEditor profile={target} onSaved={refreshProfile} signOut={signOut} theme={theme} toggle={toggle} addToast={addToast} />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <div className="flex items-start gap-4">
          <Avatar size={84} url={target.avatar_url} name={target.display_name ?? target.first_name} />
          <div className="flex-1">
            <h1 className="font-display text-3xl">{target.display_name ?? target.first_name}</h1>
            <p className="text-sm text-app-muted">{[target.city, target.country].filter(Boolean).join(', ')}</p>
            {isLeadership(target.role) && (
              <span className="mt-2 inline-block rounded-full bg-gold-400/20 px-2 py-1 text-[11px] font-semibold text-gold-600">
                {publicRole(target.role)}
              </span>
            )}
          </div>
        </div>
        {target.about && <p className="mt-4 text-sm leading-7 whitespace-pre-wrap">{target.about}</p>}
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

function OwnProfileEditor({
  profile,
  onSaved,
  signOut,
  theme,
  toggle,
  addToast,
}: {
  profile: ProfileT;
  onSaved: () => void;
  signOut: () => Promise<void>;
  theme: 'light' | 'dark';
  toggle: () => void;
  addToast: (t: { kind: 'success' | 'error' | 'info'; title: string; body?: string }) => void;
}) {
  const [first, setFirst] = useState(profile.first_name ?? '');
  const [last, setLast] = useState(profile.last_name ?? '');
  const [display, setDisplay] = useState(profile.display_name ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [country, setCountry] = useState(profile.country ?? '');
  const [about, setAbout] = useState(profile.about ?? '');
  const [verse, setVerse] = useState(profile.favourite_verse ?? '');
  const [prayer, setPrayer] = useState(profile.prayer_focus ?? '');
  const [avatar, setAvatar] = useState(profile.avatar_url ?? '');
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: first.trim() || null,
        last_name: last.trim() || null,
        display_name: display.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        about: about.trim() || null,
        favourite_verse: verse.trim() || null,
        prayer_focus: prayer.trim() || null,
        avatar_url: avatar.trim() || null,
      })
      .eq('id', profile.id);
    setBusy(false);
    if (failIfError(error, 'save your profile', addToast)) return;
    addToast({ kind: 'success', title: 'Profile saved' });
    onSaved();
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar size={72} url={avatar || profile.avatar_url} name={display || first} />
          <div className="flex-1">
            <h1 className="font-display text-2xl">Your profile</h1>
            <p className="text-sm text-app-muted">Tell your sisters who you are.</p>
          </div>
          <button type="button" onClick={toggle} className="rounded-full p-2 hover:bg-surface-raised" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="First name" name="first_name" value={first} onChange={(e) => setFirst(e.target.value)} />
          <Input label="Last name" name="last_name" value={last} onChange={(e) => setLast(e.target.value)} />
          <Input label="Display name" name="display_name" value={display} onChange={(e) => setDisplay(e.target.value)} />
          <Input label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input label="Avatar URL" name="avatar_url" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
        </div>
      </Card>
      <Card>
        <SectionTitle>About you</SectionTitle>
        <Textarea label="About" name="about" value={about} onChange={(e) => setAbout(e.target.value)} />
        <div className="h-3" />
        <Input label="Favourite verse" name="verse" value={verse} onChange={(e) => setVerse(e.target.value)} />
        <div className="h-3" />
        <Textarea label="Prayer focus" name="prayer" value={prayer} onChange={(e) => setPrayer(e.target.value)} />
      </Card>
      <div className="flex justify-between gap-2">
        <Button type="submit" loading={busy}>Save changes</Button>
        <Button type="button" variant="ghost" leadingIcon={<LogOut size={16} />} onClick={signOut}>
          Sign out
        </Button>
      </div>
    </form>
  );
}
