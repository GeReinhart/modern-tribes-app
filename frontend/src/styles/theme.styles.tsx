import { CSSProperties } from 'react';
import { Theme } from '@/components/themes/themes';

// ============================================
// LAYOUT STYLES
// ============================================

export const getHeaderStyle = (theme: Theme): CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: theme.colors.surface,
    borderBottom: `2px solid ${theme.colors.border}`,
    marginBottom: '24px',
    gap: '24px',
});

export const logoContainerStyle: CSSProperties = {
    cursor: 'pointer',
    flexShrink: 0,
};

export const middleSectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    minWidth: 0,
};

export const breadcrumbContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
};

export const actionsContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
};

export const rightSectionStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
};

export const getFooterStyle = (theme: Theme): CSSProperties => ({
    padding: '12px 24px',
    backgroundColor: theme.colors.surface,
    borderTop: `1px solid ${theme.colors.border}`,
    textAlign: 'center',
    marginTop: 'auto',
});

export const footerLinksStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '4px',
};

export const getFooterLinkStyle = (theme: Theme): CSSProperties => ({
    color: theme.colors.text,
    textDecoration: 'none',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
});

export const layoutStyle: CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
};

export const mainStyle: CSSProperties = {
    flex: 1,
    padding: '0 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
};

// ============================================
// BREADCRUMB STYLES
// ============================================

export const getBreadcrumbContainerStyle = (theme: Theme): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: theme.colors.text,
});

export const getBreadcrumbItemStyle = (theme: Theme, isClickable: boolean = false): CSSProperties => ({
    color: theme.colors.text,
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    cursor: isClickable ? 'pointer' : 'default',
});

export const getBreadcrumbActiveItemStyle = (theme: Theme): CSSProperties => ({
    color: theme.colors.text,
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'default',
});

export const getBreadcrumbSeparatorStyle = (theme: Theme): CSSProperties => ({
    color: theme.colors.text,
    userSelect: 'none',
});

// ============================================
// CARD STYLES
// ============================================

