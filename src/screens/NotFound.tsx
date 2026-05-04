import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/Card';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <EmptyState
        title="We couldn't find that page"
        body="The link may be broken, or the page may have moved. Let's get you back on track."
        icon={<Compass size={28} />}
        action={
          <Link to="/" className="text-sm font-semibold text-brand-600">
            ← Back to Home
          </Link>
        }
      />
    </div>
  );
}
