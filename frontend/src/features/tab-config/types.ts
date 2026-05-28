export interface TabConfigItem {
  key: string;
  visible: boolean;
  order: number;
  is_default: boolean;
}

export interface TabWithConfig {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  is_default: boolean;
}
