from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.features.guitar.chords.models import GuitarChordResponse

BlockType = Literal[
    "title", "author", "tempo", "time_signature", "capo", "description", "chords", "sections", "videos", "labels",
    "custom", "chord_grid",
]
Align = Literal["left", "center", "right"]
TitleHeadingLevel = Literal["h1", "h2", "h3", "h4", "h5"]
WordChordPosition = Literal["before", "start", "middle", "end", "after"]

ROW_WIDTH_TWELFTHS = 12
CUSTOM_BLOCK_TYPE = "custom"
CHORD_GRID_BLOCK_TYPE = "chord_grid"
SECTIONS_BLOCK_TYPE = "sections"
CHORDS_BLOCK_TYPE = "chords"
# A "Lyrics & Chords" block is repeatable since a song's parts (verse, chorus...) are each their
# own block, not one shared container -- same reason a custom block or a chord grid is repeatable:
# nothing about any of the three is a song-wide singleton, so a song may want more than one. A
# 'chords' block is repeatable for the same reason -- a song may want a "Main chords" block, an
# "Alternative chords" block, an "Outro chords" block, etc.; the song's own overall chord list is
# simply the deduplicated union of every 'chords' block's own list (see layout/service.py).
REPEATABLE_BLOCK_TYPES = {CUSTOM_BLOCK_TYPE, SECTIONS_BLOCK_TYPE, CHORD_GRID_BLOCK_TYPE, CHORDS_BLOCK_TYPE}
# title/author/tempo/time_signature/capo show the song's own value instead of a separate label,
# so they're the only block types with no editable title at all -- every other type shown here
# defaults to no title (or, for chords/videos/chord_grid, a translated heading) until named.
# Shared with pdf_blocks.py (its rendering needs the exact same set) and the frontend's
# layoutBlockOptions.ts (kept in sync by hand, same as every other backend/frontend enum pair).
TITLE_EDITABLE_BLOCK_TYPES = {
    CHORDS_BLOCK_TYPE, SECTIONS_BLOCK_TYPE, "videos", "labels", "description", CHORD_GRID_BLOCK_TYPE, CUSTOM_BLOCK_TYPE,
}
MAX_CHORD_GRID_ROWS = 30
MAX_CHORD_GRID_COLUMNS = 15
MIN_CHORD_GRID_CHORD_SIZE_PX = 8
MAX_CHORD_GRID_CHORD_SIZE_PX = 40
DEFAULT_CHORD_GRID_CHORD_SIZE_PX = 18
MAX_LYRICS_TEXT_LENGTH = 20_000


class LyricsWordInput(BaseModel):
    """One word (or an intentional empty slot, text='') of a lyrics-mode 'sections' block, as
    round-tripped by the client -- always the block's own last-known copy, resent unchanged
    alongside its lyrics_text on every row replace, so the server can carry chord attachments
    across an edit that has nothing to do with this block (see layout/lyrics_words.py)."""

    text: str = Field(max_length=200)
    chords: Dict[WordChordPosition, str] = Field(default_factory=dict)


class LyricsWordResponse(BaseModel):
    text: str
    chords: Dict[WordChordPosition, GuitarChordResponse] = Field(default_factory=dict)


class LyricsWordChordUpdate(BaseModel):
    chord_id: Optional[str] = None  # None detaches the chord from this position


def _check_lyrics_text_length(text: Optional[str]) -> Optional[str]:
    if text is not None and len(text) > MAX_LYRICS_TEXT_LENGTH:
        raise ValueError(f"lyrics text must not exceed {MAX_LYRICS_TEXT_LENGTH} characters")
    return text


