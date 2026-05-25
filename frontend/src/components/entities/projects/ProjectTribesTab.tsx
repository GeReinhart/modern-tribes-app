import { ThemedBadge } from '@/components/common/layout/ThemedBadge';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ProjectTribeWithMembers } from '@/types/queries/projects.query.types';

import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

type BadgeVariant = 'primary' | 'accent' | 'ghost';

const POSITION_VARIANT: Record<string, BadgeVariant> = {
  manager: 'accent',
  member: 'primary',
  guest: 'ghost',
};

const TribeMembersCard: React.FC<{ tribe: ProjectTribeWithMembers }> = ({
  tribe,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <ThemedCard variant="primary" bordered>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 0,
        }}
      >
        <ThemedText variant="primary" size="medium" as="span">
          {tribe.tribe_name}
        </ThemedText>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemedText variant="secondary" size="small">
            {t('tribes.membersCount', { count: tribe.members.length })}
          </ThemedText>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {expanded && (
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {tribe.members.map((member) => (
            <div
              key={member.person_id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <ThemedText variant="primary" size="small">
                {member.first_name} {member.last_name}
              </ThemedText>
              <ThemedBadge variant={POSITION_VARIANT[member.position] ?? 'ghost'}>
                {t(`positions.${member.position}`)}
              </ThemedBadge>
            </div>
          ))}
        </div>
      )}
    </ThemedCard>
  );
};

interface ProjectTribesTabProps {
  tribes: ProjectTribeWithMembers[];
}

export const ProjectTribesTab: React.FC<ProjectTribesTabProps> = ({
  tribes,
}) => {
  const { t } = useTranslation();

  if (tribes.length === 0) {
    return (
      <ThemedText variant="secondary" size="small">
        {t('projects.noTribesLinked')}
      </ThemedText>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {tribes.map((tribe) => (
        <TribeMembersCard key={tribe.tribe_id} tribe={tribe} />
      ))}
    </div>
  );
};
