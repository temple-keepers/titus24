import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { fullDate, cn } from '@/lib/utils';
import { Plus, MapPin, Calendar, Clock, Package, Check, HelpCircle, X, Globe } from 'lucide-react';
import type { RSVPStatus } from '@/types';

const rsvpOptions: { status: RSVPStatus; label: string; icon: typeof Check }[] = [
  { status: 'coming', label: 'Coming', icon: Check },
  { status: 'maybe', label: 'Maybe', icon: HelpCircle },
  { status: 'no', label: "Can't make it", icon: X },
];

// Common timezones relevant to this community
const TIMEZONE_OPTIONS = [
  { value: 'America/Port_of_Spain', label: 'AST (Trinidad & Caribbean)' },
  { value: 'America/Guyana', label: 'GYT (Guyana)' },
  { value: 'America/New_York', label: 'EST/EDT (US East)' },
  { value: 'America/Chicago', label: 'CST/CDT (US Central)' },
  { value: 'America/Denver', label: 'MST/MDT (US Mountain)' },
  { value: 'America/Los_Angeles', label: 'PST/PDT (US West)' },
  { value: 'Europe/London', label: 'GMT/BST (London)' },
  { value: 'Africa/Lagos', label: 'WAT (West Africa)' },
  { value: 'America/Toronto', label: 'EST/EDT (Canada East)' },
];

/**
 * Convert an event's date + time (HH:mm) + timezone into the user's local time.
 * Returns a formatted string like "10:00 AM AST (2:00 PM your time)"
 */
function formatEventTime(dateStr: string, timeStr: string, eventTz: string): { eventTime: string; localTime: string | null; tzAbbr: string } {
  // If not a valid HH:mm, just return the raw text
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { eventTime: timeStr, localTime: null, tzAbbr: '' };

  const h = Number(match[1]);
  const m = Number(match[2]);

  // Format event time in its own timezone
  try {
    const eventDate = new Date(`${dateStr}T${timeStr.padStart(5, '0')}:00`);
    // Build a date in the event's timezone
    const eventTimeStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: eventTz,
    }).format(eventDate);

    const tzAbbr = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short', timeZone: eventTz,
    }).formatToParts(eventDate).find(p => p.type === 'timeZoneName')?.value || '';

    // Build a proper UTC date from the event's local time
    // Create a formatter that tells us the UTC offset of the event timezone
    const utcDate = dateToUTC(dateStr, timeStr, eventTz);

    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (userTz === eventTz) {
      return { eventTime: `${eventTimeStr} ${tzAbbr}`, localTime: null, tzAbbr };
    }

    const localTimeStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: userTz,
    }).format(utcDate);

    const localTzAbbr = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short', timeZone: userTz,
    }).formatToParts(utcDate).find(p => p.type === 'timeZoneName')?.value || '';

    return {
      eventTime: `${eventTimeStr} ${tzAbbr}`,
      localTime: `${localTimeStr} ${localTzAbbr}`,
      tzAbbr,
    };
  } catch {
    // Fallback: just format with basic logic
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return { eventTime: `${h12}:${String(m).padStart(2, '0')} ${ampm}`, localTime: null, tzAbbr: '' };
  }
}

/**
 * Convert a date string + HH:mm time in a specific timezone to a UTC Date object.
 */
function dateToUTC(dateStr: string, timeStr: string, tz: string): Date {
  // Parse the target date/time components
  const [year, month, day] = dateStr.split('-').map(Number);
  const [h, m] = timeStr.split(':').map(Number);

  // Create a date and use Intl to figure out the offset
  // Start with a rough estimate
  const rough = new Date(Date.UTC(year, month - 1, day, h, m));

  // Get what that UTC time looks like in the target timezone
  const inTz = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: tz,
  }).formatToParts(rough);

  const parts: Record<string, number> = {};
  for (const p of inTz) {
    if (p.type === 'year') parts.year = Number(p.value);
    if (p.type === 'month') parts.month = Number(p.value);
    if (p.type === 'day') parts.day = Number(p.value);
    if (p.type === 'hour') parts.hour = Number(p.value);
    if (p.type === 'minute') parts.minute = Number(p.value);
  }

  // Calculate the offset: rough is UTC, parts is what it looks like in tz
  const tzDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour === 24 ? 0 : parts.hour, parts.minute));
  const offsetMs = tzDate.getTime() - rough.getTime();

  // The actual UTC time for our desired local time is shifted back by the offset
  const target = new Date(Date.UTC(year, month - 1, day, h, m));
  return new Date(target.getTime() - offsetMs);
}

