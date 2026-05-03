import { useEffect, useState } from 'react';
import { Calendar, MapPin, Check, X as XIcon, HelpCircle } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { listMyRsvps, listUpcomingEvents } from '../../data/queries';
import type { EventRow, Rsvp, RsvpStatus } from '../../lib/database.types';
import { formatEventTime, parseLocalDate } from '../../lib/dates';
import { cn } from '../../lib/cn';

export default function Events() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [myRsvps, setMyRsvps] = useState<Record<string, RsvpStatus>>({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!user) return;
    const [evs, rsvps] = await Promise.all([listUpcomingEvents(180), listMyRsvps(user.id)]);
    setEvents(evs);
    const map: Record<string, RsvpStatus> = {};
    rsvps.forEach((r: Rsvp) => {
      map[r.event_id] = r.status;
    });
    setMyRsvps(map);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function setRsvp(eventId: string, status: RsvpStatus) {
    if (!user) return;
    const { error } = await supabase
      .from('rsvps')
      .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: 'event_id,user_id' });
    if (failIfError(error, 'save your RSVP', addToast)) return;
    setMyRsvps((m) => ({ ...m, [eventId]: status }));
    addToast({ kind: 'success', title: status === 'going' ? 'See you there, sister' : 'Got it' });
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Events</h1>
      {events.length === 0 ? (
        <EmptyState title="No upcoming events" body="When something is added, you'll see it here." icon={<Calendar size={28} />} />
      ) : (
        events.map((ev) => {
          const { eventLine, localLine } = formatEventTime(ev.date, ev.time, ev.timezone || 'UTC');
          const my = myRsvps[ev.id];
          return (
            <Card key={ev.id}>
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-brand-100 px-3 py-3 text-center min-w-[64px]">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    {parseLocalDate(ev.date).toLocaleDateString(undefined, { month: 'short' })}
                  </div>
                  <div className="font-display text-3xl text-brand-700">{parseLocalDate(ev.date).getDate()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl">{ev.title}</h2>
                  <p className="text-xs text-app-muted">{eventLine}</p>
                  {localLine && <p className="text-[11px] text-brand-600">{localLine}</p>}
                  {ev.location && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-app-muted">
                      <MapPin size={12} /> {ev.location}
                    </p>
                  )}
                  {ev.description && <p className="mt-2 text-sm leading-6">{ev.description}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <RsvpBtn current={my} value="going" Icon={Check} label="Going" onClick={() => setRsvp(ev.id, 'going')} />
                <RsvpBtn current={my} value="maybe" Icon={HelpCircle} label="Maybe" onClick={() => setRsvp(ev.id, 'maybe')} />
                <RsvpBtn current={my} value="cant" Icon={XIcon} label="Can't make it" onClick={() => setRsvp(ev.id, 'cant')} />
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

function RsvpBtn({
  current,
  value,
  Icon,
  label,
  onClick,
}: {
  current?: RsvpStatus;
  value: RsvpStatus;
  Icon: typeof Calendar;
  label: string;
  onClick: () => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition',
        active ? 'bg-brand-500 text-white border-brand-500' : 'border-app text-app-muted hover:bg-surface-raised'
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
