import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

const GROCERIES_ICONS: IconName[] = [
  'apple', 'banana', 'orange', 'lemon', 'grape', 'strawberry', 'watermelon', 'cherry',
  'pineapple', 'avocado', 'carrot', 'pepper', 'onion', 'potato', 'mushroom', 'broccoli',
  'corn', 'pumpkin', 'bread', 'croissant', 'donut', 'cupcake', 'cookie', 'cake',
  'milk', 'cheese', 'butter', 'yogurt', 'egg', 'ice-cream',
  'meat', 'bacon', 'sausage', 'fish', 'shrimp',
  'bottle', 'wine-glass', 'jar', 'basket',
];

interface Props {
  value: string | null;
  onChange: (icon: string | null) => void;
}

const GroceriesIconPicker: React.FC<Props> = ({ value, onChange }) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {GROCERIES_ICONS.map((icon) => {
        const selected = value === icon;
        return (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(selected ? null : icon)}
            title={icon}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: `2px solid ${selected ? theme.colors.primary : theme.colors.border}`,
              backgroundColor: selected ? `${theme.colors.primary}15` : 'transparent',
              cursor: 'pointer',
            }}
          >
            <ThemedSvgIcon name={icon} color={selected ? theme.colors.primary : theme.colors.text} size={26} />
          </button>
        );
      })}
    </div>
  );
};

export default GroceriesIconPicker;
