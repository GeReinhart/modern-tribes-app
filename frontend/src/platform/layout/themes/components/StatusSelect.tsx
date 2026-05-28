import { ThemedSelect } from '@/platform/layout/themes/components/ThemedSelect.tsx';

import React from 'react';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
];

interface StatusSelectProps {
  status: string;
  onChange: (status: string) => void;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  status,
  onChange,
}) => (
  <div onClick={(e) => e.stopPropagation()}>
    <ThemedSelect
      value={status}
      onChange={onChange}
      options={STATUS_OPTIONS}
      allowEmpty={false}
    />
  </div>
);
