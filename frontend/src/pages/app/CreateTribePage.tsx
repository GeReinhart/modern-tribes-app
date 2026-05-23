import React, {useState, useMemo} from 'react';
import { useTranslation } from 'react-i18next';
import {ThemeProvider, useTheme} from '@/contexts/ThemeContext.tsx';
import {AppLayout} from '@/components/layout/AppLayout';
import { ThemedText} from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import {ThemedSection} from "@/components/common/layout/ThemedSection.tsx";
import {ThemedLoadingOverlay} from "@/components/common/layout/ThemedLoadingOverlay.tsx";
import {useNavigate} from 'react-router-dom';
import {usePersons} from '@/hooks/usePersons';
import {useTribeWithPositionsMutations} from '@/hooks/useTribesWithPositions';
import {
    formContainerStyle,
    getInputStyle,
    getFilterInputStyle,
    getPersonCardStyle,
    getSelectedPersonCardStyle,
    getPositionSelectStyle,
    errorStyle,
    successStyle,
    formActionsStyle,
    personListContainerStyle,
    personInfoContainerStyle,
    checkboxStyle,
    filterHeaderStyle,
    clearButtonStyle,
    getSubmitButtonStyle,
} from '@/styles/theme.styles';
import JoditEditorComponent from "@/components/common/editor/JoditEditorComponent.tsx";
import FileUploader from "@/components/common/editor/FileUploader.tsx";
import {AttachmentFile} from "@/types/document.types.ts";
import {ThemedLoadingSpinner} from "@/components/common/layout/ThemedLoadingSpinner.tsx";
import { PositionEnum } from '@/types/position.types';
import { MenuAction } from '@/types/menu.types';

interface SelectedPerson {
    person_id: string;
    position: PositionEnum;
}

interface TribeFormData {
    tribeName: string;
    documentContent: string;
    attachments: AttachmentFile[];
    selectedPersons: SelectedPerson[];
}

