import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import EmptyState from '@/components/EmptyState';
import { Plus, ImagePlus, Camera, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function Gallery() {
  const {
    profile, profiles, galleryAlbums, galleryPhotos,
    addAlbum, uploadPhoto, deletePhoto, addToast,
  } = useApp();

  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [caption, setCaption] = useState('');
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [photoDisplayCount, setPhotoDisplayCount] = useState(20);

  const isAdmin = profile?.role === 'admin';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbum || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setShowCaptionInput(true);
    setCaption('');
  };

  const handleUpload = async () => {
    if (!selectedAlbum || !pendingFile) return;
    setUploading(true);
    try {
      await uploadPhoto(selectedAlbum, pendingFile, caption.trim() || undefined);
      setPendingFile(null);
      setPendingPreview(null);
      setShowCaptionInput(false);
      setCaption('');
    } catch {
      addToast('error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setPendingPreview(null);
    setShowCaptionInput(false);
    setCaption('');
  };

  if (selectedAlbum) {
    const album = galleryAlbums.find((a) => a.id === selectedAlbum);
    const allPhotos = galleryPhotos.filter((p) => p.album_id === selectedAlbum);
    const photos = allPhotos.slice(0, photoDisplayCount);

    return (
      <div className="space-y-6">
        <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedAlbum(null); cancelUpload(); }}>
          ← Back to albums
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {album?.title}
            </h1>
            {album?.description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{album.description}</p>
            )}
          </div>
          <label className="btn btn-primary btn-sm cursor-pointer">
            <ImagePlus size={14} /> Add Photo
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploading} />
          </label>
        </div>

        {/* Upload preview with caption */}
        {showCaptionInput && pendingPreview && (
          <div className="card space-y-3">
            <div className="relative">
              <img src={pendingPreview} alt="" className="w-full rounded-xl max-h-48 object-cover" />
              <button
                onClick={cancelUpload}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs"
                aria-label="Cancel upload"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              className="input text-sm"
              placeholder="Add a caption (optional)..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <button
              className="btn btn-primary w-full"
              onClick={handleUpload}
              disabled={uploading}
            >
              <ImagePlus size={14} />
              {uploading ? 'Uploading…' : 'Upload Photo'}
            </button>
          </div>
        )}

        {photos.length === 0 && !showCaptionInput ? (
          <EmptyState message="No photos yet — be the first to add one!" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => {
                const uploader = profiles.find((p) => p.id === photo.uploaded_by);
                return (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxIndex(idx)}
                    className="aspect-square rounded-xl overflow-hidden relative group"
                  >
                    <img src={photo.image_url} alt={photo.caption ?? ''} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {/* Delete button for admin or uploader */}
                    {(isAdmin || photo.uploaded_by === profile?.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingPhotoId(photo.id);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete photo"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
            {allPhotos.length > photoDisplayCount && (
              <button
                className="btn btn-secondary w-full"
                onClick={() => setPhotoDisplayCount(prev => prev + 20)}
              >
                Load more photos ({allPhotos.length - photoDisplayCount} remaining)
              </button>
            )}
          </>
        )}

        {/* Lightbox with swipe + arrows */}
        {lightboxIndex !== null && photos[lightboxIndex] && (() => {
          const photo = photos[lightboxIndex];
          const uploader = profiles.find((p) => p.id === photo.uploaded_by);
          return (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
              onClick={() => setLightboxIndex(null)}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const diff = e.changedTouches[0].clientX - touchStartX.current;
                if (Math.abs(diff) > 50) {
                  if (diff < 0 && lightboxIndex < photos.length - 1) setLightboxIndex(lightboxIndex + 1);
                  if (diff > 0 && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
                }
                touchStartX.current = null;
              }}
              role="dialog"
              aria-label="Photo lightbox"
            >
              <button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close lightbox"
              >
                <X size={20} />
              </button>
              {/* Prev arrow */}
              {lightboxIndex > 0 && (
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {/* Next arrow */}
              {lightboxIndex < photos.length - 1 && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                  aria-label="Next photo"
                >
                  <ChevronRight size={20} />
                </button>
              )}
              <img src={photo.image_url} alt="" className="max-w-full max-h-[70vh] rounded-xl" />
              <div className="mt-4 text-center" onClick={(e) => e.stopPropagation()}>
                {photo.caption && (
                  <p className="text-white text-sm mb-1">{photo.caption}</p>
                )}
                <p className="text-white/60 text-xs">
                  Uploaded by {uploader?.first_name ?? 'Someone'} · {timeAgo(photo.created_at)}
                </p>
                <p className="text-white/40 text-[10px] mt-1">
                  {lightboxIndex + 1} / {photos.length}
                </p>
              </div>
            </div>
          );
        })()}

        <ConfirmModal
          isOpen={!!deletingPhotoId}
          onClose={() => setDeletingPhotoId(null)}
          onConfirm={() => { if (deletingPhotoId) deletePhoto(deletingPhotoId); }}
          title="Delete Photo"
          message="Are you sure you want to delete this photo? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
        />
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
                onClick={() => { setSelectedAlbum(album.id); setPhotoDisplayCount(20); }}
                className="card text-left overflow-hidden p-0"
              >
                <div className="aspect-[4/3] bg-black/10 flex items-center justify-center">
                  {cover ? (
                    <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" />
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
