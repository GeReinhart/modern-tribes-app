import { ChordDiagramSize, ChordDiagramStyle } from '../chords/ChordDiagram.tsx';
import { GuitarChord } from '../chords/types.ts';

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
  document_id: string | null;
  description_html: string;
  label_ids: string[];
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GuitarSongCreate {
  title: string;
  author?: string | null;
  tempo_bpm?: number;
  beats_per_bar?: number;
  capo?: number;
  chord_diagram_style?: ChordDiagramStyle;
  chord_diagram_size?: ChordDiagramSize;
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
  description_html?: string | null;
}

export interface GuitarSongChord {
  id: string;
  song_id: string;
  position: number;
  comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  chord: GuitarChord;
}

export interface GuitarSongDetail extends GuitarSong {
  chords: GuitarSongChord[];
  sections: GuitarSongSection[];
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
  | 'custom';

export type LayoutAlign = 'left' | 'center' | 'right';

export const LAYOUT_ROW_WIDTH_EIGHTHS = 8;

export interface GuitarSongLayoutBlock {
  id: string;
  block_type: LayoutBlockType;
  width_eighths: number;
  zoom_percent: number;
  show_card: boolean;
  custom_title: string | null;
  custom_content_html: string | null;
}

export interface GuitarSongLayoutBlockContentUpdate {
  custom_title?: string | null;
  custom_content_html?: string | null;
}

export interface GuitarSongLayoutColumn {
  id: string;
  row_id: string;
  position: number;
  blocks: GuitarSongLayoutBlock[];
  width_eighths: number;
  align: LayoutAlign;
  padding_top_mm: number;
  padding_right_mm: number;
  padding_bottom_mm: number;
  padding_left_mm: number;
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
  width_eighths?: number;
  zoom_percent?: number;
  show_card?: boolean;
  custom_title?: string | null;
  custom_content_html?: string | null;
}

export interface GuitarSongLayoutColumnInput {
  blocks: GuitarSongLayoutBlockInput[];
  width_eighths: number;
  align: LayoutAlign;
  padding_top_mm?: number;
  padding_right_mm?: number;
  padding_bottom_mm?: number;
  padding_left_mm?: number;
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

export interface GuitarSongChordCreate {
  chord_id: string;
  comment?: string | null;
}

export interface GuitarSongChordUpdate {
  comment?: string | null;
}

export type MoveDirection = 'prev' | 'next';

export type SectionContentMode = 'lyrics' | 'chords_only';

export type WordChordPosition = 'before' | 'start' | 'middle' | 'end' | 'after';

export interface GuitarSongSectionWord {
  id: string;
  line_index: number;
  word_index: number;
  text: string;
  chord_before: GuitarChord | null;
  chord_start: GuitarChord | null;
  chord_middle: GuitarChord | null;
  chord_end: GuitarChord | null;
  chord_after: GuitarChord | null;
}

export interface GuitarSongSectionChord {
  id: string;
  section_id: string;
  position: number;
  chord: GuitarChord;
}

export interface GuitarSongSection {
  id: string;
  song_id: string;
  position: number;
  type_label: string;
  custom_label: string | null;
  display_label: string;
  content_mode: SectionContentMode;
  lyrics_text: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  words: GuitarSongSectionWord[];
  chords: GuitarSongSectionChord[];
}

export interface GuitarSongSectionCreate {
  type_label: string;
  custom_label?: string | null;
  content_mode: SectionContentMode;
}

export interface GuitarSongSectionUpdate {
  type_label?: string;
  custom_label?: string | null;
}

export interface GuitarSongSectionLyricsUpdate {
  text: string;
}

export interface GuitarSongSectionWordChordUpdate {
  chord_id: string | null;
}

export interface GuitarSongSectionChordCreate {
  chord_id: string;
}

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
