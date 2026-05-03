import { useEffect, useState } from 'react';
import { ImageIcon, Image as ImageIconLucide } from 'lucide-react';
import { Card, EmptyState } from '../../components/Card';
import { LoadingPage } from '../../components/LoadingPage';
import { listAlbums, listAlbumPhotos } from '../../data/queries';
import type { GalleryAlbum, GalleryPhoto } from '../../lib/database.types';

export default function Gallery() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [open, setOpen] = useState<GalleryAlbum | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAlbums().then((a) => {
      setAlbums(a);
      setLoading(false);
    });
  }, []);

  async function openAlbum(a: GalleryAlbum) {
    setOpen(a);
    setPhotos(await listAlbumPhotos(a.id));
  }

  if (loading) return <LoadingPage />;

  if (open) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <button onClick={() => setOpen(null)} className="text-sm font-semibold text-brand-600">← All albums</button>
        <h1 className="font-display text-3xl">{open.title}</h1>
        {open.description && <p className="text-sm text-app-muted">{open.description}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setLightbox(p)}
              className="aspect-square overflow-hidden rounded-2xl bg-surface-raised"
            >
              <img src={p.url} alt={p.caption ?? ''} className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
        {lightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightbox(null)}
          >
            <img src={lightbox.url} alt={lightbox.caption ?? ''} className="max-h-full max-w-full rounded-2xl" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl">Gallery</h1>
      {albums.length === 0 ? (
        <EmptyState title="No albums yet" body="Photos will appear here as we make memories together." icon={<ImageIconLucide size={28} />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {albums.map((a) => (
            <Card key={a.id} className="cursor-pointer hover:shadow-soft-lg" as="article">
              <button onClick={() => openAlbum(a)} className="text-left w-full">
                {a.cover_url ? (
                  <img src={a.cover_url} alt="" className="w-full h-40 object-cover rounded-2xl mb-3" />
                ) : (
                  <div className="w-full h-40 rounded-2xl bg-surface-raised flex items-center justify-center text-brand-400 mb-3">
                    <ImageIcon size={32} />
                  </div>
                )}
                <h2 className="font-display text-xl">{a.title}</h2>
                {a.description && <p className="text-sm text-app-muted mt-1">{a.description}</p>}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
