// Recognizes URLs that can play inline instead of falling back to a plain link -- a YouTube
// or MEGA link becomes an iframe embed, a direct link to a video file becomes a native <video>
// tag. Any other URL (Vimeo, a webpage, ...) is left as a plain link, exactly like every video
// URL used to render before embeds existed.
const VIDEO_FILE_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.m4v'];

const parseUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

// youtube-nocookie.com is Google's own "privacy-enhanced mode" embed domain, recommended for
// third-party sites -- it skips setting YouTube's tracking cookies until the viewer interacts
// with the player, which also avoids some browsers' tracking-protection blocking the embed
// outright (Firefox's Enhanced Tracking Protection, Brave, Safari ITP, ...).
const EMBED_HOST = 'https://www.youtube-nocookie.com/embed/';

export const youtubeEmbedUrl = (url: string): string | null => {
  const parsed = parseUrl(url);
  if (!parsed) return null;
  const host = parsed.hostname.replace(/^(www|m)\./, '');
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1);
    return id ? `${EMBED_HOST}${id}` : null;
  }
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null;
  if (parsed.pathname === '/watch') {
    const id = parsed.searchParams.get('v');
    return id ? `${EMBED_HOST}${id}` : null;
  }
  if (parsed.pathname.startsWith('/embed/')) return `${EMBED_HOST}${parsed.pathname.slice('/embed/'.length)}`;
  return null;
};

// MEGA only plays a file inline via its dedicated "/embed/" path -- the plain "/file/" share
// link requires MEGA's own JS to decrypt the content and cannot be embedded directly. This also
// requires the file owner to have "Allow embedding" enabled on their MEGA account, which can't
// be detected client-side before the iframe loads.
export const megaEmbedUrl = (url: string): string | null => {
  const parsed = parseUrl(url);
  if (!parsed) return null;
  const host = parsed.hostname.replace(/^www\./, '');
  if (host !== 'mega.nz' && host !== 'mega.co.nz') return null;
  if (!parsed.pathname.startsWith('/file/')) return null;
  const handle = parsed.pathname.slice('/file/'.length);
  return handle ? `https://mega.nz/embed/${handle}${parsed.hash}` : null;
};

export const isDirectVideoFileUrl = (url: string): boolean => {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  const path = parsed.pathname.toLowerCase();
  return VIDEO_FILE_EXTENSIONS.some((extension) => path.endsWith(extension));
};
