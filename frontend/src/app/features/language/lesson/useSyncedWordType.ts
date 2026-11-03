import { useEffect } from 'react';

import { WordColumnState } from './wordColumn.ts';

// A word and its translation always share the same part of speech -- a noun translates to a
// noun (see local_dictionary.py's word_type handling) -- so picking a type on either column
// must mirror it onto the other rather than letting the two diverge. Two one-directional
// effects, each a no-op once the values already match, keep this a stable two-way sync instead
// of a render loop.
export function useSyncedWordType(
  left: WordColumnState, setLeft: (next: WordColumnState) => void, leftLocked: boolean,
  right: WordColumnState | null, setRight: (next: WordColumnState) => void, rightLocked: boolean,
) {
  // A locked column (a reused, already-existing word in the add flow) shows a fixed fact read
  // from the dictionary, not a value to silently overwrite -- it may still drive the other,
  // unlocked column, just never the other way around. Neither column is ever locked while
  // editing an already-saved word in place, so both sync freely there.
  useEffect(() => {
    if (right && !rightLocked && right.wordType !== left.wordType) setRight({ ...right, wordType: left.wordType });
  }, [left.wordType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (right && !leftLocked && right.wordType !== left.wordType) setLeft({ ...left, wordType: right.wordType });
  }, [right?.wordType]); // eslint-disable-line react-hooks/exhaustive-deps
}