class ChordGridCellItem(BaseModel):
    """One item in a cell's freely-ordered sequence -- a chord badge or a short text token
    (e.g. "x4") -- mixed and reordered by the user to read like "Em G x4"."""

    item_type: Literal["chord", "text"]
    chord_id: Optional[str] = None
    text: Optional[str] = Field(default=None, max_length=50)

    @model_validator(mode="after")
    def _check_payload_matches_type(self) -> "ChordGridCellItem":
        if self.item_type == "chord" and not self.chord_id:
            raise ValueError("a chord item must have a chord_id")
        if self.item_type == "text" and not self.text:
            raise ValueError("a text item must have non-empty text")
        return self


class ChordGridCell(BaseModel):
    border_top: bool = False
    border_right: bool = False
    border_bottom: bool = False
    border_left: bool = False
    items: List[ChordGridCellItem] = Field(default_factory=list)


class BlockChordInput(BaseModel):
    """One entry in a 'chords' block's own ordered chord list, as round-tripped by the client --
    order is the list's own order, so there is no separate position field."""

    chord_id: str
    comment: Optional[str] = None


class BlockChordResponse(BaseModel):
    chord_id: str
    chord: GuitarChordResponse
    comment: Optional[str] = None


def _check_no_duplicate_block_chords(chords: Optional[List[BlockChordInput]]) -> Optional[List[BlockChordInput]]:
    """The same chord can appear in more than one 'chords' block of a song (e.g. an outro reusing
    a main chord), but not twice within the same block's own list."""
    if chords is None:
        return chords
    chord_ids = [c.chord_id for c in chords]
    if len(chord_ids) != len(set(chord_ids)):
        raise ValueError("a chord cannot be listed twice in the same block")
    return chords


def _check_chord_grid_rows(
    rows: Optional[List[List[ChordGridCell]]],
) -> Optional[List[List[ChordGridCell]]]:
    """Every row must have the same number of columns -- a chord grid is a dense rectangle,
    never jagged."""
    if rows is None:
        return rows
    if len(rows) > MAX_CHORD_GRID_ROWS:
        raise ValueError(f"a chord grid cannot have more than {MAX_CHORD_GRID_ROWS} rows")
    if rows:
        column_count = len(rows[0])
        if column_count == 0 or column_count > MAX_CHORD_GRID_COLUMNS:
            raise ValueError(f"a chord grid must have between 1 and {MAX_CHORD_GRID_COLUMNS} columns")
        if any(len(row) != column_count for row in rows):
            raise ValueError("every row of a chord grid must have the same number of columns")
    return rows


class GuitarSongLayoutBlockInput(BaseModel):
    """A custom block's title and rich text (and a 'sections' block's lyrics/chords) are edited
    later, from the song's own page -- this input only places the block in the layout, so no
    content is required here. Content fields are still round-tripped, never left off: replace_row
    archives and recreates every block of a row on any edit, so the client resends each block's
    last-known content alongside it, unchanged, so content survives edits that have nothing to do
    with it (see layout/lyrics_words.py for how lyrics_text/lyrics_words stay in sync)."""

    block_type: BlockType
    width_twelfths: int = Field(default=ROW_WIDTH_TWELFTHS, ge=1, le=ROW_WIDTH_TWELFTHS)
    zoom_percent: int = Field(default=100, ge=30, le=200)
    show_card: bool = False
    title_heading_level: TitleHeadingLevel = "h3"
    padding_top_mm: float = Field(default=0, ge=0, le=100)
    padding_right_mm: float = Field(default=0, ge=0, le=100)
    padding_bottom_mm: float = Field(default=0, ge=0, le=100)
    padding_left_mm: float = Field(default=0, ge=0, le=100)
    custom_title: Optional[str] = None
    custom_content_html: Optional[str] = None
    chord_grid_rows: Optional[List[List[ChordGridCell]]] = None
    # 'chord_grid' blocks only -- font size of the chord name text in this table's own cells,
    # independent of the song-wide chord_diagram_size. Meaningless for every other block type,
    # which is why (unlike chord_grid_rows) it's never None -- every block has a starting value.
    chord_grid_chord_size_px: int = Field(
        default=DEFAULT_CHORD_GRID_CHORD_SIZE_PX, ge=MIN_CHORD_GRID_CHORD_SIZE_PX, le=MAX_CHORD_GRID_CHORD_SIZE_PX
    )
    # 'sections' blocks only -- NULL lyrics_text means the block hasn't been set up yet; NULL/
    # empty on a block that links to another via linked_to_block_id, which never stores content
    # of its own.
    lyrics_text: Optional[str] = None
    lyrics_words: Optional[List[List[LyricsWordInput]]] = None
    linked_to_block_id: Optional[str] = None
    # 'chords' blocks only -- this block's own ordered chord list. Stored directly on the block
    # (like chord_grid_rows) rather than in a separate table keyed by block id: replace_row
    # archives and recreates every block in a row on any edit at all, so content living on the
    # block itself survives that for free (the client resends it unchanged), while a separate
    # table's foreign key would dangle on every unrelated row edit.
    chords: Optional[List[BlockChordInput]] = None

    @field_validator("chord_grid_rows")
    @classmethod
    def _validate_chord_grid_rows(cls, rows):
        return _check_chord_grid_rows(rows)

    @field_validator("lyrics_text")
    @classmethod
    def _validate_lyrics_text(cls, text):
        return _check_lyrics_text_length(text)

    @field_validator("chords")
    @classmethod
    def _validate_chords(cls, chords):
        return _check_no_duplicate_block_chords(chords)


