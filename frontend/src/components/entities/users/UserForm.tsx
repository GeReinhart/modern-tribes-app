import { ThemedButton } from '@/components/common/form/ThemedButton.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedMultiSelect } from '@/components/common/form/ThemedMultiSelect.tsx';
import { ThemedSelect } from '@/components/common/form/ThemedSelect.tsx';
import { useTheme } from '@/contexts/ThemeContext.tsx';
import { usePersons } from '@/hooks/usePersons.ts';
import { useRoles } from '@/hooks/useRoles.ts';
import { FormMode } from '@/types/common.types.ts';
import { User, UserCreate, UserUpdate } from '@/types/user.types.ts';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

interface UserFormProps {
  user?: User;
  mode: FormMode;
  onSubmit: (
    data: UserCreate | UserUpdate,
    representPersonIds: string[],
  ) => Promise<void>;
  onCancel: () => void;
  initialRepresentPersonIds?: string[];
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  mode,
  onSubmit,
  onCancel,
  initialRepresentPersonIds,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { roles, loading: rolesLoading } = useRoles();
  const { persons, loading: personsLoading } = usePersons();

  const [formData, setFormData] = useState({
    login: user?.login || '',
    email: user?.email || '',
    role_ids: user?.role_ids || [],
    person_id: user?.person_id || null,
  });
  const [status, setStatus] = useState(user?.status ?? 'active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize synchronously when already available (edit page), fall back to effect for modal (async load)
  const [representPersonIds, setRepresentPersonIds] = useState<string[]>(
    initialRepresentPersonIds ?? [],
  );
  const [representFilter, setRepresentFilter] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(
    (initialRepresentPersonIds?.length ?? 0) > 0,
  );
  const representsInitialized = useRef(initialRepresentPersonIds !== undefined);

  useEffect(() => {
    if (
      !representsInitialized.current &&
      initialRepresentPersonIds !== undefined
    ) {
      setRepresentPersonIds(initialRepresentPersonIds);
      setShowOnlySelected(initialRepresentPersonIds.length > 0);
      representsInitialized.current = true;
    }
  }, [initialRepresentPersonIds]);

  const isViewMode = mode === 'view';
  const showRepresents = mode !== 'create';

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: t(`roles.${role.name}`, { defaultValue: role.name }),
  }));
  const personOptions = persons.map((person) => ({
    value: person.id,
    label: `${person.first_name} ${person.last_name}`,
  }));

  const filteredPersonsForRepresents = useMemo(() => {
    let list = persons;
    if (showOnlySelected)
      list = list.filter((p) => representPersonIds.includes(p.id));
    if (representFilter.trim()) {
      const term = representFilter.toLowerCase();
      list = list.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(term),
      );
    }
    return list;
  }, [persons, representFilter, showOnlySelected, representPersonIds]);

  const toggleRepresent = useCallback((personId: string) => {
    setRepresentPersonIds((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId],
    );
  }, []);

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'archived', label: 'Archived' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.login.trim()) newErrors.name = 'Login is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await onSubmit(formData as UserCreate, []);
      } else {
        await onSubmit(
          { ...formData, status } as UserUpdate,
          representPersonIds,
        );
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string])
      setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ThemedInput
        label="Login"
        value={formData.login}
        onChange={(e) => handleChange('login', e.target.value)}
        error={errors.name}
        disabled={isViewMode}
        required
      />

      <ThemedInput
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        disabled={isViewMode}
        required
      />

      <ThemedMultiSelect
        label="Roles"
        options={roleOptions}
        value={formData.role_ids}
        onChange={(values) => handleChange('role_ids', values)}
        disabled={isViewMode || rolesLoading}
        placeholder="Select roles"
      />

      <ThemedSelect
        label="Direct person"
        value={formData.person_id || ''}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, person_id: e || null }))
        }
        options={personOptions}
        disabled={isViewMode || personsLoading}
      />

      {showRepresents && (
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: theme.colors.primary,
              marginBottom: '8px',
            }}
          >
            Represented persons
          </div>

          {!isViewMode && (
            <div
              style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}
            >
              <div style={{ flex: 1 }}>
                <ThemedInput
                  label=""
                  value={representFilter}
                  onChange={(e) => setRepresentFilter(e.target.value)}
                  placeholder="Filter persons..."
                  variant="primary"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowOnlySelected((prev) => !prev)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${showOnlySelected ? theme.colors.accent : theme.colors.primary + '40'}`,
                  background: showOnlySelected
                    ? `${theme.colors.accent}18`
                    : 'transparent',
                  color: showOnlySelected
                    ? theme.colors.accent
                    : theme.colors.text,
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  marginBottom: '2px',
                }}
              >
                {showOnlySelected
                  ? `Selected (${representPersonIds.length})`
                  : 'All persons'}
              </button>
            </div>
          )}

          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              marginTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingRight: '2px',
            }}
          >
            {filteredPersonsForRepresents.length === 0 && (
              <div
                style={{
                  fontSize: '13px',
                  color: theme.colors.secondary,
                  padding: '8px 0',
                }}
              >
                No persons found
              </div>
            )}
            {filteredPersonsForRepresents.map((person) => {
              const isSelected = representPersonIds.includes(person.id);
              const isDirect = formData.person_id === person.id;
              return (
                <div
                  key={person.id}
                  onClick={() => !isViewMode && toggleRepresent(person.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `2px solid ${isSelected ? theme.colors.accent : theme.colors.primary + '25'}`,
                    background: isSelected
                      ? `${theme.colors.accent}18`
                      : `${theme.colors.primary}05`,
                    cursor: isViewMode ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {!isViewMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      style={{
                        width: '15px',
                        height: '15px',
                        cursor: 'pointer',
                        accentColor: theme.colors.accent,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: '13px',
                      color: theme.colors.text,
                      flex: 1,
                    }}
                  >
                    {person.first_name} {person.last_name}
                  </span>
                  {isDirect && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        background: `${theme.colors.primary}20`,
                        color: theme.colors.primary,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      direct
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode !== 'create' && (
        <ThemedSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={statusOptions}
          disabled={isViewMode}
          allowEmpty={false}
        />
      )}

      {!isViewMode && (
        <div className="flex justify-end gap-3 pt-4">
          <ThemedButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </ThemedButton>
          <ThemedButton
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {mode === 'create' ? 'Create User' : 'Update User'}
          </ThemedButton>
        </div>
      )}
    </form>
  );
};
