import { IconName } from '@/components/common/icons/ThemedSvgIcon';

export interface MenuAction {
  icon: IconName;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}
