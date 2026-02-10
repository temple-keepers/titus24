import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { timeAgo, buildCommentTree, cn } from '@/lib/utils';
import { ImagePlus, Send, Pin, MessageCircle, ChevronDown, ChevronUp, PartyPopper } from 'lucide-react';
import type { ReactionType, Post as PostType } from '@/types';

const reactionEmojis: Record<ReactionType, string> = {
  amen: '🙏',
  heart: '❤️',
  praying: '🤲',
};

export default function Community() {
  const {
    user, profile, profiles, posts, comments, reactions,
    addPost, toggleReaction, addComment, deletePost, togglePin,
    addToast,
  } = useApp();

  const [newContent, setNewContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const sortedPosts = useMemo(() => {
    const pinned = posts.filter((p) => p.is_pinned);
    const rest = posts.filter((p) => !p.is_pinned);
    return [...pinned, ...rest];
  }, [posts]);

  // Today's celebrations
  const todayCelebrations = useMemo(() => {
    const now = new Date();
    const items: Array<{ name: string; type: 'birthday' | 'anniversary'; photoUrl: string | null }> = [];
    profiles.forEach(p => {
      if (!p.birthday_visible) return;
      [
        { date: p.birthday, type: 'birthday' as const },
        { date: p.wedding_anniversary, type: 'anniversary' as const },
      ].forEach(({ date, type }) => {
        if (!date) return;
        const d = new Date(date);
        if (d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
          items.push({ name: p.first_name, type, photoUrl: p.photo_url });
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

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Community
      </h1>

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
              <div key={i} className="flex items-center gap-3">
                <Avatar src={c.photoUrl} name={c.name} size="sm" />
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {c.type === 'birthday' ? '🎂' : '💍'}{' '}
                  Happy {c.type === 'birthday' ? 'Birthday' : 'Anniversary'}, <strong>{c.name}</strong>!
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      {sortedPosts.length === 0 ? (
        <EmptyState message="No posts yet. Be the first to share!" />
      ) : (
        <div className="space-y-4 stagger">
          {sortedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post Card Component ────────────────────────────────────
function PostCard({ post }: { post: PostType }) {
  const {
    user, profile, profiles, comments, reactions,
    toggleReaction, addComment, deletePost, togglePin,
  } = useApp();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const author = profiles.find((p) => p.id === post.author_id);
  const postComments = comments.filter((c) => c.post_id === post.id);
  const commentTree = useMemo(() => buildCommentTree(postComments), [postComments]);
  const postReactions = reactions.filter((r) => r.post_id === post.id);

  const reactionCounts: Record<ReactionType, number> = {
    amen: postReactions.filter((r) => r.type === 'amen').length,
    heart: postReactions.filter((r) => r.type === 'heart').length,
    praying: postReactions.filter((r) => r.type === 'praying').length,
  };

  const myReactions = postReactions.filter((r) => r.user_id === user?.id).map((r) => r.type);
  const isAdmin = profile?.role === 'admin';

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

      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={author?.photo_url ?? null} name={author?.first_name ?? 'U'} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {author?.first_name} {author?.last_name}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {timeAgo(post.created_at)}
            {author?.area && ` · ${author.area}`}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => togglePin(post.id, !post.is_pinned)}
            >
              <Pin size={14} />
            </button>
            <button
              className="btn btn-ghost btn-sm text-rose-400"
              onClick={() => { if (confirm('Delete this post?')) deletePost(post.id); }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
        {post.content}
      </p>

      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full rounded-xl mb-3 max-h-72 object-cover" />
      )}

      {/* Reactions */}
      <div className="flex items-center gap-2 mb-3">
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
            <CommentItem key={c.id} comment={c} onReply={setReplyTo} depth={0} />
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
            <button className="btn btn-primary btn-sm" onClick={handleComment} disabled={!commentText.trim()}>
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
    </div>
  );
}

// ─── Comment Item ───────────────────────────────────────────
function CommentItem({
  comment, onReply, depth,
}: {
  comment: any;
  onReply: (id: string) => void;
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
          <Avatar src={author?.photo_url ?? null} name={author?.first_name ?? 'U'} size="sm" />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            {author?.first_name}
          </span>
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
        <CommentItem key={r.id} comment={r} onReply={onReply} depth={depth + 1} />
      ))}
    </div>
  );
}
