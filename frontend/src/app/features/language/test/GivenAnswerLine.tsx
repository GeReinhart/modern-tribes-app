import React from 'react';

import { CORRECT_COLOR, WRONG_COLOR } from './attemptColors.ts';
import { DiffSegment, diffLetters } from './letterDiff.ts';

interface Props {
  given: string;
  solution: string;
  correct: boolean;
  // Mark the extra and missing letters of a close wrong answer (typed answers only).
  compareLetters: boolean;
}

const renderSegment = (segment: DiffSegment, index: number) => {
  if (segment.kind === 'extra') return <del key={index}>{segment.text}</del>;
  if (segment.kind === 'missing') return <ins key={index} style={{ fontWeight: 700 }}>{segment.text}</ins>;
  return <span key={index}>{segment.text}</span>;
};

// The answer the user gave: green when right, orange when wrong -- with, for a close typed answer,
// its extra letters struck through and the missing ones inserted in bold underline.
const GivenAnswerLine: React.FC<Props> = ({ given, solution, correct, compareLetters }) => {
  const segments = !correct && compareLetters ? diffLetters(given, solution) : null;

  return (
    <span style={{ color: correct ? CORRECT_COLOR : WRONG_COLOR, fontSize: 'var(--font-lg)' }}>
      {segments ? segments.map(renderSegment) : given}
    </span>
  );
};

export default GivenAnswerLine;
