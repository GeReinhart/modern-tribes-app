import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';

import React from 'react';

interface Props {
  loading: boolean;
  children: React.ReactNode;
}

// A spinner while a results page waits for its data, the page itself once it has arrived.
const ResultLoading: React.FC<Props> = ({ loading, children }) => (
  loading ? <ThemedLoadingSpinner size="md" className="py-6" /> : <>{children}</>
);

export default ResultLoading;
