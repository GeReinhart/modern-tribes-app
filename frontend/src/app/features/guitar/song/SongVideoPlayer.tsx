import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { GuitarSongVideo } from './types.ts';
import { isDirectVideoFileUrl, megaEmbedUrl, youtubeEmbedUrl } from './videoEmbed.ts';

interface SongVideoPlayerProps {
  video: GuitarSongVideo;
}

const PLAYER_MAX_WIDTH = '400px';

// Renders an inline player for a YouTube link, a MEGA link, or a direct video file link; any
// other URL falls back to a plain clickable link, exactly like every video used to render
// before embeds existed.
export const SongVideoPlayer: React.FC<SongVideoPlayerProps> = ({ video }) => {
  const { theme } = useTheme();
  const embedUrl = youtubeEmbedUrl(video.url) ?? megaEmbedUrl(video.url);

  if (embedUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: PLAYER_MAX_WIDTH }}>
        {video.title && <span style={{ color: theme.colors.text, fontWeight: 600 }}>{video.title}</span>}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
          <iframe
            src={embedUrl}
            title={video.title || video.url}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', borderRadius: 'var(--radius-md)' }}
          />
        </div>
      </div>
    );
  }

  if (isDirectVideoFileUrl(video.url)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: PLAYER_MAX_WIDTH }}>
        {video.title && <span style={{ color: theme.colors.text, fontWeight: 600 }}>{video.title}</span>}
        <video controls src={video.url} style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  return (
    <a href={video.url} target="_blank" rel="noreferrer" style={{ color: theme.colors.primary }}>
      {video.title || video.url}
    </a>
  );
};
