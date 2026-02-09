import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { MapPin } from 'lucide-react';

export default function Directory() {
  const { profiles, user } = useApp();
  const members = profiles.filter((p) => p.id !== user?.id);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Directory
      </h1>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {members.length} {members.length === 1 ? 'sister' : 'sisters'} in the community
      </p>
      {members.length === 0 ? (
        <EmptyState message="No other members yet" />
      ) : (
        <div className="grid grid-cols-2 gap-3 stagger">
          {members.map((m) => (
            <div key={m.id} className="card flex flex-col items-center text-center py-5 px-3">
              <Avatar src={m.photo_url} name={m.first_name} size="lg" />
              <h3 className="font-semibold text-sm mt-3" style={{ color: 'var(--color-text)' }}>
                {m.first_name}
              </h3>
              {m.area && (
                <div className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                  <MapPin size={10} /> {m.area}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
