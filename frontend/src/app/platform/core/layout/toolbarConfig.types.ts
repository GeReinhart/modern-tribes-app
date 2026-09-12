export type ToolbarActionPlacement = 'direct' | 'menu';

// Keyed by MenuAction.id — only actions the user explicitly repositioned appear here.
export type ToolbarConfigOverrides = Record<string, ToolbarActionPlacement>;