export const getCardStyle = (theme: Theme, variant: keyof Theme['colors'] = 'primary', bordered: boolean = true): CSSProperties => ({
    border: bordered ? `3px solid ${theme.colors[variant]}` : 'none',
    borderRadius: '12px',
    padding: '24px',
    background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.accent}08)`,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    margin: '16px 0',
});

export const getMemberCardStyle = (theme: Theme): CSSProperties => ({
    padding: '12px 16px',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
});

export const getAttachmentCardStyle = (theme: Theme): CSSProperties => ({
    padding: '12px 16px',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    transition: 'all 0.2s ease',
});

// ============================================
// BADGE STYLES
// ============================================

export const getBadgeStyle = (theme: Theme, variant: keyof Theme['colors'] = 'secondary'): CSSProperties => ({
    backgroundColor: theme.colors[variant],
    color: 'white',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
    margin: '0 4px',
});

export const getPositionBadgeStyle = (theme: Theme, type: 'chief' | 'member' | 'guest'): CSSProperties => {
    const colors = {
        chief: theme.colors.accent,
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
        textTransform: 'uppercase',
    };
};

// ============================================
// TEXT STYLES
// ============================================

export const getTextStyle = (theme: Theme, variant: keyof Theme['colors'] = 'text', size: 'small' | 'medium' | 'large' = 'medium'): CSSProperties => {
    const sizes = {
        small: '14px',
        medium: '18px',
        large: '24px',
    };

    return {
        color: theme.colors[variant],
        fontSize: sizes[size],
        fontWeight: '600',
        margin: '8px 0',
    };
};

// ============================================
// DIVIDER STYLES
// ============================================

export const getDividerStyle = (theme: Theme, variant: keyof Theme['colors'] = 'primary'): CSSProperties => ({
    height: '2px',
    background: `linear-gradient(to right, transparent, ${theme.colors[variant]}, transparent)`,
    border: 'none',
    margin: '20px 0',
});

// ============================================
// BUTTON STYLES
// ============================================

export const getButtonStyle = (
    theme: Theme,
    variant: keyof Theme['colors'] = 'primary',
    fullWidth: boolean = false,
    disabled: boolean = false
): CSSProperties => ({
    backgroundColor: disabled ? '#cccccc' : theme.colors[variant],
    color: disabled ? '#666666' : 'white',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
});

export const getSubmitButtonStyle = (theme: Theme, isLoading: boolean): CSSProperties => ({
    backgroundColor: theme.colors.primary,
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    opacity: isLoading ? 0.7 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '160px',
    justifyContent: 'center',
});

export const clearButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'underline',
    padding: '4px 8px',
};

// ============================================
// FORM STYLES
// ============================================

export const containerStyle: CSSProperties = {
    padding: '8px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
};

export const formContainerStyle: CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
};

export const getInputStyle = (theme: Theme): CSSProperties => ({
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: `2px solid ${theme.colors.secondary}`,
    marginTop: '8px',
    marginBottom: '16px',
    fontFamily: 'Arial, sans-serif',
    transition: 'border-color 0.3s ease',
});

export const getFilterInputStyle = (theme: Theme): CSSProperties => ({
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: `2px solid ${theme.colors.secondary}`,
    marginTop: '12px',
    marginBottom: '16px',
    fontFamily: 'Arial, sans-serif',
    transition: 'all 0.3s ease',
    backgroundColor: '#fafafa',
});

export const getPersonCardStyle = (theme: Theme): CSSProperties => ({
    padding: '16px',
    borderRadius: '8px',
    border: `2px solid ${theme.colors.secondary}20`,
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
    cursor: 'pointer',
});

export const getSelectedPersonCardStyle = (theme: Theme): CSSProperties => ({
    ...getPersonCardStyle(theme),
    backgroundColor: `${theme.colors.primary}10`,
    border: `2px solid ${theme.colors.primary}`,
});

export const getPositionSelectStyle = (theme: Theme): CSSProperties => ({
    padding: '8px 12px',
    borderRadius: '6px',
    border: `2px solid ${theme.colors.accent}`,
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: '12px',
});

export const getFilterCheckboxStyle = (theme: Theme, checked: boolean): CSSProperties => ({
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
    border: `2px solid ${checked ? theme.colors.primary : 'transparent'}`,
});

export const errorStyle: CSSProperties = {
    backgroundColor: '#fee',
    border: '2px solid #f00',
    color: '#c00',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
};

export const successStyle: CSSProperties = {
    backgroundColor: '#efe',
    border: '2px solid #0c0',
    color: '#060',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
};

export const formActionsStyle: CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '30px',
    justifyContent: 'flex-end',
};

export const personListContainerStyle: CSSProperties = {
    marginTop: '20px',
    maxHeight: '500px',
    overflowY: 'auto',
    paddingRight: '8px',
};

export const personInfoContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
};

export const checkboxStyle: CSSProperties = {
    width: '20px',
    height: '20px',
    marginRight: '12px',
    cursor: 'pointer',
};

export const filterHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
};

// ============================================
// LOADING STYLES
// ============================================

export const loadingOverlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
};

export const loadingContentStyle: CSSProperties = {
    backgroundColor: 'white',
    padding: '40px 60px',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
};

export const loadingTextStyle: CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginTop: '10px',
};

export const loadingSubTextStyle: CSSProperties = {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
};

// ============================================
// MODAL STYLES
// ============================================

export const getModalHeaderStyle = (theme: Theme): CSSProperties => ({
    borderBottom: `1px solid ${theme.colors.border}`,
});

export const getModalFooterStyle = (theme: Theme): CSSProperties => ({
    borderTop: `1px solid ${theme.colors.border}`,
    backgroundColor: `${theme.colors.surface}50`,
});

// ============================================
// UTILITY STYLES
// ============================================

export const centerContainerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
};

export const flexCenterStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px',
};

export const downloadLinkStyle = (theme: Theme): CSSProperties => ({
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
});
