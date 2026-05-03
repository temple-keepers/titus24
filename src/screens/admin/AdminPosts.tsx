import { useEffect, useState } from 'react';
import { Pin, Trash2 } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingPage } from '../../components/LoadingPage';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { listPosts } from '../../data/queries';
import type { PostWithAuthor } from '../../data/queries';
import { timeAgo } from '../../lib/dates';

export default function AdminPosts() {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setPosts(await listPosts(100));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function togglePin(p: PostWithAuthor) {
    const { error } = await supabase.from('posts').update({ is_pinned: !p.is_pinned }).eq('id', p.id);
    if (failIfError(error, 'pin post', addToast)) return;
    refresh();
  }

  async function del(p: PostWithAuthor) {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', p.id);
    if (failIfError(error, 'delete post', addToast)) return;
    addToast({ kind: 'success', title: 'Post deleted' });
    refresh();
  }

  if (loading) return <LoadingPage />;
  if (posts.length === 0) return <EmptyState title="No posts" />;

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <Card key={p.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{p.author?.display_name ?? p.author?.first_name}</div>
              <div className="text-[11px] text-app-muted">{timeAgo(p.created_at)}</div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{p.content}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant={p.is_pinned ? 'sage' : 'secondary'} leadingIcon={<Pin size={14} />} onClick={() => togglePin(p)}>
                {p.is_pinned ? 'Unpin' : 'Pin'}
              </Button>
              <Button size="sm" variant="danger" leadingIcon={<Trash2 size={14} />} onClick={() => del(p)}>
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
