import { ChordDiagramSize, ChordDiagramStyle } from '../chords/ChordDiagram.tsx';
import { GuitarChord } from '../chords/types.ts';

export enum GuitarSongState {
  draft = 'draft',
  completed = 'completed',
}

export interface GuitarSong {
  id: string;
  url_param_id: string;
  project_id: string;
  title: string;
  author: string | null;
  tempo_bpm: number;
  beats_per_bar: number;
  capo: number;
  chord_diagram_style: ChordDiagramStyle;
  chord_diagram_size: ChordDiagramSize;
  lyrics_line_spacing_px: number;
  lyrics_text_size_px: number;
  lyrics_chord_size_px: number;
  document_id: string | null;
  description_html: string;
  label_ids: string[];
  song_state: GuitarSongState;
  difficulty: number | null;
  chord_count: number;
  difficult_chord_count: number;
  my_mastery: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GuitarSongListFilters {
  q?: string;
  labelIds?: string[];
  songStates?: GuitarSongState[];
  difficulties?: number[];
  masteries?: number[];
}

export interface GuitarSongCreate {
  title: string;
  author?: string | null;
  tempo_bpm?: number;
  beats_per_bar?: number;
  capo?: number;
  chord_diagram_style?: ChordDiagramStyle;
  chord_diagram_size?: ChordDiagramSize;
  lyrics_line_spacing_px?: number;
  lyrics_text_size_px?: number;
  lyrics_chord_size_px?: number;
  description_html?: string | null;
  template_song_id?: string | null;
  copy_from_song_id?: string | null;
  blank_layout?: boolean;
}

export interface GuitarSongUpdate {
  title?: string;
  author?: string | null;
  tempo_bpm?: number;
  beats_per_bar?: number;
  capo?: number;
  chord_diagram_style?: ChordDiagramStyle;
  chord_diagram_size?: ChordDiagramSize;
  lyrics_line_spacing_px?: number;
  lyrics_text_size_px?: number;
  lyrics_chord_size_px?: number;
  description_html?: string | null;
  song_state?: GuitarSongState;
  difficulty?: number | null;
}

// One entry of a 'chords' block's own chord list (or, for GuitarSongDetail.chords, the
// deduplicated union of every 'chords' block's own list -- see collect_song_chords_union on the
// backend). Order is the list's own order; there is no separate position field.
export interface GuitarSongChord {
  chord_id: string;
  chord: GuitarChord;
  comment: string | null;
}

export interface BlockChordInput {
  chord_id: string;
  comment?: string | null;
}

export interface GuitarSongDetail extends GuitarSong {
  chords: GuitarSongChord[];
  videos: GuitarSongVideo[];
  layout: GuitarSongLayout;
}

export type LayoutBlockType =
  | 'title'
  | 'author'
  | 'tempo'
  | 'time_signature'
  | 'capo'
  | 'description'
  | 'chords'
  | 'sections'
  | 'videos'
  | 'labels'
  | 'custom'
  | 'chord_grid';

export type LayoutAlign = 'left' | 'center' | 'right';
export type TitleHeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5';

export const LAYOUT_ROW_WIDTH_TWELFTHS = 12;

export type ChordGridCellItemType = 'chord' | 'text';

export interface ChordGridCellItem {
  item_type: ChordGridCellItemType;
  chord_id: string | null;
  text: string | null;
}

export interface ChordGridCell {
  border_top: boolean;
  border_right: boolean;
  border_bottom: boolean;
  border_left: boolean;
  items: ChordGridCellItem[];
}

export type WordChordPosition = 'before' | 'start' | 'middle' | 'end' | 'after';

// One word (or an intentional empty slot, text: '') of a lyrics-mode 'sections' block, identified
// by its position in the nested lyrics_words array (line index, then word index within that
// line) rather than by its own id -- the server always re-derives this structure from lyrics_text.
export interface GuitarSongLyricsWord {
  text: string;
  chords: Partial<Record<WordChordPosition, GuitarChord>>;
}

// The input-side counterpart, round-tripped back on every row replace so content survives edits
// that have nothing to do with it (see layoutDraft.ts) -- chords are plain ids here, not
// resolved GuitarChord objects.
export interface GuitarSongLyricsWordInput {
  text: string;
  chords: Partial<Record<WordChordPosition, string>>;
}

export interface GuitarSongLayoutBlock {
  id: string;
  block_type: LayoutBlockType;
  width_twelfths: number;
  zoom_percent: number;
  show_card: boolean;
  title_heading_level: TitleHeadingLevel;
  padding_top_mm: number;
  padding_right_mm: number;
  padding_bottom_mm: number;
  padding_left_mm: number;
  custom_title: string | null;
  custom_content_html: string | null;
  chord_grid_rows: ChordGridCell[][] | null;
  // 'chord_grid' blocks only -- font size of the chord name text in this table's own cells,
  // independent of the song-wide chord_diagram_size. Meaningless for every other block type.
  chord_grid_chord_size_px: number;
  // 'sections' blocks only. lyrics_text/lyrics_words are resolved from linked_to_block_id's
  // target when this block mirrors another -- linked_to_block_id itself always stays this
  // block's own. NULL lyrics_text means the block hasn't been set up yet (shows the setup
  // picker); '' is a deliberate, valid "configured but empty" state.
  lyrics_text: string | null;
  lyrics_words: GuitarSongLyricsWord[][] | null;
  linked_to_block_id: string | null;
  // 'chords' blocks only -- this block's own resolved chord list.
  chords: GuitarSongChord[] | null;
}

export interface GuitarSongLayoutBlockContentUpdate {
  custom_title?: string | null;
  custom_content_html?: string | null;
  chord_grid_rows?: ChordGridCell[][] | null;
  // 'chord_grid' blocks only.
  chord_grid_chord_size_px?: number;
  lyrics_text?: string | null;
  linked_to_block_id?: string | null;
  // 'chords' blocks only.
  chords?: BlockChordInput[] | null;
}

export interface GuitarSongLyricsWordChordUpdate {
  chord_id: string | null;
}

export interface GuitarSongLayoutColumn {
  id: string;
  row_id: string;
  position: number;
  blocks: GuitarSongLayoutBlock[];
  width_twelfths: number;
  align: LayoutAlign;
  padding_top_mm: number;
  padding_right_mm: number;
  padding_bottom_mm: number;
  padding_left_mm: number;
  separator_left: boolean;
  separator_right: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GuitarSongLayoutRow {
  id: string;
  song_id: string;
  position: number;
  page_break_before: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  columns: GuitarSongLayoutColumn[];
}

export interface GuitarSongLayoutSettings {
  id: string;
  song_id: string;
  margin_top_mm: number;
  margin_right_mm: number;
  margin_bottom_mm: number;
  margin_left_mm: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GuitarSongLayout {
  settings: GuitarSongLayoutSettings;
  rows: GuitarSongLayoutRow[];
}

export interface GuitarSongLayoutBlockInput {
  block_type: LayoutBlockType;
  width_twelfths?: number;
  zoom_percent?: number;
  show_card?: boolean;
  title_heading_level?: TitleHeadingLevel;
  padding_top_mm?: number;
  padding_right_mm?: number;
  padding_bottom_mm?: number;
  padding_left_mm?: number;
  custom_title?: string | null;
  custom_content_html?: string | null;
  chord_grid_rows?: ChordGridCell[][] | null;
  chord_grid_chord_size_px?: number;
  lyrics_text?: string | null;
  lyrics_words?: GuitarSongLyricsWordInput[][] | null;
  linked_to_block_id?: string | null;
  // 'chords' blocks only -- round-tripped unchanged on every row replace, exactly like
  // chord_grid_rows, so content survives edits that have nothing to do with it.
  chords?: BlockChordInput[] | null;
}

export interface GuitarSongLayoutColumnInput {
  blocks: GuitarSongLayoutBlockInput[];
  width_twelfths: number;
  align: LayoutAlign;
  padding_top_mm?: number;
  padding_right_mm?: number;
  padding_bottom_mm?: number;
  padding_left_mm?: number;
  separator_left?: boolean;
  separator_right?: boolean;
}

export interface GuitarSongLayoutRowInput {
  page_break_before: boolean;
  columns: GuitarSongLayoutColumnInput[];
}

export interface GuitarSongLayoutSettingsUpdate {
  margin_top_mm?: number;
  margin_right_mm?: number;
  margin_bottom_mm?: number;
  margin_left_mm?: number;
}

export type MoveDirection = 'prev' | 'next';

export interface GuitarSongAuthor {
  id: string;
  project_id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GuitarSongVideo {
  id: string;
  song_id: string;
  title: string | null;
  url: string;
  position: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GuitarSongVideoCreate {
  title?: string | null;
  url: string;
}

export interface GuitarSongVideoUpdate {
  title?: string | null;
  url?: string;
}

export interface GuitarSongLabel {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface GuitarSongLabelCreate {
  name: string;
  color?: string;
}

export interface GuitarSongLabelUpdate {
  name?: string;
  color?: string;
}
