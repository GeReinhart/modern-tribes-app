import { IconName } from '@/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

export interface MenuAction {
  icon: IconName;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}
