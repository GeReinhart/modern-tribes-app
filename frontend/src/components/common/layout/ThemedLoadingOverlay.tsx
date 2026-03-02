import React from 'react';
import {
    loadingOverlayStyle,
    loadingContentStyle,
    loadingTextStyle,
    loadingSubTextStyle,
} from '@/styles/theme.styles.tsx';
import {ThemedLoadingSpinner} from "@/components/common/layout/ThemedLoadingSpinner.tsx";

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
                <ThemedLoadingSpinner size="sm"  />
                <div style={loadingTextStyle}>{message}</div>
                {subMessage && <div style={loadingSubTextStyle}>{subMessage}</div>}
            </div>
        </div>
    );
};