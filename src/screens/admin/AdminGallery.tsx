import { useEffect, useState, type FormEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { ImageUpload } from '../../components/ImageUpload';
import { LoadingPage } from '../../components/LoadingPage';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ToastProvider';
import { failIfError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { GalleryAlbum, GalleryPhoto } from '../../lib/database.types';

export default function AdminGallery() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [photos, setPhotos] = useState<Record<string, GalleryPhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; cover_url: string }>({
    title: '',
    description: '',
    cover_url: '',
  });
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from('gallery_albums')
      .select('*')
      .order('created_at', { ascending: false });
    setAlbums((data as GalleryAlbum[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function loadPhotos(albumId: string) {
    const { data } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });
    setPhotos((prev) => ({ ...prev, [albumId]: (data as GalleryPhoto[] | null) ?? [] }));
  }

  useEffect(() => {
    if (openAlbumId) void loadPhotos(openAlbumId);
  }, [openAlbumId]);

  async function createAlbum(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('gallery_albums').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      cover_url: form.cover_url || null,
    });
    setBusy(false);
    if (failIfError(error, 'create album', addToast)) return;
    addToast({ kind: 'success', title: 'Album created' });
    setForm({ title: '', description: '', cover_url: '' });
    void refresh();
  }

  async function deleteAlbum(id: string) {
    if (!confirm('Delete this album and all its photos?')) return;
    // Photos cascade via FK in schema; if not, delete photos first.
    await supabase.from('gallery_photos').delete().eq('album_id', id);
    const { error } = await supabase.from('gallery_albums').delete().eq('id', id);
    if (failIfError(error, 'delete album', addToast)) return;
    if (openAlbumId === id) setOpenAlbumId(null);
    void refresh();
  }

  async function addPhoto(albumId: string, url: string) {
    if (!user || !url) return;
    const { error } = await supabase.from('gallery_photos').insert({
      album_id: albumId,
      url,
      caption: null,
      uploaded_by: user.id,
    });
    if (failIfError(error, 'add photo', addToast)) return;
    addToast({ kind: 'success', title: 'Photo added' });
    void loadPhotos(albumId);
  }

  async function deletePhoto(p: GalleryPhoto) {
    if (!confirm('Delete this photo?')) return;
    const { error } = await supabase.from('gallery_photos').delete().eq('id', p.id);
    if (failIfError(error, 'delete photo', addToast)) return;
    void loadPhotos(p.album_id);
  }

  if (loading) return <LoadingPage />;

  const openAlbum = albums.find((a) => a.id === openAlbumId) ?? null;

  if (openAlbum) {
    const list = photos[openAlbum.id] ?? [];
    return (
      <div className="space-y-4">
        <button
          onClick={() => setOpenAlbumId(null)}
          className="text-sm font-semibold text-brand-600"
        >
          ← All albums
        </button>
        <Card>
          <h2 className="font-display text-2xl">{openAlbum.title}</h2>
          {openAlbum.description && (
            <p className="text-sm text-app-muted mt-1">{openAlbum.description}</p>
          )}
        </Card>

        <Card>
          <SectionTitle>Add a photo</SectionTitle>
          {user && (
            <ImageUpload
              bucket="gallery"
              userId={user.id}
              value=""
              onChange={(url) => void addPhoto(openAlbum.id, url)}
              buttonLabel="Upload photo"
              label="JPG or PNG, up to 5 MB. Photo is added to the album as soon as it uploads."
            />
          )}
        </Card>

        <SectionTitle>Photos ({list.length})</SectionTitle>
        {list.length === 0 ? (
          <EmptyState title="No photos yet" body="Upload one above." icon={<ImagePlus size={24} />} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {list.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-2xl bg-surface-raised">
                <img src={p.url} alt={p.caption ?? ''} className="h-full w-full object-cover" loading="lazy" />
                <button
                  onClick={() => void deletePhoto(p)}
                  className="absolute top-1 right-1 rounded-full bg-black/55 p-1 text-white hover:bg-red-600"
                  aria-label="Delete photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>New album</SectionTitle>
        <form onSubmit={createAlbum} className="space-y-3">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-app-muted">
              Cover image
            </span>
            {user && (
              <ImageUpload
                bucket="gallery"
                userId={user.id}
                value={form.cover_url}
                onChange={(url) => setForm({ ...form, cover_url: url })}
                buttonLabel="Upload cover"
                label="Optional. Up to 5 MB."
              />
            )}
          </div>
          <Button type="submit" loading={busy}>Create album</Button>
        </form>
      </Card>

      <SectionTitle>Albums</SectionTitle>
      {albums.length === 0 ? (
        <EmptyState title="No albums yet" body="Create one above to get started." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {albums.map((a) => (
            <Card key={a.id} as="article">
              <button
                onClick={() => setOpenAlbumId(a.id)}
                className="block w-full text-left"
              >
                {a.cover_url ? (
                  <img src={a.cover_url} alt="" className="w-full h-32 object-cover rounded-2xl mb-2" />
                ) : (
                  <div className="w-full h-32 rounded-2xl bg-surface-raised flex items-center justify-center text-brand-400 mb-2">
                    <ImagePlus size={24} />
                  </div>
                )}
                <h3 className="font-display text-lg">{a.title}</h3>
                {a.description && <p className="text-xs text-app-muted line-clamp-2">{a.description}</p>}
              </button>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => void deleteAlbum(a.id)}
                  className="text-xs font-semibold text-red-600"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
