import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { TITLE_HEADING_SIZES_PX } from './layoutBlockOptions.ts';

interface SongFreeformHtmlProps {
  html: string;
  style?: React.CSSProperties;
}

// Tailwind Typography's default heading scale (used by the "prose" class below) looks nothing
// like a block's own title -- H1-H4 typed into free-form rich text must render at the exact same
// size/weight/color as a block title at that level (see SongEditableBlockTitle), so a heading
// reads the same whether it's a block's title or one typed inside its body.
export const SongFreeformHtml: React.FC<SongFreeformHtmlProps> = ({ html, style }) => {
  const { theme } = useTheme();

  return (
    <div className="prose max-w-none song-freeform-html" style={style}>
      <style>{`
        .song-freeform-html :where(h1, h2, h3, h4) {
          font-weight: 700;
          color: ${theme.colors.text};
          margin: 0 0 8px;
        }
        .song-freeform-html :where(h1) { font-size: ${TITLE_HEADING_SIZES_PX.h1}px; }
        .song-freeform-html :where(h2) { font-size: ${TITLE_HEADING_SIZES_PX.h2}px; }
        .song-freeform-html :where(h3) { font-size: ${TITLE_HEADING_SIZES_PX.h3}px; }
        .song-freeform-html :where(h4) { font-size: ${TITLE_HEADING_SIZES_PX.h4}px; }
        .song-freeform-html :where(h5) {
          font-weight: 400;
          font-style: italic;
          color: ${theme.colors.text};
          font-size: ${TITLE_HEADING_SIZES_PX.h5}px;
          margin: 0 0 8px;
        }
      `}
      </style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};
