export type DiffKind = 'same' | 'extra' | 'missing';

export interface DiffSegment {
  kind: DiffKind;
  text: string;
}

const MIN_DISTANCE = 1;
const MAX_DISTANCE = 3;

// How many letters may differ for a wrong answer to count as "close": a third of the solution's length.
export const closeDistance = (solution: string): number =>
  Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, Math.floor(solution.length / 3)));

// The Levenshtein table between two letter lists (comparison ignores the case).
function distanceTable(given: string[], solution: string[]): number[][] {
  const table = Array.from({ length: given.length + 1 }, (_, i) => [i, ...Array(solution.length).fill(0)]);
  for (let j = 1; j <= solution.length; j += 1) table[0][j] = j;
  for (let i = 1; i <= given.length; i += 1) {
    for (let j = 1; j <= solution.length; j += 1) {
      const same = given[i - 1].toLowerCase() === solution[j - 1].toLowerCase();
      table[i][j] = Math.min(table[i - 1][j] + 1, table[i][j - 1] + 1, table[i - 1][j - 1] + (same ? 0 : 1));
    }
  }
  return table;
}

// Walks the table back from the end to tell, letter by letter, what is shared, extra or missing.
function backtrace(given: string[], solution: string[], table: number[][]): DiffSegment[] {
  const reversed: DiffSegment[] = [];
  let [i, j] = [given.length, solution.length];
  while (i > 0 || j > 0) {
    const here = table[i][j];
    const diagonal = i > 0 && j > 0 ? table[i - 1][j - 1] : Infinity;
    if (i > 0 && j > 0 && diagonal === here && given[i - 1].toLowerCase() === solution[j - 1].toLowerCase()) {
      reversed.push({ kind: 'same', text: given[i - 1] });
      [i, j] = [i - 1, j - 1];
    } else if (i > 0 && j > 0 && diagonal + 1 === here) {
      reversed.push({ kind: 'missing', text: solution[j - 1] }, { kind: 'extra', text: given[i - 1] });
      [i, j] = [i - 1, j - 1];
    } else if (i > 0 && table[i - 1][j] + 1 === here) {
      reversed.push({ kind: 'extra', text: given[i - 1] });
      i -= 1;
    } else {
      reversed.push({ kind: 'missing', text: solution[j - 1] });
      j -= 1;
    }
  }
  return reversed.reverse();
}

function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  return segments.reduce<DiffSegment[]>((merged, segment) => {
    const last = merged[merged.length - 1];
    if (last && last.kind === segment.kind) last.text += segment.text;
    else merged.push({ ...segment });
    return merged;
  }, []);
}

// The given word with its extra letters and the solution's missing letters marked, or null when the
// two words are identical or too far apart for the comparison to help.
export function diffLetters(given: string, solution: string): DiffSegment[] | null {
  const [givenLetters, solutionLetters] = [Array.from(given), Array.from(solution)];
  const table = distanceTable(givenLetters, solutionLetters);
  const distance = table[givenLetters.length][solutionLetters.length];
  if (distance === 0 || distance > closeDistance(solution)) return null;
  return mergeSegments(backtrace(givenLetters, solutionLetters, table));
}