const CreateTribeFormContent: React.FC = () => {
    const { t } = useTranslation();
    const {theme} = useTheme();
    const navigate = useNavigate();

    // Hooks
    const {persons, loading: personsLoading, error: personsError} = usePersons();
    const {createTribeWithPositions, loading: createLoading, error: createError} = useTribeWithPositionsMutations();

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [personFilter, setPersonFilter] = useState('');
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    const [formData, setFormData] = useState<TribeFormData>({
        tribeName: '',
        documentContent: '',
        attachments: [],
        selectedPersons: []
    });

    const breadcrumbs = [
        { label: t('common.home'), path: '/app' },
        { label: t('tribes.title'), path: '/app/tribes' },
        { label: t('common.create') }
    ];

    const menuActions = useMemo((): MenuAction[] => [
        { icon: 'x', label: t('common.cancel'), onClick: () => navigate('/app') },
    ], [t, navigate]);

    // Get theme-dependent styles
    const inputStyle = getInputStyle(theme);
    const filterInputStyle = getFilterInputStyle(theme);
    const personCardStyle = getPersonCardStyle(theme);
    const selectedPersonCardStyle = getSelectedPersonCardStyle(theme);
    const positionSelectStyle = getPositionSelectStyle(theme);

    const isLoading = isSubmitting || personsLoading || createLoading;
    const submitButtonStyle = getSubmitButtonStyle(theme, isLoading);

    // Filter persons
    const filteredPersons = useMemo(() => {
        let filtered = persons;

        if (personFilter.trim()) {
            const searchTerm = personFilter.toLowerCase();
            filtered = filtered.filter(person =>
                person.first_name.toLowerCase().includes(searchTerm) ||
                person.last_name.toLowerCase().includes(searchTerm) ||
                `${person.first_name} ${person.last_name}`.toLowerCase().includes(searchTerm) ||
                person.gender.toLowerCase().includes(searchTerm)
            );
        }

        if (showOnlySelected) {
            const selectedIds = formData.selectedPersons.map(p => p.person_id);
            filtered = filtered.filter(person => selectedIds.includes(person.id));
        }

        return filtered;
    }, [persons, personFilter, showOnlySelected, formData.selectedPersons]);

    const handleInputChange = (field: keyof TribeFormData, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
        setError(null);
    };

    const togglePersonSelection = (personId: string) => {
        setFormData(prev => {
            const isSelected = prev.selectedPersons.some(p => p.person_id === personId);

            if (isSelected) {
                return {
                    ...prev,
                    selectedPersons: prev.selectedPersons.filter(p => p.person_id !== personId)
                };
            } else {
                return {
                    ...prev,
                    selectedPersons: [...prev.selectedPersons, {person_id: personId, position: 'member'}]
                };
            }
        });
    };

    const handlePositionChange = (personId: string, position: 'manager' | 'member' | 'guest') => {
        setFormData(prev => ({
            ...prev,
            selectedPersons: prev.selectedPersons.map(p =>
                p.person_id === personId ? {...p, position} : p
            )
        }));
    };

    const handleAttachmentsChange = (attachments: AttachmentFile[]) => {
        setFormData(prev => ({...prev, attachments}));
    };

    const isPersonSelected = (personId: string): boolean => {
        return formData.selectedPersons.some(p => p.person_id === personId);
    };

    const getPersonPosition = (personId: string): string => {
        const person = formData.selectedPersons.find(p => p.person_id === personId);
        return person?.position || 'member';
    };

    const validateForm = (): boolean => {
        if (!formData.tribeName.trim()) {
            setError(t('validation.tribeNameRequired'));
            return false;
        }
        if (!formData.documentContent.trim()) {
            setError(t('validation.documentContentRequired'));
            return false;
        }
        if (formData.selectedPersons.length === 0) {
            setError(t('validation.selectOnePerson'));
            return false;
        }

        const hasChief = formData.selectedPersons.some(p => p.position === 'manager');
        if (!hasChief) {
            setError(t('validation.assignOneChief'));
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await createTribeWithPositions({
                name: formData.tribeName,
                document_content_html: formData.documentContent,
                document_attachments: formData.attachments,
                positions: formData.selectedPersons
            });

            if (!result) {
                throw new Error('Failed to create tribe');
            }

            setSuccess(true);

            // Reset form
            setFormData({
                tribeName: '',
                documentContent: '',
                attachments: [],
                selectedPersons: []
            });
            setPersonFilter('');
            setShowOnlySelected(false);

            // Navigate after a short delay
            setTimeout(() => {
                navigate(`/app/tribes/${result.url_param_id}`);
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : t('validation.failedCreateTribe'));
            console.error('Error creating tribe:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/app');
    };

    const handleClearFilter = () => {
        setPersonFilter('');
        setShowOnlySelected(false);
    };

    const displayError = error || personsError || createError;

    const filterCheckboxStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '12px',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: `${theme.colors.primary}08`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `2px solid ${showOnlySelected ? theme.colors.primary : 'transparent'}`,
    };

    const handleContentChange = (content: string) => {
        setFormData(prev => ({...prev, documentContent: content}));
    };

    return (
        <AppLayout menuActions={menuActions} breadcrumbs={breadcrumbs}>
            {isSubmitting && (
                <ThemedLoadingOverlay
                    message={t('tribes.creatingTribe')}
                    subMessage={t('tribes.createWait')}
                />
            )}

            {/* Error Message */}
            {displayError && (
                <div style={errorStyle}>
                    <strong>{t('common.error')}</strong> {displayError}
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div style={successStyle}>
                    <strong>{t('common.success')}</strong> {t('tribes.createSuccess')}
                </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit}>
                <div style={formContainerStyle}>
                    {/* Tribe Information Section */}
                    <ThemedSection themeId="main_1">
                        <label>
                            <ThemedText size="medium" as="h3">
                                {t('tribes.name')}
                            </ThemedText>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.tribeName}
                                onChange={(e) => handleInputChange('tribeName', e.target.value)}
                                placeholder={t('tribes.name').replace(' *', '')}
                                disabled={isLoading}
                            />
                        </label>
                        <ThemedText size="medium" as="h3">
                            {t('tribes.description')}
                        </ThemedText>
                        <label>
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                <JoditEditorComponent
                                    content={formData.documentContent}
                                    onChange={handleContentChange}
                                />
                            </div>
                            {/* File Uploader */}
                            <div className="mb-6">
                                <FileUploader
                                    attachments={formData.attachments}
                                    onAttachmentsChange={handleAttachmentsChange}
                                />
                            </div>
                        </label>
                    </ThemedSection>

                    {/* Person Selection Section */}
                    <ThemedSection themeId="main_2">
                        <ThemedText size="medium" as="h2">
                            {t('tribes.membersAndPositions')}
                        </ThemedText>
                        <ThemedText variant="secondary" size="small">
                            {t('tribes.membersAndPositionsHint')}
                        </ThemedText>

                        {/* Filter Input */}
                        <div style={filterHeaderStyle}>
                            <ThemedText variant="accent" size="small" as="span">
                                {t('tribes.filterPersons')}
                            </ThemedText>
                            {(personFilter || showOnlySelected) && (
                                <button
                                    type="button"
                                    style={clearButtonStyle}
                                    onClick={handleClearFilter}
                                >
                                    {t('tribes.clearAllFilters')}
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            style={filterInputStyle}
                            value={personFilter}
                            onChange={(e) => setPersonFilter(e.target.value)}
                            placeholder={t('common.filter')}
                            disabled={isLoading}
                        />

                        {/* Show Only Selected Checkbox */}
                        <label
                            style={filterCheckboxStyle}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.currentTarget.style.backgroundColor = `${theme.colors.primary}15`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = `${theme.colors.primary}08`;
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={showOnlySelected}
                                onChange={(e) => setShowOnlySelected(e.target.checked)}
                                disabled={isLoading || formData.selectedPersons.length === 0}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: formData.selectedPersons.length === 0 ? 'not-allowed' : 'pointer',
                                }}
                            />
                            <ThemedText variant="primary" size="small" as="span">
                                {t('tribes.showOnlySelected', { count: formData.selectedPersons.length })}
                            </ThemedText>
                        </label>

                        {(personFilter || showOnlySelected) && (
                            <div style={{marginBottom: '12px'}}>
                                <ThemedText variant="secondary" size="small" as="div">
                                    {showOnlySelected
                                        ? t('tribes.showingSelected', { count: filteredPersons.length })
                                        : t('tribes.foundPersons', { count: filteredPersons.length, search: personFilter })
                                    }
                                </ThemedText>
                            </div>
                        )}

                        <div style={personListContainerStyle}>
                            {personsLoading && (
                                <ThemedText variant="secondary" size="small">
                                    {t('tribes.loadingPersons')}
                                </ThemedText>
                            )}

                            {!personsLoading && persons.length === 0 && (
                                <ThemedText variant="secondary" size="small">
                                    {t('tribes.noPersonsAvailable')}
                                </ThemedText>
                            )}

                            {!personsLoading && persons.length > 0 && filteredPersons.length === 0 && (
                                <ThemedText variant="secondary" size="small">
                                    {showOnlySelected
                                        ? t('tribes.noPersonsSelected')
                                        : t('tribes.noPersonsMatch')
                                    }
                                </ThemedText>
                            )}

                            {!personsLoading && filteredPersons.length > 0 && filteredPersons.map(person => {
                                const selected = isPersonSelected(person.id);
                                const position = getPersonPosition(person.id);

                                return (
                                    <div
                                        key={person.id}
                                        style={selected ? selectedPersonCardStyle : personCardStyle}
                                        onClick={() => !isLoading && togglePersonSelection(person.id)}
                                        onMouseEnter={(e) => {
                                            if (!isLoading) {
                                                e.currentTarget.style.transform = 'translateX(4px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        <div style={personInfoContainerStyle}>
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() => {
                                                }}
                                                style={checkboxStyle}
                                                disabled={isLoading}
                                            />
                                            <div>
                                                <ThemedText variant="primary" size="small" as="span">
                                                    {person.first_name} {person.last_name}
                                                </ThemedText>
                                            </div>
                                        </div>

                                        {selected && (
                                            <select
                                                value={position}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handlePositionChange(
                                                        person.id,
                                                        e.target.value as 'manager' | 'member' | 'guest'
                                                    );
                                                }}
                                                style={positionSelectStyle}
                                                disabled={isLoading}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="member">{t('positions.member')}</option>
                                                <option value="manager">{t('positions.manager')}</option>
                                                <option value="guest">{t('positions.guest')}</option>
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    </ThemedSection>

                    {/* Form Actions */}
                    <div style={formActionsStyle}>
                        <ThemedButton
                            variant="secondary"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel')}
                        </ThemedButton>
                        <button
                            type="submit"
                            style={submitButtonStyle}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <ThemedLoadingSpinner size="sm" />}
                            {isSubmitting ? t('tribes.creatingTribe') : t('tribes.createTribe')}
                        </button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
};

const CreateTribeForm: React.FC = () => {
    return (
        <ThemeProvider defaultTheme="default">
            <CreateTribeFormContent/>
        </ThemeProvider>
    );
};

export default CreateTribeForm;