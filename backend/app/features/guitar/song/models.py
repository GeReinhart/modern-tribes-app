from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator

from app.features.guitar.song.layout.models import BlockChordResponse, GuitarSongLayoutResponse
from app.features.guitar.song.video.models import GuitarSongVideoResponse

ChordDiagramSize = Literal["xxs", "xs", "s", "m", "l", "xl", "xxl"]
GuitarSongState = Literal["draft", "completed"]
GuitarSongContentType = Literal["layout", "pdf"]


class GuitarSongCreate(BaseModel):
    title: str
    author: Optional[str] = None
    tempo_bpm: int = Field(default=120, ge=20, le=300)
    beats_per_bar: int = Field(default=4, ge=2, le=8)
    capo: int = Field(default=0, ge=0, le=12)
    chord_diagram_style: Literal["full", "simple"] = "full"
    chord_diagram_size: ChordDiagramSize = "m"
    lyrics_line_spacing_px: int = Field(default=10, ge=0, le=60)
    lyrics_text_size_px: int = Field(default=16, ge=8, le=40)
    lyrics_chord_size_px: int = Field(default=18, ge=8, le=40)
    description_html: Optional[str] = None
    template_song_id: Optional[str] = None
    copy_from_song_id: Optional[str] = None
    blank_layout: bool = False
    # A song's content mode is chosen once, here, and never changes afterward (see
    # song_lookup.require_layout_content_song). "pdf" replaces the whole row/column layout with a
    # single uploaded file, so it cannot be combined with anything that seeds a layout.
    content_type: GuitarSongContentType = "layout"
    pdf_file_url: Optional[str] = None
    pdf_file_name: Optional[str] = None
    pdf_file_size: Optional[int] = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _check_pdf_content(self) -> "GuitarSongCreate":
        if self.content_type != "pdf":
            return self
        if not self.pdf_file_url or not self.pdf_file_name:
            raise ValueError("a PDF song needs pdf_file_url and pdf_file_name")
        if self.template_song_id or self.blank_layout:
            raise ValueError("content_type 'pdf' cannot be combined with template_song_id or blank_layout")
        return self


class GuitarSongUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    tempo_bpm: Optional[int] = Field(default=None, ge=20, le=300)
    beats_per_bar: Optional[int] = Field(default=None, ge=2, le=8)
    capo: Optional[int] = Field(default=None, ge=0, le=12)
    chord_diagram_style: Optional[Literal["full", "simple"]] = None
    chord_diagram_size: Optional[ChordDiagramSize] = None
    lyrics_line_spacing_px: Optional[int] = Field(default=None, ge=0, le=60)
    lyrics_text_size_px: Optional[int] = Field(default=None, ge=8, le=40)
    lyrics_chord_size_px: Optional[int] = Field(default=None, ge=8, le=40)
    description_html: Optional[str] = None
    song_state: Optional[GuitarSongState] = None
    difficulty: Optional[int] = Field(default=None, ge=0, le=5)
    # Only meaningful for a PDF song (see song_lookup.require_layout_content_song) -- replaces the
    # currently uploaded file. content_type itself is never in this model: it's fixed at creation.
    pdf_file_url: Optional[str] = None
    pdf_file_name: Optional[str] = None
    pdf_file_size: Optional[int] = Field(default=None, ge=0)


class GuitarSongResponse(BaseModel):
    id: str
    url_param_id: str
    project_id: str
    title: str
    author: Optional[str] = None
    tempo_bpm: int
    beats_per_bar: int
    capo: int
    chord_diagram_style: str
    chord_diagram_size: str
    lyrics_line_spacing_px: int
    lyrics_text_size_px: int
    lyrics_chord_size_px: int
    document_id: Optional[str] = None
    description_html: str = ""
    label_ids: List[str] = []
    song_state: GuitarSongState
    difficulty: Optional[int] = None
    content_type: GuitarSongContentType = "layout"
    pdf_file_url: Optional[str] = None
    pdf_file_name: Optional[str] = None
    pdf_file_size: Optional[int] = None
    # The song's own deduplicated chord list's size, and how many of those chords are rated
    # difficult (4 or 5) -- computed, not stored. A chord with no difficulty rating counts
    # toward chord_count but not difficult_chord_count.
    chord_count: int = 0
    difficult_chord_count: int = 0
    # The current user's own private mastery rating for this song (see guitar_songs_mastery) --
    # null if they have never rated it. Never another user's rating.
    my_mastery: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class GuitarSongChordMove(BaseModel):
    direction: Literal["prev", "next"]


class GuitarSongDetailResponse(GuitarSongResponse):
    # The deduplicated union of every 'chords' block's own list -- see
    # layout.service.collect_song_chords_union -- used by the chord-grid and lyrics-word chord
    # pickers as "the song's own chord list".
    chords: List[BlockChordResponse]
    videos: List[GuitarSongVideoResponse]
    layout: GuitarSongLayoutResponse
