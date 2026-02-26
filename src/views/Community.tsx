import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import PullToRefresh from '@/components/PullToRefresh';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import ConfirmModal from '@/components/ConfirmModal';
import { timeAgo, buildCommentTree, cn } from '@/lib/utils';
import {
  ImagePlus, Send, Pin, MessageCircle, ChevronDown, ChevronUp,
  PartyPopper, TrendingUp, Filter, Bookmark, BookmarkCheck,
  Flame, Users,
} from 'lucide-react';
import type { ReactionType, Post as PostType, Profile } from '@/types';

const reactionEmojis: Record<ReactionType, string> = {
  amen: '🙏',
  heart: '❤️',
  praise: '🙌',
  strength: '💪',
  fire: '🔥',
};

type PostFilter = 'all' | 'popular' | 'mine';

export default function Community() {
  const {
    user, profile, profiles, posts, comments, reactions,
    addPost, addToast,
    loadMorePosts, hasMorePosts, loadingMorePosts,
    refetchAll,
  } = useApp();
  const handleRefresh = useCallback(() => refetchAll(), [refetchAll]);

  const [newContent, setNewContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState<PostFilter>('all');
  const [savedPosts, setSavedPosts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('titus24_saved_posts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const navigate = useNavigate();
  const viewProfile = (p: Profile) => navigate(`/member/${p.id}`);

  // Active members this week
  const activeMembers = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const activeIds = new Set<string>();
    posts.forEach((p) => {
      if (new Date(p.created_at) >= oneWeekAgo) activeIds.add(p.author_id);
    });
    comments.forEach((c) => {
      if (new Date(c.created_at) >= oneWeekAgo) activeIds.add(c.author_id);
    });
    return profiles
      .filter((p) => activeIds.has(p.id) && p.id !== user?.id)
      .slice(0, 8);
  }, [posts, comments, profiles, user]);

  const sortedPosts = useMemo(() => {
    let filtered = [...posts];

    // Filter by type
    if (filter === 'mine') {
      filtered = filtered.filter((p) => p.author_id === user?.id);
    }
    if (showSavedOnly) {
      filtered = filtered.filter((p) => savedPosts.has(p.id));
    }

    // Sort: pinned first, then by criteria
    const pinned = filtered.filter((p) => p.is_pinned);
    const rest = filtered.filter((p) => !p.is_pinned);

    if (filter === 'popular') {
      rest.sort((a, b) => {
        const aReactions = reactions.filter((r) => r.post_id === a.id).length;
        const bReactions = reactions.filter((r) => r.post_id === b.id).length;
        const aComments = comments.filter((c) => c.post_id === a.id).length;
        const bComments = comments.filter((c) => c.post_id === b.id).length;
        return (bReactions + bComments) - (aReactions + aComments);
      });
    }

    return [...pinned, ...rest];
  }, [posts, filter, showSavedOnly, savedPosts, user, reactions, comments]);

  // Today's celebrations
  const todayCelebrations = useMemo(() => {
    const now = new Date();
    const items: Array<{ profile: Profile; type: 'birthday' | 'anniversary' }> = [];
    profiles.forEach((p) => {
      if (!p.birthday_visible) return;
      [
        { date: p.birthday, type: 'birthday' as const },
        { date: p.wedding_anniversary, type: 'anniversary' as const },
      ].forEach(({ date, type }) => {
        if (!date) return;
        const d = new Date(date);
        if (d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
          items.push({ profile: p, type });
        }
      });
    });
    return items;
  }, [profiles]);

  const handlePost = async () => {
    if (!newContent.trim() && !imageFile) return;
    setPosting(true);
    try {
      await addPost(newContent.trim(), imageFile ?? undefined);
      setNewContent('');
      setImageFile(null);
      setImagePreview(null);
    } catch {
      addToast('error', 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleSavePost = (postId: string) => {
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      localStorage.setItem('titus24_saved_posts', JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Community
      </h1>

      {/* Active Members This Week */}
      {activeMembers.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Flame size={14} style={{ color: 'var(--color-brand)' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
              Active This Week
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {activeMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => viewProfile(m)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-transform active:scale-95"
              >
                <div
                  className="rounded-full p-[2px]"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  <div className="rounded-full p-[2px]" style={{ background: 'var(--color-bg-raised)' }}>
                    <Avatar src={m.photo_url} name={m.first_name} size="sm" />
                  </div>
                </div>
                <span className="text-[10px] font-semibold truncate w-14 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  {m.first_name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compose */}
      <div className="card space-y-3">
        <div className="flex gap-3">
          <Avatar src={profile?.photo_url ?? null} name={profile?.first_name ?? 'U'} size="sm" />
          <textarea
            className="input flex-1"
            placeholder="Share what's on your heart…"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={2}
          />
        </div>
        {imagePreview && (
          <div className="relative">
            <img src={imagePreview} alt="" className="w-full rounded-xl max-h-48 object-cover" />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <label className="btn btn-ghost btn-sm cursor-pointer">
            <ImagePlus size={16} />
            Photo
            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </label>
          <button
            className="btn btn-primary btn-sm"
            onClick={handlePost}
            disabled={posting || (!newContent.trim() && !imageFile)}
          >
            <Send size={14} />
            {posting ? 'Posting…' : 'Share'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([
          { key: 'all' as const, label: 'Latest', icon: <Filter size={13} /> },
          { key: 'popular' as const, label: 'Popular', icon: <TrendingUp size={13} /> },
          { key: 'mine' as const, label: 'My Posts', icon: <Users size={13} /> },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setShowSavedOnly(false); }}
            className={cn(
              'btn btn-sm flex-shrink-0 text-xs',
              filter === key && !showSavedOnly ? 'btn-primary' : 'btn-secondary'
            )}
          >
            {icon} {label}
          </button>
        ))}
        <button
          onClick={() => setShowSavedOnly(!showSavedOnly)}
          className={cn(
            'btn btn-sm flex-shrink-0 text-xs',
            showSavedOnly ? 'btn-primary' : 'btn-secondary'
          )}
        >
          <Bookmark size={13} /> Saved
        </button>
      </div>

      {/* Celebration Banner */}
      {todayCelebrations.length > 0 && (
        <div
          className="card card-glow"
          style={{
            background: 'linear-gradient(135deg, var(--color-bg-raised) 0%, var(--color-gold-soft, rgba(245,176,65,0.08)) 100%)',
            borderColor: 'rgba(245,176,65,0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <PartyPopper size={18} style={{ color: 'var(--color-gold)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--color-gold)' }}>
              Celebrate Today!
            </span>
          </div>
          <div className="space-y-2">
            {todayCelebrations.map((c, i) => (
              <button
                key={i}
                onClick={() => viewProfile(c.profile)}
                className="flex items-center gap-3 w-full text-left transition-opacity hover:opacity-80"
              >
                <Avatar src={c.profile.photo_url} name={c.profile.first_name} size="sm" />
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {c.type === 'birthday' ? '🎂' : '💍'}{' '}
                  Happy {c.type === 'birthday' ? 'Birthday' : 'Anniversary'}, <strong>{c.profile.first_name}</strong>!
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      {sortedPosts.length === 0 ? (
        <EmptyState message={
          showSavedOnly ? 'No saved posts yet. Bookmark posts to find them here!'
            : filter === 'mine' ? 'You haven\'t posted yet. Share what\'s on your heart!'
            : 'No posts yet. Be the first to share!'
        } />
      ) : (
        <div className="space-y-4 stagger">
          {sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isSaved={savedPosts.has(post.id)}
              onToggleSave={() => toggleSavePost(post.id)}
              onViewProfile={viewProfile}
            />
          ))}
          {hasMorePosts && filter === 'all' && !showSavedOnly && (
            <button
              className="btn btn-secondary w-full"
              onClick={loadMorePosts}
              disabled={loadingMorePosts}
            >
              {loadingMorePosts ? 'Loading...' : 'Load older posts'}
            </button>
          )}
        </div>
      )}

    </div>
    </PullToRefresh>
  );
}

// ─── Post Card Component ────────────────────────────────────
function PostCard({
  post,
  isSaved,
  onToggleSave,
  onViewProfile,
}: {
  post: PostType;
  isSaved: boolean;
  onToggleSave: () => void;
  onViewProfile: (profile: Profile) => void;
}) {
  const {
    user, profile, profiles, comments, reactions,
    toggleReaction, addComment, deletePost, togglePin,
  } = useApp();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showReactors, setShowReactors] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const author = profiles.find((p) => p.id === post.author_id);
  const postComments = comments.filter((c) => c.post_id === post.id);
  const commentTree = useMemo(() => buildCommentTree(postComments), [postComments]);
  const postReactions = reactions.filter((r) => r.post_id === post.id);

  const reactionCounts: Record<ReactionType, number> = {
    amen: postReactions.filter((r) => r.type === 'amen').length,
    heart: postReactions.filter((r) => r.type === 'heart').length,
    praise: postReactions.filter((r) => r.type === 'praise').length,
    strength: postReactions.filter((r) => r.type === 'strength').length,
    fire: postReactions.filter((r) => r.type === 'fire').length,
  };
  const totalReactions = postReactions.length;

  const myReactions = postReactions.filter((r) => r.user_id === user?.id).map((r) => r.type);
  const isAdmin = profile?.role === 'admin';
  const isOwnPost = post.author_id === user?.id;

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await addComment(post.id, commentText.trim(), replyTo ?? undefined);
    setCommentText('');
    setReplyTo(null);
  };

  return (
    <div
      className={cn('card', post.is_pinned && 'card-glow')}
      style={post.is_pinned ? { borderColor: 'rgba(245, 176, 65, 0.3)' } : undefined}
    >
      {/* Pin indicator */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold" style={{ color: 'var(--color-brand)' }}>
          <Pin size={12} />
          Pinned
        </div>
      )}

      {/* Author + actions */}
      <div className="mb-3">
        {/* Row 1: Avatar, name, badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => author && onViewProfile(author)}
            className="flex-shrink-0 transition-transform active:scale-95"
          >
            <Avatar src={author?.photo_url ?? null} name={author?.first_name ?? 'U'} size="sm" />
          </button>
          <button
            onClick={() => author && onViewProfile(author)}
            className="flex-1 min-w-0 text-left"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {author?.first_name} {author?.last_name}
              </span>
              {(author?.role === 'elder' || author?.role === 'admin') && (
                <span className="badge badge-gold text-[9px] py-0 px-1.5">Elder</span>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
              {timeAgo(post.created_at)}
              {(author?.city || author?.area) && ` · ${author.city && author.country ? `${author.city}, ${author.country}` : author?.area}`}
            </div>
          </button>
        </div>

        {/* Row 2: Action buttons */}
        <div className="flex gap-1 items-center mt-2 ml-12">
          <button
            onClick={onToggleSave}
            className="btn btn-ghost btn-sm p-1.5"
            aria-label={isSaved ? 'Unsave post' : 'Save post'}
          >
            {isSaved ? (
              <BookmarkCheck size={14} style={{ color: 'var(--color-brand)' }} />
            ) : (
              <Bookmark size={14} />
            )}
          </button>
          {isAdmin && (
            <>
              <button
                className="btn btn-ghost btn-sm p-1.5"
                onClick={() => togglePin(post.id, !post.is_pinned)}
                aria-label={post.is_pinned ? 'Unpin post' : 'Pin post'}
              >
                <Pin size={13} />
              </button>
              <button
                className="btn btn-ghost btn-sm p-1.5 text-rose-400"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete post"
              >
                ✕
              </button>
            </>
          )}
          {!isAdmin && isOwnPost && (
            <button
              className="btn btn-ghost btn-sm p-1.5 text-rose-400"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete post"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
        {post.content}
      </p>

      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full rounded-xl mb-3 max-h-72 object-cover" />
      )}

      {/* Engagement summary */}
      {(totalReactions > 0 || postComments.length > 0) && (
        <div className="flex items-center justify-between text-xs mb-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
          {totalReactions > 0 && (
            <button
              onClick={() => setShowReactors(!showReactors)}
              className="hover:underline"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {Object.entries(reactionCounts)
                .filter(([_, count]) => count > 0)
                .map(([type]) => reactionEmojis[type as ReactionType])
                .join('')}{' '}
              {totalReactions}
            </button>
          )}
          {postComments.length > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {postComments.length} {postComments.length === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Who reacted panel */}
      {showReactors && totalReactions > 0 && (
        <div
          className="rounded-xl px-3 py-2.5 mb-2 space-y-1.5"
          style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)' }}
        >
          {(Object.keys(reactionEmojis) as ReactionType[]).map((type) => {
            const reactors = postReactions.filter((r) => r.type === type);
            if (reactors.length === 0) return null;
            return (
              <div key={type} className="flex items-center gap-2 text-xs">
                <span>{reactionEmojis[type]}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {reactors.map((r) => {
                    const p = profiles.find((pr) => pr.id === r.user_id);
                    return r.user_id === user?.id ? 'You' : p?.first_name ?? 'Someone';
                  }).join(', ')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="divider mb-2" />

      {/* Reactions */}
      <div className="flex items-center gap-2 mb-2">
        {(Object.keys(reactionEmojis) as ReactionType[]).map((type) => (
          <button
            key={type}
            onClick={() => toggleReaction(post.id, type)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              myReactions.includes(type)
                ? 'bg-brand-500/15 border border-brand-500/30'
                : 'border'
            )}
            style={{
              borderColor: myReactions.includes(type) ? undefined : 'var(--color-border)',
              color: myReactions.includes(type) ? 'var(--color-brand)' : 'var(--color-text-muted)',
            }}
          >
            {reactionEmojis[type]}
            {reactionCounts[type] > 0 && reactionCounts[type]}
          </button>
        ))}
      </div>

      {/* Comments toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <MessageCircle size={14} />
        {postComments.length} {postComments.length === 1 ? 'comment' : 'comments'}
        {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 space-y-3">
          {commentTree.map((c: any) => (
            <CommentItem
              key={c.id}
              comment={c}
              onReply={setReplyTo}
              onViewProfile={onViewProfile}
              depth={0}
            />
          ))}

          {/* Comment input */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              className="input flex-1 text-sm"
              placeholder={replyTo ? 'Write a reply…' : 'Write a comment…'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleComment(); }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleComment} disabled={!commentText.trim()} aria-label="Send comment">
              <Send size={12} />
            </button>
          </div>
          {replyTo && (
            <button
              className="text-xs underline"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={() => setReplyTo(null)}
            >
              Cancel reply
            </button>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deletePost(post.id)}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

// ─── Comment Item ───────────────────────────────────────────
function CommentItem({
  comment,
  onReply,
  onViewProfile,
  depth,
}: {
  comment: any;
  onReply: (id: string) => void;
  onViewProfile: (profile: Profile) => void;
  depth: number;
}) {
  const { profiles } = useApp();
  const author = profiles.find((p: any) => p.id === comment.author_id);

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <div
        className="rounded-xl px-3 py-2"
        style={{ background: depth > 0 ? 'var(--color-bg-overlay)' : 'transparent' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => author && onViewProfile(author)}
            className="flex-shrink-0 transition-transform active:scale-95"
          >
            <Avatar src={author?.photo_url ?? null} name={author?.first_name ?? 'U'} size="sm" />
          </button>
          <button
            onClick={() => author && onViewProfile(author)}
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--color-text)' }}
          >
            {author?.first_name}
          </button>
          {(author?.role === 'elder' || author?.role === 'admin') && (
            <span className="badge badge-gold text-[8px] py-0 px-1">Elder</span>
          )}
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {timeAgo(comment.created_at)}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text)' }}>
          {comment.content}
        </p>
        <button
          onClick={() => onReply(comment.id)}
          className="text-xs font-medium mt-1 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Reply
        </button>
      </div>
      {comment.replies?.map((r: any) => (
        <CommentItem key={r.id} comment={r} onReply={onReply} onViewProfile={onViewProfile} depth={depth + 1} />
      ))}
    </div>
  );
}
