import { ThemedLoadingSpinner } from '@/platform/themes/components/ThemedLoadingSpinner.tsx';
import {
  loadingContentStyle,
  loadingOverlayStyle,
  loadingSubTextStyle,
  loadingTextStyle,
} from '@/platform/themes/theme.styles.tsx';

import React from 'react';

interface LoadingOverlayProps {
  message?: string;
  subMessage?: string;
}

export const ThemedLoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Processing...',
  subMessage = 'Please wait while we process your request',
}) => {
  return (
    <div style={loadingOverlayStyle}>
      <div style={loadingContentStyle}>
        <ThemedLoadingSpinner size="sm" />
        <div style={loadingTextStyle}>{message}</div>
        {subMessage && <div style={loadingSubTextStyle}>{subMessage}</div>}
      </div>
    </div>
  );
};
