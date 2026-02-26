import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns';

/** "2 hours ago", "3 days ago" etc. */
export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

/** Smart date: "Today", "Yesterday", or "12 Jan 2025" */
export function smartDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM yyyy');
}

/** "Saturday, 15 March 2025" */
export function fullDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, d MMMM yyyy');
}

/** "2:30 PM" — handles HH:mm or free-text gracefully */
export function formatTime(timeStr: string): string {
  // If it's a standard HH:mm format, format it nicely
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const d = new Date();
    d.setHours(Number(match[1]), Number(match[2]));
    return format(d, 'h:mm a');
  }
  // Otherwise return the free-text as-is (e.g. "10:00 AM AST / 2:00 PM GMT")
  return timeStr;
}

/** Generate unique ID */
export function uid(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
}

/** Truncate text */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + '…';
}

/** Clsx-lite: conditional class joining */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Build comment tree from flat array */
export function buildCommentTree(
  comments: Array<{ id: string; parent_id: string | null; [key: string]: any }>
) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  comments.forEach((c) => {
    map.set(c.id, { ...c, replies: [] });
  });

  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
