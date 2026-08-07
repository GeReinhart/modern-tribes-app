from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

BlockType = Literal[
    "title", "author", "tempo", "time_signature", "capo", "description", "chords", "sections", "videos", "labels",
    "custom",
]
Align = Literal["left", "center", "right"]
TitleHeadingLevel = Literal["h1", "h2", "h3", "h4"]

ROW_WIDTH_EIGHTHS = 8
CUSTOM_BLOCK_TYPE = "custom"
# Unlike every other non-custom block type, a song's sections are split across its own
# "Lyrics & Chords" blocks (each section picks which one it belongs to), so several may coexist.
REPEATABLE_BLOCK_TYPES = {CUSTOM_BLOCK_TYPE, "sections"}


class GuitarSongLayoutBlockInput(BaseModel):
    """A custom block's title and rich text are edited later, from the song's own page --
    this input only places the block in the layout, so no content is required here."""

    block_type: BlockType
    width_eighths: int = Field(default=ROW_WIDTH_EIGHTHS, ge=1, le=ROW_WIDTH_EIGHTHS)
    zoom_percent: int = Field(default=100, ge=30, le=200)
    show_card: bool = False
    title_heading_level: TitleHeadingLevel = "h3"
    custom_title: Optional[str] = None
    custom_content_html: Optional[str] = None


class GuitarSongLayoutBlockContentUpdate(BaseModel):
    custom_title: Optional[str] = None
    custom_content_html: Optional[str] = None


def _uniqueness_constrained_block_types(blocks: List[GuitarSongLayoutBlockInput]) -> List[BlockType]:
    return [b.block_type for b in blocks if b.block_type not in REPEATABLE_BLOCK_TYPES]


class GuitarSongLayoutColumnInput(BaseModel):
    # A column may have no blocks at all -- it still occupies its share of the row's width, so
    # it works as a plain spacer that elements can be added to later.
    blocks: List[GuitarSongLayoutBlockInput] = Field(default_factory=list)
    width_eighths: int = Field(ge=1, le=ROW_WIDTH_EIGHTHS)
    align: Align = "left"
    padding_top_mm: float = Field(default=0, ge=0, le=100)
    padding_right_mm: float = Field(default=0, ge=0, le=100)
    padding_bottom_mm: float = Field(default=0, ge=0, le=100)
    padding_left_mm: float = Field(default=0, ge=0, le=100)

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
    columns: List[GuitarSongLayoutColumnInput] = Field(min_length=1, max_length=ROW_WIDTH_EIGHTHS)

    @field_validator("columns")
    @classmethod
    def _check_widths_fit_in_row(cls, columns: List[GuitarSongLayoutColumnInput]) -> List[GuitarSongLayoutColumnInput]:
        # Columns don't have to fill the row -- leftover width is left blank on purpose, so a
        # user can free up room now and add another column later without every existing column
        # having to shrink to make space.
        total = sum(c.width_eighths for c in columns)
        if total > ROW_WIDTH_EIGHTHS:
            raise ValueError(f"column widths in a row must not exceed {ROW_WIDTH_EIGHTHS}/8, got {total}/8")
        all_constrained = [block_type for c in columns for block_type in _uniqueness_constrained_block_types(c.blocks)]
        if len(all_constrained) != len(set(all_constrained)):
            raise ValueError("a block type cannot be used twice in the same row")
        return columns


class GuitarSongLayoutBlockResponse(BaseModel):
    id: str
    block_type: BlockType
    width_eighths: int
    zoom_percent: int
    show_card: bool
    title_heading_level: TitleHeadingLevel
    custom_title: Optional[str] = None
    custom_content_html: Optional[str] = None


class GuitarSongLayoutColumnResponse(BaseModel):
    id: str
    row_id: str
    position: int
    blocks: List[GuitarSongLayoutBlockResponse]
    width_eighths: int
    align: Align
    padding_top_mm: float
    padding_right_mm: float
    padding_bottom_mm: float
    padding_left_mm: float
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
