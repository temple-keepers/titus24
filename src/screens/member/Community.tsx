import { useEffect, useState, type FormEvent } from 'react';
import { Heart, Sparkles, Hand, MessageCircle, Pin, Image as ImageIcon, Send } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea, Input } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { LoadingPage } from '../../components/LoadingPage';
import { PullToRefresh } from '../../components/PullToRefresh';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { listPosts, listComments, listReactions } from '../../data/queries';
import type { PostWithAuthor } from '../../data/queries';
import type { Comment, ReactionType } from '../../lib/database.types';
import { timeAgo } from '../../lib/dates';
import { isAdmin } from '../../lib/roles';
import { cn } from '../../lib/cn';

const REACTION_TYPES: Array<{ type: ReactionType; Icon: typeof Heart; label: string }> = [
  { type: 'heart', Icon: Heart, label: 'love' },
  { type: 'praise', Icon: Sparkles, label: 'praise' },
  { type: 'amen', Icon: Hand, label: 'amen' },
  { type: 'hug', Icon: Heart, label: 'hug' },
];

export default function Community() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const ps = await listPosts(50);
    setPosts(ps);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onShare(e: FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      content: content.trim(),
      image_url: imageUrl.trim() || null,
    });
    setBusy(false);
    if (failIfError(error, 'share your post', addToast)) return;
    setContent('');
    setImageUrl('');
    addToast({ kind: 'success', title: 'Shared with the sisterhood' });
    refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Community</h1>
      <Card>
        <form onSubmit={onShare} className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar size={40} url={profile?.avatar_url} name={profile?.display_name ?? profile?.first_name} />
            <Textarea
              name="content"
              placeholder={`What's on your heart, ${profile?.first_name ?? 'sister'}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              required
            />
          </div>
          {imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-app">
              <img src={imageUrl} alt="" className="w-full h-48 object-cover" />
            </div>
          )}
          <div className="flex items-end justify-between gap-3">
            <Input
              name="image"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="text-xs"
            />
            <Button type="submit" loading={busy} leadingIcon={<Send size={16} />}>
              Share
            </Button>
          </div>
        </form>
      </Card>

      {posts.length === 0 && (
        <EmptyState title="Be the first to share" body="Tell the sisterhood something on your heart." icon={<MessageCircle size={28} />} />
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onRefresh={refresh} canPin={isAdmin(profile?.role)} />
      ))}
    </div>
    </PullToRefresh>
  );
}

function PostCard({ post, onRefresh, canPin }: { post: PostWithAuthor; onRefresh: () => void; canPin: boolean }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Array<Comment & { author: PostWithAuthor['author'] }>>([]);
  const [myReactions, setMyReactions] = useState<Set<ReactionType>>(new Set());
  const [reactionTotals, setReactionTotals] = useState<Record<ReactionType, number>>({} as Record<ReactionType, number>);
  const [commentText, setCommentText] = useState('');

  async function loadInteractions() {
    const [cs, rs] = await Promise.all([listComments(post.id), listReactions(post.id)]);
    setComments(cs);
    const totals: Record<string, number> = {};
    const mine = new Set<ReactionType>();
    rs.forEach((r) => {
      totals[r.type] = (totals[r.type] ?? 0) + 1;
      if (user && r.user_id === user.id) mine.add(r.type);
    });
    setReactionTotals(totals as Record<ReactionType, number>);
    setMyReactions(mine);
  }

  useEffect(() => {
    loadInteractions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  async function toggleReaction(type: ReactionType) {
    if (!user) return;
    const has = myReactions.has(type);
    if (has) {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .eq('type', type);
      if (failIfError(error, 'remove your reaction', addToast)) return;
    } else {
      const { error } = await supabase.from('reactions').insert({ post_id: post.id, user_id: user.id, type });
      if (failIfError(error, 'add your reaction', addToast)) return;
    }
    loadInteractions();
  }

  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      parent_id: null,
      author_id: user.id,
      content: commentText.trim(),
    });
    if (failIfError(error, 'add your comment', addToast)) return;
    setCommentText('');
    loadInteractions();
  }

  async function togglePin() {
    const { error } = await supabase.from('posts').update({ is_pinned: !post.is_pinned }).eq('id', post.id);
    if (failIfError(error, 'pin this post', addToast)) return;
    onRefresh();
  }

  return (
    <Card className={cn(post.is_pinned && 'ring-2 ring-brand-300')}>
      <header className="mb-3 flex items-center gap-3">
        <Avatar size={40} url={post.author?.avatar_url ?? null} name={post.author?.display_name ?? post.author?.first_name ?? 'Sister'} />
        <div className="flex-1">
          <div className="text-sm font-semibold">{post.author?.display_name ?? post.author?.first_name ?? 'Sister'}</div>
          <div className="text-[11px] text-app-muted">{timeAgo(post.created_at)}</div>
        </div>
        {post.is_pinned && <Pin size={16} className="text-brand-500" aria-label="Pinned" />}
        {canPin && (
          <button onClick={togglePin} className="text-xs text-app-muted hover:text-brand-600">
            {post.is_pinned ? 'Unpin' : 'Pin'}
          </button>
        )}
      </header>
      <p className="text-sm leading-7 whitespace-pre-wrap">{post.content}</p>
      {post.image_url && <img src={post.image_url} alt="" className="mt-3 w-full rounded-2xl" loading="lazy" />}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {REACTION_TYPES.map(({ type, Icon, label }) => {
          const active = myReactions.has(type);
          const count = reactionTotals[type] ?? 0;
          return (
            <button
              key={type}
              onClick={() => toggleReaction(type)}
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border transition',
                active
                  ? 'bg-brand-100 border-brand-300 text-brand-700'
                  : 'border-app text-app-muted hover:bg-surface-raised'
              )}
            >
              <Icon size={14} />
              {label}
              {count > 0 && <span className="opacity-70">· {count}</span>}
            </button>
          );
        })}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="ml-auto text-xs font-semibold text-app-muted hover:text-brand-600"
        >
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </button>
      </div>
      {showComments && (
        <div className="mt-3 border-t border-app pt-3 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar size={28} url={c.author?.avatar_url ?? null} name={c.author?.display_name ?? c.author?.first_name ?? 'Sister'} />
              <div className="flex-1 rounded-2xl bg-surface-raised px-3 py-2">
                <div className="text-xs font-semibold">{c.author?.display_name ?? c.author?.first_name ?? 'Sister'}</div>
                <div className="text-sm">{c.content}</div>
                <div className="text-[10px] text-app-muted mt-1">{timeAgo(c.created_at)}</div>
              </div>
            </div>
          ))}
          <form onSubmit={addComment} className="flex items-center gap-2">
            <Input
              name="comment"
              placeholder="Encourage your sister…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button type="submit" size="sm">Send</Button>
          </form>
        </div>
      )}
    </Card>
  );
}
