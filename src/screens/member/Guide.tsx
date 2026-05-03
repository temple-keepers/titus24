import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { LoadingPage } from '../../components/LoadingPage';
import { supabase } from '../../lib/supabase';

interface Section {
  id: string;
  title: string;
  body: string;
  ordinal: number;
}

export default function Guide() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('guide_sections')
      .select('id, title, body, ordinal')
      .order('ordinal', { ascending: true })
      .then(({ data }) => {
        setSections((data as Section[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">Guide</h1>
      <p className="text-sm text-app-muted">Quick answers about how to get the most out of Titus 2:4.</p>
      {sections.length === 0 ? (
        <EmptyState title="Guide is being written" body="Leadership will add help articles soon." icon={<HelpCircle size={24} />} />
      ) : (
        sections.map((s) => (
          <Card key={s.id}>
            <SectionTitle>{s.title}</SectionTitle>
            <div className="text-sm leading-7 whitespace-pre-wrap">{s.body}</div>
          </Card>
        ))
      )}
    </div>
  );
}
