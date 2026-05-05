import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastProvider';
import { Button } from './Button';

/**
 * Reusable single-image upload control. Pick a file → uploads to the given
 * bucket under `<userId>/<timestamp>.<ext>` → returns the public URL.
 *
 * Path is timestamped so we never need `upsert: true` (which trips the
 * UPDATE-policy owner check on Storage RLS — see avatar upload fix).
 */
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function ImageUpload({
  bucket,
  userId,
  value,
  onChange,
  label = 'Add a photo',
  buttonLabel = 'Upload photo',
}: {
  bucket: 'post-images' | 'gallery' | 'avatars';
  userId: string;
  value: string;
  onChange: (publicUrl: string) => void;
  label?: string;
  buttonLabel?: string;
}) {
  const { addToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      addToast({ kind: 'error', title: 'That photo is too big', body: 'Please use one under 5 MB.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      addToast({ kind: 'error', title: 'Not a photo', body: 'Please pick an image file.' });
      return;
    }

    setBusy(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

    if (error) {
      setBusy(false);
      addToast({ kind: 'error', title: 'Upload failed', body: error.message });
      return;
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    setBusy(false);
    onChange(`${pub.publicUrl}?t=${Date.now()}`);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-app">
          <img src={value} alt="" className="w-full max-h-64 object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove photo"
            className="absolute top-2 right-2 rounded-full bg-black/55 p-1 text-white hover:bg-black/75"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          leadingIcon={<ImagePlus size={16} />}
          loading={busy}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </Button>
      )}
      {!value && label && <p className="mt-1 text-xs text-app-muted">{label}</p>}
    </div>
  );
}
