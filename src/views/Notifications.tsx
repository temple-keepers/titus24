import { useApp } from '@/context/AppContext';
import EmptyState from '@/components/EmptyState';
import { timeAgo, cn } from '@/lib/utils';
import {
  Heart, MessageCircle, Reply, Mail, Calendar, Hand,
  Award, BookOpen, Megaphone, Trash2, CheckCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<string, typeof Heart> = {
  reaction: Heart,
  comment: MessageCircle,
  reply: Reply,
  message: Mail,
  event_reminder: Calendar,
  prayer_response: Hand,
  badge_earned: Award,
  study_reminder: BookOpen,
  announcement: Megaphone,
};

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, unreadNotificationCount } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Notifications
        </h1>
        {unreadNotificationCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllNotificationsRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="No notifications yet" />
      ) : (
        <div className="space-y-2 stagger">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] ?? Megaphone;
            return (
              <div
                key={n.id}
                className={cn('card flex items-start gap-3 cursor-pointer', !n.is_read && 'card-glow')}
                style={!n.is_read ? { borderColor: 'rgba(245, 176, 65, 0.2)' } : undefined}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.link) navigate(n.link);
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: !n.is_read ? 'rgba(245, 176, 65, 0.1)' : 'var(--color-border)' }}
                >
                  <Icon size={16} style={{ color: !n.is_read ? 'var(--color-brand)' : 'var(--color-text-faint)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{n.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{n.body}</div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                <button
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--color-text-faint)' }}
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
