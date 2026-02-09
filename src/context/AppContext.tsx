import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { optimiseAvatar, optimisePostImage, optimiseGalleryImage } from '@/lib/image';
import { uid } from '@/lib/utils';
import type {
  Profile, Post, Comment, Reaction, ReactionType,
  PrayerRequest, PrayerResponse, PrayerCategory,
  AppEvent, RSVP, RSVPStatus, EventReminder, Attendance,
  BibleStudy, StudyDay, StudyProgress, StudyEnrollment,
  GalleryAlbum, GalleryPhoto,
  Message, Conversation,
  Resource, ResourceCategory, ResourceType,
  Notification, NotificationType,
  Badge, UserBadge,
  FollowUpNote, FollowUpStatus,
  DailyDevotional,
  Toast, ToastType,
} from '@/types';
import type { Session, User } from '@supabase/supabase-js';

// ─── Context Types ────────────────────────────────────────────
interface AppState {
  // Auth
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authLoading: boolean;

  // Data
  profiles: Profile[];
  posts: Post[];
  comments: Comment[];
  reactions: Reaction[];
  prayerRequests: PrayerRequest[];
  prayerResponses: PrayerResponse[];
  events: AppEvent[];
  rsvps: RSVP[];
  eventReminders: EventReminder[];
  bibleStudies: BibleStudy[];
  studyDays: StudyDay[];
  studyProgress: StudyProgress[];
  studyEnrollments: StudyEnrollment[];
  galleryAlbums: GalleryAlbum[];
  galleryPhotos: GalleryPhoto[];
  messages: Message[];
  resources: Resource[];
  dailyDevotionals: DailyDevotional[];
  notifications: Notification[];
  badges: Badge[];
  userBadges: UserBadge[];
  followUpNotes: FollowUpNote[];

  // Toast
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Profile
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;

  // Posts
  addPost: (content: string, imageFile?: File) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  togglePin: (postId: string, pinned: boolean) => Promise<void>;
  toggleReaction: (postId: string, type: ReactionType) => Promise<void>;
  addComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;

  // Prayer
  addPrayerRequest: (content: string, category: PrayerCategory, isAnonymous: boolean) => Promise<void>;
  deletePrayerRequest: (id: string) => Promise<void>;
  markPrayerAnswered: (id: string) => Promise<void>;
  togglePrayerResponse: (requestId: string, encouragement?: string) => Promise<void>;

