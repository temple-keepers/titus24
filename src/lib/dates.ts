import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Parse a date-only string ('YYYY-MM-DD') as **local** midnight.
 * `new Date('YYYY-MM-DD')` is parsed as UTC, which renders as the previous
 * day for any user east of UTC. See REBUILD-BRIEF §7.6.
 */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Today as 'YYYY-MM-DD' in the viewer's local timezone. */
export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "Today", "Yesterday", or "Mon 3 May" relative label. */
export function relativeDayLabel(s: string): string {
  const d = parseLocalDate(s);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE d MMM');
}

/** "3 minutes ago" style. */
export function timeAgo(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

/** Format an event in its own TZ + the viewer's local TZ. */
export function formatEventTime(date: string, time: string | null, eventTz: string): {
  eventLine: string;
  localLine: string | null;
} {
  if (!time) {
    return { eventLine: format(parseLocalDate(date), 'EEEE, d MMMM yyyy'), localLine: null };
  }
  // Construct an instant from the wall-clock time in eventTz.
  const iso = `${date}T${time.length === 5 ? `${time}:00` : time}`;
  // We can't easily compute timezone offsets without a tz lib; render the
  // wall-clock time and the timezone label, then a local-clock equivalent
  // assuming the event time string is already in the user's local TZ if no
  // mismatch. Proper conversion is wired up later via `Intl.DateTimeFormat`.
  let localLine: string | null = null;
  try {
    // Heuristic: ask Intl what the same wall-clock means in the event tz.
    // Use the viewer's browser locale so US users get MM/DD ordering and
    // 12-hour clock, while UK users still get DD/MM and 24-hour by default.
    const fmt = new Intl.DateTimeFormat(undefined, {
      timeZone: eventTz,
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const localFmt = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    // Treat the iso string as if it were UTC, then shift.
    const asDate = new Date(iso);
    const eventLine = `${fmt.format(asDate)} (${eventTz})`;
    const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (viewerTz !== eventTz) {
      localLine = `${localFmt.format(asDate)} your time`;
    }
    return { eventLine, localLine };
  } catch {
    return { eventLine: `${iso} (${eventTz})`, localLine };
  }
}
