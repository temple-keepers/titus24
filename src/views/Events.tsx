import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { fullDate, formatTime, cn } from '@/lib/utils';
import { Plus, MapPin, Calendar, Clock, Package, Check, HelpCircle, X } from 'lucide-react';
import type { RSVPStatus } from '@/types';

const rsvpOptions: { status: RSVPStatus; label: string; icon: typeof Check }[] = [
  { status: 'coming', label: 'Coming', icon: Check },
  { status: 'maybe', label: 'Maybe', icon: HelpCircle },
  { status: 'no', label: "Can't make it", icon: X },
];

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
  const [location, setLocation] = useState('');
  const [whatToBring, setWhatToBring] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const now = new Date();

  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now);

  const handleCreate = async () => {
    if (!title.trim() || !date || !time) return;
    setSaving(true);
    try {
      await addEvent({ title: title.trim(), description: description.trim(), date, time, location: location.trim(), what_to_bring: whatToBring.trim() || null });
      setTitle(''); setDescription(''); setDate(''); setTime('');
      setLocation(''); setWhatToBring('');
      setShowModal(false);
    } catch {
      addToast('error', 'Failed to create event');
    } finally {
      setSaving(false);
    }
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
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          <Clock size={14} /> {formatTime(event.time)}
                        </div>
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
