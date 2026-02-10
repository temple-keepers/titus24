import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { Plus, ImagePlus, Camera } from 'lucide-react';

export default function Gallery() {
  const {
    profile, galleryAlbums, galleryPhotos,
    addAlbum, uploadPhoto, deletePhoto, addToast,
  } = useApp();

  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbum || !e.target.files?.[0]) return;
    setUploading(true);
    try {
      await uploadPhoto(selectedAlbum, e.target.files[0]);
    } catch {
      addToast('error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (selectedAlbum) {
    const album = galleryAlbums.find((a) => a.id === selectedAlbum);
    const photos = galleryPhotos.filter((p) => p.album_id === selectedAlbum);

    return (
      <div className="space-y-6">
        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAlbum(null)}>
          ← Back to albums
        </button>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {album?.title}
          </h1>
          <label className="btn btn-primary btn-sm cursor-pointer">
            <ImagePlus size={14} /> {uploading ? 'Uploading…' : 'Add'}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        {photos.length === 0 ? (
          <EmptyState message="No photos yet — be the first to add one!" />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setLightboxUrl(photo.image_url)}
                className="aspect-square rounded-xl overflow-hidden"
              >
                <img src={photo.image_url} alt={photo.caption ?? ''} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </button>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <img src={lightboxUrl} alt="" className="max-w-full max-h-full rounded-xl" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Gallery</h1>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAlbumModal(true)}>
            <Plus size={14} /> Album
          </button>
        )}
      </div>
      {galleryAlbums.length === 0 ? (
        <EmptyState message="No albums yet" />
      ) : (
        <div className="grid grid-cols-2 gap-3 stagger">
          {galleryAlbums.map((album) => {
            const photos = galleryPhotos.filter((p) => p.album_id === album.id);
            const cover = photos[0]?.image_url;
            return (
              <button
                key={album.id}
                onClick={() => setSelectedAlbum(album.id)}
                className="card text-left overflow-hidden p-0"
              >
                <div className="aspect-[4/3] bg-black/10 flex items-center justify-center">
                  {cover ? (
                    <img src={cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={24} style={{ color: 'var(--color-text-faint)' }} />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{album.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{photos.length} photos</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal isOpen={showAlbumModal} onClose={() => setShowAlbumModal(false)} title="Create Album">
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" value={albumDesc} onChange={(e) => setAlbumDesc(e.target.value)} rows={2} />
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={async () => {
              await addAlbum(albumTitle.trim(), albumDesc.trim() || undefined);
              setAlbumTitle(''); setAlbumDesc(''); setShowAlbumModal(false);
            }}
            disabled={!albumTitle.trim()}
          >
            Create Album
          </button>
        </div>
      </Modal>
    </div>
  );
}
