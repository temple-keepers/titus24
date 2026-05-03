import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HandHeart, MessageCircle } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';

export default function PrayerPartners() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('prayer_partnerships')
        .select('user_a_id, user_b_id')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .gte('period_end', today)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      const row = data as { user_a_id: string; user_b_id: string } | null;
      if (!row) {
        setLoading(false);
        return;
      }
      const partnerId = row.user_a_id === user.id ? row.user_b_id : row.user_a_id;
      const { data: p } = await supabase.from('profiles').select('*').eq('id', partnerId).maybeSingle();
      setPartner((p as Profile | null) ?? null);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-3xl">Prayer Partners</h1>
      {!partner ? (
        <EmptyState
          title="No partner assigned yet"
          body="An elder pairs sisters into prayer partners — yours will show up here when you're matched."
          icon={<HandHeart size={28} />}
        />
      ) : (
        <Card>
          <div className="flex items-start gap-4">
            <Avatar size={72} url={partner.avatar_url} name={partner.display_name ?? partner.first_name} />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-brand-600">Your partner</p>
              <h2 className="font-display text-2xl">{partner.display_name ?? partner.first_name}</h2>
              <p className="text-sm text-app-muted">{[partner.city, partner.country].filter(Boolean).join(', ')}</p>
              {partner.prayer_focus && (
                <div className="mt-3 rounded-2xl bg-pink-wash p-3" style={{ background: 'var(--pink-wash)' }}>
                  <p className="text-xs uppercase tracking-wide text-app-muted">Prayer focus</p>
                  <p className="text-sm">{partner.prayer_focus}</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Button leadingIcon={<MessageCircle size={16} />} onClick={() => nav(`/messages/${partner.id}`)}>
              Send a message
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
