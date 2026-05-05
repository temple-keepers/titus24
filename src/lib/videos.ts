/**
 * Detect a YouTube or Vimeo URL and return its embeddable iframe src,
 * plus a thumbnail URL where one is cheaply available.
 *
 * Returns null when the URL isn't a recognised video host — caller
 * should fall back to a regular external link.
 */
export interface VideoEmbed {
  /** iframe src for embedding (YouTube /embed/, Vimeo /video/) */
  src: string;
  /** Optional thumbnail (poster image) URL */
  thumbnail: string | null;
  /** Provider name for analytics / labels */
  provider: 'youtube' | 'vimeo';
}

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com',
]);

const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

export function getEmbedUrl(rawUrl: string | null | undefined): VideoEmbed | null {
  if (!rawUrl) return null;
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }

  // YouTube
  if (YT_HOSTS.has(u.hostname)) {
    let id: string | null = null;
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1).split('/')[0] || null;
    } else if (u.pathname === '/watch') {
      id = u.searchParams.get('v');
    } else if (u.pathname.startsWith('/shorts/')) {
      id = u.pathname.split('/')[2] || null;
    } else if (u.pathname.startsWith('/embed/')) {
      id = u.pathname.split('/')[2] || null;
    } else if (u.pathname.startsWith('/live/')) {
      id = u.pathname.split('/')[2] || null;
    }
    if (!id) return null;
    return {
      src: `https://www.youtube.com/embed/${id}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      provider: 'youtube',
    };
  }

  // Vimeo
  if (VIMEO_HOSTS.has(u.hostname)) {
    // /video/<id> for player.vimeo.com, /<id> for vimeo.com
    const parts = u.pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];
    if (!/^\d+$/.test(id)) return null;
    return {
      src: `https://player.vimeo.com/video/${id}`,
      thumbnail: null,
      provider: 'vimeo',
    };
  }

  return null;
}
