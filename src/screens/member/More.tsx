import { Link } from 'react-router-dom';
import { BookOpen, Calendar, MessageCircle, Image as ImageIcon, Library, Users, Award, HandHeart, HelpCircle, Heart, Settings, Search, Bell, Shield, Sparkles } from 'lucide-react';
import { Card } from '../../components/Card';
import { useAuth } from '../../auth/AuthProvider';
import { isAdmin } from '../../lib/roles';

const TILES = [
  { to: '/devotional', label: 'Devotional', Icon: BookOpen },
  { to: '/events', label: 'Events', Icon: Calendar },
  { to: '/messages', label: 'Messages', Icon: MessageCircle },
  { to: '/study', label: 'Bible Study', Icon: BookOpen },
  { to: '/gallery', label: 'Gallery', Icon: ImageIcon },
  { to: '/resources', label: 'Resources', Icon: Library },
  { to: '/directory', label: 'Directory', Icon: Users },
  { to: '/leaderboard', label: 'Leaderboard', Icon: Award },
  { to: '/elders', label: 'Ask Elders', Icon: HandHeart },
  { to: '/mentor', label: 'Mentorship', Icon: HandHeart },
  { to: '/partners', label: 'Prayer Partners', Icon: Heart },
  { to: '/testimonies', label: 'Testimonies', Icon: Sparkles },
  { to: '/notifications', label: 'Notifications', Icon: Bell },
  { to: '/search', label: 'Search', Icon: Search },
  { to: '/guide', label: 'Guide', Icon: HelpCircle },
  { to: '/profile', label: 'Profile', Icon: Settings },
];

export default function More() {
  const { profile } = useAuth();
  const showAdmin = isAdmin(profile?.role);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl">More</h1>
      <div className="grid grid-cols-3 gap-3">
        {TILES.map(({ to, label, Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex flex-col items-center gap-2 py-5 hover:bg-surface-raised">
              <span className="text-brand-500"><Icon size={22} /></span>
              <span className="text-xs font-semibold text-center">{label}</span>
            </Card>
          </Link>
        ))}
        {showAdmin && (
          <Link to="/admin">
            <Card className="flex flex-col items-center gap-2 py-5 hover:bg-surface-raised ring-1 ring-brand-200">
              <span className="text-brand-600"><Shield size={22} /></span>
              <span className="text-xs font-semibold text-center text-brand-700">Admin</span>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
