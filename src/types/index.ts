// ─── User & Auth ──────────────────────────────────────────────
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'member' | 'leader';
  photo_url: string | null;
  area: string | null;
  about: string | null;
  prayer_focus: string | null;
  birthday: string | null;
  birthday_visible: boolean;
  theme: 'dark' | 'light';
  digest_day: string | null;
  digest_time: string | null;
  digest_timezone: string | null;
  last_attended: string | null;
  created_at: string;
}

// ─── Community ────────────────────────────────────────────────
export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  author?: Profile;
  reactions?: Reaction[];
  comments?: Comment[];
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  author?: Profile;
  replies?: Comment[];
}

export type ReactionType = 'amen' | 'heart' | 'praying';

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
}

// ─── Prayer ───────────────────────────────────────────────────
export type PrayerCategory =
  | 'General'
  | 'Family'
  | 'Health'
  | 'Work'
  | 'Spiritual Growth'
  | 'Relationships'
  | 'Finances'
  | 'Marriage'
  | 'Other';

export interface PrayerRequest {
  id: string;
  author_id: string;
  content: string;
  category: PrayerCategory;
  is_anonymous: boolean;
  is_answered: boolean;
  answered_at: string | null;
  created_at: string;
  author?: Profile;
  responses?: PrayerResponse[];
}

export interface PrayerResponse {
  id: string;
  prayer_request_id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  user?: Profile;
}

// ─── Events ───────────────────────────────────────────────────
export interface AppEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  what_to_bring: string | null;
  created_by: string;
  created_at: string;
  rsvps?: RSVP[];
}

export type RSVPStatus = 'coming' | 'maybe' | 'no';

export interface RSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
}

export interface EventReminder {
  id: string;
  user_id: string;
  event_id: string;
  remind_offset_hours: number;
}

export interface Attendance {
  id: string;
  event_id: string;
  user_id: string;
  date: string;
}

// ─── Bible Study ──────────────────────────────────────────────
export interface BibleStudy {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  total_days: number;
  start_date: string | null;
  created_by: string;
  created_at: string;
  days?: StudyDay[];
  enrollment_count?: number;
  is_enrolled?: boolean;
}

export interface StudyDay {
  id: string;
  study_id: string;
  day_number: number;
  title: string;
  scripture_ref: string;
  scripture_text: string | null;
  reflection_prompt: string;
}

export interface StudyProgress {
  id: string;
  user_id: string;
  study_id: string;
  day_number: number;
  reflection: string | null;
  completed_at: string;
}

export interface StudyEnrollment {
  id: string;
  user_id: string;
  study_id: string;
  enrolled_at: string;
}

// ─── Gallery ──────────────────────────────────────────────────
export interface GalleryAlbum {
  id: string;
  title: string;
  description: string | null;
  event_id: string | null;
  created_by: string;
  created_at: string;
  photos?: GalleryPhoto[];
}

export interface GalleryPhoto {
  id: string;
  album_id: string;
  uploaded_by: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

// ─── Messages ─────────────────────────────────────────────────
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Conversation {
  partnerId: string;
  partner: Profile;
  lastMessage: Message;
  unreadCount: number;
}

// ─── Resources ────────────────────────────────────────────────
export type ResourceCategory = 'Teaching' | 'Guide' | 'Inspiration';
export type ResourceType = 'article' | 'video';

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  type: ResourceType;
  thumbnail: string | null;
  description: string;
  why_it_matters: string | null;
  next_step: string | null;
  link: string;
  created_by: string;
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────────
export type NotificationType =
  | 'reaction'
  | 'comment'
  | 'reply'
  | 'message'
  | 'event_reminder'
  | 'prayer_response'
  | 'badge_earned'
  | 'study_reminder'
  | 'announcement';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Badges ───────────────────────────────────────────────────
export type BadgeCategory = 'community' | 'prayer' | 'study' | 'events' | 'milestones';

export interface Badge {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  threshold: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

// ─── Admin ────────────────────────────────────────────────────
export type FollowUpStatus = 'Texted' | 'Called' | 'Prayed' | 'Needs Support' | 'Doing Better';

export interface FollowUpNote {
  id: string;
  user_id: string;
  leader_id: string;
  note: string;
  status: FollowUpStatus;
  created_at: string;
  user?: Profile;
}

// ─── Toast ────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
