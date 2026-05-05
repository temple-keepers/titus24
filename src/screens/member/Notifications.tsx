import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { LoadingPage } from '../../components/LoadingPage';
import { PullToRefresh } from '../../components/PullToRefresh';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { listNotifications } from '../../data/queries';
import type { Notification } from '../../lib/database.types';
import { timeAgo } from '../../lib/dates';
import { cn } from '../../lib/cn';

export default function Notifications() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!user) return;
    setItems(await listNotifications(user.id));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function markRead(id: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (failIfError(error, 'mark notification read', addToast)) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    if (!user) return;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    if (failIfError(error, 'mark all read', addToast)) return;
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-3xl">Notifications</h1>
        {items.some((n) => !n.is_read) && (
          <button onClick={markAllRead} className="text-xs font-semibold text-brand-600">
            Mark all read
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState title="All caught up" body="You're up to date, sister." icon={<Bell size={24} />} />
      ) : (
        items.map((n) => {
          const Body = (
            <Card className={cn('hover:bg-surface-raised', !n.is_read && 'ring-1 ring-brand-200')}>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full" style={{ background: n.is_read ? 'transparent' : 'var(--rose)' }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{n.title}</div>
                  {n.body && <div className="text-sm text-app-muted">{n.body}</div>}
                  <div className="text-[11px] text-app-muted mt-1">{timeAgo(n.created_at)}</div>
                </div>
              </div>
            </Card>
          );
          return n.link ? (
            <Link key={n.id} to={n.link} onClick={() => markRead(n.id)}>{Body}</Link>
          ) : (
            <button key={n.id} onClick={() => markRead(n.id)} className="block w-full text-left">{Body}</button>
          );
        })
      )}
    </div>
    </PullToRefresh>
  );
}
