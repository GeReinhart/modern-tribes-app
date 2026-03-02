import React, { useState, useMemo } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext.tsx';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText} from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSection } from "@/components/common/layout/ThemedSection.tsx";
import { ThemedLoadingOverlay } from "@/components/common/layout/ThemedLoadingOverlay.tsx";
import { useNavigate, useParams } from 'react-router-dom';
import { usePersons } from '@/hooks/usePersons';
import { useTribeWithPositions, useTribeWithPositionsMutations } from '@/hooks/useTribesWithPositions';
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
import { AttachmentFile } from "@/types/document.types.ts";
import {TribeWithPositionsUpdate} from "@/types/app/tribe_with_positions.types.ts";
import {ThemedLoadingSpinner} from "@/components/common/layout/ThemedLoadingSpinner.tsx";

interface SelectedPerson {
    person_id: string;
    position: 'chief' | 'member' | 'guest';
}

const UpdateTribePageContent: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { tribeId } = useParams<{ tribeId: string }>();

    // Hooks
    const { persons, loading: personsLoading, error: personsError } = usePersons();
    const { tribe, loading: tribeLoading, error: tribeError } = useTribeWithPositions(tribeId || null);
    const { updateTribeWithPositions, loading: updateLoading, error: updateError } = useTribeWithPositionsMutations();

    // State
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data
    const [tribeName, setTribeName] = useState('');
    const [documentContent, setDocumentContent] = useState('');
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [selectedPersons, setSelectedPersons] = useState<SelectedPerson[]>([]);

    // Original values for comparison
    const [originalTribeName, setOriginalTribeName] = useState('');
    const [originalDocumentContent, setOriginalDocumentContent] = useState('');
    const [originalAttachments, setOriginalAttachments] = useState<AttachmentFile[]>([]);
    const [originalPersons, setOriginalPersons] = useState<SelectedPerson[]>([]);

    // Filter state
    const [personFilter, setPersonFilter] = useState('');
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    // Initialize form with tribe data
    React.useEffect(() => {
        if (tribe) {
            setTribeName(tribe.name);
            setOriginalTribeName(tribe.name);

            setDocumentContent(tribe.document_content_html || '');
            setOriginalDocumentContent(tribe.document_content_html || '');

            setAttachments(tribe.document_attachments || []);
            setOriginalAttachments(tribe.document_attachments || []);

            console.log("Tribe:", tribe);


            const persons = tribe.persons.map(p => ({
                person_id: p.id,
                position: p.position
            }));
            setSelectedPersons(persons);
            setOriginalPersons(persons);
        }
    }, [tribe]);

    // ✅ MOVE BREADCRUMBS HERE - BEFORE ANY EARLY RETURNS
    const breadcrumbs = React.useMemo(() => [
        { label: 'Home', path: '/app' },
        { label: 'Tribes', path: '/app/tribes' },
        { label: tribe?.name || 'Loading...', path: `/app/tribes/${tribeId}` },
        { label: 'Edit' }
    ], [tribe?.name, tribeId]);

    // ✅ MOVE HEADER ACTIONS HERE - AFTER BREADCRUMBS
    const headerActions = (
        <ThemedButton
            variant="secondary"
            onClick={() => navigate(`/app/tribes/${tribeId}`)}
            disabled={isSubmitting}
        >
            Cancel
        </ThemedButton>
    );

    // Get theme-dependent styles
    const inputStyle = getInputStyle(theme);
    const filterInputStyle = getFilterInputStyle(theme);
    const personCardStyle = getPersonCardStyle(theme);
    const selectedPersonCardStyle = getSelectedPersonCardStyle(theme);
    const positionSelectStyle = getPositionSelectStyle(theme);

    const isLoading = isSubmitting || tribeLoading || personsLoading || updateLoading;
    const submitButtonStyle = getSubmitButtonStyle(theme, isLoading);

    // Filter persons
    const filteredPersons = useMemo(() => {
        let filtered = persons;

        if (personFilter.trim()) {
            const searchTerm = personFilter.toLowerCase();
            filtered = filtered.filter(person =>
                person.first_name.toLowerCase().includes(searchTerm) ||
                person.last_name.toLowerCase().includes(searchTerm) ||
                `${person.first_name} ${person.last_name}`.toLowerCase().includes(searchTerm)
            );
        }

        if (showOnlySelected) {
            const selectedIds = selectedPersons.map(p => p.person_id);
            filtered = filtered.filter(person => selectedIds.includes(person.id));
        }

        return filtered;
    }, [persons, personFilter, showOnlySelected, selectedPersons]);

    // Check what has changed
    const hasChanges = useMemo(() => {
        const nameChanged = tribeName !== originalTribeName;
        const documentChanged = documentContent !== originalDocumentContent;

        // Compare attachments
        const attachmentsChanged = JSON.stringify(attachments) !== JSON.stringify(originalAttachments);

        const originalIds = originalPersons.map(p => p.person_id).sort();
        const currentIds = selectedPersons.map(p => p.person_id).sort();
        const membersChanged = JSON.stringify(originalIds) !== JSON.stringify(currentIds) ||
            originalPersons.some(op => {
                const current = selectedPersons.find(sp => sp.person_id === op.person_id);
                return current && current.position !== op.position;
            });

        return nameChanged || documentChanged || attachmentsChanged || membersChanged;
    }, [tribeName, originalTribeName, documentContent, originalDocumentContent, attachments, originalAttachments, selectedPersons, originalPersons]);

    // Validation
    const validateForm = (): boolean => {
        if (!tribeName.trim()) {
            setError('Tribe name is required');
            return false;
        }

        if (!documentContent.trim()) {
            setError('Document content is required');
            return false;
        }

        if (selectedPersons.length === 0) {
            setError('Please select at least one person for the tribe');
            return false;
        }

        const hasChief = selectedPersons.some(p => p.position === 'chief');
        if (!hasChief) {
            setError('Please assign at least one person as Chief');
            return false;
        }

        if (!hasChanges) {
            setError('No changes detected');
            return false;
        }

        return true;
    };

    // Submit handler
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
        setSuccess(null);

        try {
            // Build update data - only include what changed
            const updateData: TribeWithPositionsUpdate = {
                positions: selectedPersons
            };

            // Only add name if changed
            if (tribeName !== originalTribeName) {
                updateData.name = tribeName;
            }

            // Add document fields if document content OR attachments changed
            const documentChanged = documentContent !== originalDocumentContent;
            const attachmentsChanged = JSON.stringify(attachments) !== JSON.stringify(originalAttachments);

            if (documentChanged || attachmentsChanged) {
                // Always send both when either changes - backend expects them together
                updateData.document_content_html = documentContent;
                updateData.document_attachments = attachments;
            }

            const result = await updateTribeWithPositions(tribeId!, updateData);

            if (!result) {
                throw new Error('Failed to update tribe');
            }

            setSuccess('Tribe updated successfully!');

            // Update original values
            setOriginalTribeName(tribeName);
            setOriginalDocumentContent(documentContent);
            setOriginalAttachments([...attachments]);
            setOriginalPersons([...selectedPersons]);

            setTimeout(() => {
                navigate(`/app/tribes/${tribeId}`);
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update tribe');
            console.error('Error updating tribe:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePersonSelection = (personId: string) => {
        setSelectedPersons(prev => {
            const isSelected = prev.some(p => p.person_id === personId);

            if (isSelected) {
                return prev.filter(p => p.person_id !== personId);
            } else {
                return [...prev, { person_id: personId, position: 'member' }];
            }
        });
    };

    const handlePositionChange = (personId: string, position: 'chief' | 'member' | 'guest') => {
        setSelectedPersons(prev =>
            prev.map(p => p.person_id === personId ? { ...p, position } : p)
        );
    };

    const isPersonSelected = (personId: string): boolean => {
        return selectedPersons.some(p => p.person_id === personId);
    };

    const getPersonPosition = (personId: string): string => {
        const person = selectedPersons.find(p => p.person_id === personId);
        return person?.position || 'member';
    };

    const handleClearFilter = () => {
        setPersonFilter('');
        setShowOnlySelected(false);
    };

    const handleCancel = () => {
        navigate(`/app/tribes/${tribeId}`);
    };

    const displayError = error || personsError || tribeError || updateError;

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

    // ✅ EARLY RETURNS NOW COME AFTER BREADCRUMBS AND HEADER ACTIONS ARE DEFINED
    if (tribeLoading) {
        return (
            <AppLayout headerActions={headerActions} breadcrumbs={breadcrumbs}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <ThemedLoadingSpinner size="sm"  />
                </div>
            </AppLayout>
        );
    }

    if (!tribe) {
        return (
            <AppLayout headerActions={headerActions} breadcrumbs={breadcrumbs}>
                <div style={{ padding: '0 24px' }}>
                    <ThemedCard>
                        <ThemedText variant="danger" size="medium">
                            <strong>Error:</strong> Tribe not found
                        </ThemedText>
                    </ThemedCard>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout headerActions={headerActions} breadcrumbs={breadcrumbs}>
            {isSubmitting && (
                <ThemedLoadingOverlay
                    message="Updating Tribe..."
                    subMessage="Please wait while we save your changes"
                />
            )}

            <div style={{ padding: '0 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                {/* Page Title */}
                <ThemedCard>
                    <ThemedText variant="primary" size="large" as="h1">
                        Update Tribe
                    </ThemedText>
                    <ThemedText size="small">
                        Modify the tribe information below
                    </ThemedText>
                </ThemedCard>

                {/* Error/Success Messages */}
                {displayError && (
                    <div style={errorStyle}>
                        <strong>Error:</strong> {displayError}
                    </div>
                )}

                {success && (
                    <div style={successStyle}>
                        <strong>Success!</strong> {success}
                    </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleSubmit}>
                    <div style={formContainerStyle}>
                        {/* Tribe Name Section */}
                        <ThemedSection themeId="main_1">
                            <ThemedText size="medium" as="h3">
                                Tribe Name *
                            </ThemedText>
                            <input
                                type="text"
                                style={inputStyle}
                                value={tribeName}
                                onChange={(e) => setTribeName(e.target.value)}
                                placeholder="Enter tribe name"
                                disabled={isLoading}
                            />
                        </ThemedSection>

                        {/* Document Section */}
                        <ThemedSection themeId="main_1">
                            <ThemedText size="medium" as="h3">
                                Description *
                            </ThemedText>
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                <JoditEditorComponent
                                    content={documentContent}
                                    onChange={setDocumentContent}
                                />
                            </div>

                            <div className="mb-6">
                                <FileUploader
                                    attachments={attachments}
                                    onAttachmentsChange={setAttachments}
                                    maxFiles={5}
                                    maxFileSize={10}
                                />
                            </div>
                        </ThemedSection>

                        {/* Members Section */}
                        <ThemedSection themeId="main_2">
                            <ThemedText size="medium" as="h2">
                                Members and Positions
                            </ThemedText>
                            <ThemedText variant="secondary" size="small">
                                Select persons and assign their positions. At least one Chief is required.
                            </ThemedText>

                            {/* Filter */}
                            <div style={filterHeaderStyle}>
                                <ThemedText variant="accent" size="small" as="span">
                                    Filter persons
                                </ThemedText>
                                {(personFilter || showOnlySelected) && (
                                    <button
                                        type="button"
                                        style={clearButtonStyle}
                                        onClick={handleClearFilter}
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                style={filterInputStyle}
                                value={personFilter}
                                onChange={(e) => setPersonFilter(e.target.value)}
                                placeholder="Search..."
                                disabled={isLoading}
                            />

                            {/* Show Only Selected */}
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
                                    disabled={isLoading || selectedPersons.length === 0}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        cursor: selectedPersons.length === 0 ? 'not-allowed' : 'pointer',
                                    }}
                                />
                                <ThemedText variant="primary" size="small" as="span">
                                    Show only selected persons ({selectedPersons.length})
                                </ThemedText>
                            </label>

                            {(personFilter || showOnlySelected) && (
                                <div style={{ marginBottom: '12px' }}>
                                    <ThemedText variant="secondary" size="small" as="div">
                                        {showOnlySelected
                                            ? `Showing ${filteredPersons.length} selected person(s)`
                                            : `Found ${filteredPersons.length} person(s) matching "${personFilter}"`
                                        }
                                    </ThemedText>
                                </div>
                            )}

                            {/* Person List */}
                            <div style={personListContainerStyle}>
                                {personsLoading && (
                                    <ThemedText variant="secondary" size="small">
                                        Loading persons...
                                    </ThemedText>
                                )}

                                {!personsLoading && filteredPersons.length === 0 && (
                                    <ThemedText variant="secondary" size="small">
                                        {showOnlySelected
                                            ? "No persons selected yet."
                                            : "No persons found."
                                        }
                                    </ThemedText>
                                )}

                                {!personsLoading && filteredPersons.map(person => {
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
                                                    onChange={() => {}}
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
                                                            e.target.value as 'chief' | 'member' | 'guest'
                                                        );
                                                    }}
                                                    style={positionSelectStyle}
                                                    disabled={isLoading}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="chief">Chief</option>
                                                    <option value="guest">Guest</option>
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
                                Cancel
                            </ThemedButton>
                            <button
                                type="submit"
                                style={submitButtonStyle}
                                disabled={isSubmitting || !hasChanges}
                            >
                                {isSubmitting && <ThemedLoadingSpinner size="sm"  />}
                                {isSubmitting ? 'Updating Tribe...' : 'Update Tribe'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

const UpdateTribePage: React.FC = () => {
    return (
        <ThemeProvider defaultTheme="default">
            <UpdateTribePageContent />
        </ThemeProvider>
    );
};

export default UpdateTribePage;
