/**
 * Thin typed wrappers over Supabase queries. One module per domain so
 * components don't import the supabase client directly for simple reads.
 *
 * Mutations stay in their callers so they can compose with `failIfError`
 * + toast addToast in the right scope.
 */
import { supabase } from '../lib/supabase';
import type {
  Profile,
  Post,
  Comment,
  Reaction,
  PrayerRequest,
  PrayerResponse,
  EventRow,
  Rsvp,
  DailyDevotional,
  Pod,
  PodMember,
  Message,
  Notification,
  BibleStudy,
  StudyDay,
  GalleryAlbum,
  GalleryPhoto,
  Resource,
} from '../lib/database.types';

// ---------- Profiles ----------

export async function listSisters(): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'active')
    .order('display_name', { ascending: true });
  return (data as Profile[] | null) ?? [];
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return (data as Profile | null) ?? null;
}

// ---------- Posts ----------

export interface PostWithAuthor extends Post {
  author: Pick<Profile, 'id' | 'display_name' | 'first_name' | 'avatar_url' | 'role'> | null;
  reaction_count: number;
  comment_count: number;
}

export async function listPosts(limit = 30): Promise<PostWithAuthor[]> {
  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(id, display_name, first_name, avatar_url, role)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (!data) return [];
  // Counts in a follow-up call (simpler than joining views).
  const ids = data.map((p: Post) => p.id);
  const counts = await loadPostCounts(ids);
  return (data as Array<Post & { author: PostWithAuthor['author'] }>).map((p) => ({
    ...p,
    reaction_count: counts.reactions[p.id] ?? 0,
    comment_count: counts.comments[p.id] ?? 0,
  }));
}

async function loadPostCounts(postIds: string[]) {
  if (postIds.length === 0) return { reactions: {}, comments: {} };
  const [{ data: rs }, { data: cs }] = await Promise.all([
    supabase.from('reactions').select('post_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
  ]);
  const reactions: Record<string, number> = {};
  const comments: Record<string, number> = {};
  (rs as Reaction[] | null)?.forEach((r) => {
    reactions[r.post_id] = (reactions[r.post_id] ?? 0) + 1;
  });
  (cs as Comment[] | null)?.forEach((c) => {
    comments[c.post_id] = (comments[c.post_id] ?? 0) + 1;
  });
  return { reactions, comments };
}

export async function listComments(postId: string): Promise<Array<Comment & { author: PostWithAuthor['author'] }>> {
  const { data } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(id, display_name, first_name, avatar_url, role)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return (data as Array<Comment & { author: PostWithAuthor['author'] }> | null) ?? [];
}

export async function listReactions(postId: string): Promise<Reaction[]> {
  const { data } = await supabase.from('reactions').select('*').eq('post_id', postId);
  return (data as Reaction[] | null) ?? [];
}

// ---------- Prayer ----------

export interface PrayerRequestWithAuthor extends PrayerRequest {
  author: PostWithAuthor['author'];
  response_count: number;
}

export async function listPrayerRequests(showAnswered = false): Promise<PrayerRequestWithAuthor[]> {
  let q = supabase
    .from('prayer_requests')
    .select('*, author:profiles!prayer_requests_author_id_fkey(id, display_name, first_name, avatar_url, role)')
    .order('created_at', { ascending: false });
  if (!showAnswered) q = q.eq('is_answered', false);
  const { data } = await q;
  if (!data) return [];
  const ids = (data as PrayerRequest[]).map((p) => p.id);
  const counts = await loadResponseCounts(ids);
  return (data as Array<PrayerRequest & { author: PostWithAuthor['author'] }>).map((p) => ({
    ...p,
    response_count: counts[p.id] ?? 0,
  }));
}

async function loadResponseCounts(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const { data } = await supabase.from('prayer_responses').select('prayer_request_id').in('prayer_request_id', ids);
  const counts: Record<string, number> = {};
  (data as PrayerResponse[] | null)?.forEach((r) => {
    counts[r.prayer_request_id] = (counts[r.prayer_request_id] ?? 0) + 1;
  });
  return counts;
}

// ---------- Events ----------

export async function listUpcomingEvents(daysAhead = 60): Promise<EventRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + daysAhead * 86400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('events')
    .select('*')
    .gte('date', today)
    .lte('date', horizon)
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  return (data as EventRow[] | null) ?? [];
}

