import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import Modal from '@/components/Modal';
import { cn } from '@/lib/utils';
import { MapPin, Heart, MessageCircle, Award, Calendar, Sparkles } from 'lucide-react';
import type { Profile } from '@/types';

interface Props {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

const roleBadgeClass = (role: string) => {
  if (role === 'admin' || role === 'elder') return 'badge-gold';
  return 'badge-sage';
};

const roleLabel = (role: string) => {
  if (role === 'admin' || role === 'elder') return 'Elder';
  return 'Member';
};

const roleIcon = (role: string) => {
  if (role === 'admin' || role === 'elder') return <Sparkles size={12} />;
  return <Heart size={12} />;
};

export default function UserProfileModal({ profile: viewProfile, isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { user, posts, prayerRequests, badges, userBadges, profiles } = useApp();

  if (!viewProfile) return null;

  const isOwnProfile = viewProfile.id === user?.id;
  const userPosts = posts.filter((p) => p.author_id === viewProfile.id).length;
  const userPrayers = prayerRequests.filter((p) => p.author_id === viewProfile.id && !p.is_anonymous).length;

  // Get badges earned by this user
  const earnedBadges = userBadges
    .filter((ub) => ub.user_id === viewProfile.id)
    .map((ub) => badges.find((b) => b.id === ub.badge_id))
    .filter(Boolean);

  const handleMessage = () => {
    onClose();
    navigate(`/messages?to=${viewProfile.id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar src={viewProfile.photo_url} name={viewProfile.first_name} size="xl" />
          <div
            className={cn('absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1', roleBadgeClass(viewProfile.role))}
          >
            {roleIcon(viewProfile.role)}
            {roleLabel(viewProfile.role)}
          </div>
        </div>

        {/* Name */}
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {viewProfile.first_name} {viewProfile.last_name}
          </h2>
          {viewProfile.area && (
            <div className="flex items-center justify-center gap-1 text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              <MapPin size={13} /> {viewProfile.area}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="rounded-xl py-3 px-2" style={{ background: 'var(--color-brand-soft)' }}>
            <div className="text-lg font-bold" style={{ color: 'var(--color-brand)' }}>{userPosts}</div>
            <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Posts</div>
          </div>
          <div className="rounded-xl py-3 px-2" style={{ background: 'var(--color-sage-soft)' }}>
            <div className="text-lg font-bold" style={{ color: 'var(--color-sage)' }}>{userPrayers}</div>
            <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Prayers</div>
          </div>
          <div className="rounded-xl py-3 px-2" style={{ background: 'var(--color-gold-soft)' }}>
            <div className="text-lg font-bold" style={{ color: 'var(--color-gold)' }}>{viewProfile.checkin_streak ?? 0}</div>
            <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Streak</div>
          </div>
        </div>

        {/* About */}
        {viewProfile.about && (
          <div className="w-full text-left">
            <div className="section-label">About</div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
              {viewProfile.about}
            </p>
          </div>
        )}

        {/* Prayer Focus */}
        {viewProfile.prayer_focus && (
          <div className="w-full text-left">
            <div className="flex items-center gap-1.5 section-label">
              <Heart size={11} /> Prayer Focus
            </div>
            <p className="text-sm leading-relaxed italic" style={{ color: 'var(--color-text-muted)' }}>
              "{viewProfile.prayer_focus}"
            </p>
          </div>
        )}

        {/* Birthday */}
        {viewProfile.birthday_visible && viewProfile.birthday && (
          <div className="w-full text-left">
            <div className="flex items-center gap-1.5 section-label">
              <Calendar size={11} /> Birthday
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              {new Date(viewProfile.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          </div>
        )}

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <div className="w-full text-left">
            <div className="flex items-center gap-1.5 section-label">
              <Award size={11} /> Badges
            </div>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((badge) => badge && (
                <span key={badge.id} className="badge badge-pink text-xs">
                  {badge.icon} {badge.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isOwnProfile && (
          <button
            onClick={handleMessage}
            className="btn btn-primary w-full mt-2"
          >
            <MessageCircle size={16} />
            Send Message
          </button>
        )}
      </div>
    </Modal>
  );
}
