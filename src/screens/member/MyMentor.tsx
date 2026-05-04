import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HandHeart, MessageCircle, Users } from 'lucide-react';
import { Card, EmptyState, ScripturePill, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';
import { isLeadership, publicRole } from '../../lib/roles';

interface AssignmentRow {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'active' | 'pending' | 'inactive';
  assigned_at: string;
}

export default function MyMentor() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [mentor, setMentor] = useState<Profile | null>(null);
  const [mentees, setMentees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    (async () => {
      const { data: rows } = await supabase
        .from('mentor_assignments')
        .select('*')
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .eq('status', 'active');

      const list = (rows as AssignmentRow[] | null) ?? [];
      if (!active) return;

      // If I'm a mentee, find my mentor.
      const asMentee = list.find((a) => a.mentee_id === user.id);
      if (asMentee) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', asMentee.mentor_id)
          .maybeSingle();
        if (active) setMentor((data as Profile | null) ?? null);
      }

      // If I'm a mentor, find my mentees.
      const asMentor = list.filter((a) => a.mentor_id === user.id);
      if (asMentor.length) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('id', asMentor.map((a) => a.mentee_id));
        if (active) setMentees((data as Profile[] | null) ?? []);
      }

      if (active) setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user]);

  if (loading) return <LoadingPage />;

  const isLeader = isLeadership(profile?.role);
  const hasMentor = !!mentor;
  const hasMentees = mentees.length > 0;

  if (!hasMentor && !hasMentees) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="font-display text-3xl">{isLeader ? 'Your mentees' : 'Your mentor'}</h1>
        <ScripturePill reference="Titus 2:4">
          That they may teach the young women to be sober, to love their husbands, to love their children…
        </ScripturePill>
        <EmptyState
          title={isLeader ? 'No mentees assigned to you yet' : 'No mentor assigned to you yet'}
          body={
            isLeader
              ? 'When leadership pairs a mentee with you, she will appear here.'
              : 'An elder will pair you with a mentor — keep an eye on this page.'
          }
          icon={<HandHeart size={28} />}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-3xl">Mentorship</h1>
      <ScripturePill reference="Titus 2:4">
        That they may teach the young women to be sober, to love their husbands, to love their children…
      </ScripturePill>

      {hasMentor && mentor && (
        <Card>
          <div className="flex items-start gap-4">
            <Avatar size={72} url={mentor.avatar_url} name={mentor.display_name ?? mentor.first_name} />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-brand-600">Your mentor</p>
              <h2 className="font-display text-2xl">{mentor.display_name ?? mentor.first_name}</h2>
              <p className="text-sm text-app-muted">
                {[mentor.city, mentor.country].filter(Boolean).join(', ')}
                {isLeadership(mentor.role) && (
                  <>
                    {' · '}
                    <span className="font-semibold text-gold-600">{publicRole(mentor.role)}</span>
                  </>
                )}
              </p>
              {mentor.about && <p className="mt-2 text-sm leading-6">{mentor.about}</p>}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button leadingIcon={<MessageCircle size={16} />} onClick={() => nav(`/messages/${mentor.id}`)}>
              Send a message
            </Button>
          </div>
        </Card>
      )}

      {hasMentees && (
        <>
          <SectionTitle>
            {mentees.length === 1 ? 'Your mentee' : `Your mentees (${mentees.length})`}
          </SectionTitle>
          {mentees.map((m) => (
            <Card key={m.id}>
              <div className="flex items-start gap-3">
                <Avatar size={56} url={m.avatar_url} name={m.display_name ?? m.first_name} />
                <div className="flex-1">
                  <h3 className="font-display text-xl">{m.display_name ?? m.first_name}</h3>
                  <p className="text-sm text-app-muted">{[m.city, m.country].filter(Boolean).join(', ')}</p>
                  {m.prayer_focus && (
                    <div className="mt-2 rounded-2xl px-3 py-2 text-xs" style={{ background: 'var(--pink-wash)' }}>
                      <span className="font-semibold uppercase tracking-wide text-app-muted">Prayer focus</span>
                      <p className="mt-1 text-sm">{m.prayer_focus}</p>
                    </div>
                  )}
                </div>
                <Button size="sm" leadingIcon={<MessageCircle size={14} />} onClick={() => nav(`/messages/${m.id}`)}>
                  Message
                </Button>
              </div>
            </Card>
          ))}
          {hasMentees && !hasMentor && isLeader && (
            <Card className="text-xs text-app-muted">
              <p className="flex items-center gap-2">
                <Users size={14} />
                You can also pair more sisters via Admin → Mentor pairings.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
