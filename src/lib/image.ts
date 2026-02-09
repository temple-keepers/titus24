/**
 * Client-side image optimisation before upload.
 * Resizes and compresses images using Canvas API.
 */

interface OptimiseOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  onProgress?: (pct: number) => void;
}

const AVATAR_OPTS: OptimiseOptions = { maxWidth: 512, maxHeight: 512, quality: 0.82 };
const POST_OPTS: OptimiseOptions = { maxWidth: 1600, maxHeight: 1600, quality: 0.82 };
const GALLERY_OPTS: OptimiseOptions = { maxWidth: 1600, maxHeight: 1600, quality: 0.82 };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function optimise(file: File, opts: OptimiseOptions): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      opts.onProgress?.(10);
      const img = await loadImage(file);
      opts.onProgress?.(40);

      let { width, height } = img;
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      opts.onProgress?.(70);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            opts.onProgress?.(100);
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        opts.quality
      );

      URL.revokeObjectURL(img.src);
    } catch (err) {
      reject(err);
    }
  });
}

export function optimiseAvatar(file: File, onProgress?: (pct: number) => void) {
  return optimise(file, { ...AVATAR_OPTS, onProgress });
}

export function optimisePostImage(file: File, onProgress?: (pct: number) => void) {
  return optimise(file, { ...POST_OPTS, onProgress });
}

export function optimiseGalleryImage(file: File, onProgress?: (pct: number) => void) {
  return optimise(file, { ...GALLERY_OPTS, onProgress });
}
