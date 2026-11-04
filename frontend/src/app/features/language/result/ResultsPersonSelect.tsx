import { useAuth } from '@/app/platform/core/authentication/AuthContext.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ResultMember } from './types.ts';

interface Props {
  members: ResultMember[];
  selectedUserId?: string;
  onChange: (userId: string | undefined) => void;
}

// Picks the project member whose results are shown; `undefined` stands for the signed-in user.
const ResultsPersonSelect: React.FC<Props> = ({ members, selectedUserId, onChange }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (members.length === 0) return null;

  return (
    <ThemedSelect
      label={t('features.language.resultsPerson')}
      options={members.map((m) => ({ value: m.user_id, label: m.name }))}
      value={selectedUserId ?? user?.id}
      allowEmpty={false}
      onChange={(userId) => onChange(userId === user?.id ? undefined : userId)}
    />
  );
};

export default ResultsPersonSelect;
