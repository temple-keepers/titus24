import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input, Textarea } from '../../components/Input';
import { Button } from '../../components/Button';
import { ScripturePill } from '../../components/Card';
import { ImageUpload } from '../../components/ImageUpload';
import { Avatar } from '../../components/Avatar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { cn } from '../../lib/cn';

type Step = 'where' | 'about' | 'photo' | 'done';

export default function Onboarding() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState<Step>('where');

  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [verse, setVerse] = useState(profile?.favourite_verse ?? '');
  const [about, setAbout] = useState(profile?.about ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [busy, setBusy] = useState(false);

  async function saveAndContinue(nextStep: Step, opts?: { final?: boolean }) {
    if (!user) return;
    setBusy(true);
    const display_name =
      firstName.trim() || profile?.first_name || user.email?.split('@')[0] || 'Sister';
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          first_name: firstName.trim() || null,
          display_name,
          city: city.trim() || null,
          country: country.trim() || null,
          favourite_verse: verse.trim() || null,
          about: about.trim() || null,
          avatar_url: avatarUrl || null,
        },
        { onConflict: 'id' }
      );
    setBusy(false);
    if (failIfError(error, 'save your profile', addToast)) return;
    await refreshProfile();
    setStep(nextStep);
    if (opts?.final) {
      addToast({ kind: 'success', title: 'Welcome, sister!', body: 'Your profile is set up.' });
    }
  }

  async function onWhereSubmit(e: FormEvent) {
    e.preventDefault();
    if (!city.trim() && !country.trim()) {
      addToast({ kind: 'error', title: 'Please add at least one of city or country.' });
      return;
    }
    await saveAndContinue('about');
  }

  if (step === 'done') {
    return (
      <AuthLayout title="You're in, sister" subtitle="Welcome to the sisterhood.">
        <ScripturePill reference="Jeremiah 29:11">
          For I know the plans I have for you, plans to prosper you and not to harm you.
        </ScripturePill>
        <p className="mt-4 text-sm leading-7">
          Your profile is set. You can fill in more about yourself any time from your Profile.
        </p>
        <div className="mt-6">
          <Link to="/">
            <Button trailingIcon={<ArrowRight size={16} />} fullWidth>
              Take me to the sisterhood
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={
        step === 'where'
          ? 'Welcome, sister'
          : step === 'about'
          ? 'Tell us a little about you'
          : 'Add a photo'
      }
      subtitle={
        step === 'where'
          ? 'Help us know where to find you.'
          : step === 'about'
          ? 'Optional — you can skip and come back later.'
          : 'A face helps your sisters say hi. Optional.'
      }
    >
      <Stepper current={step} />

      {step === 'where' && (
        <form className="mt-5 space-y-4" onSubmit={onWhereSubmit}>
          <ScripturePill reference="Jeremiah 29:11">
            For I know the plans I have for you, plans to prosper you and not to harm you.
          </ScripturePill>
          <Input
            label="First name"
            name="first_name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input
            label="Country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            hint="Either a city or a country is enough to get going."
          />
          <Button type="submit" loading={busy} trailingIcon={<ArrowRight size={16} />} fullWidth>
            Continue
          </Button>
          <button
            type="button"
            onClick={signOut}
            className="block w-full text-center text-xs text-app-muted hover:text-app"
          >
            Sign out
          </button>
        </form>
      )}

      {step === 'about' && (
        <div className="mt-5 space-y-4">
          <Input
            label="Favourite verse"
            placeholder="Like Proverbs 31:25"
            value={verse}
            onChange={(e) => setVerse(e.target.value)}
          />
          <Textarea
            label="A bit about you"
            placeholder="What season are you in, sister?"
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('photo')}
              fullWidth
            >
              Skip
            </Button>
            <Button
              type="button"
              loading={busy}
              trailingIcon={<ArrowRight size={16} />}
              onClick={() => saveAndContinue('photo')}
              fullWidth
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'photo' && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <Avatar size={96} url={avatarUrl} name={firstName || 'Sister'} />
            {user && (
              <ImageUpload
                bucket="avatars"
                userId={user.id}
                value={avatarUrl}
                onChange={setAvatarUrl}
                buttonLabel={avatarUrl ? 'Change photo' : 'Upload photo'}
                label="JPG or PNG, up to 5 MB."
              />
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => saveAndContinue('done', { final: true })}
              fullWidth
            >
              Skip for now
            </Button>
            <Button
              type="button"
              loading={busy}
              leadingIcon={<Sparkles size={16} />}
              onClick={() => saveAndContinue('done', { final: true })}
              fullWidth
            >
              All done
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

function Stepper({ current }: { current: Step }) {
  const order: Step[] = ['where', 'about', 'photo'];
  const idx = order.indexOf(current);
  return (
    <div className="mt-2 flex items-center gap-2">
      {order.map((s, i) => (
        <span
          key={s}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            i <= idx ? 'bg-brand-500' : 'bg-app-muted/20'
          )}
        />
      ))}
    </div>
  );
}
