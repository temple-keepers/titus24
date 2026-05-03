/**
 * The remaining admin sections (Prayers, Studies, Resources, Pods,
 * Announcements, Email broadcast, Celebrations, Guide CMS) are all
 * variations of "list + create form + delete" against their respective
 * tables. Each ships as a thin scaffold here so the route tree is
 * complete; the existing schema's RLS policies are what gate write
 * access.
 *
 * When productionising, port over the richer flows from the legacy
 * `src-legacy/views/AdminDashboard.tsx`.
 */
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { LoadingPage } from '../../components/LoadingPage';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';

type Row = { id: string; created_at?: string; [k: string]: unknown };

interface Field {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'textarea' | 'url' | 'number';
  required?: boolean;
}

function makeListPage(opts: {
  table: string;
  title: string;
  display: (row: Row) => ReactNode;
  fields: Field[];
}) {
  return function Page() {
    const { addToast } = useToast();
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);

    async function refresh() {
      const { data } = await supabase
        .from(opts.table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);
      setRows(((data as Row[] | null) ?? []));
      setLoading(false);
    }

    useEffect(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function create(e: FormEvent) {
      e.preventDefault();
      setBusy(true);
      const payload: Record<string, unknown> = {};
      for (const f of opts.fields) {
        const v = form[f.key];
        if (f.type === 'number') payload[f.key] = v ? Number(v) : null;
        else payload[f.key] = v?.trim() || null;
      }
      const { error } = await supabase.from(opts.table).insert(payload);
      setBusy(false);
      if (failIfError(error, `create ${opts.title.toLowerCase()}`, addToast)) return;
      addToast({ kind: 'success', title: `${opts.title} added` });
      setForm({});
      refresh();
    }

    async function del(id: string) {
      if (!confirm('Delete this?')) return;
      const { error } = await supabase.from(opts.table).delete().eq('id', id);
      if (failIfError(error, 'delete', addToast)) return;
      refresh();
    }

    if (loading) return <LoadingPage />;

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>New {opts.title.toLowerCase()}</SectionTitle>
          <form onSubmit={create} className="space-y-3">
            {opts.fields.map((f) =>
              f.type === 'textarea' ? (
                <Textarea
                  key={f.key}
                  label={f.label}
                  required={f.required}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              ) : (
                <Input
                  key={f.key}
                  label={f.label}
                  type={f.type ?? 'text'}
                  required={f.required}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )
            )}
            <Button type="submit" loading={busy}>Save</Button>
          </form>
        </Card>
        <SectionTitle>{opts.title}</SectionTitle>
        {rows.length === 0 ? (
          <EmptyState title={`No ${opts.title.toLowerCase()}`} />
        ) : (
          rows.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">{opts.display(r)}</div>
                <button onClick={() => del(r.id)} className="text-xs text-red-600 font-semibold">Delete</button>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  };
}

export const AdminPrayers = makeListPage({
  table: 'prayer_requests',
  title: 'Prayer requests',
  display: (r) => (
    <>
      <p className="text-xs uppercase tracking-wide text-app-muted">{String(r.category)} {(r.is_anonymous as boolean) ? '· anonymous' : ''}</p>
      <p className="text-sm whitespace-pre-wrap">{String(r.content)}</p>
    </>
  ),
  fields: [],
});

export const AdminResources = makeListPage({
  table: 'resources',
  title: 'Resources',
  display: (r) => (
    <>
      <h3 className="font-display text-lg">{String(r.title)}</h3>
      <p className="text-xs text-app-muted">{String(r.category)}</p>
      {(r.url as string) && <a href={r.url as string} target="_blank" rel="noreferrer" className="text-xs text-brand-600">{String(r.url)}</a>}
    </>
  ),
  fields: [
    { key: 'title', label: 'Title', required: true },
    { key: 'category', label: 'Category', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'url', label: 'URL', type: 'url', required: true },
    { key: 'cover_url', label: 'Cover image URL', type: 'url' },
  ],
});

export const AdminStudies = makeListPage({
  table: 'bible_studies',
  title: 'Bible studies',
  display: (r) => (
    <>
      <h3 className="font-display text-lg">{String(r.title)}</h3>
      <p className="text-xs text-app-muted">{String(r.duration_days)} days</p>
    </>
  ),
  fields: [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'duration_days', label: 'Days', type: 'number', required: true },
    { key: 'cover_url', label: 'Cover URL', type: 'url' },
  ],
});

export const AdminPods = makeListPage({
  table: 'pods',
  title: 'Groups',
  display: (r) => (
    <>
      <h3 className="font-display text-lg">{String(r.name)}</h3>
      <p className="text-xs text-app-muted">{String(r.visibility)}{r.max_members ? ` · max ${r.max_members}` : ''}</p>
    </>
  ),
  fields: [
    { key: 'name', label: 'Name', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'visibility', label: 'Visibility (public or private)', required: true },
    { key: 'max_members', label: 'Max members (optional)', type: 'number' },
  ],
});

export const AdminAnnouncements = makeListPage({
  table: 'announcements',
  title: 'Announcements',
  display: (r) => (
    <>
      <h3 className="font-display text-lg">{String(r.title)}</h3>
      <p className="text-sm whitespace-pre-wrap">{String(r.body)}</p>
    </>
  ),
  fields: [
    { key: 'title', label: 'Title', required: true },
    { key: 'body', label: 'Body', type: 'textarea', required: true },
    { key: 'audience', label: 'Audience (all, leaders, members)', required: true },
  ],
});

export const AdminGuide = makeListPage({
  table: 'guide_sections',
  title: 'Guide sections',
  display: (r) => (
    <>
      <h3 className="font-display text-lg">{String(r.title)}</h3>
      <p className="text-sm whitespace-pre-wrap line-clamp-3">{String(r.body)}</p>
    </>
  ),
  fields: [
    { key: 'title', label: 'Title', required: true },
    { key: 'body', label: 'Body', type: 'textarea', required: true },
    { key: 'ordinal', label: 'Order (number)', type: 'number' },
  ],
});

export const AdminEmailBroadcast = makeListPage({
  table: 'email_broadcasts',
  title: 'Email broadcasts',
  display: (r) => (
    <>
      <h3 className="font-display text-lg">{String(r.subject)}</h3>
      <p className="text-xs text-app-muted">to {String(r.audience)}</p>
      <p className="text-sm whitespace-pre-wrap line-clamp-3">{String(r.body)}</p>
    </>
  ),
  fields: [
    { key: 'subject', label: 'Subject', required: true },
    { key: 'audience', label: 'Audience (all, leaders, members)', required: true },
    { key: 'body', label: 'Body (Markdown / plain)', type: 'textarea', required: true },
  ],
});
