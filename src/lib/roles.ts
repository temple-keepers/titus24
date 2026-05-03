import type { Role } from './database.types';

/**
 * Public-facing role label. Per REBUILD-BRIEF §4 and §8, both `elder` and
 * `admin` are displayed as "Elder" everywhere user-facing — the `admin`
 * label only appears inside the admin dashboard itself.
 */
export function publicRole(role: Role): 'Elder' | 'Sister' {
  return role === 'admin' || role === 'elder' ? 'Elder' : 'Sister';
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === 'admin';
}

export function isLeadership(role: Role | null | undefined): boolean {
  return role === 'admin' || role === 'elder';
}
