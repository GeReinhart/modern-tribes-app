from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.features.guitar.song.layout.models import BlockChordResponse, GuitarSongLayoutResponse
from app.features.guitar.song.video.models import GuitarSongVideoResponse

ChordDiagramSize = Literal["xxs", "xs", "s", "m", "l", "xl", "xxl"]


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
