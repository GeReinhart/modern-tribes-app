import { Theme } from '@/components/themes/themes.ts';

import { CSSProperties } from 'react';

// ============================================
// LAYOUT STYLES
// ============================================

export const getHeaderStyle = (theme: Theme): CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 'var(--header-pad)',
  backgroundColor: theme.colors.surface,
  borderBottom: `2px solid ${theme.colors.border}`,
  marginBottom: 'var(--space-lg)',
  gap: 'var(--space-lg)',
});

export const logoContainerStyle: CSSProperties = {
  cursor: 'pointer',
  flexShrink: 0,
};

export const middleSectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
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
  gap: 'var(--space-md)',
  flexWrap: 'wrap',
};

export const rightSectionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-md)',
  flexShrink: 0,
};

export const getFooterStyle = (theme: Theme): CSSProperties => ({
  padding: 'var(--space-sm) var(--space-lg)',
  backgroundColor: theme.colors.surface,
  borderTop: `1px solid ${theme.colors.border}`,
  textAlign: 'center',
  marginTop: 'auto',
});

export const footerLinksStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 'var(--space-lg)',
  marginTop: 'var(--space-xs)',
};

export const getFooterLinkStyle = (theme: Theme): CSSProperties => ({
  color: theme.colors.text,
  textDecoration: 'none',
  fontSize: 'var(--font-sm)',
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
  padding: 'var(--main-pad)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-lg)',
};

// ============================================
// BREADCRUMB STYLES
// ============================================

export const getBreadcrumbContainerStyle = (theme: Theme): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  fontSize: 'var(--font-sm)',
  color: theme.colors.text,
});

