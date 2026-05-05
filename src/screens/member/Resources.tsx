import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Library, ExternalLink, Plus, Clock } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { listResources } from '../../data/queries';
import type { Resource } from '../../lib/database.types';

export default function Resources() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Resource[]>([]);
  const [myDrafts, setMyDrafts] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggest, setShowSuggest] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    url: '',
  });
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [pub, mine] = await Promise.all([
      listResources(),
      user
        ? supabase
            .from('resources')
            .select('*')
            .eq('submitted_by', user.id)
            .eq('is_published', false)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as Resource[] }),
    ]);
    setItems(pub);
    setMyDrafts(((mine.data as Resource[] | null) ?? []));
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const grouped = useMemo(() => {
    const m = new Map<string, Resource[]>();
    items.forEach((r) => {
      const k = r.category || 'Other';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  async function suggest(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('resources').insert({
      title: form.title.trim(),
      category: form.category.trim() || 'Other',
      description: form.description.trim() || null,
      url: form.url.trim(),
      cover_url: null,
      is_published: false,
      submitted_by: user.id,
    });
    setBusy(false);
    if (failIfError(error, 'submit your resource', addToast)) return;
    addToast({
      kind: 'success',
      title: 'Sent for review',
      body: 'A leader will check your suggestion before it appears in the library.',
    });
    setForm({ title: '', category: '', description: '', url: '' });
    setShowSuggest(false);
    void refresh();
  }

  async function deleteDraft(id: string) {
    if (!confirm('Delete this draft?')) return;
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (failIfError(error, 'delete your draft', addToast)) return;
    void refresh();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl">Resources</h1>
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<Plus size={14} />}
          onClick={() => setShowSuggest((v) => !v)}
        >
          Suggest
        </Button>
      </header>

      {showSuggest && (
        <Card>
          <SectionTitle>Suggest a resource</SectionTitle>
          <p className="mb-3 text-xs text-app-muted">
            Books, podcasts, sermons, videos — anything that's blessed you. A leader will review
            it before it goes live in the library.
          </p>
          <form onSubmit={suggest} className="space-y-3">
            <Input
              label="Title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="E.g. Discerning the Voice of God"
            />
            <Input
              label="Category"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Teaching · Podcast · Book · Video"
            />
            <Input
              label="Link"
              type="url"
              required
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://"
            />
            <Textarea
              label="Why this resource?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="A line or two on what made it speak to you."
            />
            <div className="flex gap-2">
              <Button type="submit" loading={busy}>Send for review</Button>
              <Button type="button" variant="ghost" onClick={() => setShowSuggest(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* My pending drafts */}
      {myDrafts.length > 0 && (
        <section>
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <Clock size={14} className="text-app-muted" /> Awaiting review
            </span>
          </SectionTitle>
          <div className="space-y-2">
            {myDrafts.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg">{r.title}</h3>
                    <p className="text-xs text-app-muted">{r.category}</p>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block break-all text-xs text-brand-600"
                    >
                      {r.url}
                    </a>
                  </div>
                  <button
                    onClick={() => void deleteDraft(r.id)}
                    className="text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {grouped.length === 0 ? (
        <EmptyState
          title="No resources yet"
          body="Books, podcasts, sermons — they'll show up here."
          icon={<Library size={28} />}
        />
      ) : (
        grouped.map(([cat, list]) => (
          <section key={cat}>
            <SectionTitle>{cat}</SectionTitle>
            <div className="space-y-2">
              {list.map((r) => (
                <Card key={r.id}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3">
                    {r.cover_url && <img src={r.cover_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg">{r.title}</h3>
                      {r.description && <p className="text-sm text-app-muted">{r.description}</p>}
                    </div>
                    <ExternalLink size={16} className="shrink-0 text-app-muted" />
                  </a>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
