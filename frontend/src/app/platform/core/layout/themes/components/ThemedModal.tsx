import { Theme } from '@/app/platform/core/layout/themes/themes.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ThemedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  theme?: Theme;
}

export const ModalBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

export const ModalFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 ${className}`}
  >
    {children}
  </div>
);

export const ThemedModal: React.FC<ThemedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  theme: themeOverride,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  // Dragging offsets the modal from its default centered position via a CSS transform, so no
  // absolute-position math is needed for the initial placement. Always resets to centered
  // (0, 0) on open -- a dragged position is only ever good for the current viewing session.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // Both refs so the pointermove/pointerup listeners below can stay attached (with stable
  // function identity) for as long as the modal is open, instead of being added/removed on
  // every single drag gesture.
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Deliberately its own effect, depending only on `isOpen` -- NOT bundled with the escape-key
  // effect above, which also depends on `onClose` and so re-runs on every render where a caller
  // passes a fresh inline `onClose` closure (the common case). Bundled together, acting on
  // anything inside the modal (which reloads data and re-renders the whole tree) re-ran this on
  // every such click and snapped a dragged modal straight back to center.
  useEffect(() => {
    if (isOpen) setOffset({ x: 0, y: 0 });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleMove = (e: PointerEvent) => {
      if (!dragStart.current) return;
      const { x, y, offsetX, offsetY } = dragStart.current;
      setOffset({ x: offsetX + (e.clientX - x), y: offsetY + (e.clientY - y) });
    };
    const handleUp = () => {
      dragStart.current = null;
    };
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, [isOpen]);

  const startDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    // Anywhere in the header starts a drag (background or title text) except the close button
    // itself, which must keep working as a plain click.
    if ((e.target as HTMLElement).closest('button')) return;
    dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offsetRef.current.x, offsetY: offsetRef.current.y };
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Portalled to document.body -- without this, a modal opened from inside an ancestor that
  // happens to establish its own stacking context (e.g. a `position:absolute` toolbar with its
  // own z-index, as several of the guitar-song layout's row/column/block menus are) stays
  // trapped inside that ancestor's paint order no matter how high its own z-index goes, and can
  // end up rendered behind unrelated siblings (or a fixed-position widget like the metronome)
  // that sits outside that trap.
  return createPortal(
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 2000 }}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div
          className={`relative bg-white rounded-lg shadow-xl w-full ${sizes[size]} my-8`}
          style={{ borderTop: `4px solid ${theme.colors.primary}`, transform: `translate(${offset.x}px, ${offset.y}px)` }}
        >
          {(title || showCloseButton) && (
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${theme.colors.border}`, cursor: 'move', touchAction: 'none' }}
              onPointerDown={startDragging}
            >
              {title && (
                <h3
                  className="text-lg font-semibold"
                  style={{ color: theme.colors.primary }}
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="transition-colors"
                  style={{ color: theme.colors.text }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const ThemedModalBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

export const ThemedModalFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
  theme?: Theme;
}> = ({ children, className = '', theme: themeOverride }) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  return (
    <div
      className={`px-6 py-4 flex justify-end gap-3 ${className}`}
      style={{
        borderTop: `1px solid ${theme.colors.border}`,
        backgroundColor: `${theme.colors.surface}50`,
      }}
    >
      {children}
    </div>
  );
};