export const getBreadcrumbItemStyle = (
  theme: Theme,
  isClickable: boolean = false,
): CSSProperties => ({
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

export const getCardStyle = (
  theme: Theme,
  variant: keyof Theme['colors'] = 'primary',
  bordered: boolean = true,
): CSSProperties => ({
  border: bordered ? `3px solid ${theme.colors[variant]}` : 'none',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--card-pad)',
  background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.accent}08)`,
  boxShadow: 'var(--shadow-sm)',
  margin: 'var(--space-md) 0',
});

export const getMemberCardStyle = (theme: Theme): CSSProperties => ({
  padding: 'var(--space-sm) var(--space-md)',
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'var(--space-sm)',
});

export const getAttachmentCardStyle = (theme: Theme): CSSProperties => ({
  padding: 'var(--space-sm) var(--space-md)',
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'var(--space-sm)',
  transition: 'all 0.2s ease',
});

// ============================================
// BADGE STYLES
// ============================================

export const getBadgeStyle = (
  theme: Theme,
  variant: keyof Theme['colors'] = 'secondary',
): CSSProperties => ({
  backgroundColor: theme.colors[variant],
  color: 'white',
  padding: 'var(--space-xs) var(--space-md)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--font-xs)',
  fontWeight: 'bold',
  display: 'inline-block',
  margin: '0 var(--space-xs)',
});

export const getPositionBadgeStyle = (
  theme: Theme,
  type: 'manager' | 'member' | 'guest',
): CSSProperties => {
  const colors = {
    manager: theme.colors.accent,
    member: theme.colors.primary,
    guest: theme.colors.ghost,
  };

  return {
    padding: 'var(--space-xs) var(--space-md)',
    backgroundColor: colors[type],
    color: 'white',
    borderRadius: 'var(--radius-lg)',
    fontSize: 'var(--font-xs)',
    fontWeight: 600,
    textTransform: 'uppercase',
  };
};

// ============================================
// TEXT STYLES
// ============================================

export const getTextStyle = (
  theme: Theme,
  variant: keyof Theme['colors'] = 'text',
  size: 'small' | 'medium' | 'large' = 'medium',
): CSSProperties => {
  const sizes = {
    small: 'var(--font-sm)',
    medium: 'var(--font-lg)',
    large: 'var(--font-xl)',
  };

  return {
    color: theme.colors[variant],
    fontSize: sizes[size],
    fontWeight: '600',
    margin: 'var(--space-sm) 0',
  };
};

// ============================================
// DIVIDER STYLES
// ============================================

export const getDividerStyle = (
  theme: Theme,
  variant: keyof Theme['colors'] = 'primary',
): CSSProperties => ({
  height: '2px',
  background: `linear-gradient(to right, transparent, ${theme.colors[variant]}, transparent)`,
  border: 'none',
  margin: 'var(--space-lg) 0',
});

// ============================================
// BUTTON STYLES
// ============================================

export const getButtonStyle = (
  theme: Theme,
  variant: keyof Theme['colors'] = 'primary',
  fullWidth: boolean = false,
  disabled: boolean = false,
): CSSProperties => ({
  backgroundColor: disabled ? '#cccccc' : theme.colors[variant],
  color: disabled ? '#666666' : 'white',
  border: 'none',
  padding: 'var(--btn-pad-v) var(--btn-pad-h)',
  fontSize: 'var(--btn-font)',
  fontWeight: 'bold',
  borderRadius: 'var(--radius-md)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: disabled ? 'none' : 'var(--shadow-sm)',
  width: fullWidth ? '100%' : 'auto',
  opacity: disabled ? 0.6 : 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-sm)',
});

export const getSubmitButtonStyle = (
  theme: Theme,
  isLoading: boolean,
): CSSProperties => ({
  backgroundColor: theme.colors.primary,
  color: 'white',
  border: 'none',
  padding: 'var(--btn-pad-v) var(--btn-pad-h)',
  fontSize: 'var(--btn-font)',
  fontWeight: 'bold',
  borderRadius: 'var(--radius-md)',
  cursor: isLoading ? 'not-allowed' : 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: 'var(--shadow-sm)',
  opacity: isLoading ? 0.7 : 1,
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  minWidth: '160px',
  justifyContent: 'center',
});

export const clearButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#666',
  cursor: 'pointer',
  fontSize: 'var(--font-sm)',
  textDecoration: 'underline',
  padding: 'var(--space-xs) var(--space-sm)',
};

// ============================================
// FORM STYLES
// ============================================

export const containerStyle: CSSProperties = {
  padding: 'var(--space-sm)',
  fontFamily: 'Arial, sans-serif',
  maxWidth: '1400px',
  margin: '0 auto',
  backgroundColor: '#f9f9f9',
  minHeight: '100vh',
};

export const formContainerStyle: CSSProperties = {
  backgroundColor: 'white',
  padding: 'var(--space-xl)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
};

export const getInputStyle = (theme: Theme): CSSProperties => ({
  width: '100%',
  padding: 'var(--space-sm)',
  fontSize: 'var(--font-md)',
  borderRadius: 'var(--radius-md)',
  border: `2px solid ${theme.colors.secondary}`,
  marginTop: 'var(--space-sm)',
  marginBottom: 'var(--space-md)',
  fontFamily: 'Arial, sans-serif',
  transition: 'border-color 0.3s ease',
});

export const getFilterInputStyle = (theme: Theme): CSSProperties => ({
  width: '100%',
  padding: 'var(--space-sm) var(--space-md)',
  fontSize: 'var(--font-md)',
  borderRadius: 'var(--radius-md)',
  border: `2px solid ${theme.colors.secondary}`,
  marginTop: 'var(--space-sm)',
  marginBottom: 'var(--space-md)',
  fontFamily: 'Arial, sans-serif',
  transition: 'all 0.3s ease',
  backgroundColor: '#fafafa',
});

export const getPersonCardStyle = (theme: Theme): CSSProperties => ({
  padding: 'var(--space-md)',
  borderRadius: 'var(--radius-md)',
  border: `2px solid ${theme.colors.secondary}20`,
  marginBottom: 'var(--space-md)',
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
  padding: 'var(--space-sm) var(--space-md)',
  borderRadius: 'var(--radius-sm)',
  border: `2px solid ${theme.colors.accent}`,
  fontSize: 'var(--font-sm)',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginLeft: 'var(--space-md)',
});

export const getFilterCheckboxStyle = (
  theme: Theme,
  checked: boolean,
): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  marginTop: 'var(--space-md)',
  marginBottom: 'var(--space-md)',
  padding: 'var(--space-md)',
  backgroundColor: `${theme.colors.primary}08`,
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: `2px solid ${checked ? theme.colors.primary : 'transparent'}`,
});

export const errorStyle: CSSProperties = {
  backgroundColor: '#fee',
  border: '2px solid #f00',
  color: '#c00',
  padding: 'var(--space-md)',
  borderRadius: 'var(--radius-md)',
  marginBottom: 'var(--space-lg)',
};

export const successStyle: CSSProperties = {
  backgroundColor: '#efe',
  border: '2px solid #0c0',
  color: '#060',
  padding: 'var(--space-md)',
  borderRadius: 'var(--radius-md)',
  marginBottom: 'var(--space-lg)',
};

export const formActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-md)',
  marginTop: 'var(--space-xl)',
  justifyContent: 'flex-end',
};

export const personListContainerStyle: CSSProperties = {
  marginTop: 'var(--space-lg)',
  maxHeight: '500px',
  overflowY: 'auto',
  paddingRight: 'var(--space-sm)',
};

export const personInfoContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flex: 1,
};

export const checkboxStyle: CSSProperties = {
  width: '20px',
  height: '20px',
  marginRight: 'var(--space-md)',
  cursor: 'pointer',
};

export const filterHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 'var(--space-sm)',
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
  padding: 'var(--space-xl)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-lg)',
};

export const loadingTextStyle: CSSProperties = {
  fontSize: 'var(--font-lg)',
  fontWeight: '600',
  color: '#333',
  marginTop: 'var(--space-sm)',
};

export const loadingSubTextStyle: CSSProperties = {
  fontSize: 'var(--font-sm)',
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
  padding: 'var(--space-xl)',
};

export const downloadLinkStyle = (theme: Theme): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-xs)',
  padding: 'var(--space-sm) var(--space-md)',
  backgroundColor: theme.colors.primary,
  color: 'white',
  borderRadius: 'var(--radius-sm)',
  textDecoration: 'none',
  fontSize: 'var(--font-sm)',
  fontWeight: 500,
  transition: 'opacity 0.2s ease',
});
