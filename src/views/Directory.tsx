import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import { MapPin, Search, Sparkles, Heart, MessageCircle } from 'lucide-react';
import type { Profile } from '@/types';

// Admins are also elders — sorted and displayed alongside elders
const roleOrder = { elder: 0, admin: 0, member: 1 };

const roleBadgeClass = (role: string) => {
  if (role === 'elder' || role === 'admin') return 'badge-gold';
  return 'badge-sage';
};

const roleLabel = (role: string) => {
  if (role === 'elder' || role === 'admin') return 'Elder';
  return 'Member';
};

export default function Directory() {
  const { profiles, user } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'elder' | 'member'>('all');
  const navigate = useNavigate();
  const viewProfile = (p: Profile) => navigate(`/member/${p.id}`);

  const activeProfiles = profiles.filter((p) => (p.status || 'active') === 'active');
  const allMembers = activeProfiles.filter((p) => p.id !== user?.id);

  const filtered = useMemo(() => {
    return activeProfiles
      .filter((p) => p.id !== user?.id)
      .filter((p) => {
        const matchesSearch = search === '' ||
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase());
        // Admins are also elders
        const displayRole = p.role === 'admin' ? 'elder' : p.role;
        const matchesRole = roleFilter === 'all' || displayRole === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const ra = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
        const rb = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
        if (ra !== rb) return ra - rb;
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      });
  }, [activeProfiles, user, search, roleFilter]);

  // Split members by role for sectioned view (admins grouped with elders)
  const elders = useMemo(() => filtered.filter((m) => m.role === 'elder' || m.role === 'admin'), [filtered]);
  const regularMembers = useMemo(() => filtered.filter((m) => m.role === 'member'), [filtered]);

  const showSections = roleFilter === 'all' && !search;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Directory
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {allMembers.length} {allMembers.length === 1 ? 'sister' : 'sisters'} in the community
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Role filters */}
      <div className="flex gap-2">
        {([
          { key: 'all' as const, label: 'All', count: allMembers.length },
          { key: 'elder' as const, label: 'Elders', count: allMembers.filter(p => p.role === 'elder' || p.role === 'admin').length },
          { key: 'member' as const, label: 'Members', count: allMembers.filter(p => p.role === 'member').length },
        ]).map(({ key, label, count }) => (
          <button
            key={key}
            className={cn('btn btn-sm flex-1', roleFilter === key && 'btn-primary')}
            onClick={() => setRoleFilter(key)}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Members */}
      {filtered.length === 0 ? (
        <EmptyState message={search ? 'No members match your search' : 'No other members yet'} />
      ) : showSections ? (
        /* Sectioned view — clear distinction between roles */
        <div className="space-y-6 stagger">
          {/* Elders Section */}
          {elders.length > 0 && (
            <div>
              <div
                className="flex items-center gap-2 mb-3 px-1 pb-2"
                style={{ borderBottom: '2px solid var(--color-gold)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-gold-soft)' }}
                >
                  <Sparkles size={14} style={{ color: 'var(--color-gold)' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>
                    Elders
                  </h2>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                    Guiding with wisdom & grace
                  </p>
                </div>
                <span className="badge badge-gold text-xs ml-auto">{elders.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {elders.map((m) => (
                  <MemberCard key={m.id} member={m} onSelect={viewProfile} variant="elder" />
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          {regularMembers.length > 0 && (
            <div>
              <div
                className="flex items-center gap-2 mb-3 px-1 pb-2"
                style={{ borderBottom: '2px solid var(--color-sage)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-sage-soft)' }}
                >
                  <Heart size={14} style={{ color: 'var(--color-sage)' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: 'var(--color-sage)' }}>
                    Members
                  </h2>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                    Growing together in faith
                  </p>
                </div>
                <span className="badge badge-sage text-xs ml-auto">{regularMembers.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {regularMembers.map((m) => (
                  <MemberCard key={m.id} member={m} onSelect={viewProfile} variant="member" />
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Flat grid view for filtered/searched */
        <div className="grid grid-cols-2 gap-3 stagger">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} onSelect={viewProfile} variant={(m.role === 'elder' || m.role === 'admin') ? 'elder' : 'member'} />
          ))}
        </div>
      )}

    </div>
  );
}

// ─── Member Card ────────────────────────────────────────────
function MemberCard({
  member,
  onSelect,
  variant,
}: {
  member: Profile;
  onSelect: (profile: Profile) => void;
  variant: 'elder' | 'member';
}) {
  const accentColor =
    variant === 'elder' ? 'var(--color-gold)' : 'var(--color-sage)';

  return (
    <button
      onClick={() => onSelect(member)}
      className="card flex flex-col items-center text-center py-5 px-3 transition-all active:scale-[0.97] cursor-pointer"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Avatar with role-colored ring */}
      <div
        className="rounded-full p-[2.5px]"
        style={{
          background: variant === 'elder'
            ? 'linear-gradient(135deg, #FFD98F 0%, #E6AD3E 100%)'
            : 'var(--gradient-sage)',
        }}
      >
        <div className="rounded-full p-[2px]" style={{ background: 'var(--color-bg-raised)' }}>
          <Avatar src={member.photo_url} name={member.first_name} size="lg" />
        </div>
      </div>

      <h3 className="font-semibold text-sm mt-3" style={{ color: 'var(--color-text)' }}>
        {member.first_name}
      </h3>

      {/* Role badge with icon */}
      <span
        className={cn('badge badge-sm mt-1.5 flex items-center gap-1', roleBadgeClass(member.role))}
      >
        {variant === 'elder' && <Sparkles size={10} />}
        {variant === 'member' && <Heart size={10} />}
        {roleLabel(variant)}
      </span>

      {(member.city || member.area) && (
        <div className="flex items-center gap-1 text-xs mt-1.5" style={{ color: 'var(--color-text-faint)' }}>
          <MapPin size={10} /> {member.city && member.country
            ? `${member.city}, ${member.country}`
            : member.area}
        </div>
      )}

      {/* Tap hint */}
      <div className="flex items-center gap-1 text-[10px] mt-2 font-medium" style={{ color: accentColor }}>
        <MessageCircle size={10} /> View Profile
      </div>
    </button>
  );
}
