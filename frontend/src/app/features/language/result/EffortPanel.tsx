import React from 'react';

import EffortChart from './EffortChart.tsx';
import ResultLoading from './ResultLoading.tsx';
import { useEffort } from './useEffort.ts';

interface Props {
  lessonId: string;
  userId?: string;
}

// The "Effort" results of one person: how much they answered each day, successes and errors.
const EffortPanel: React.FC<Props> = ({ lessonId, userId }) => {
  const { data, loading } = useEffort(lessonId, userId);

  return <ResultLoading loading={loading}><EffortChart days={data} /></ResultLoading>;
};

export default EffortPanel;
