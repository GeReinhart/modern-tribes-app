import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

export interface MenuAction {
  // Stable, non-translated identifier (e.g. "recipes.new") used to remember this action's
  // toolbar placement (direct vs in the overflow menu) across sessions — must stay stable
  // even if `label` changes with the UI language.
  id: string;
  icon: IconName;
  label: string;
  path?: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  // Small icon overlaid on `icon` to disambiguate the same verb icon (add/edit/
  // theme/archive/configure) applied to different entities (tribe/project/feature/...).
  badgeIcon?: IconName;
}
