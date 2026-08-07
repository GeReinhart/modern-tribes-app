from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

from app.features.guitar.chords.models import GuitarChordResponse

ContentMode = Literal["lyrics", "chords_only"]
WordChordPosition = Literal["before", "start", "middle", "end", "after"]


class GuitarSongSectionCreate(BaseModel):
    type_label: str
    custom_label: Optional[str] = None
    content_mode: ContentMode = "lyrics"
    # Which "Lyrics & Chords" layout block this section belongs to -- only meaningful once a
    # song has more than one; left None it's simply unassigned.
    layout_block_id: Optional[str] = None
    # Makes this section a live mirror of another (non-linked) section of the same song -- its
    # lyrics/chords are always read from, and edited through to, the linked section, so several
    # identical refrains only need typing once. Only settable at creation time.
    linked_to_section_id: Optional[str] = None


class GuitarSongSectionUpdate(BaseModel):
    type_label: Optional[str] = None
    custom_label: Optional[str] = None
    layout_block_id: Optional[str] = None


class GuitarSongSectionLyricsUpdate(BaseModel):
    text: str


class GuitarSongSectionWordChordUpdate(BaseModel):
    chord_id: Optional[str] = None  # None detaches the chord from this position


class GuitarSongSectionWordResponse(BaseModel):
    id: str
    line_index: int
    word_index: int
    text: str
    chord_before: Optional[GuitarChordResponse] = None
    chord_start: Optional[GuitarChordResponse] = None
    chord_middle: Optional[GuitarChordResponse] = None
    chord_end: Optional[GuitarChordResponse] = None
    chord_after: Optional[GuitarChordResponse] = None


class GuitarSongSectionChordCreate(BaseModel):
    chord_id: str


class GuitarSongSectionChordResponse(BaseModel):
    id: str
    section_id: str
    position: int
    chord: GuitarChordResponse


class GuitarSongSectionResponse(BaseModel):
    id: str
    song_id: str
    position: int
    type_label: str
    custom_label: Optional[str] = None
    display_label: str
    content_mode: ContentMode
    lyrics_text: Optional[str] = None
    layout_block_id: Optional[str] = None
    linked_to_section_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    words: List[GuitarSongSectionWordResponse] = []
    chords: List[GuitarSongSectionChordResponse] = []
