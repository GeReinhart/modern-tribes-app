import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { ThemedText } from '@/components/common/layout/ThemedText';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/components/layout/AdminNavigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useApi } from '@/hooks/useApi';
import { appConfigService } from '@/services/app-config.service';
import { AppConfigCreate, AppConfigEntry } from '@/types/app-config.types';

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

function useAdminConfig() {
  const [entries, setEntries] = useState<AppConfigEntry[]>([]);
  const { loading, error, execute } = useApi<AppConfigEntry[]>();

  const fetch = useCallback(() => {
    execute(() => appConfigService.getAll()).then((data) => {
      if (data) setEntries(data);
    });
  }, [execute]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { entries, setEntries, loading, error, refetch: fetch };
}

interface EditRowState {
  value: string;
  description: string;
  saving: boolean;
}

const ConfigRow: React.FC<{
  entry: AppConfigEntry;
  onSaved: (updated: AppConfigEntry) => void;
  onDeleted: (id: string) => void;
}> = ({ entry, onSaved, onDeleted }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<EditRowState>({
    value: entry.value,
    description: entry.description ?? '',
    saving: false,
  });

  const handleSave = async () => {
    setState((s) => ({ ...s, saving: true }));
    try {
      const updated = await appConfigService.update(entry.id, {
        value: state.value,
        description: state.description || undefined,
      });
      onSaved(updated);
      setEditing(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t('validation.errorOccurred'));
    } finally {
      setState((s) => ({ ...s, saving: false }));
    }
  };

  const handleCancel = () => {
    setState({
      value: entry.value,
      description: entry.description ?? '',
      saving: false,
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(t('admin.confirmDeleteNamed', { name: entry.key }))) return;
    try {
      await appConfigService.delete(entry.id);
      onDeleted(entry.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t('validation.errorOccurred'));
    }
  };

  const cellStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: `1px solid ${theme.colors.border}`,
    verticalAlign: 'middle',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 'var(--font-sm)',
    boxSizing: 'border-box',
  };

  return (
    <tr>
      <td style={cellStyle}>
        <code
          style={{ fontSize: 'var(--font-sm)', color: theme.colors.primary }}
        >
          {entry.key}
        </code>
      </td>
      <td style={cellStyle}>
        {editing ? (
          <input
            style={inputStyle}
            value={state.value}
            onChange={(e) => setState((s) => ({ ...s, value: e.target.value }))}
            autoFocus
          />
        ) : (
          <span style={{ fontSize: 'var(--font-sm)' }}>{entry.value}</span>
        )}
      </td>
      <td style={cellStyle}>
        {editing ? (
          <input
            style={inputStyle}
            value={state.description}
            onChange={(e) =>
              setState((s) => ({ ...s, description: e.target.value }))
            }
            placeholder={t('admin.config.descriptionPlaceholder')}
          />
        ) : (
          <span
            style={{
              fontSize: 'var(--font-sm)',
              color: theme.colors.secondary,
            }}
          >
            {entry.description ?? '—'}
          </span>
        )}
      </td>
      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
        {editing ? (
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <ThemedButton
              variant="secondary"
              onClick={handleSave}
              disabled={state.saving}
            >
              {t('common.save')}
            </ThemedButton>
            <ThemedButton
              variant="ghost"
              onClick={handleCancel}
              disabled={state.saving}
            >
              {t('common.cancel')}
            </ThemedButton>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <ThemedButton variant="ghost" onClick={() => setEditing(true)}>
              {t('common.edit')}
            </ThemedButton>
            <ThemedButton variant="ghost" onClick={handleDelete}>
              {t('common.delete')}
            </ThemedButton>
          </div>
        )}
      </td>
    </tr>
  );
};

const AddConfigForm: React.FC<{
  onAdded: (entry: AppConfigEntry) => void;
  onCancel: () => void;
}> = ({ onAdded, onCancel }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [form, setForm] = useState<AppConfigCreate>({
    key: '',
    value: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const entry = await appConfigService.create({
        ...form,
        description: form.description || undefined,
      });
      onAdded(entry);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('validation.errorOccurred'));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 'var(--font-sm)',
    boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 2fr auto',
          gap: 'var(--space-sm)',
          alignItems: 'end',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-xs)',
              marginBottom: 4,
              color: theme.colors.secondary,
            }}
          >
            {t('admin.config.key')} *
          </label>
          <input
            style={inputStyle}
            value={form.key}
            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
            placeholder="upload.my_setting"
            required
            autoFocus
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-xs)',
              marginBottom: 4,
              color: theme.colors.secondary,
            }}
          >
            {t('admin.config.value')} *
          </label>
          <input
            style={inputStyle}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            required
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-xs)',
              marginBottom: 4,
              color: theme.colors.secondary,
            }}
          >
            {t('admin.config.description')}
          </label>
          <input
            style={inputStyle}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder={t('admin.config.descriptionPlaceholder')}
          />
        </div>
        <div
          style={{ display: 'flex', gap: 'var(--space-xs)', paddingBottom: 0 }}
        >
          <ThemedButton variant="secondary" type="submit" disabled={saving}>
            {t('common.create')}
          </ThemedButton>
          <ThemedButton
            variant="ghost"
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            {t('common.cancel')}
          </ThemedButton>
        </div>
      </div>
    </form>
  );
};

const AppConfigPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { reload: reloadAppConfig } = useAppConfig();
  const { entries, setEntries, loading, error } = useAdminConfig();
  const [showAddForm, setShowAddForm] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.config') },
    ],
    [t],
  );

  const handleSaved = (updated: AppConfigEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    reloadAppConfig();
  };

  const handleDeleted = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    reloadAppConfig();
  };

  const handleAdded = (entry: AppConfigEntry) => {
    setEntries((prev) => [...prev, entry]);
    setShowAddForm(false);
    reloadAppConfig();
  };

  const headerActions = <AdminNavigation currentPage="config" />;

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: theme.colors.secondary,
    borderBottom: `2px solid ${theme.colors.border}`,
  };

  if (loading)
    return (
      <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
        <ThemedLoadingSpinner />
      </AppLayout>
    );

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
      <ThemedCard>
        <ThemedText size="small">{t('admin.configSubtitle')}</ThemedText>
      </ThemedCard>

      {error && (
        <ThemedCard variant="danger">
          <ThemedText variant="danger">{error}</ThemedText>
        </ThemedCard>
      )}

      {showAddForm && (
        <ThemedCard>
          <ThemedText size="small" style={{ marginBottom: 'var(--space-md)' }}>
            {t('admin.config.addEntry')}
          </ThemedText>
          <AddConfigForm
            onAdded={handleAdded}
            onCancel={() => setShowAddForm(false)}
          />
        </ThemedCard>
      )}

      <ThemedCard>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-md)',
          }}
        >
          <ThemedText size="small">
            {t('admin.foundResults', { count: entries.length })}
          </ThemedText>
          {!showAddForm && (
            <ThemedButton
              variant="secondary"
              onClick={() => setShowAddForm(true)}
            >
              {t('admin.config.addEntry')}
            </ThemedButton>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{t('admin.config.key')}</th>
                <th style={thStyle}>{t('admin.config.value')}</th>
                <th style={thStyle}>{t('admin.config.description')}</th>
                <th style={thStyle}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <ConfigRow
                  key={entry.id}
                  entry={entry}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                />
              ))}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: theme.colors.secondary,
                    }}
                  >
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ThemedCard>
    </AppLayout>
  );
};

export const AppConfigPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <AppConfigPageContent />
  </ThemeProvider>
);
