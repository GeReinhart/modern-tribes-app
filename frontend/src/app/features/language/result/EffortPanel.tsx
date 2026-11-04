import React from 'react';

import EffortChart from './EffortChart.tsx';
import { useEffort } from './useEffort.ts';

interface Props {
  lessonId: string;
  userId?: string;
}

// The "Effort" results of one person: how much they answered each day, successes and errors.
const EffortPanel: React.FC<Props> = ({ lessonId, userId }) => <EffortChart days={useEffort(lessonId, userId)} />;

export default EffortPanel;
