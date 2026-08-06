from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

BlockType = Literal[
    "title", "author", "tempo", "time_signature", "capo", "description", "chords", "sections", "videos", "labels",
    "custom",
]
Align = Literal["left", "center", "right"]

ROW_WIDTH_EIGHTHS = 8
CUSTOM_BLOCK_TYPE = "custom"


class GuitarSongLayoutBlockInput(BaseModel):
    """A custom block's title and rich text are edited later, from the song's own page --
    this input only places the block in the layout, so no content is required here."""

    block_type: BlockType
    width_eighths: int = Field(default=ROW_WIDTH_EIGHTHS, ge=1, le=ROW_WIDTH_EIGHTHS)
    zoom_percent: int = Field(default=100, ge=30, le=200)
    show_card: bool = False
    custom_title: Optional[str] = None
    custom_content_html: Optional[str] = None


class GuitarSongLayoutBlockContentUpdate(BaseModel):
    custom_title: Optional[str] = None
    custom_content_html: Optional[str] = None


def _non_custom_block_types(blocks: List[GuitarSongLayoutBlockInput]) -> List[BlockType]:
    return [b.block_type for b in blocks if b.block_type != CUSTOM_BLOCK_TYPE]


class GuitarSongLayoutColumnInput(BaseModel):
    blocks: List[GuitarSongLayoutBlockInput] = Field(min_length=1)
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
        non_custom = _non_custom_block_types(blocks)
        if len(non_custom) != len(set(non_custom)):
            raise ValueError("a block type cannot be used twice in the same column")
        return blocks


class GuitarSongLayoutRowInput(BaseModel):
    page_break_before: bool = False
    columns: List[GuitarSongLayoutColumnInput] = Field(min_length=1, max_length=ROW_WIDTH_EIGHTHS)

    @field_validator("columns")
    @classmethod
    def _check_widths_sum_to_row(cls, columns: List[GuitarSongLayoutColumnInput]) -> List[GuitarSongLayoutColumnInput]:
        total = sum(c.width_eighths for c in columns)
        if total != ROW_WIDTH_EIGHTHS:
            raise ValueError(f"column widths in a row must sum to exactly {ROW_WIDTH_EIGHTHS}/8, got {total}/8")
        all_non_custom = [block_type for c in columns for block_type in _non_custom_block_types(c.blocks)]
        if len(all_non_custom) != len(set(all_non_custom)):
            raise ValueError("a block type cannot be used twice in the same row")
        return columns


class GuitarSongLayoutBlockResponse(BaseModel):
    id: str
    block_type: BlockType
    width_eighths: int
    zoom_percent: int
    show_card: bool
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
