import React, { createContext, useContext, useEffect, useState } from 'react';

interface ActiveLayoutMenuContextValue {
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
}

const ActiveLayoutMenuContext = createContext<ActiveLayoutMenuContextValue | null>(null);

// Only one row/column/block "tools" popover should ever be open at once -- opening a new one
// closes whichever other one was open, and the currently open one needs to visually clear every
// other row/column/block on the page (they're independent stacking contexts, so raw z-index
// alone doesn't do that -- see the isActive-driven zIndex boost in SongLayoutRow/Column/
// BlockContent's own toolbar wrapper).
export const ActiveLayoutMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  return (
    <ActiveLayoutMenuContext.Provider value={{ activeMenuId, setActiveMenuId }}>
      {children}
    </ActiveLayoutMenuContext.Provider>
  );
};

// menuId must be unique and stable for the lifetime of the row/column/block it belongs to (e.g.
// `row-${row.id}`). `onOpenChange` is the same callback the popover trigger already reports
// through to the parent (used there to highlight the whole row/column/block) -- calling it
// ourselves too is what keeps that highlight in sync when THIS menu gets force-closed by another
// one opening, since remounting the popover (see key={isForcedClosed} on the consumer) never
// calls it on its own.
//
// isForcedClosed (NOT plain isActive) is deliberately what gets keyed on by callers: it's false
// both when nothing is active yet AND when THIS menu is the active one, so opening or closing
// THIS menu never itself changes the key -- only some OTHER menu becoming active does. Keying on
// isActive instead was a real bug: activating a menu updates the same activeMenuId that its own
// isActive is computed from, so the very click that opens it would also flip its key and force a
// remount before the click even finished, silently resetting it back to closed and needing a
// second click to actually open.
export const useActiveLayoutMenu = (menuId: string, onOpenChange?: (open: boolean) => void) => {
  const context = useContext(ActiveLayoutMenuContext);
  if (!context) throw new Error('useActiveLayoutMenu must be used within an ActiveLayoutMenuProvider');
  const { activeMenuId, setActiveMenuId } = context;
  const isForcedClosed = activeMenuId !== null && activeMenuId !== menuId;

  useEffect(() => {
    if (isForcedClosed) onOpenChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForcedClosed]);

  const handleOpenChange = (open: boolean) => {
    setActiveMenuId(open ? menuId : null);
    onOpenChange?.(open);
  };

  return { isForcedClosed, handleOpenChange };
};