class GuitarSongLayoutBlockContentUpdate(BaseModel):
    custom_title: Optional[str] = None
    custom_content_html: Optional[str] = None
    chord_grid_rows: Optional[List[List[ChordGridCell]]] = None
    # 'chord_grid' blocks only -- 409 if sent for any other block type.
    chord_grid_chord_size_px: Optional[int] = Field(
        default=None, ge=MIN_CHORD_GRID_CHORD_SIZE_PX, le=MAX_CHORD_GRID_CHORD_SIZE_PX
    )
    # 'sections' blocks only -- 409 if sent for any other block type.
    lyrics_text: Optional[str] = None
    linked_to_block_id: Optional[str] = None
    # 'chords' blocks only -- 409 if sent for any other block type.
    chords: Optional[List[BlockChordInput]] = None

    @field_validator("chord_grid_rows")
    @classmethod
    def _validate_chord_grid_rows(cls, rows):
        return _check_chord_grid_rows(rows)

    @field_validator("lyrics_text")
    @classmethod
    def _validate_lyrics_text(cls, text):
        return _check_lyrics_text_length(text)

    @field_validator("chords")
    @classmethod
    def _validate_chords(cls, chords):
        return _check_no_duplicate_block_chords(chords)


def _uniqueness_constrained_block_types(blocks: List[GuitarSongLayoutBlockInput]) -> List[BlockType]:
    return [b.block_type for b in blocks if b.block_type not in REPEATABLE_BLOCK_TYPES]


class GuitarSongLayoutColumnInput(BaseModel):
    # A column may have no blocks at all -- it still occupies its share of the row's width, so
    # it works as a plain spacer that elements can be added to later.
    blocks: List[GuitarSongLayoutBlockInput] = Field(default_factory=list)
    width_twelfths: int = Field(ge=1, le=ROW_WIDTH_TWELFTHS)
    align: Align = "left"
    padding_top_mm: float = Field(default=0, ge=0, le=100)
    padding_right_mm: float = Field(default=0, ge=0, le=100)
    padding_bottom_mm: float = Field(default=0, ge=0, le=100)
    padding_left_mm: float = Field(default=0, ge=0, le=100)
    separator_left: bool = False
    separator_right: bool = False

    @field_validator("blocks")
    @classmethod
    def _check_no_duplicate_blocks_in_column(
        cls, blocks: List[GuitarSongLayoutBlockInput]
    ) -> List[GuitarSongLayoutBlockInput]:
        constrained = _uniqueness_constrained_block_types(blocks)
        if len(constrained) != len(set(constrained)):
            raise ValueError("a block type cannot be used twice in the same column")
        return blocks


