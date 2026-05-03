import { useState, type FormEvent } from 'react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ScripturePill } from '../../components/Card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';

export default function Onboarding() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { addToast } = useToast();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!city.trim() && !country.trim()) {
      addToast({ kind: 'error', title: 'Please add at least one of city or country.' });
      return;
    }
    setBusy(true);
    const display_name = firstName.trim() || profile?.first_name || user.email?.split('@')[0] || 'Sister';

    // Use upsert in case the profile row hasn't been auto-created by a trigger.
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
        },
        { onConflict: 'id' }
      );
    setBusy(false);
    if (failIfError(error, 'save your profile', addToast)) return;

    await refreshProfile();
    addToast({ kind: 'success', title: `Welcome, sister!` });
  }

  return (
    <AuthLayout title="Welcome, sister" subtitle="Help us know where to find you.">
      <ScripturePill reference="Jeremiah 29:11">
        For I know the plans I have for you, plans to prosper you and not to harm you.
      </ScripturePill>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <Input label="First name" name="first_name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="City (optional)" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input
          label="Country"
          name="country"
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          hint="Either a city or a country is enough to get going."
        />
        <Button type="submit" loading={busy} fullWidth>
          Take me in
        </Button>
        <button
          type="button"
          onClick={signOut}
          className="block w-full text-center text-xs text-app-muted hover:text-app"
        >
          Sign out
        </button>
      </form>
    </AuthLayout>
  );
}
