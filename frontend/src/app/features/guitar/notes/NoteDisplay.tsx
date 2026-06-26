import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect } from 'react';

import { SoundIcon } from './icons.tsx';

let rippleInjected = false;
function injectRippleAnimation(): void {
  if (rippleInjected) return;
  rippleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes noteRipple {
      0%   { transform: scale(1); opacity: 0.7; }
      100% { transform: scale(1.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

interface Props {
  note: string;
  octave: number | null;
  visible: boolean;
  showSpeaker?: boolean;
  playKey?: number;
}

const NoteDisplay: React.FC<Props> = ({ note, octave, visible, showSpeaker, playKey = 0 }) => {
  const { theme } = useTheme();

  useEffect(() => { injectRippleAnimation(); }, []);

  const content = visible
    ? <NoteContent note={note} octave={octave} theme={theme} />
    : showSpeaker
      ? <SoundIcon size={44} />
      : null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        border: `3px solid ${theme.colors.primary}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        boxShadow: `0 3px 16px ${theme.colors.ghost}`,
        visibility: visible || showSpeaker ? 'visible' : 'hidden',
        color: theme.colors.primary,
        flexShrink: 0,
      }}
    >
      {playKey > 0 && (
        <div
          key={playKey}
          style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '50%',
            border: `3px solid ${theme.colors.primary}`,
            animation: 'noteRipple 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}
      {content}
    </div>
  );
};

interface NoteContentProps {
  note: string;
  octave: number | null;
  theme: { colors: Record<string, string> };
}

const NoteContent: React.FC<NoteContentProps> = ({ note, octave, theme }) => (
  <>
    <span style={{ fontSize: '40px', fontWeight: 700, color: theme.colors.primary, lineHeight: 1, letterSpacing: '-1px' }}>
      {note}
    </span>
    {octave !== null && (
      <span style={{ fontSize: '14px', fontWeight: 500, color: theme.colors.ghost, marginTop: '2px' }}>
        {octave}
      </span>
    )}
  </>
);

export default NoteDisplay;