export default function Events() {
  const {
    user, profile, events, rsvps,
    addEvent, rsvpEvent, addToast,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState('America/Port_of_Spain');
  const [location, setLocation] = useState('');
  const [whatToBring, setWhatToBring] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const now = new Date();

  const upcoming = useMemo(() => events.filter((e) => new Date(e.date) >= now), [events]);
  const past = useMemo(() => events.filter((e) => new Date(e.date) < now), [events]);

  const handleCreate = async () => {
    if (!title.trim() || !date || !time) return;
    setSaving(true);
    try {
      await addEvent({
        title: title.trim(), description: description.trim(),
        date, time, timezone,
        location: location.trim(), what_to_bring: whatToBring.trim() || null,
      });
      setTitle(''); setDescription(''); setDate(''); setTime('');
      setTimezone('America/Port_of_Spain');
      setLocation(''); setWhatToBring('');
      setShowModal(false);
    } catch {
      addToast('error', 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const renderEventTime = (event: typeof events[0]) => {
    const { eventTime, localTime } = formatEventTime(event.date, event.time, event.timezone || 'America/Port_of_Spain');
    return (
      <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <Clock size={14} className="mt-0.5 flex-shrink-0" />
        <div>
          <div>{eventTime}</div>
          {localTime && (
            <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-brand)' }}>
              <Globe size={10} /> {localTime} your time
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Events
        </h1>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Create
          </button>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState message="No events yet" />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
                Upcoming
              </h2>
              <div className="space-y-4 stagger">
                {upcoming.map((event) => {
                  const eventRsvps = rsvps.filter((r) => r.event_id === event.id);
                  const myRsvp = eventRsvps.find((r) => r.user_id === user?.id);
                  const comingCount = eventRsvps.filter((r) => r.status === 'coming').length;

                  return (
                    <div key={event.id} className="card space-y-3">
                      <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                        {event.title}
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          <Calendar size={14} /> {fullDate(event.date)}
                        </div>
                        {renderEventTime(event)}
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            <MapPin size={14} /> {event.location}
                          </div>
                        )}
                        {event.what_to_bring && (
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            <Package size={14} /> {event.what_to_bring}
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-brand)' }}>
                        {comingCount} {comingCount === 1 ? 'sister' : 'sisters'} coming
                      </div>
                      <div className="flex gap-2">
                        {rsvpOptions.map(({ status, label, icon: Icon }) => (
                          <button
                            key={status}
                            onClick={() => rsvpEvent(event.id, status)}
                            className={cn(
                              'btn btn-sm flex-1',
                              myRsvp?.status === status ? 'btn-primary' : 'btn-secondary'
                            )}
                          >
                            <Icon size={14} /> {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
                Past Events
              </h2>
              {past.map((event) => (
                <div key={event.id} className="card opacity-60">
                  <h3 className="font-display font-semibold" style={{ color: 'var(--color-text)' }}>
                    {event.title}
                  </h3>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                    {fullDate(event.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Event">
        <div className="space-y-4">
          <div>
            <label className="label">Event Title *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sisters' Brunch" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's the gathering about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Time *</label>
              <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Timezone</label>
            <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where is it?" />
          </div>
          <div>
            <label className="label">What to Bring</label>
            <input className="input" value={whatToBring} onChange={(e) => setWhatToBring(e.target.value)} placeholder="A dish, Bible, etc." />
          </div>
          <button className="btn btn-primary w-full" onClick={handleCreate} disabled={saving || !title.trim() || !date || !time}>
            {saving ? 'Creating…' : 'Create Event'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
