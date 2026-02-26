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
  Pod, PodMember, PodCheckin,
  GuideSection,
  Toast, ToastType,
} from '@/types';
import { defaultGuideSections } from '@/lib/defaultGuide';
import { validateTextField, validateUrl, sanitizeText, checkRateLimit, MAX_LENGTHS } from '@/lib/validation';
import type { Session, User } from '@supabase/supabase-js';

const PAGE_SIZE = 20;

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
  pods: Pod[];
  podMembers: PodMember[];
  podCheckins: PodCheckin[];
  guideSections: GuideSection[];

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
  updateUserRole: (userId: string, newRole: 'admin' | 'elder' | 'member') => Promise<void>;
  banUser: (userId: string, reason: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;

  // Posts
  addPost: (content: string, imageFile?: File) => Promise<Post | undefined>;
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
  updateEvent: (id: string, data: Partial<Omit<AppEvent, 'id' | 'created_by' | 'created_at' | 'rsvps'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  rsvpEvent: (eventId: string, status: RSVPStatus) => Promise<void>;
  setEventReminder: (eventId: string, offsetHours: number) => Promise<void>;
  removeEventReminder: (eventId: string) => Promise<void>;
  recordAttendance: (eventId: string, userIds: string[]) => Promise<void>;

  // Bible Study
  addBibleStudy: (data: { title: string; description: string; totalDays: number; days: Omit<StudyDay, 'id' | 'study_id'>[] }) => Promise<void>;
  deleteBibleStudy: (studyId: string) => Promise<void>;
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
  markMessagesRead: (senderId: string) => Promise<void>;
  unreadMessageCount: number;

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

  // Pods
  addPod: (name: string, description: string | null, maxMembers: number) => Promise<void>;
  deletePod: (podId: string) => Promise<void>;
  addPodMember: (podId: string, userId: string, role?: 'leader' | 'member') => Promise<void>;
  removePodMember: (podId: string, userId: string) => Promise<void>;
  addPodCheckin: (podId: string, content: string) => Promise<void>;

  // Guide
  addGuideSection: (data: Omit<GuideSection, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateGuideSection: (id: string, data: Partial<Omit<GuideSection, 'id' | 'created_by' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteGuideSection: (id: string) => Promise<void>;

  // Pagination
  loadMorePosts: () => Promise<void>;
  hasMorePosts: boolean;
  loadingMorePosts: boolean;
  loadMorePrayers: () => Promise<void>;
  hasMorePrayers: boolean;
  loadingMorePrayers: boolean;

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
  const [pods, setPods] = useState<Pod[]>([]);
  const [podMembers, setPodMembers] = useState<PodMember[]>([]);
  const [podCheckins, setPodCheckins] = useState<PodCheckin[]>([]);
  const [guideSections, setGuideSections] = useState<GuideSection[]>([]);

  // Pagination state
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMorePrayers, setHasMorePrayers] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadingMorePrayers, setLoadingMorePrayers] = useState(false);

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

  // ─── Data Fetching (Two-Phase: Critical → Background) ─────
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // PHASE 1: Critical data only — gets app visible fast
    try {
      const [profilesRes, postsRes, notificationsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (postsRes.data) {
        setPosts(postsRes.data);
        setHasMorePosts(postsRes.data.length === PAGE_SIZE);
      }
      if (notificationsRes.data) setNotifications(notificationsRes.data);

      const me = profilesRes.data?.find((p: Profile) => p.id === user.id);
      if (me) setProfile(me);
    } catch (err) {
      console.error('Critical data fetch error:', err);
      addToast('error', 'Connection slow. Retrying...');
    } finally {
      // Unlock the app — user can see Home immediately
      setLoading(false);
    }

    // PHASE 2: Everything else loads in background (non-blocking)
    const bgFetch = async (label: string, fn: () => Promise<void>) => {
      try { await fn(); } catch (e) { console.warn(`Background fetch [${label}] failed:`, e); }
    };

    bgFetch('comments', async () => {
      const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: true });
      if (data) setComments(data);
    });
    bgFetch('reactions', async () => {
      const { data } = await supabase.from('reactions').select('*');
      if (data) setReactions(data);
    });
    bgFetch('prayers', async () => {
      const [reqRes, respRes] = await Promise.all([
        supabase.from('prayer_requests').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('prayer_responses').select('*'),
      ]);
      if (reqRes.data) {
        setPrayerRequests(reqRes.data);
        setHasMorePrayers(reqRes.data.length === PAGE_SIZE);
      }
      if (respRes.data) setPrayerResponses(respRes.data);
    });
    bgFetch('events', async () => {
      const [evRes, rsvpRes, remRes] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('rsvps').select('*'),
        supabase.from('event_reminders').select('*').eq('user_id', user.id),
      ]);
      if (evRes.data) setEvents(evRes.data);
      if (rsvpRes.data) setRsvps(rsvpRes.data);
      if (remRes.data) setEventReminders(remRes.data);
    });
    bgFetch('studies', async () => {
      const [sRes, dRes, pRes, eRes] = await Promise.all([
        supabase.from('bible_studies').select('*').order('created_at', { ascending: false }),
        supabase.from('study_days').select('*').order('day_number', { ascending: true }),
        supabase.from('study_progress').select('*').eq('user_id', user.id),
        supabase.from('study_enrollments').select('*'),
      ]);
      if (sRes.data) setBibleStudies(sRes.data);
      if (dRes.data) setStudyDays(dRes.data);
      if (pRes.data) setStudyProgress(pRes.data);
      if (eRes.data) setStudyEnrollments(eRes.data);
    });
    bgFetch('gallery', async () => {
      const [aRes, pRes] = await Promise.all([
        supabase.from('gallery_albums').select('*').order('created_at', { ascending: false }),
        supabase.from('gallery_photos').select('*').order('created_at', { ascending: false }),
      ]);
      if (aRes.data) setGalleryAlbums(aRes.data);
      if (pRes.data) setGalleryPhotos(pRes.data);
    });
    bgFetch('messages', async () => {
      const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: true });
      if (data) setMessages(data);
    });
    bgFetch('resources', async () => {
      const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
      if (data) setResources(data);
    });
    bgFetch('devotionals', async () => {
      const { data } = await supabase.from('daily_devotionals').select('*').order('date', { ascending: false });
      if (data) setDailyDevotionals(data);
    });
    bgFetch('badges', async () => {
      const [bRes, ubRes] = await Promise.all([
        supabase.from('badges').select('*'),
        supabase.from('user_badges').select('*').eq('user_id', user.id),
      ]);
      if (bRes.data) setBadges(bRes.data);
      if (ubRes.data) setUserBadges(ubRes.data);
    });
    bgFetch('followup', async () => {
      const { data } = await supabase.from('follow_up_notes').select('*').order('created_at', { ascending: false });
      if (data) setFollowUpNotes(data);
    });
    bgFetch('pods', async () => {
      const [pRes, mRes, cRes] = await Promise.all([
        supabase.from('pods').select('*').order('created_at', { ascending: false }),
        supabase.from('pod_members').select('*'),
        supabase.from('pod_checkins').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (pRes.data) setPods(pRes.data);
      if (mRes.data) setPodMembers(mRes.data);
      if (cRes.data) setPodCheckins(cRes.data);
    });
    bgFetch('guide', async () => {
      const { data } = await supabase.from('guide_sections').select('*').order('display_order', { ascending: true });
      if (data && data.length > 0) {
        // Merge: per category, if DB has sections use DB; otherwise use defaults
        const dbCategories = new Set(data.map((s: GuideSection) => s.category));
        const merged = [
          ...data,
          ...defaultGuideSections
            .filter(d => !dbCategories.has(d.category))
            .map(d => ({ ...d, created_by: null, created_at: '', updated_at: '' }) as GuideSection),
        ];
        setGuideSections(merged);
      } else {
        setGuideSections(defaultGuideSections.map(d => ({ ...d, created_by: null, created_at: '', updated_at: '' }) as GuideSection));
      }
    });
  }, [user, addToast]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user, fetchAllData]);

  // ─── Apply Theme ──────────────────────────────────────────────
  useEffect(() => {
    if (profile?.theme) {
      document.documentElement.setAttribute('data-theme', profile.theme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', profile.theme === 'dark' ? '#1A1215' : '#FFFBF9');
      }
    }
  }, [profile?.theme]);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newPost = payload.new as Post;
          setPosts(prev => prev.some(p => p.id === newPost.id) ? prev : [newPost, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setPosts(prev => prev.map(p => p.id === (payload.new as Post).id ? payload.new as Post : p));
        } else if (payload.eventType === 'DELETE') {
          setPosts(prev => prev.filter(p => p.id !== (payload.old as any).id));
        }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newReq = payload.new as PrayerRequest;
          setPrayerRequests(prev => prev.some(p => p.id === newReq.id) ? prev : [newReq, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setPrayerRequests(prev => prev.map(p => p.id === (payload.new as PrayerRequest).id ? payload.new as PrayerRequest : p));
        } else if (payload.eventType === 'DELETE') {
          setPrayerRequests(prev => prev.filter(p => p.id !== (payload.old as any).id));
        }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pods' }, () => {
        supabase.from('pods').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setPods(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pod_members' }, () => {
        supabase.from('pod_members').select('*').then(({ data }) => data && setPodMembers(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pod_checkins' }, () => {
        supabase.from('pod_checkins').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => data && setPodCheckins(data));
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
    // Validate text fields if present
    if (updates.first_name !== undefined) {
      const v = validateTextField(updates.first_name || '', MAX_LENGTHS.PROFILE_NAME, 'First name');
      if (!v.valid) { addToast('error', v.error!); return; }
    }
    if (updates.last_name !== undefined) {
      const v = validateTextField(updates.last_name || '', MAX_LENGTHS.PROFILE_NAME, 'Last name', false);
      if (!v.valid) { addToast('error', v.error!); return; }
    }
    if (updates.about !== undefined) {
      const v = validateTextField(updates.about || '', MAX_LENGTHS.PROFILE_ABOUT, 'About', false);
      if (!v.valid) { addToast('error', v.error!); return; }
    }
    if (updates.prayer_focus !== undefined) {
      const v = validateTextField(updates.prayer_focus || '', MAX_LENGTHS.PROFILE_PRAYER_FOCUS, 'Prayer focus', false);
      if (!v.valid) { addToast('error', v.error!); return; }
    }
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

  const updateUserRole = useCallback(async (userId: string, newRole: 'admin' | 'elder' | 'member') => {
    if (!user) return;
    const { error, data } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Permission denied — only admins can change roles');

    // Update profiles list
    setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, role: newRole } : p));
    addToast('success', `Role updated to ${newRole}`);
  }, [user, addToast]);

  const banUser = useCallback(async (userId: string, reason: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'banned', banned_at: new Date().toISOString(), banned_reason: reason })
      .eq('id', userId);
    if (error) throw error;
    setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, status: 'banned' as const, banned_at: new Date().toISOString(), banned_reason: reason } : p));
    addToast('success', 'User has been banned');
  }, [user, addToast]);

  const unbanUser = useCallback(async (userId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'active', banned_at: null, banned_reason: null })
      .eq('id', userId);
    if (error) throw error;
    setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, status: 'active' as const, banned_at: null, banned_reason: null } : p));
    addToast('success', 'User has been unbanned');
  }, [user, addToast]);

  const removeUser = useCallback(async (userId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'removed', banned_at: new Date().toISOString(), banned_reason: 'Account removed by admin' })
      .eq('id', userId);
    if (error) throw error;
    setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, status: 'removed' as const } : p));
    addToast('success', 'User has been removed');
  }, [user, addToast]);

  // ─── Post Actions ─────────────────────────────────────────
  const addPost = useCallback(async (content: string, imageFile?: File): Promise<Post | undefined> => {
    if (!user) return;
    const v = validateTextField(content, MAX_LENGTHS.POST_CONTENT, 'Post');
    if (!v.valid) { addToast('error', v.error!); return; }
    const rl = checkRateLimit('addPost', 5000);
    if (!rl.valid) { addToast('error', rl.error!); return; }
    const sanitized = sanitizeText(content);

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
      author_id: user.id, content: sanitized, image_url,
    }).select().single();
    if (error) throw error;
    if (newPost) setPosts((prev) => [newPost, ...prev]);
    addToast('success', 'Post shared');
    checkBadges();
    return newPost ?? undefined;
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
    const v = validateTextField(content, MAX_LENGTHS.COMMENT_CONTENT, 'Comment');
    if (!v.valid) { addToast('error', v.error!); return; }
    const rl = checkRateLimit('addComment', 2000);
    if (!rl.valid) { addToast('error', rl.error!); return; }
    const sanitized = sanitizeText(content);

    const { data: newComment, error } = await supabase.from('comments').insert({
      post_id: postId, author_id: user.id, content: sanitized, parent_id: parentId ?? null,
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
    const v = validateTextField(content, MAX_LENGTHS.PRAYER_CONTENT, 'Prayer request');
    if (!v.valid) { addToast('error', v.error!); return; }
    const rl = checkRateLimit('addPrayerRequest', 5000);
    if (!rl.valid) { addToast('error', rl.error!); return; }
    const sanitized = sanitizeText(content);

    const { data: newReq, error } = await supabase.from('prayer_requests').insert({
      author_id: user.id, content: sanitized, category, is_anonymous: isAnonymous,
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
    if (encouragement) {
      const v = validateTextField(encouragement, MAX_LENGTHS.ENCOURAGEMENT, 'Encouragement', false);
      if (!v.valid) { addToast('error', v.error!); return; }
    }
    const existing = prayerResponses.find((r) => r.prayer_request_id === requestId && r.user_id === user.id);
    if (existing) {
      await supabase.from('prayer_responses').delete().eq('id', existing.id);
      setPrayerResponses((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const { data: newResp } = await supabase.from('prayer_responses').insert({
        prayer_request_id: requestId, user_id: user.id, content: encouragement ? sanitizeText(encouragement) : null,
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
    const checks = [
      validateTextField(data.title, MAX_LENGTHS.EVENT_TITLE, 'Event title'),
      validateTextField(data.description || '', MAX_LENGTHS.EVENT_DESCRIPTION, 'Event description', false),
      validateTextField(data.location || '', MAX_LENGTHS.EVENT_LOCATION, 'Location', false),
    ];
    const fail = checks.find(c => !c.valid);
    if (fail) { addToast('error', fail.error!); return; }

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

  const updateEvent = useCallback(async (id: string, data: Partial<Omit<AppEvent, 'id' | 'created_by' | 'created_at' | 'rsvps'>>) => {
    const { error } = await supabase.from('events').update(data).eq('id', id);
    if (error) throw error;
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, ...data } : e));
    addToast('success', 'Event updated');
  }, [addToast]);

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
    if (!user) return;
    const date = new Date().toISOString().split('T')[0];
    const rows = userIds.map((uid) => ({ event_id: eventId, user_id: uid, date, recorded_by: user.id }));
    await supabase.from('attendance').upsert(rows, { onConflict: 'event_id,user_id' });
    // Update last_attended for each user
    for (const uid of userIds) {
      await supabase.from('profiles').update({ last_attended: date }).eq('id', uid);
    }
    addToast('success', 'Attendance recorded');
  }, [user, addToast]);

  // ─── Bible Study Actions ──────────────────────────────────
  const addBibleStudy = useCallback(async (data: { title: string; description: string; totalDays: number; days: Omit<StudyDay, 'id' | 'study_id'>[] }) => {
    if (!user) return;
    const checks = [
      validateTextField(data.title, MAX_LENGTHS.STUDY_TITLE, 'Study title'),
      validateTextField(data.description, MAX_LENGTHS.STUDY_DESCRIPTION, 'Study description'),
    ];
    const fail = checks.find(c => !c.valid);
    if (fail) { addToast('error', fail.error!); return; }

    const { data: study, error } = await supabase.from('bible_studies').insert({
      title: sanitizeText(data.title), description: sanitizeText(data.description), total_days: data.totalDays, created_by: user.id,
    }).select().single();
    if (error || !study) throw error ?? new Error('Failed to create study');

    const dayRows = data.days.map((d) => ({ ...d, study_id: study.id }));
    const { data: insertedDays } = await supabase.from('study_days').insert(dayRows).select();

    // Update local state so the study appears immediately
    setBibleStudies((prev) => [study, ...prev]);
    if (insertedDays) setStudyDays((prev) => [...prev, ...insertedDays]);
    addToast('success', 'Bible study created');
  }, [user, addToast]);

  const deleteBibleStudy = useCallback(async (studyId: string) => {
    if (!user) return;
    await supabase.from('study_progress').delete().eq('study_id', studyId);
    await supabase.from('study_enrollments').delete().eq('study_id', studyId);
    await supabase.from('study_days').delete().eq('study_id', studyId);
    await supabase.from('bible_studies').delete().eq('id', studyId);
    setBibleStudies((prev) => prev.filter((s) => s.id !== studyId));
    setStudyDays((prev) => prev.filter((d) => d.study_id !== studyId));
    setStudyEnrollments((prev) => prev.filter((e) => e.study_id !== studyId));
    setStudyProgress((prev) => prev.filter((p) => p.study_id !== studyId));
    addToast('success', 'Bible study deleted');
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
    const { data: progress } = await supabase.from('study_progress').upsert({
      user_id: user.id, study_id: studyId, day_number: dayNumber, reflection: reflection ?? null,
    }, { onConflict: 'user_id,study_id,day_number' }).select().single();

    // Update local state so the day shows as completed immediately
    if (progress) {
      setStudyProgress((prev) => {
        const filtered = prev.filter((p) => !(p.study_id === studyId && p.day_number === dayNumber && p.user_id === user.id));
        return [...filtered, progress];
      });
    }
    addToast('success', 'Day completed');
    checkBadges();
  }, [user, addToast, checkBadges]);

  // ─── Gallery Actions ──────────────────────────────────────
  const addAlbum = useCallback(async (title: string, description?: string, eventId?: string) => {
    if (!user) return;
    const v = validateTextField(title, MAX_LENGTHS.ALBUM_TITLE, 'Album title');
    if (!v.valid) { addToast('error', v.error!); return; }
    if (description) {
      const dv = validateTextField(description, MAX_LENGTHS.ALBUM_DESCRIPTION, 'Album description', false);
      if (!dv.valid) { addToast('error', dv.error!); return; }
    }

    await supabase.from('gallery_albums').insert({
      title: sanitizeText(title), description: description ? sanitizeText(description) : null, event_id: eventId ?? null, created_by: user.id,
    });
    addToast('success', 'Album created');
  }, [user, addToast]);

  const uploadPhoto = useCallback(async (albumId: string, file: File, caption?: string) => {
    if (!user) return;
    if (caption) {
      const v = validateTextField(caption, MAX_LENGTHS.PHOTO_CAPTION, 'Caption', false);
      if (!v.valid) { addToast('error', v.error!); return; }
    }
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
    const v = validateTextField(content, MAX_LENGTHS.MESSAGE_CONTENT, 'Message');
    if (!v.valid) { addToast('error', v.error!); return; }
    const rl = checkRateLimit('sendMessage', 1000);
    if (!rl.valid) { addToast('error', rl.error!); return; }
    const sanitized = sanitizeText(content);

    const { data: newMsg } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: receiverId, content: sanitized }).select().single();
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
        const unreadCount = msgs.filter((m) => m.sender_id !== user.id && !m.read_at).length;
        return { partnerId, partner, lastMessage, unreadCount };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.lastMessage.created_at).getTime() - new Date(a!.lastMessage.created_at).getTime()) as Conversation[];
  }, [user, messages, profiles]);

  const markMessagesRead = useCallback(async (senderId: string) => {
    if (!user) return;
    const unread = messages.filter((m) => m.sender_id === senderId && m.receiver_id === user.id && !m.read_at);
    if (unread.length === 0) return;
    const ids = unread.map((m) => m.id);
    const now = new Date().toISOString();
    await supabase.from('messages').update({ read_at: now }).in('id', ids);
    setMessages((prev) => prev.map((m) => ids.includes(m.id) ? { ...m, read_at: now } : m));
  }, [user, messages]);

  const unreadMessageCount = user
    ? messages.filter((m) => m.receiver_id === user.id && !m.read_at).length
    : 0;

  // ─── Pagination ─────────────────────────────────────────────
  const loadMorePosts = useCallback(async () => {
    if (loadingMorePosts || !hasMorePosts || posts.length === 0) return;
    setLoadingMorePosts(true);
    try {
      const oldest = posts[posts.length - 1];
      const { data } = await supabase
        .from('posts')
        .select('*')
        .lt('created_at', oldest.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (data) {
        setPosts(prev => [...prev, ...data]);
        setHasMorePosts(data.length === PAGE_SIZE);
      }
    } finally {
      setLoadingMorePosts(false);
    }
  }, [loadingMorePosts, hasMorePosts, posts]);

  const loadMorePrayers = useCallback(async () => {
    if (loadingMorePrayers || !hasMorePrayers || prayerRequests.length === 0) return;
    setLoadingMorePrayers(true);
    try {
      const oldest = prayerRequests[prayerRequests.length - 1];
      const { data } = await supabase
        .from('prayer_requests')
        .select('*')
        .lt('created_at', oldest.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (data) {
        setPrayerRequests(prev => [...prev, ...data]);
        setHasMorePrayers(data.length === PAGE_SIZE);
      }
    } finally {
      setLoadingMorePrayers(false);
    }
  }, [loadingMorePrayers, hasMorePrayers, prayerRequests]);

  // ─── Resource Actions ─────────────────────────────────────
  const addResource = useCallback(async (data: Omit<Resource, 'id' | 'created_by' | 'created_at'>) => {
    if (!user) return;
    const checks = [
      validateTextField(data.title, MAX_LENGTHS.RESOURCE_TITLE, 'Resource title'),
      validateTextField(data.description || '', MAX_LENGTHS.RESOURCE_DESCRIPTION, 'Description', false),
    ];
    if (data.link) {
      checks.push(validateTextField(data.link, MAX_LENGTHS.RESOURCE_LINK, 'Link'));
      checks.push(validateUrl(data.link, 'Resource link'));
    }
    const fail = checks.find(c => !c.valid);
    if (fail) { addToast('error', fail.error!); return; }

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
    const checks = [
      validateTextField(data.theme || '', MAX_LENGTHS.DEVOTIONAL_THEME, 'Theme', false),
      validateTextField(data.scripture_text || '', MAX_LENGTHS.DEVOTIONAL_TEXT, 'Scripture text', false),
      validateTextField(data.reflection || '', MAX_LENGTHS.DEVOTIONAL_REFLECTION, 'Reflection', false),
      validateTextField(data.affirmation || '', MAX_LENGTHS.DEVOTIONAL_AFFIRMATION, 'Affirmation', false),
      validateTextField(data.prayer || '', MAX_LENGTHS.DEVOTIONAL_PRAYER, 'Prayer', false),
    ];
    const fail = checks.find(c => !c.valid);
    if (fail) { addToast('error', fail.error!); return; }

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
    const v = validateTextField(note, MAX_LENGTHS.FOLLOW_UP_NOTE, 'Note');
    if (!v.valid) { addToast('error', v.error!); return; }

    const { data: newNote } = await supabase.from('follow_up_notes').insert({
      user_id: userId, leader_id: user.id, note: sanitizeText(note), status,
    }).select().single();
    if (newNote) setFollowUpNotes((prev) => [newNote, ...prev]);
    addToast('success', 'Note saved');
  }, [user, addToast]);

  // ─── Pod Actions ────────────────────────────────────────
  const addPod = useCallback(async (name: string, description: string | null, maxMembers: number) => {
    if (!user) return;
    const v = validateTextField(name, MAX_LENGTHS.POD_NAME, 'Pod name');
    if (!v.valid) { addToast('error', v.error!); return; }
    if (description) {
      const dv = validateTextField(description, MAX_LENGTHS.POD_DESCRIPTION, 'Pod description', false);
      if (!dv.valid) { addToast('error', dv.error!); return; }
    }

    const { data: newPod, error } = await supabase.from('pods').insert({
      name: sanitizeText(name), description: description ? sanitizeText(description) : null, max_members: maxMembers, created_by: user.id,
    }).select().single();
    if (error) throw error;
    if (newPod) setPods((prev) => [newPod, ...prev]);
    addToast('success', 'Pod created');
  }, [user, addToast]);

  const deletePod = useCallback(async (podId: string) => {
    await supabase.from('pod_checkins').delete().eq('pod_id', podId);
    await supabase.from('pod_members').delete().eq('pod_id', podId);
    await supabase.from('pods').delete().eq('id', podId);
    setPods((prev) => prev.filter((p) => p.id !== podId));
    setPodMembers((prev) => prev.filter((m) => m.pod_id !== podId));
    setPodCheckins((prev) => prev.filter((c) => c.pod_id !== podId));
    addToast('success', 'Pod deleted');
  }, [addToast]);

  const addPodMember = useCallback(async (podId: string, userId: string, role: 'leader' | 'member' = 'member') => {
    const { data: newMember, error } = await supabase.from('pod_members').insert({
      pod_id: podId, user_id: userId, role,
    }).select().single();
    if (error) throw error;
    if (newMember) setPodMembers((prev) => [...prev, newMember]);
  }, []);

  const removePodMember = useCallback(async (podId: string, userId: string) => {
    await supabase.from('pod_members').delete().eq('pod_id', podId).eq('user_id', userId);
    setPodMembers((prev) => prev.filter((m) => !(m.pod_id === podId && m.user_id === userId)));
  }, []);

  const addPodCheckin = useCallback(async (podId: string, content: string) => {
    if (!user) return;
    const v = validateTextField(content, MAX_LENGTHS.POD_CHECKIN, 'Check-in');
    if (!v.valid) { addToast('error', v.error!); return; }
    const rl = checkRateLimit('addPodCheckin', 2000);
    if (!rl.valid) { addToast('error', rl.error!); return; }

    const { data: newCheckin, error } = await supabase.from('pod_checkins').insert({
      pod_id: podId, user_id: user.id, content: sanitizeText(content),
    }).select().single();
    if (error) throw error;
    if (newCheckin) setPodCheckins((prev) => [newCheckin, ...prev]);
    addToast('success', 'Check-in posted');
  }, [user, addToast]);

  // ─── Guide Actions ──────────────────────────────────────
  const addGuideSection = useCallback(async (data: Omit<GuideSection, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const checks = [
      validateTextField(data.title, MAX_LENGTHS.GUIDE_TITLE, 'Guide title'),
      validateTextField(data.content, MAX_LENGTHS.GUIDE_CONTENT, 'Guide content'),
    ];
    const fail = checks.find(c => !c.valid);
    if (fail) { addToast('error', fail.error!); return; }

    const { data: newSection, error } = await supabase.from('guide_sections').insert({ ...data, created_by: user.id }).select().single();
    if (error) throw error;
    if (newSection) {
      // Refetch to re-merge with defaults
      const { data: all } = await supabase.from('guide_sections').select('*').order('display_order', { ascending: true });
      if (all && all.length > 0) {
        const dbCategories = new Set(all.map((s: GuideSection) => s.category));
        setGuideSections([
          ...all,
          ...defaultGuideSections.filter(d => !dbCategories.has(d.category)).map(d => ({ ...d, created_by: null, created_at: '', updated_at: '' }) as GuideSection),
        ]);
      }
    }
    addToast('success', 'Guide section added');
  }, [user, addToast]);

  const updateGuideSection = useCallback(async (id: string, data: Partial<Omit<GuideSection, 'id' | 'created_by' | 'created_at' | 'updated_at'>>) => {
    const { data: updated, error } = await supabase.from('guide_sections').update(data).eq('id', id).select().single();
    if (error) throw error;
    if (updated) setGuideSections(prev => prev.map(s => s.id === id ? updated : s));
    addToast('success', 'Guide section updated');
  }, [addToast]);

  const deleteGuideSection = useCallback(async (id: string) => {
    await supabase.from('guide_sections').delete().eq('id', id);
    // Refetch to re-merge with defaults
    const { data: all } = await supabase.from('guide_sections').select('*').order('display_order', { ascending: true });
    if (all && all.length > 0) {
      const dbCategories = new Set(all.map((s: GuideSection) => s.category));
      setGuideSections([
        ...all,
        ...defaultGuideSections.filter(d => !dbCategories.has(d.category)).map(d => ({ ...d, created_by: null, created_at: '', updated_at: '' }) as GuideSection),
      ]);
    } else {
      setGuideSections(defaultGuideSections.map(d => ({ ...d, created_by: null, created_at: '', updated_at: '' }) as GuideSection));
    }
    addToast('success', 'Guide section deleted');
  }, [addToast]);

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
    pods, podMembers, podCheckins, guideSections,
    toasts, addToast, removeToast,
    signIn, signUp, signOut,
    updateProfile, uploadAvatar, updateUserRole, banUser, unbanUser, removeUser,
    addPost, deletePost, togglePin, toggleReaction, addComment, deleteComment,
    addPrayerRequest, deletePrayerRequest, markPrayerAnswered, togglePrayerResponse,
    addEvent, updateEvent, deleteEvent, rsvpEvent, setEventReminder, removeEventReminder, recordAttendance,
    addBibleStudy, deleteBibleStudy, enrollInStudy, unenrolFromStudy, completeStudyDay,
    addAlbum, uploadPhoto, deletePhoto,
    sendMessage, getConversations, markMessagesRead, unreadMessageCount,
    addResource, deleteResource,
    addDevotional, updateDevotional, deleteDevotional,
    markNotificationRead, markAllNotificationsRead, deleteNotification, unreadNotificationCount,
    addFollowUpNote,
    addPod, deletePod, addPodMember, removePodMember, addPodCheckin,
    addGuideSection, updateGuideSection, deleteGuideSection,
    loadMorePosts, hasMorePosts, loadingMorePosts,
    loadMorePrayers, hasMorePrayers, loadingMorePrayers,
    refetchAll: fetchAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
