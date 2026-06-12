import { ConfirmDialog } from '@/app/platform/core/layout/themes/components/ConfirmDialog.tsx';
import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedTabs } from '@/app/platform/core/layout/themes/components/ThemedTabs.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { TabConfigPopup } from '@/app/features/glue/tab-config/TabConfigPopup.tsx';
import { useTabConfig } from '@/app/features/glue/tab-config/useTabConfig.ts';
import { useCurrentUserProfile } from '@/app/platform/functions/people/users/useCurrentUserProfile.ts';
import { useReorderProjectsInTribe, useUserProjectsByTribe } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useUserTribes } from '@/app/features/tribes-projects/tribes/useTribes.ts';
import { useTribeWithPositions, useTribeWithPositionsMutations } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { ThemePickerModal } from '@/app/platform/core/layout/themes/components/ThemePickerModal.tsx';
import { useUrlTab } from '@/app/features/glue/url-tab/useUrlTab.ts';
import { authorizationHooks } from '@/app/platform/core/authorization/authorization-hooks.ts';
import { tribeWithPositionService } from '@/app/features/tribes-projects/tribes/tribe_with_positions.service.ts';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';
import { AttachmentFile } from '@/app/platform/functions/documents/document.types.ts';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { ProjectEntry } from '@/app/features/tribes-projects/projects/projects.query.types.ts';

import { BookmarkToggle } from '@/app/features/bookmarks/BookmarkToggle.tsx';
import { buildBookmarkDescription } from '@/app/features/bookmarks/types.ts';
import { InvertedMarkStyle } from '@/app/platform/functions/search/InvertedMarkStyle.tsx';
import { highlightHtml } from '@/app/platform/functions/search/highlight.utils.ts';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  ChevronDown,
  ChevronUp,
  Download,
  File,
  FileText,
  Film,
  Image,
  Music,
  Paperclip,
} from 'lucide-react';

const ShowTribePageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchHighlight = searchParams.get('q') ?? null;
  const { tribeId } = useParams<{ tribeId: string }>();
  const {
    data: authorization,
    error: authorizationError,
    verifyAuthorization,
  } = authorizationHooks();
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showTabConfig, setShowTabConfig] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [reorderingProjects, setReorderingProjects] = useState(false);

  // Single hook call to get all data
  const { tribe, loading, error, refetch: refetchTribe } = useTribeWithPositions(tribeId || null);
  const { updateTribeWithPositions } = useTribeWithPositionsMutations();

  const [pageThemeCode, setPageThemeCode] = useState<string | null>(null);

  useEffect(() => {
    const code = tribe?.theme_code ?? null;
    setPageThemeCode(code);
    setTheme(code || 'default');
  }, [tribe?.theme_code, setTheme]);

  const { user } = useCurrentUserProfile();
  const { tribes: userTribes } = useUserTribes(user?.id || '', {
    enabled: !!user?.id,
  });
  const { projects: tribeProjects, refetch: refetchProjects } = useUserProjectsByTribe(
    tribeId || '',
    user?.id || '',
    { enabled: !!tribeId && !!user?.id },
  );
  const { reorderProjects } = useReorderProjectsInTribe();

  const myPosition = useMemo(() => {
    if (!tribeId) return null;
    const entries = userTribes.filter((r) => r.tribe_url_param_id === tribeId);
    const direct = entries.find((e) => !e.via_represents);
    const represents = entries.filter((e) => e.via_represents);
    return {
      direct_position: direct?.position ?? null,
      represented_persons: represents.map((r) => ({
        first_name: r.person_first_name,
        last_name: r.person_last_name,
        position: r.position,
      })),
    };
  }, [tribeId, userTribes]);

  const isManager = useMemo(() => {
    if (!myPosition) return false;
    return (
      myPosition.direct_position === 'manager' ||
      myPosition.represented_persons.some((p) => p.position === 'manager')
    );
  }, [myPosition]);

  const dedupedProjects = useMemo((): ProjectEntry[] => {
    const map = new Map<string, ProjectEntry>();
    for (const row of tribeProjects) {
      const existing = map.get(row.project_id);
      if (!existing) {
        map.set(row.project_id, {
          project_id: row.project_id,
          project_url_param_id: row.project_url_param_id,
          project_name: row.project_name,
          direct_position: row.via_represents ? null : row.effective_position,
          represented_persons:
            row.via_represents && row.person_first_name && row.person_last_name
              ? [
                  {
                    first_name: row.person_first_name,
                    last_name: row.person_last_name,
                    position: row.effective_position,
                  },
                ]
              : [],
        });
      } else {
        if (!row.via_represents) {
          existing.direct_position = row.effective_position;
        } else if (row.person_first_name && row.person_last_name) {
          existing.represented_persons.push({
            first_name: row.person_first_name,
            last_name: row.person_last_name,
            position: row.effective_position,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [tribeProjects]);

  const allTabs = useMemo(
    () => [
      { key: 'description', label: t('tribes.tabDescription') },
      { key: 'projects', label: t('tribes.tabProjects') },
      { key: 'members', label: t('tribes.tabMembers') },
    ],
    [t],
  );

  const contextKey = tribeId ? `tribe:${tribeId}` : '';
  const { visibleTabs, defaultTabKey, tabsWithConfig, saveConfig } =
    useTabConfig(contextKey, allTabs);

  const { activeTab, breadcrumbTabs, handleTabChange, navTabs } = useUrlTab(
    visibleTabs,
    `/app/tribes/${tribeId ?? ''}`,
    defaultTabKey,
  );

  // Check authorization when component mounts or tribeId changes
  useEffect(() => {
    if (tribeId) {
      verifyAuthorization(
        ['admin', 'can_access_attached_tribes'],
        tribeId,
        'manager',
      ).catch((err) => {
        console.error('Authorization check failed:', err);
      });
    }
  }, [tribeId, verifyAuthorization]);

  const handleArchive = async () => {
    if (!tribeId) return;
    setArchiving(true);
    try {
      await tribeWithPositionService.archiveTribe(tribeId);
      navigate('/app/tribes');
    } finally {
      setArchiving(false);
      setShowArchiveConfirm(false);
    }
  };

  const handleProjectMove = async (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    const reordered = [...dedupedProjects];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderProjects(tribeId!, reordered.map((p) => p.project_id));
    refetchProjects();
  };

  const menuActions = useMemo(
    (): MenuAction[] => [
      {
        icon: 'settings' as const,
        label: t('tabConfig.configure'),
        onClick: () => setShowTabConfig(true),
      },
      ...(searchHighlight
        ? [
            {
              icon: 'x' as const,
              label: t('search.removeHighlight'),
              onClick: () => {
                const next = new URLSearchParams(searchParams);
                next.delete('q');
                setSearchParams(next);
              },
            },
          ]
        : []),
      ...(isManager
        ? [
            {
              icon: 'plus' as const,
              label: t('common.project'),
              onClick: () => navigate(`/app/tribes/${tribeId}/projects/new`),
            },
          ]
        : []),
      ...(isManager && activeTab === 'projects'
        ? [
            {
              icon: 'chevrons-up' as const,
              label: t('projects.reorderProjects'),
              onClick: () => setReorderingProjects((v) => !v),
            },
          ]
        : []),
      ...(authorization?.authorized
        ? [
            {
              icon: 'palette' as const,
              label: t('tribes.title'),
              onClick: () => setShowThemePicker(true),
            },
            {
              icon: 'pencil' as const,
              label: t('common.edit'),
              onClick: () => navigate(`/app/tribes/${tribeId}/update`),
            },
            {
              icon: 'archive' as const,
              label: t('tribes.archive'),
              onClick: () => setShowArchiveConfirm(true),
              variant: 'danger' as const,
              disabled: archiving,
            },
          ]
        : []),
    ],
    [isManager, activeTab, authorization?.authorized, archiving, tribeId, t, navigate, setShowTabConfig, setShowThemePicker, searchHighlight, searchParams, setSearchParams],
  );

  const breadcrumbs = React.useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('tribes.title'), path: '/app/tribes' },
      { label: tribe?.name || t('common.loading') },
    ],
    [tribe?.name, t],
  );

  const memberCardStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const badgeStyle = (
    type: 'manager' | 'member' | 'guest',
  ): React.CSSProperties => {
    const colors = {
      manager: theme.colors.accent,
      member: theme.colors.primary,
      guest: theme.colors.ghost,
    };

    return {
      padding: '4px 12px',
      backgroundColor: colors[type],
      color: 'white',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    };
  };

  const attachmentCardStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    transition: 'all 0.2s ease',
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={20} />;
    if (type.startsWith('video/')) return <Film size={20} />;
    if (type.startsWith('audio/')) return <Music size={20} />;
    if (type.includes('pdf') || type.includes('document'))
      return <FileText size={20} />;
    return <File size={20} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      </AppLayout>
    );
  }

  if (error || !tribe) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div style={errorStyle}>
          <strong>Error:</strong> {error || 'Tribe not found'}
        </div>
      </AppLayout>
    );
  }

  // Group persons by position
  const managers = tribe.persons.filter((p) => p.position === 'manager');
  const members = tribe.persons.filter((p) => p.position === 'member');
  const guests = tribe.persons.filter((p) => p.position === 'guest');

  return (
    <AppLayout
      menuActions={menuActions}
      breadcrumbs={breadcrumbs}
      breadcrumbTabs={breadcrumbTabs}
      bookmarkSlot={tribe?.name ? <BookmarkToggle pagePath={location.pathname} pageTitle={tribe.name} pageDescription={buildBookmarkDescription(breadcrumbs)} /> : null}
    >
      {showTabConfig && (
        <TabConfigPopup
          tabsWithConfig={tabsWithConfig}
          onSave={saveConfig}
          onClose={() => setShowTabConfig(false)}
        />
      )}

      {showThemePicker && tribeId && (
        <ThemePickerModal
          title={t('theme.selectTheme')}
          currentThemeCode={tribe?.theme_code}
          onSave={async (themeCode) => {
            await updateTribeWithPositions(tribeId, { theme_code: themeCode });
            setPageThemeCode(themeCode);
            setTheme(themeCode || 'default');
            refetchTribe();
          }}
          onClose={() => setShowThemePicker(false)}
        />
      )}

      {/* Authorization Error Message */}
      {authorizationError && (
        <ThemedCard>
          <div style={errorStyle}>
            <strong>Authorization Error:</strong> {authorizationError.message}
          </div>
        </ThemedCard>
      )}

      {/* Tabs */}
      <ThemedTabs
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div style={{ marginTop: '16px' }}>
        {/* Description tab */}
        {activeTab === 'description' && (
          <>
            {tribe.document_content_html ? (
              <ThemedSection themeId={pageThemeCode ?? 'main_1'}>
                <div
                  className="prose max-w-none"
                  style={{
                    padding: '16px',
                    backgroundColor: theme.colors.surface,
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border}`,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: searchHighlight ? highlightHtml(tribe.document_content_html, searchHighlight) : tribe.document_content_html,
                  }}
                />
              </ThemedSection>
            ) : (
              <ThemedText variant="secondary" size="small">
                {t('tribes.descriptionSection')}
              </ThemedText>
            )}
            {searchHighlight && <InvertedMarkStyle />}

            {tribe.document_attachments &&
              tribe.document_attachments.length > 0 && (
                <ThemedSection themeId={pageThemeCode ?? 'main_1'}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    <Paperclip size={20} color={theme.colors.secondary} />
                    <ThemedText size="small" as="h4">
                      {t('tribes.attachmentsCount', {
                        count: tribe.document_attachments.length,
                      })}
                    </ThemedText>
                  </div>
                  {tribe.document_attachments.map(
                    (attachment: AttachmentFile) => (
                      <div
                        key={attachment.id}
                        style={attachmentCardStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                          e.currentTarget.style.borderColor =
                            theme.colors.primary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            theme.colors.surface;
                          e.currentTarget.style.borderColor =
                            theme.colors.border;
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <span style={{ color: theme.colors.primary }}>
                            {getFileIcon(attachment.type)}
                          </span>
                          <div>
                            <ThemedText variant="primary" size="small">
                              {attachment.name}
                            </ThemedText>
                            <ThemedText variant="secondary" size="small">
                              {formatFileSize(attachment.size)}
                            </ThemedText>
                          </div>
                        </div>
                        <a
                          href={attachment.url}
                          download={attachment.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            backgroundColor: theme.colors.primary,
                            color: 'white',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'opacity 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          <Download size={16} />
                          {t('tribes.download')}
                        </a>
                      </div>
                    ),
                  )}
                </ThemedSection>
              )}
          </>
        )}

        {/* Projects tab */}
        {activeTab === 'projects' && (
          <ThemedSection themeId={pageThemeCode ?? 'main_1'}>
            {dedupedProjects.length === 0 ? (
              <ThemedText variant="secondary" size="small">
                {t('projects.noProjects')}
              </ThemedText>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {dedupedProjects.map((project, index) => (
                  <div
                    key={project.project_id}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: reorderingProjects ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => {
                      if (!reorderingProjects) {
                        navigate(`/app/tribes/${tribeId}/projects/${project.project_url_param_id}`);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (reorderingProjects) return;
                      e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                      e.currentTarget.style.borderColor = theme.colors.primary;
                    }}
                    onMouseLeave={(e) => {
                      if (reorderingProjects) return;
                      e.currentTarget.style.backgroundColor = theme.colors.surface;
                      e.currentTarget.style.borderColor = theme.colors.border;
                    }}
                  >
                    <ThemedText variant="primary" size="small">
                      {project.project_name}
                    </ThemedText>
                    {reorderingProjects && (
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: index === 0 ? 'default' : 'pointer',
                            color: index === 0 ? theme.colors.border : theme.colors.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px',
                            opacity: index === 0 ? 0.4 : 1,
                          }}
                          disabled={index === 0}
                          onClick={(e) => { e.stopPropagation(); handleProjectMove(index, 'up'); }}
                          title={t('projects.moveUp')}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: index === dedupedProjects.length - 1 ? 'default' : 'pointer',
                            color: index === dedupedProjects.length - 1 ? theme.colors.border : theme.colors.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px',
                            opacity: index === dedupedProjects.length - 1 ? 0.4 : 1,
                          }}
                          disabled={index === dedupedProjects.length - 1}
                          onClick={(e) => { e.stopPropagation(); handleProjectMove(index, 'down'); }}
                          title={t('projects.moveDown')}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ThemedSection>
        )}

        {/* Members tab */}
        {activeTab === 'members' && (
          <>
            <ThemedSection>
              {/* User position in this tribe */}
              {myPosition &&
                (myPosition.direct_position ||
                  myPosition.represented_persons.length > 0) && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    {myPosition.direct_position && (
                      <ThemedBadge
                        variant={
                          myPosition.direct_position === 'manager'
                            ? 'accent'
                            : myPosition.direct_position === 'member'
                              ? 'primary'
                              : 'ghost'
                        }
                      >
                        {t(`positions.${myPosition.direct_position}`)}
                      </ThemedBadge>
                    )}
                    {myPosition.represented_persons.map((p, i) => (
                      <ThemedBadge
                        key={i}
                        variant={
                          p.position === 'manager'
                            ? 'accent'
                            : p.position === 'member'
                              ? 'primary'
                              : 'ghost'
                        }
                      >
                        {t(`positions.${p.position}`)} {t('tribes.as')}{' '}
                        {p.first_name} {p.last_name}
                      </ThemedBadge>
                    ))}
                  </div>
                )}
            </ThemedSection>
            <ThemedSection themeId={pageThemeCode ?? 'main_2'}>
              {managers.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  {managers.map((person) => (
                    <div key={person.id} style={memberCardStyle}>
                      <ThemedText variant="primary" size="small">
                        {person.first_name} {person.last_name}
                      </ThemedText>
                      <span style={badgeStyle('manager')}>
                        {t('positions.manager')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {members.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  {members.map((person) => (
                    <div key={person.id} style={memberCardStyle}>
                      <ThemedText variant="primary" size="small">
                        {person.first_name} {person.last_name}
                      </ThemedText>
                      <span style={badgeStyle('member')}>
                        {t('positions.member')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {guests.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  {guests.map((person) => (
                    <div key={person.id} style={memberCardStyle}>
                      <ThemedText variant="primary" size="small">
                        {person.first_name} {person.last_name}
                      </ThemedText>
                      <span style={badgeStyle('guest')}>
                        {t('positions.guest')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {tribe.persons.length === 0 && (
                <ThemedText variant="secondary" size="small">
                  {t('tribes.noMembers')}
                </ThemedText>
              )}
            </ThemedSection>
          </>
        )}
      </div>

      {showArchiveConfirm && (
        <ConfirmDialog
          title={t('tribes.archiveConfirmTitle')}
          message={t('tribes.archiveConfirmMessage', { name: tribe.name })}
          confirmLabel={t('tribes.archive')}
          confirmVariant="danger"
          onConfirm={handleArchive}
          onCancel={() => setShowArchiveConfirm(false)}
        />
      )}
    </AppLayout>
  );
};

const ShowTribePage: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="default">
      <ShowTribePageContent />
    </ThemeProvider>
  );
};

export default ShowTribePage;
