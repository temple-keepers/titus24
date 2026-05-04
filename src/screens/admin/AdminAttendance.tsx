import { useEffect, useMemo, useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { EventRow, Profile } from '../../lib/database.types';
import { parseLocalDate } from '../../lib/dates';

interface AttendanceRow {
  id: string;
  event_id: string;
  user_id: string;
  recorded_by: string | null;
  date: string;
}

export default function AdminAttendance() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [{ data: e }, { data: m }, { data: a }] = await Promise.all([
      supabase.from('events').select('*').order('date', { ascending: false }),
      supabase.from('profiles').select('*').eq('status', 'active').order('display_name'),
      supabase.from('attendance').select('*'),
    ]);
    setEvents((e as EventRow[] | null) ?? []);
    setMembers((m as Profile[] | null) ?? []);
    setAttendance((a as AttendanceRow[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const presentByEvent = useMemo(() => {
    const m = new Map<string, Set<string>>();
    attendance.forEach((row) => {
      if (!m.has(row.event_id)) m.set(row.event_id, new Set());
      m.get(row.event_id)!.add(row.user_id);
    });
    return m;
  }, [attendance]);

  async function toggle(eventId: string, userId: string, currentlyAttended: boolean) {
    if (currentlyAttended) {
      const row = attendance.find((a) => a.event_id === eventId && a.user_id === userId);
      if (!row) return;
      const { error } = await supabase.from('attendance').delete().eq('id', row.id);
      if (failIfError(error, 'remove attendance', addToast)) return;
    } else {
      const { error } = await supabase.from('attendance').insert({
        event_id: eventId,
        user_id: userId,
        recorded_by: user?.id ?? null,
        date: new Date().toISOString(),
      });
      if (failIfError(error, 'mark attendance', addToast)) return;
    }
    refresh();
  }

  if (loading) return <LoadingPage />;

  if (selectedEventId) {
    const ev = events.find((e) => e.id === selectedEventId);
    const present = presentByEvent.get(selectedEventId) ?? new Set();
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedEventId(null)} className="text-sm font-semibold text-brand-600">
          ← All events
        </button>
        {ev && (
          <Card>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-brand-100 px-3 py-2 text-center min-w-[56px]">
                <div className="text-[11px] font-semibold uppercase text-brand-700">
                  {parseLocalDate(ev.date).toLocaleDateString(undefined, { month: 'short' })}
                </div>
                <div className="font-display text-2xl text-brand-700">{parseLocalDate(ev.date).getDate()}</div>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl">{ev.title}</h2>
                <p className="text-xs text-app-muted">
                  {present.size} of {members.length} attended
                </p>
              </div>
            </div>
          </Card>
        )}
        <SectionTitle>Mark attendance</SectionTitle>
        {members.map((m) => {
          const attended = present.has(m.id);
          return (
            <Card key={m.id}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attended}
                  onChange={() => toggle(selectedEventId, m.id, attended)}
                  className="h-5 w-5 accent-brand-500"
                />
                <Avatar size={36} url={m.avatar_url} name={m.display_name ?? m.first_name} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{m.display_name ?? m.first_name}</div>
                  <div className="text-[11px] text-app-muted truncate">
                    {[m.city, m.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </label>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <EmptyState title="No events yet" body="Create an event first, then come here to mark attendance." icon={<Calendar size={28} />} />
      ) : (
        events.map((ev) => {
          const count = presentByEvent.get(ev.id)?.size ?? 0;
          return (
            <Card key={ev.id} className="cursor-pointer hover:bg-surface-raised">
              <button onClick={() => setSelectedEventId(ev.id)} className="block w-full text-left">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-100 px-3 py-2 text-center min-w-[56px]">
                    <div className="text-[11px] font-semibold uppercase text-brand-700">
                      {parseLocalDate(ev.date).toLocaleDateString(undefined, { month: 'short' })}
                    </div>
                    <div className="font-display text-2xl text-brand-700">{parseLocalDate(ev.date).getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{ev.title}</div>
                    <div className="text-[11px] text-app-muted">
                      <Users size={12} className="inline mr-1" />
                      {count} attended
                    </div>
                  </div>
                </div>
              </button>
            </Card>
          );
        })
      )}
    </div>
  );
}
