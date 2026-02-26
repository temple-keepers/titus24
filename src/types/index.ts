// ─── User & Auth ──────────────────────────────────────────────
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'elder' | 'member';
  phone_number: string | null;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null;
  husband_name: string | null;
  wedding_anniversary: string | null;
  photo_url: string | null;
  area: string | null;
  city: string | null;
  country: string | null;
  about: string | null;
  prayer_focus: string | null;
  birthday: string | null;
  birthday_visible: boolean;
  theme: 'dark' | 'light';
  digest_day: string | null;
  digest_time: string | null;
  digest_timezone: string | null;
  last_attended: string | null;
  status: 'active' | 'banned' | 'removed';
  banned_at: string | null;
  banned_reason: string | null;
  checkin_streak?: number;
  total_points?: number;
  last_checkin_date?: string | null;
  created_at: string;
  activity?: {
    checkins: number;
    posts: number;
    prayers: number;
  };
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

export type ReactionType = 'amen' | 'heart' | 'praise' | 'strength' | 'fire';

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
  timezone: string;
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
  recorded_by?: string;
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
  read_at: string | null;
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
  | 'announcement'
  | 'celebration';

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

// ─── Daily Devotional & Check-In ──────────────────────────────
export type MoodType = 'joyful' | 'peaceful' | 'grateful' | 'hopeful' | 'anxious' | 'struggling' | 'lonely' | 'excited';

export interface DailyCheckIn {
  id: string;
  user_id: string;
  mood: MoodType;
  gratitude: string | null;
  date: string;
  created_at: string;
}

export interface DailyDevotional {
  id: string;
  date: string;
  theme: string;
  scripture_ref: string | null;
  scripture_text: string | null;
  reflection: string | null;
  affirmation: string | null;
  prayer: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Prayer Partners ─────────────────────────────────────────
export interface PrayerPartnership {
  id: string;
  user_a_id: string;
  user_b_id: string;
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_at: string;
}

// ─── Testimonies ─────────────────────────────────────────────
export type TestimonyCategory = 'Answered Prayer' | 'Engagement' | 'Marriage' | 'Breakthrough' | 'Healing' | 'Provision' | 'Growth' | 'Other';

export interface Testimony {
  id: string;
  author_id: string;
  content: string;
  category: TestimonyCategory;
  is_anonymous: boolean;
  celebration_count: number;
  created_at: string;
}

export interface TestimonyCelebration {
  id: string;
  testimony_id: string;
  user_id: string;
  created_at: string;
}

// ─── Ask the Elders ──────────────────────────────────────────
export interface ElderQuestion {
  id: string;
  author_id: string;
  question: string;
  category: string;
  is_answered: boolean;
  answer: string | null;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
}

// ─── Points & Leaderboard ────────────────────────────────────
export type PointAction =
  | 'daily_checkin'
  | 'devotional_read'
  | 'post_created'
  | 'comment_added'
  | 'prayer_submitted'
  | 'prayer_response'
  | 'testimony_shared'
  | 'study_day_completed'
  | 'event_attended'
  | 'streak_bonus';

export interface PointEntry {
  id: string;
  user_id: string;
  action: PointAction;
  points: number;
  description: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  rank: number;
  title: string;
  profile?: Profile;
}

// ─── Eldership ──────────────────────────────────────────────
export interface MentorAssignment {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'active' | 'pending' | 'inactive';
  assigned_at: string;
  notes: string | null;
  mentor?: Profile;
  mentee?: Profile;
}

export interface MentorRequest {
  id: string;
  mentee_id: string;
  mentor_id: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  mentee?: Profile;
  mentor?: Profile;
}

// ─── Pods (Accountability Groups) ────────────────────────────
export interface Pod {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

export interface PodMember {
  id: string;
  pod_id: string;
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
}

export interface PodCheckin {
  id: string;
  pod_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// ─── Guide ──────────────────────────────────────────────────
export type GuideSectionCategory = 'getting_started' | 'features' | 'faq';

export interface GuideSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  content: string;
  category: GuideSectionCategory;
  display_order: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Email ────────────────────────────────────────────────────
export type EmailAudience = 'all' | 'elders' | 'members' | 'individual';
export type EmailStatus = 'sent' | 'failed' | 'partial';

export interface EmailLog {
  id: string;
  sent_by: string;
  recipient_emails: string[];
  recipient_count: number;
  audience: EmailAudience;
  subject: string;
  body: string;
  status: EmailStatus;
  resend_id: string | null;
  error_message: string | null;
  created_at: string;
}

// ─── Toast ────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
