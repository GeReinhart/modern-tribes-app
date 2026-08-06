from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.features.guitar.chords.models import GuitarChordResponse
from app.features.guitar.song.layout.models import GuitarSongLayoutResponse
from app.features.guitar.song.sections.models import GuitarSongSectionResponse
from app.features.guitar.song.video.models import GuitarSongVideoResponse

ChordDiagramSize = Literal["very_small", "small", "medium", "large"]


class GuitarSongCreate(BaseModel):
    title: str
    author: Optional[str] = None
    tempo_bpm: int = Field(default=120, ge=20, le=300)
    beats_per_bar: int = Field(default=4, ge=2, le=8)
    capo: int = Field(default=0, ge=0, le=12)
    chord_diagram_style: Literal["full", "simple"] = "full"
    chord_diagram_size: ChordDiagramSize = "medium"
    description_html: Optional[str] = None
    template_song_id: Optional[str] = None


class GuitarSongUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    tempo_bpm: Optional[int] = Field(default=None, ge=20, le=300)
    beats_per_bar: Optional[int] = Field(default=None, ge=2, le=8)
    capo: Optional[int] = Field(default=None, ge=0, le=12)
    chord_diagram_style: Optional[Literal["full", "simple"]] = None
    chord_diagram_size: Optional[ChordDiagramSize] = None
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
    document_id: Optional[str] = None
    description_html: str = ""
    label_ids: List[str] = []
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class GuitarSongChordCreate(BaseModel):
    chord_id: str
    comment: Optional[str] = None


class GuitarSongChordUpdate(BaseModel):
    comment: Optional[str] = None


class GuitarSongChordMove(BaseModel):
    direction: Literal["prev", "next"]


class GuitarSongChordResponse(BaseModel):
    id: str
    song_id: str
    position: int
    comment: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    chord: GuitarChordResponse


class GuitarSongDetailResponse(GuitarSongResponse):
    chords: List[GuitarSongChordResponse]
    sections: List[GuitarSongSectionResponse]
    videos: List[GuitarSongVideoResponse]
    layout: GuitarSongLayoutResponse
