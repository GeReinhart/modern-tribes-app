import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

export interface LevelOption<T extends string | number = number> {
  value: T;
  icon?: IconName;
  color: string;
  caption: string;
}

interface ThemedLevelPickerProps<T extends string | number> {
  options: LevelOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  onDeselect?: () => void;
  ariaLabelPrefix: string;
  disabled?: boolean;
}

// A 0..N rating widget (difficulty, mastery...) or a single-pick card grid (root note...) -- each
// option gets its own accent color and short caption, since a single repeated glyph with no other
// distinction reads as "all the same" once two options share a shape. `onDeselect`, when provided,
// lets clicking the already-selected card clear the selection instead of re-selecting it.
export function ThemedLevelPicker<T extends string | number>({
  options, value, onChange, onDeselect, ariaLabelPrefix, disabled = false,
}: ThemedLevelPickerProps<T>) {
  const { theme } = useTheme();

  const handleClick = (option: LevelOption<T>) => {
    if (value === option.value && onDeselect) onDeselect();
    else onChange(option.value);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(option)}
            aria-label={`${ariaLabelPrefix}: ${option.caption}`}
            title={option.caption}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '6px 10px', borderRadius: 'var(--radius-md)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              border: `1px solid ${selected ? option.color : theme.colors.border}`,
              backgroundColor: selected ? `${option.color}25` : 'transparent',
            }}
          >
            {option.icon && <ThemedSvgIcon name={option.icon} color={option.color} size={18} />}
            <span style={{ fontSize: '10px', color: theme.colors.text, whiteSpace: 'nowrap' }}>
              {option.caption}
            </span>
          </button>
        );
      })}
    </div>
  );
}
