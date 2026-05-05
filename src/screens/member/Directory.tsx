import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { Input } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { listSisters } from '../../data/queries';
import type { Profile, MaritalStatus } from '../../lib/database.types';
import { isLeadership, publicRole } from '../../lib/roles';
import { cn } from '../../lib/cn';

type RoleFilter = 'any' | 'elder' | 'member';
type Stage = 'any' | '20s' | '30s' | '40s' | '50s' | '60s+';
type MaritalFilter = MaritalStatus | 'any';

export default function Directory() {
  const [sisters, setSisters] = useState<Profile[]>([]);
  const [q, setQ] = useState('');
  const [country, setCountry] = useState<string>('any');
  const [role, setRole] = useState<RoleFilter>('any');
  const [marital, setMarital] = useState<MaritalFilter>('any');
  const [skill, setSkill] = useState<string>('any');
  const [stage, setStage] = useState<Stage>('any');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSisters().then((s) => {
      setSisters(s);
      setLoading(false);
    });
  }, []);

  // Build filter option lists from the actual data so we don't show
  // "Trinidad" as an option if no sister lives there.
  const countries = useMemo(() => {
    const set = new Set<string>();
    sisters.forEach((s) => {
      if (s.country) set.add(s.country);
    });
    return Array.from(set).sort();
  }, [sisters]);

  const skills = useMemo(() => {
    const set = new Set<string>();
    sisters.forEach((s) => (s.skills ?? []).forEach((k) => set.add(k)));
    return Array.from(set).sort();
  }, [sisters]);

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return sisters.filter((s) => {
      if (lower) {
        const hay = [s.display_name, s.first_name, s.last_name, s.city, s.country, s.profession]
          .filter(Boolean)
          .map((v) => v!.toLowerCase());
        if (!hay.some((v) => v.includes(lower))) return false;
      }
      if (country !== 'any' && s.country !== country) return false;
      if (role === 'elder' && !isLeadership(s.role)) return false;
      if (role === 'member' && isLeadership(s.role)) return false;
      if (marital !== 'any' && s.marital_status !== marital) return false;
      if (skill !== 'any' && !(s.skills ?? []).includes(skill)) return false;
      if (stage !== 'any' && stageOfLife(s.birthday) !== stage) return false;
      return true;
    });
  }, [sisters, q, country, role, marital, skill, stage]);

  const activeFilterCount =
    (country !== 'any' ? 1 : 0) +
    (role !== 'any' ? 1 : 0) +
    (marital !== 'any' ? 1 : 0) +
    (skill !== 'any' ? 1 : 0) +
    (stage !== 'any' ? 1 : 0);

  function clearFilters() {
    setCountry('any');
    setRole('any');
    setMarital('any');
    setSkill('any');
    setStage('any');
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="font-display text-3xl">Directory</h1>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            name="q"
            placeholder="Search by name, city, or profession"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'relative shrink-0 rounded-2xl border px-3 py-2 text-sm font-semibold',
            activeFilterCount > 0
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-app text-app-muted hover:bg-surface-raised'
          )}
          aria-label="Toggle filters"
        >
          <Filter size={16} className="inline" /> Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <Card className="space-y-3">
          <FilterRow label="Country">
            <ChipGroup
              options={[{ label: 'Any', value: 'any' }, ...countries.map((c) => ({ label: c, value: c }))]}
              value={country}
              onChange={(v) => setCountry(v)}
            />
          </FilterRow>
          <FilterRow label="Role">
            <ChipGroup
              options={[
                { label: 'Any', value: 'any' },
                { label: 'Elders', value: 'elder' },
                { label: 'Sisters', value: 'member' },
              ]}
              value={role}
              onChange={(v) => setRole(v as RoleFilter)}
            />
          </FilterRow>
          <FilterRow label="Marital status">
            <ChipGroup
              options={[
                { label: 'Any', value: 'any' },
                { label: 'Single', value: 'single' },
                { label: 'Married', value: 'married' },
                { label: 'Divorced', value: 'divorced' },
                { label: 'Widowed', value: 'widowed' },
              ]}
              value={marital}
              onChange={(v) => setMarital(v as MaritalFilter)}
            />
          </FilterRow>
          {skills.length > 0 && (
            <FilterRow label="Skill">
              <ChipGroup
                options={[{ label: 'Any', value: 'any' }, ...skills.map((s) => ({ label: s, value: s }))]}
                value={skill}
                onChange={(v) => setSkill(v)}
              />
            </FilterRow>
          )}
          <FilterRow label="Decade of life">
            <ChipGroup
              options={[
                { label: 'Any', value: 'any' },
                { label: '20s', value: '20s' },
                { label: '30s', value: '30s' },
                { label: '40s', value: '40s' },
                { label: '50s', value: '50s' },
                { label: '60s+', value: '60s+' },
              ]}
              value={stage}
              onChange={(v) => setStage(v as Stage)}
            />
          </FilterRow>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </Card>
      )}

      <p className="text-xs text-app-muted">
        Showing <span className="font-semibold tabular-nums">{filtered.length}</span> of{' '}
        <span className="tabular-nums">{sisters.length}</span> sisters.
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="No sisters match" body="Try a different search or fewer filters." icon={<Search size={24} />} />
      ) : (
        filtered.map((s) => (
          <Link key={s.id} to={`/profile/${s.id}`}>
            <Card className="hover:bg-surface-raised">
              <div className="flex items-center gap-3">
                <Avatar size={44} url={s.avatar_url} name={s.display_name ?? s.first_name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {s.display_name ?? (`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || 'Sister')}
                  </div>
                  <div className="truncate text-[11px] text-app-muted">
                    {[s.city, s.country].filter(Boolean).join(', ')}
                    {s.profession && ` · ${s.profession}`}
                  </div>
                  {s.skills && s.skills.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.skills.slice(0, 3).map((sk) => (
                        <span
                          key={sk}
                          className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700"
                        >
                          {sk}
                        </span>
                      ))}
                      {s.skills.length > 3 && (
                        <span className="text-[10px] text-app-muted">+{s.skills.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                {isLeadership(s.role) && (
                  <span className="shrink-0 rounded-full bg-gold-400/20 px-2 py-0.5 text-[11px] font-semibold text-gold-600">
                    {publicRole(s.role)}
                  </span>
                )}
              </div>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}

function stageOfLife(birthday: string | null): Stage | null {
  if (!birthday) return null;
  const [y] = birthday.split('-').map(Number);
  if (!y) return null;
  const age = new Date().getFullYear() - y;
  if (age < 30) return '20s';
  if (age < 40) return '30s';
  if (age < 50) return '40s';
  if (age < 60) return '50s';
  return '60s+';
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-app-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-semibold',
            value === o.value
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-app text-app-muted hover:bg-surface-raised'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
