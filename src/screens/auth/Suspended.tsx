import { AuthLayout } from './AuthLayout';
import { Button } from '../../components/Button';
import { useAuth } from '../../auth/AuthProvider';

export default function Suspended() {
  const { profile, signOut } = useAuth();
  return (
    <AuthLayout title="Your account is paused" subtitle="Please reach out if you believe this is in error.">
      <p className="text-sm leading-6">
        Your access to Titus 2:4 has been temporarily paused by leadership.
      </p>
      {profile?.banned_reason && (
        <div className="mt-3 rounded-2xl border border-app bg-surface-raised p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-app-muted">Reason</p>
          <p>{profile.banned_reason}</p>
        </div>
      )}
      <p className="mt-4 text-xs text-app-muted">
        For questions, please email an elder.
      </p>
      <div className="mt-6">
        <Button variant="secondary" fullWidth onClick={signOut}>
          Sign out
        </Button>
      </div>
    </AuthLayout>
  );
}