  // Events
  addEvent: (data: Omit<AppEvent, 'id' | 'created_by' | 'created_at' | 'rsvps'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  rsvpEvent: (eventId: string, status: RSVPStatus) => Promise<void>;
  setEventReminder: (eventId: string, offsetHours: number) => Promise<void>;
  removeEventReminder: (eventId: string) => Promise<void>;
  recordAttendance: (eventId: string, userIds: string[]) => Promise<void>;

  // Bible Study
  addBibleStudy: (data: { title: string; description: string; totalDays: number; days: Omit<StudyDay, 'id' | 'study_id'>[] }) => Promise<void>;
  enrollInStudy: (studyId: string) => Promise<void>;
  unenrolFromStudy: (studyId: string) => Promise<void>;
  completeStudyDay: (studyId: string, dayNumber: number, reflection?: string) => Promise<void>;

  // Gallery
  addAlbum: (title: string, description?: string, eventId?: string) => Promise<void>;
  uploadPhoto: (albumId: string, file: File, caption?: string) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;

  // Messages
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  getConversations: () => Conversation[];

  // Resources
  addResource: (data: Omit<Resource, 'id' | 'created_by' | 'created_at'>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;

  // Daily Devotionals
  addDevotional: (data: Omit<DailyDevotional, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDevotional: (id: string, data: Partial<Omit<DailyDevotional, 'id' | 'created_by' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteDevotional: (id: string) => Promise<void>;

  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  unreadNotificationCount: number;

  // Follow-up (admin)
  addFollowUpNote: (userId: string, note: string, status: FollowUpStatus) => Promise<void>;

  // Refetch
  refetchAll: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Data state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayerResponses, setPrayerResponses] = useState<PrayerResponse[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [eventReminders, setEventReminders] = useState<EventReminder[]>([]);
  const [bibleStudies, setBibleStudies] = useState<BibleStudy[]>([]);
  const [studyDays, setStudyDays] = useState<StudyDay[]>([]);
  const [studyProgress, setStudyProgress] = useState<StudyProgress[]>([]);
  const [studyEnrollments, setStudyEnrollments] = useState<StudyEnrollment[]>([]);
  const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [dailyDevotionals, setDailyDevotionals] = useState<DailyDevotional[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [followUpNotes, setFollowUpNotes] = useState<FollowUpNote[]>([]);

  const { toasts, addToast, removeToast } = useToast();
  const channelRef = useRef<any>(null);

  // ─── Auth ─────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Data Fetching ────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        profilesRes, postsRes, commentsRes, reactionsRes,
        prayerReqRes, prayerRespRes,
        eventsRes, rsvpsRes, remindersRes,
        studiesRes, studyDaysRes, progressRes, enrollmentsRes,
        albumsRes, photosRes,
        messagesRes, resourcesRes, devotionalsRes, notificationsRes,
        badgesRes, userBadgesRes, notesRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('reactions').select('*'),
        supabase.from('prayer_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('prayer_responses').select('*'),
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('rsvps').select('*'),
        supabase.from('event_reminders').select('*').eq('user_id', user.id),
        supabase.from('bible_studies').select('*').order('created_at', { ascending: false }),
        supabase.from('study_days').select('*').order('day_number', { ascending: true }),
        supabase.from('study_progress').select('*').eq('user_id', user.id),
        supabase.from('study_enrollments').select('*'),
        supabase.from('gallery_albums').select('*').order('created_at', { ascending: false }),
        supabase.from('gallery_photos').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: true }),
        supabase.from('resources').select('*').order('created_at', { ascending: false }),
        supabase.from('daily_devotionals').select('*').order('date', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('badges').select('*'),
        supabase.from('user_badges').select('*').eq('user_id', user.id),
        supabase.from('follow_up_notes').select('*').order('created_at', { ascending: false }),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
      if (reactionsRes.data) setReactions(reactionsRes.data);
      if (prayerReqRes.data) setPrayerRequests(prayerReqRes.data);
      if (prayerRespRes.data) setPrayerResponses(prayerRespRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
      if (rsvpsRes.data) setRsvps(rsvpsRes.data);
      if (remindersRes.data) setEventReminders(remindersRes.data);
      if (studiesRes.data) setBibleStudies(studiesRes.data);
      if (studyDaysRes.data) setStudyDays(studyDaysRes.data);
      if (progressRes.data) setStudyProgress(progressRes.data);
      if (enrollmentsRes.data) setStudyEnrollments(enrollmentsRes.data);
      if (albumsRes.data) setGalleryAlbums(albumsRes.data);
      if (photosRes.data) setGalleryPhotos(photosRes.data);
      if (messagesRes.data) setMessages(messagesRes.data);
      if (resourcesRes.data) setResources(resourcesRes.data);
      if (devotionalsRes.data) setDailyDevotionals(devotionalsRes.data);
      if (notificationsRes.data) setNotifications(notificationsRes.data);
      if (badgesRes.data) setBadges(badgesRes.data);
      if (userBadgesRes.data) setUserBadges(userBadgesRes.data);
      if (notesRes.data) setFollowUpNotes(notesRes.data);

      // Set current user profile
      const me = profilesRes.data?.find((p: Profile) => p.id === user.id);
      if (me) {
        setProfile(me);
        console.log('👤 Current user role:', me.role, '(needs "leader" for devotional admin)');
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      addToast('error', 'Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user, fetchAllData]);

  // ─── Realtime ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      // Clean up any existing channel if user logs out
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channel = supabase
      .channel('app-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        supabase.from('posts').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setPosts(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        supabase.from('comments').select('*').order('created_at', { ascending: true }).then(({ data }) => data && setComments(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
        supabase.from('reactions').select('*').then(({ data }) => data && setReactions(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: true }).then(({ data }) => data && setMessages(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_requests' }, () => {
        supabase.from('prayer_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setPrayerRequests(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_responses' }, () => {
        supabase.from('prayer_responses').select('*').then(({ data }) => data && setPrayerResponses(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.new && (payload.new as any).user_id === user.id) {
          supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).then(({ data }) => data && setNotifications(data));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, () => {
        supabase.from('rsvps').select('*').then(({ data }) => data && setRsvps(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        supabase.from('events').select('*').order('date', { ascending: true }).then(({ data }) => data && setEvents(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_photos' }, () => {
        supabase.from('gallery_photos').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setGalleryPhotos(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_badges' }, () => {
        supabase.from('user_badges').select('*').eq('user_id', user.id).then(({ data }) => data && setUserBadges(data));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      // Proper cleanup
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  // ─── Notification Helper ──────────────────────────────────
  const createNotification = useCallback(async (
    userId: string, type: NotificationType, title: string, body: string, link?: string
  ) => {
    if (userId === user?.id) return; // Don't notify self
    await supabase.from('notifications').insert({ user_id: userId, type, title, body, link });
  }, [user]);

  // ─── Badge Checker ────────────────────────────────────────
  const checkBadges = useCallback(async () => {
    if (!user || badges.length === 0) return;

    const earned = userBadges.map((ub) => ub.badge_id);
    const myPosts = posts.filter((p) => p.author_id === user.id).length;
    const myComments = comments.filter((c) => c.author_id === user.id).length;
    const myPrayerResponses = prayerResponses.filter((r) => r.user_id === user.id).length;
    const myStudyDays = studyProgress.length;

    const checks: Array<{ slug: string; count: number }> = [
      { slug: 'first-post', count: myPosts },
      { slug: 'five-posts', count: myPosts },
      { slug: 'first-prayer', count: prayerRequests.filter((p) => p.author_id === user.id).length },
      { slug: 'prayer-warrior-10', count: myPrayerResponses },
      { slug: 'prayer-warrior-50', count: myPrayerResponses },
      { slug: 'first-study', count: myStudyDays },
      { slug: 'study-streak-7', count: myStudyDays },
      { slug: 'first-comment', count: myComments },
      { slug: 'ten-comments', count: myComments },
    ];

    for (const { slug, count } of checks) {
      const badge = badges.find((b) => b.slug === slug);
      if (!badge || earned.includes(badge.id)) continue;
      if (count >= badge.threshold) {
        const { error } = await supabase.from('user_badges').insert({
          user_id: user.id, badge_id: badge.id,
        });
        if (!error) {
          await createNotification(user.id, 'badge_earned', 'Badge Earned! ✨', `You earned "${badge.title}"`);
          addToast('success', `Badge earned: ${badge.title} ✨`);
        }
      }
    }
  }, [user, badges, userBadges, posts, comments, prayerRequests, prayerResponses, studyProgress, createNotification, addToast]);

  // ─── Auth Actions ─────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, firstName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { first_name: firstName } },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  }, []);

  // ─── Profile Actions ─────────────────────────────────────
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) throw error;
    setProfile((prev) => prev ? { ...prev, ...updates } : prev);
    setProfiles((prev) => prev.map((p) => p.id === user.id ? { ...p, ...updates } : p));
    addToast('success', 'Profile updated');
  }, [user, addToast]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const blob = await optimiseAvatar(file);
    const path = `${user.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }, [user]);

  // ─── Post Actions ─────────────────────────────────────────
  const addPost = useCallback(async (content: string, imageFile?: File) => {
    if (!user) return;
    let image_url: string | null = null;
    if (imageFile) {
      const blob = await optimisePostImage(imageFile);
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from('post-images').upload(path, blob, { contentType: 'image/jpeg' });
      if (!upErr) {
        const { data } = supabase.storage.from('post-images').getPublicUrl(path);
        image_url = data.publicUrl;
      }
    }
    const { data: newPost, error } = await supabase.from('posts').insert({
      author_id: user.id, content, image_url,
    }).select().single();
    if (error) throw error;
    if (newPost) setPosts((prev) => [newPost, ...prev]);
    addToast('success', 'Post shared');
    checkBadges();
  }, [user, addToast, checkBadges]);

  const deletePost = useCallback(async (postId: string) => {
    await supabase.from('reactions').delete().eq('post_id', postId);
    await supabase.from('comments').delete().eq('post_id', postId);
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setComments((prev) => prev.filter((c) => c.post_id !== postId));
    setReactions((prev) => prev.filter((r) => r.post_id !== postId));
  }, []);

  const togglePin = useCallback(async (postId: string, pinned: boolean) => {
    await supabase.from('posts').update({ is_pinned: pinned }).eq('id', postId);
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, is_pinned: pinned } : p));
  }, []);

  const toggleReaction = useCallback(async (postId: string, type: ReactionType) => {
    if (!user) return;
    const existing = reactions.find((r) => r.post_id === postId && r.user_id === user.id && r.type === type);
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id);
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const { data: newReaction } = await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, type }).select().single();
      if (newReaction) setReactions((prev) => [...prev, newReaction]);
      const post = posts.find((p) => p.id === postId);
      if (post && post.author_id !== user.id) {
        const name = profile?.first_name ?? 'Someone';
        await createNotification(post.author_id, 'reaction', `${name} reacted`, `${name} reacted to your post`, `/community`);
      }
    }
  }, [user, reactions, posts, profile, createNotification]);

  const addComment = useCallback(async (postId: string, content: string, parentId?: string) => {
    if (!user) return;
    const { data: newComment, error } = await supabase.from('comments').insert({
      post_id: postId, author_id: user.id, content, parent_id: parentId ?? null,
    }).select().single();
    if (error) throw error;
    if (newComment) setComments((prev) => [...prev, newComment]);

    const post = posts.find((p) => p.id === postId);
    const name = profile?.first_name ?? 'Someone';
    if (post && post.author_id !== user.id) {
      await createNotification(post.author_id, 'comment', `${name} commented`, `${name} commented on your post`, `/community`);
    }
    if (parentId) {
      const parent = comments.find((c) => c.id === parentId);
      if (parent && parent.author_id !== user.id) {
        await createNotification(parent.author_id, 'reply', `${name} replied`, `${name} replied to your comment`, `/community`);
      }
    }
    checkBadges();
  }, [user, posts, comments, profile, createNotification, checkBadges]);

  const deleteComment = useCallback(async (commentId: string) => {
    const children = comments.filter((c) => c.parent_id === commentId);
    for (const child of children) {
      await supabase.from('comments').delete().eq('id', child.id);
    }
    await supabase.from('comments').delete().eq('id', commentId);
    const childIds = children.map((c) => c.id);
    setComments((prev) => prev.filter((c) => c.id !== commentId && !childIds.includes(c.id)));
  }, [comments]);

  // ─── Prayer Actions ───────────────────────────────────────
  const addPrayerRequest = useCallback(async (content: string, category: PrayerCategory, isAnonymous: boolean) => {
    if (!user) return;
    const { data: newReq, error } = await supabase.from('prayer_requests').insert({
      author_id: user.id, content, category, is_anonymous: isAnonymous,
    }).select().single();
    if (error) throw error;
    if (newReq) setPrayerRequests((prev) => [newReq, ...prev]);
    addToast('success', 'Prayer request shared');
    checkBadges();
  }, [user, addToast, checkBadges]);

  const deletePrayerRequest = useCallback(async (id: string) => {
    await supabase.from('prayer_responses').delete().eq('prayer_request_id', id);
    await supabase.from('prayer_requests').delete().eq('id', id);
    setPrayerRequests((prev) => prev.filter((p) => p.id !== id));
    setPrayerResponses((prev) => prev.filter((r) => r.prayer_request_id !== id));
  }, []);

  const markPrayerAnswered = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    await supabase.from('prayer_requests').update({
      is_answered: true, answered_at: now,
    }).eq('id', id);
    setPrayerRequests((prev) => prev.map((p) => p.id === id ? { ...p, is_answered: true, answered_at: now } : p));
    addToast('success', 'Praise God! Prayer marked as answered');
  }, [addToast]);

  const togglePrayerResponse = useCallback(async (requestId: string, encouragement?: string) => {
    if (!user) return;
    const existing = prayerResponses.find((r) => r.prayer_request_id === requestId && r.user_id === user.id);
    if (existing) {
      await supabase.from('prayer_responses').delete().eq('id', existing.id);
      setPrayerResponses((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const { data: newResp } = await supabase.from('prayer_responses').insert({
        prayer_request_id: requestId, user_id: user.id, content: encouragement ?? null,
      }).select().single();
      if (newResp) setPrayerResponses((prev) => [...prev, newResp]);
      const req = prayerRequests.find((p) => p.id === requestId);
      if (req && req.author_id !== user.id) {
        const name = profile?.first_name ?? 'Someone';
        await createNotification(req.author_id, 'prayer_response', `${name} is praying`, `${name} is praying for you`, `/prayer`);
      }
      checkBadges();
    }
  }, [user, prayerResponses, prayerRequests, profile, createNotification, checkBadges]);

  // ─── Event Actions ────────────────────────────────────────
  const addEvent = useCallback(async (data: Omit<AppEvent, 'id' | 'created_by' | 'created_at' | 'rsvps'>) => {
    if (!user) return;
    const { data: newEvent, error } = await supabase.from('events').insert({ ...data, created_by: user.id }).select().single();
    if (error) throw error;
    if (newEvent) setEvents((prev) => [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date)));
    addToast('success', 'Event created');
  }, [user, addToast]);

  const deleteEvent = useCallback(async (id: string) => {
    await supabase.from('rsvps').delete().eq('event_id', id);
    await supabase.from('event_reminders').delete().eq('event_id', id);
    await supabase.from('attendance').delete().eq('event_id', id);
    await supabase.from('events').delete().eq('id', id);
  }, []);

  const rsvpEvent = useCallback(async (eventId: string, status: RSVPStatus) => {
    if (!user) return;
    const existing = rsvps.find((r) => r.event_id === eventId && r.user_id === user.id);
    if (existing) {
      await supabase.from('rsvps').update({ status }).eq('id', existing.id);
      setRsvps((prev) => prev.map((r) => r.id === existing.id ? { ...r, status } : r));
    } else {
      const { data: newRsvp } = await supabase.from('rsvps').insert({ event_id: eventId, user_id: user.id, status }).select().single();
      if (newRsvp) setRsvps((prev) => [...prev, newRsvp]);
    }
  }, [user, rsvps]);

  const setEventReminder = useCallback(async (eventId: string, offsetHours: number) => {
    if (!user) return;
    await supabase.from('event_reminders').upsert({
      user_id: user.id, event_id: eventId, remind_offset_hours: offsetHours,
    }, { onConflict: 'user_id,event_id' });
    addToast('info', 'Reminder set');
  }, [user, addToast]);

  const removeEventReminder = useCallback(async (eventId: string) => {
    if (!user) return;
    await supabase.from('event_reminders').delete().eq('user_id', user.id).eq('event_id', eventId);
  }, [user]);

  const recordAttendance = useCallback(async (eventId: string, userIds: string[]) => {
    const date = new Date().toISOString().split('T')[0];
    const rows = userIds.map((uid) => ({ event_id: eventId, user_id: uid, date }));
    await supabase.from('attendance').upsert(rows, { onConflict: 'event_id,user_id' });
    // Update last_attended for each user
    for (const uid of userIds) {
      await supabase.from('profiles').update({ last_attended: date }).eq('id', uid);
    }
    addToast('success', 'Attendance recorded');
  }, [addToast]);

  // ─── Bible Study Actions ──────────────────────────────────
  const addBibleStudy = useCallback(async (data: { title: string; description: string; totalDays: number; days: Omit<StudyDay, 'id' | 'study_id'>[] }) => {
    if (!user) return;
    const { data: study, error } = await supabase.from('bible_studies').insert({
      title: data.title, description: data.description, total_days: data.totalDays, created_by: user.id,
    }).select().single();
    if (error || !study) throw error ?? new Error('Failed to create study');

    const dayRows = data.days.map((d) => ({ ...d, study_id: study.id }));
    await supabase.from('study_days').insert(dayRows);
    addToast('success', 'Bible study created');
  }, [user, addToast]);

  const enrollInStudy = useCallback(async (studyId: string) => {
    if (!user) return;
    await supabase.from('study_enrollments').insert({ user_id: user.id, study_id: studyId });
    setStudyEnrollments((prev) => [...prev, { id: uid(), user_id: user.id, study_id: studyId, enrolled_at: new Date().toISOString() }]);
    addToast('success', 'Enrolled in study');
  }, [user, addToast]);

  const unenrolFromStudy = useCallback(async (studyId: string) => {
    if (!user) return;
    await supabase.from('study_enrollments').delete().eq('user_id', user.id).eq('study_id', studyId);
    setStudyEnrollments((prev) => prev.filter((e) => !(e.user_id === user.id && e.study_id === studyId)));
  }, [user]);

  const completeStudyDay = useCallback(async (studyId: string, dayNumber: number, reflection?: string) => {
    if (!user) return;
    await supabase.from('study_progress').upsert({
      user_id: user.id, study_id: studyId, day_number: dayNumber, reflection: reflection ?? null,
    }, { onConflict: 'user_id,study_id,day_number' });
    addToast('success', 'Day completed ✨');
    checkBadges();
  }, [user, addToast, checkBadges]);

  // ─── Gallery Actions ──────────────────────────────────────
  const addAlbum = useCallback(async (title: string, description?: string, eventId?: string) => {
    if (!user) return;
    await supabase.from('gallery_albums').insert({
      title, description: description ?? null, event_id: eventId ?? null, created_by: user.id,
    });
    addToast('success', 'Album created');
  }, [user, addToast]);

  const uploadPhoto = useCallback(async (albumId: string, file: File, caption?: string) => {
    if (!user) return;
    const blob = await optimiseGalleryImage(file);
    const path = `${albumId}/${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('gallery').upload(path, blob, { contentType: 'image/jpeg' });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('gallery').getPublicUrl(path);
    await supabase.from('gallery_photos').insert({
      album_id: albumId, uploaded_by: user.id, image_url: data.publicUrl, caption: caption ?? null,
    });
    addToast('success', 'Photo uploaded');
  }, [user, addToast]);

  const deletePhoto = useCallback(async (photoId: string) => {
    await supabase.from('gallery_photos').delete().eq('id', photoId);
  }, []);

  // ─── Message Actions ──────────────────────────────────────
  const sendMessage = useCallback(async (receiverId: string, content: string) => {
    if (!user) return;
    const { data: newMsg } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: receiverId, content }).select().single();
    if (newMsg) setMessages((prev) => [...prev, newMsg]);
    const name = profile?.first_name ?? 'Someone';
    await createNotification(receiverId, 'message', `New message from ${name}`, content.slice(0, 100), `/messages`);
  }, [user, profile, createNotification]);

  const getConversations = useCallback((): Conversation[] => {
    if (!user) return [];
    const convMap = new Map<string, Message[]>();

    messages.forEach((m) => {
      const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!convMap.has(partnerId)) convMap.set(partnerId, []);
      convMap.get(partnerId)!.push(m);
    });

    return Array.from(convMap.entries())
      .map(([partnerId, msgs]) => {
        const partner = profiles.find((p) => p.id === partnerId);
        if (!partner) return null;
        const lastMessage = msgs[msgs.length - 1];
        return { partnerId, partner, lastMessage, unreadCount: 0 };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.lastMessage.created_at).getTime() - new Date(a!.lastMessage.created_at).getTime()) as Conversation[];
  }, [user, messages, profiles]);

  // ─── Resource Actions ─────────────────────────────────────
  const addResource = useCallback(async (data: Omit<Resource, 'id' | 'created_by' | 'created_at'>) => {
    if (!user) return;
    const { data: newRes } = await supabase.from('resources').insert({ ...data, created_by: user.id }).select().single();
    if (newRes) setResources((prev) => [newRes, ...prev]);
    addToast('success', 'Resource added');
  }, [user, addToast]);

  const deleteResource = useCallback(async (id: string) => {
    await supabase.from('resources').delete().eq('id', id);
    setResources((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ─── Daily Devotional Actions ─────────────────────────────────────
  const addDevotional = useCallback(async (data: Omit<DailyDevotional, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    console.log('🔍 Attempting to insert devotional:', { ...data, created_by: user.id });
    const { data: newDev, error } = await supabase.from('daily_devotionals').insert({ ...data, created_by: user.id }).select().single();
    if (error) {
      console.error('❌ Devotional insert error:', error);
      throw error;
    }
    if (newDev) setDailyDevotionals((prev) => [newDev, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    addToast('success', 'Devotional created');
  }, [user, addToast]);

  const updateDevotional = useCallback(async (id: string, data: Partial<Omit<DailyDevotional, 'id' | 'created_by' | 'created_at' | 'updated_at'>>) => {
    const { data: updated, error } = await supabase.from('daily_devotionals').update(data).eq('id', id).select().single();
    if (error) throw error;
    if (updated) setDailyDevotionals((prev) => prev.map((d) => d.id === id ? updated : d).sort((a, b) => b.date.localeCompare(a.date)));
    addToast('success', 'Devotional updated');
  }, [addToast]);

  const deleteDevotional = useCallback(async (id: string) => {
    await supabase.from('daily_devotionals').delete().eq('id', id);
    setDailyDevotionals((prev) => prev.filter((d) => d.id !== id));
    addToast('success', 'Devotional deleted');
  }, [addToast]);

  // ─── Notification Actions ─────────────────────────────────
  const markNotificationRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadNotificationCount = notifications.filter((n) => !n.is_read).length;

  // ─── Follow-Up Notes ──────────────────────────────────────
  const addFollowUpNote = useCallback(async (userId: string, note: string, status: FollowUpStatus) => {
    if (!user) return;
    const { data: newNote } = await supabase.from('follow_up_notes').insert({
      user_id: userId, leader_id: user.id, note, status,
    }).select().single();
    if (newNote) setFollowUpNotes((prev) => [newNote, ...prev]);
    addToast('success', 'Note saved');
  }, [user, addToast]);

  // ─── Context Value ────────────────────────────────────────
  const value: AppState = {
    session, user, profile, loading, authLoading,
    profiles, posts, comments, reactions,
    prayerRequests, prayerResponses,
    events, rsvps, eventReminders,
    bibleStudies, studyDays, studyProgress, studyEnrollments,
    galleryAlbums, galleryPhotos,
    messages, resources, dailyDevotionals, notifications,
    badges, userBadges, followUpNotes,
    toasts, addToast, removeToast,
    signIn, signUp, signOut,
    updateProfile, uploadAvatar,
    addPost, deletePost, togglePin, toggleReaction, addComment, deleteComment,
    addPrayerRequest, deletePrayerRequest, markPrayerAnswered, togglePrayerResponse,
    addEvent, deleteEvent, rsvpEvent, setEventReminder, removeEventReminder, recordAttendance,
    addBibleStudy, enrollInStudy, unenrolFromStudy, completeStudyDay,
    addAlbum, uploadPhoto, deletePhoto,
    sendMessage, getConversations,
    addResource, deleteResource,
    addDevotional, updateDevotional, deleteDevotional,
    markNotificationRead, markAllNotificationsRead, deleteNotification, unreadNotificationCount,
    addFollowUpNote,
    refetchAll: fetchAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
