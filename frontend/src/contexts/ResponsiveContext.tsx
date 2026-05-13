import React, { createContext, useContext, ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveContextType {
    isMobile: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isMobile } = useResponsive();
    return (
        <ResponsiveContext.Provider value={{ isMobile }}>
            {children}
        </ResponsiveContext.Provider>
    );
};

export const useResponsiveContext = (): ResponsiveContextType => {
    const context = useContext(ResponsiveContext);
    if (!context) {
        throw new Error('useResponsiveContext must be used within a ResponsiveProvider');
    }
    return context;
};
