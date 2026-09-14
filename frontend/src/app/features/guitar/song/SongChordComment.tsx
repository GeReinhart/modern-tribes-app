import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

// Kept smaller than the chord name at every chord size (SongChordBadge/SongChordRow), so a
// comment never competes visually with the chord it's attached to.
const CHORD_COMMENT_FONT_SIZE_PX = 10;

interface Props {
  comment: string | null | undefined;
}

const SongChordComment: React.FC<Props> = ({ comment }) => {
  const { theme } = useTheme();
  if (!comment) return null;
  return (
    <div
      style={{
        color: theme.colors.text,
        fontSize: `${CHORD_COMMENT_FONT_SIZE_PX}px`,
        opacity: 0.85,
        fontStyle: 'italic',
        textAlign: 'center',
      }}
    >
      {comment}
    </div>
  );
};

export default SongChordComment;
