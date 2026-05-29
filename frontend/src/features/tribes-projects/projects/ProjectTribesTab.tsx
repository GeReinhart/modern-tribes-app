import { ThemedBadge } from '@/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedCard } from '@/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import { PositionEnum } from '@/types/position.types.ts';
import { ProjectTribeWithMembers } from '@/types/queries/projects.query.types.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChevronDown, ChevronRight } from 'lucide-react';

type BadgeVariant = 'primary' | 'accent' | 'ghost';

const POSITION_VARIANT: Record<string, BadgeVariant> = {
  manager: 'accent',
  member: 'primary',
  guest: 'ghost',
};

interface MemberTribeEntry {
  tribe_id: string;
  tribe_name: string;
  position: PositionEnum;
}

interface ProjectMemberWithTribes {
  person_id: string;
  first_name: string;
  last_name: string;
  tribes: MemberTribeEntry[];
}

function toMemberOriented(
  tribes: ProjectTribeWithMembers[],
): ProjectMemberWithTribes[] {
  const memberMap = new Map<string, ProjectMemberWithTribes>();
  for (const tribe of tribes) {
    for (const member of tribe.members) {
      if (!memberMap.has(member.person_id)) {
        memberMap.set(member.person_id, {
          person_id: member.person_id,
          first_name: member.first_name,
          last_name: member.last_name,
          tribes: [],
        });
      }
      memberMap.get(member.person_id)!.tribes.push({
        tribe_id: tribe.tribe_id,
        tribe_name: tribe.tribe_name,
        position: member.position,
      });
    }
  }
  return Array.from(memberMap.values()).sort(
    (a, b) =>
      a.last_name.localeCompare(b.last_name) ||
      a.first_name.localeCompare(b.first_name),
  );
}

const MemberTribesCard: React.FC<{ member: ProjectMemberWithTribes }> = ({
  member,
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
          {member.first_name} {member.last_name}
        </ThemedText>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemedText variant="secondary" size="small">
            {t('tribes.tribesCount', { count: member.tribes.length })}
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
          {member.tribes.map((tribe) => (
            <div
              key={tribe.tribe_id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <ThemedText variant="primary" size="small">
                {tribe.tribe_name}
              </ThemedText>
              <ThemedBadge
                variant={POSITION_VARIANT[tribe.position] ?? 'ghost'}
              >
                {t(`positions.${tribe.position}`)}
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
  const members = toMemberOriented(tribes);

  if (members.length === 0) {
    return (
      <ThemedText variant="secondary" size="small">
        {t('projects.noTribesLinked')}
      </ThemedText>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {members.map((member) => (
        <MemberTribesCard key={member.person_id} member={member} />
      ))}
    </div>
  );
};