class GuitarSongLayoutRowInput(BaseModel):
    page_break_before: bool = False
    columns: List[GuitarSongLayoutColumnInput] = Field(min_length=1, max_length=ROW_WIDTH_TWELFTHS)

    @field_validator("columns")
    @classmethod
    def _check_widths_fit_in_row(cls, columns: List[GuitarSongLayoutColumnInput]) -> List[GuitarSongLayoutColumnInput]:
        # Columns don't have to fill the row -- leftover width is left blank on purpose, so a
        # user can free up room now and add another column later without every existing column
        # having to shrink to make space.
        total = sum(c.width_twelfths for c in columns)
        if total > ROW_WIDTH_TWELFTHS:
            raise ValueError(
                f"column widths in a row must not exceed {ROW_WIDTH_TWELFTHS}/{ROW_WIDTH_TWELFTHS}, "
                f"got {total}/{ROW_WIDTH_TWELFTHS}"
            )
        all_constrained = [block_type for c in columns for block_type in _uniqueness_constrained_block_types(c.blocks)]
        if len(all_constrained) != len(set(all_constrained)):
            raise ValueError("a block type cannot be used twice in the same row")
        return columns


class GuitarSongLayoutBlockResponse(BaseModel):
    id: str
    block_type: BlockType
    width_twelfths: int
    zoom_percent: int
    show_card: bool
    title_heading_level: TitleHeadingLevel
    padding_top_mm: float
    padding_right_mm: float
    padding_bottom_mm: float
    padding_left_mm: float
    custom_title: Optional[str] = None
    custom_content_html: Optional[str] = None
    chord_grid_rows: Optional[List[List[ChordGridCell]]] = None
    chord_grid_chord_size_px: int
    # 'sections' blocks only. lyrics_text/lyrics_words are resolved from linked_to_block_id's
    # target when this block is a link -- linked_to_block_id itself always stays this block's own.
    # NULL lyrics_text means the block hasn't been set up yet (shows the setup picker); '' is a
    # deliberate, valid "configured but empty" state.
    lyrics_text: Optional[str] = None
    lyrics_words: Optional[List[List[LyricsWordResponse]]] = None
    linked_to_block_id: Optional[str] = None
    # 'chords' blocks only -- this block's own resolved chord list.
    chords: Optional[List[BlockChordResponse]] = None


class GuitarSongLayoutColumnResponse(BaseModel):
    id: str
    row_id: str
    position: int
    blocks: List[GuitarSongLayoutBlockResponse]
    width_twelfths: int
    align: Align
    padding_top_mm: float
    padding_right_mm: float
    padding_bottom_mm: float
    padding_left_mm: float
    separator_left: bool
    separator_right: bool
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class GuitarSongLayoutRowResponse(BaseModel):
    id: str
    song_id: str
    position: int
    page_break_before: bool
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    columns: List[GuitarSongLayoutColumnResponse]


class GuitarSongLayoutSettingsUpdate(BaseModel):
    margin_top_mm: Optional[float] = Field(default=None, ge=0, le=100)
    margin_right_mm: Optional[float] = Field(default=None, ge=0, le=100)
    margin_bottom_mm: Optional[float] = Field(default=None, ge=0, le=100)
    margin_left_mm: Optional[float] = Field(default=None, ge=0, le=100)


class GuitarSongLayoutSettingsResponse(BaseModel):
    id: str
    song_id: str
    margin_top_mm: float
    margin_right_mm: float
    margin_bottom_mm: float
    margin_left_mm: float
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class GuitarSongLayoutResponse(BaseModel):
    settings: GuitarSongLayoutSettingsResponse
    rows: List[GuitarSongLayoutRowResponse]
