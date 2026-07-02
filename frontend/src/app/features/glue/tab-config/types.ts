export interface TabConfigItem {
  key: string;
  visible: boolean;
  order: number;
  is_default: boolean;
  icon?: string | null;
}

export interface TabWithConfig {
  key: string;
  label: string;
  color?: string;
  icon?: string | null;
  visible: boolean;
  order: number;
  is_default: boolean;
}