export async function listMyRsvps(userId: string): Promise<Rsvp[]> {
  const { data } = await supabase.from('rsvps').select('*').eq('user_id', userId);
  return (data as Rsvp[] | null) ?? [];
}

// ---------- Devotional ----------

export async function getTodayDevotional(today: string): Promise<DailyDevotional | null> {
  const { data } = await supabase.from('daily_devotionals').select('*').eq('date', today).maybeSingle();
  return (data as DailyDevotional | null) ?? null;
}

export async function hasReadToday(userId: string, today: string): Promise<boolean> {
  const { data } = await supabase
    .from('devotional_reads')
    .select('user_id')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();
  return !!data;
}

// ---------- Pods ----------

export interface PodWithStats extends Pod {
  member_count: number;
  is_member: boolean;
}

export async function listPods(currentUserId: string | null): Promise<PodWithStats[]> {
  const { data } = await supabase
    .from('pods')
    .select('*')
    .order('created_at', { ascending: false });
  if (!data) return [];
  const ids = (data as Pod[]).map((p) => p.id);
  const { data: members } = await supabase
    .from('pod_members')
    .select('pod_id, user_id')
    .in('pod_id', ids);
  const counts: Record<string, number> = {};
  const mine = new Set<string>();
  (members as Array<Pick<PodMember, 'pod_id' | 'user_id'>> | null)?.forEach((m) => {
    counts[m.pod_id] = (counts[m.pod_id] ?? 0) + 1;
    if (currentUserId && m.user_id === currentUserId) mine.add(m.pod_id);
  });
  return (data as Pod[]).map((p) => ({ ...p, member_count: counts[p.id] ?? 0, is_member: mine.has(p.id) }));
}

// ---------- Messages ----------

export interface ConversationSummary {
  partnerId: string;
  partner: PostWithAuthor['author'];
  lastMessage: Message;
  unread: number;
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(200);
  const msgs = (data as Message[] | null) ?? [];
  const byPartner = new Map<string, ConversationSummary>();
  for (const m of msgs) {
    const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
    const existing = byPartner.get(partnerId);
    if (!existing) {
      byPartner.set(partnerId, { partnerId, partner: null, lastMessage: m, unread: 0 });
    }
    const c = byPartner.get(partnerId)!;
    if (m.receiver_id === userId && !m.read_at) c.unread += 1;
  }
  const partnerIds = Array.from(byPartner.keys());
  if (partnerIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, avatar_url, role')
      .in('id', partnerIds);
    (profiles as Array<NonNullable<PostWithAuthor['author']>> | null)?.forEach((p) => {
      const c = byPartner.get(p.id);
      if (c) c.partner = p;
    });
  }
  return Array.from(byPartner.values());
}

export async function listMessagesWith(userId: string, partnerId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(500);
  return (data as Message[] | null) ?? [];
}

// ---------- Notifications ----------

export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);
  return (data as Notification[] | null) ?? [];
}

// ---------- Bible Study ----------

export async function listStudies(): Promise<BibleStudy[]> {
  const { data } = await supabase.from('bible_studies').select('*').order('created_at', { ascending: false });
  return (data as BibleStudy[] | null) ?? [];
}

export async function listStudyDays(studyId: string): Promise<StudyDay[]> {
  const { data } = await supabase
    .from('study_days')
    .select('*')
    .eq('study_id', studyId)
    .order('day_number', { ascending: true });
  return (data as StudyDay[] | null) ?? [];
}

// ---------- Gallery ----------

export async function listAlbums(): Promise<GalleryAlbum[]> {
  const { data } = await supabase
    .from('gallery_albums')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as GalleryAlbum[] | null) ?? [];
}

export async function listAlbumPhotos(albumId: string): Promise<GalleryPhoto[]> {
  const { data } = await supabase
    .from('gallery_photos')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: true });
  return (data as GalleryPhoto[] | null) ?? [];
}

// ---------- Resources ----------

export async function listResources(): Promise<Resource[]> {
  const { data } = await supabase.from('resources').select('*').order('category', { ascending: true });
  return (data as Resource[] | null) ?? [];
}
