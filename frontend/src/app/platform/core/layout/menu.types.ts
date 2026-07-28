import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

export interface MenuAction {
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
