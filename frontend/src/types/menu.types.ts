import { IconName } from '@/platform/layout/themes/icons/ThemedSvgIcon';

export interface MenuAction {
  icon: IconName;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}
