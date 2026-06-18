import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

export interface MenuAction {
  icon: IconName;
  label: string;
  path?: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}
