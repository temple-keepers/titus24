/**
 * Minimal hand-typed Database surface for the rebuild.
 *
 * Only the columns currently referenced by the rebuild are typed. Run
 *   supabase gen types typescript --project-id nbkvtvposonkeuufplzt
 * to regenerate the full canonical schema and replace this file.
 */

export type Role = 'member' | 'elder' | 'admin';
export type Status = 'active' | 'banned' | 'removed';
export type Theme = 'light' | 'dark';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  about: string | null;
  prayer_focus: string | null;
  favourite_verse: string | null;
  area: string | null;
  city: string | null;
  country: string | null;
  role: Role;
  status: Status;
  theme: Theme | null;
  banned_reason: string | null;
  birthday: string | null;
  anniversary: string | null;
  phone_number: string | null;
  marital_status: MaritalStatus | null;
  husband_name: string | null;
  birthday_visible: boolean;
  profession: string | null;
  skills: string[];
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
}

export interface PodCheckin {
  id: string;
  pod_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
}

export type ReactionType = 'heart' | 'praise' | 'amen' | 'hug' | 'pray' | 'celebrate';

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
}

export type PrayerCategory =
  | 'health'
  | 'family'
  | 'marriage'
  | 'guidance'
  | 'praise'
  | 'other';

export interface PrayerRequest {
  id: string;
  author_id: string;
  content: string;
  category: PrayerCategory;
  is_anonymous: boolean;
  is_answered: boolean;
  answered_at: string | null;
  created_at: string;
}

export interface PrayerResponse {
  id: string;
  prayer_request_id: string;
  user_id: string;
  content: string | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm:ss
  timezone: string;
  location: string | null;
  created_by: string;
  created_at: string;
}

export type RsvpStatus = 'going' | 'maybe' | 'cant';

export interface Rsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
}

export interface DailyDevotional {
  id: string;
  date: string; // YYYY-MM-DD
  theme: string;
  scripture_text: string;
  scripture_ref: string;
  reflection: string;
  affirmation: string;
  prayer: string;
  created_at: string;
}

export interface DevotionalRead {
  user_id: string;
  date: string;
  created_at: string;
}

export interface Pod {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
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

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface BibleStudy {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  duration_days: number;
  created_at: string;
}

export interface StudyDay {
  id: string;
  study_id: string;
  day_number: number;
  scripture_text: string;
  scripture_ref: string;
  reflection: string;
  journal_prompt: string | null;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string | null;
  event_id: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  description: string | null;
  url: string;
  cover_url: string | null;
  is_published: boolean;
  submitted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      posts: { Row: Post; Insert: Omit<Post, 'id' | 'created_at' | 'is_pinned'> & { is_pinned?: boolean }; Update: Partial<Post> };
      comments: { Row: Comment; Insert: Omit<Comment, 'id' | 'created_at'>; Update: Partial<Comment> };
      reactions: { Row: Reaction; Insert: Omit<Reaction, 'id' | 'created_at'>; Update: Partial<Reaction> };
      prayer_requests: { Row: PrayerRequest; Insert: Omit<PrayerRequest, 'id' | 'created_at' | 'is_answered' | 'answered_at'>; Update: Partial<PrayerRequest> };
      prayer_responses: { Row: PrayerResponse; Insert: Omit<PrayerResponse, 'id' | 'created_at'>; Update: Partial<PrayerResponse> };
      events: { Row: EventRow; Insert: Omit<EventRow, 'id' | 'created_at'>; Update: Partial<EventRow> };
      rsvps: { Row: Rsvp; Insert: Omit<Rsvp, 'id' | 'created_at'>; Update: Partial<Rsvp> };
      daily_devotionals: { Row: DailyDevotional; Insert: Omit<DailyDevotional, 'id' | 'created_at'>; Update: Partial<DailyDevotional> };
      devotional_reads: { Row: DevotionalRead; Insert: Omit<DevotionalRead, 'created_at'>; Update: Partial<DevotionalRead> };
      pods: { Row: Pod; Insert: Omit<Pod, 'id' | 'created_at'>; Update: Partial<Pod> };
      pod_members: { Row: PodMember; Insert: Omit<PodMember, 'id' | 'joined_at'>; Update: Partial<PodMember> };
      messages: { Row: Message; Insert: Omit<Message, 'id' | 'created_at' | 'read_at'>; Update: Partial<Message> };
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at' | 'is_read'>; Update: Partial<Notification> };
      bible_studies: { Row: BibleStudy; Insert: Omit<BibleStudy, 'id' | 'created_at'>; Update: Partial<BibleStudy> };
      study_days: { Row: StudyDay; Insert: Omit<StudyDay, 'id'>; Update: Partial<StudyDay> };
      gallery_albums: { Row: GalleryAlbum; Insert: Omit<GalleryAlbum, 'id' | 'created_at'>; Update: Partial<GalleryAlbum> };
      gallery_photos: { Row: GalleryPhoto; Insert: Omit<GalleryPhoto, 'id' | 'created_at'>; Update: Partial<GalleryPhoto> };
      resources: { Row: Resource; Insert: Omit<Resource, 'id' | 'created_at'>; Update: Partial<Resource> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
