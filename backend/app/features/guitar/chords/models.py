import re
from datetime import datetime
from typing import List, Optional, Union

from pydantic import BaseModel, field_validator

_ROOT_NOTE_RE = re.compile(r'^[A-G][#b]?$')


def _validate_frets(value: Optional[List[Union[int, str]]]) -> Optional[List[Union[int, str]]]:
    if value is None:
        return value
    if len(value) != 6:
        raise ValueError("frets must contain exactly 6 values, one per string")
    normalized: List[Union[int, str]] = []
    for fret in value:
        if isinstance(fret, str):
            if fret.upper() != "X":
                raise ValueError(f"invalid fret value: {fret!r}")
            normalized.append("X")
        elif isinstance(fret, int) and not isinstance(fret, bool):
            if not (0 <= fret <= 20):
                raise ValueError(f"fret must be between 0 and 20, got {fret}")
            normalized.append(fret)
        else:
            raise ValueError(f"invalid fret value: {fret!r}")
    return normalized


def _validate_root_note(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    value = value.strip()
    if not _ROOT_NOTE_RE.match(value):
        raise ValueError("root_note must be a note letter A-G optionally followed by # or b")
    return value


class GuitarChordCreate(BaseModel):
    name: str
    root_note: Optional[str] = None
    description: Optional[str] = None
    frets: List[Union[int, str]]

    _check_frets = field_validator("frets")(_validate_frets)
    _check_root_note = field_validator("root_note")(_validate_root_note)


class GuitarChordUpdate(BaseModel):
    name: Optional[str] = None
    root_note: Optional[str] = None
    description: Optional[str] = None
    frets: Optional[List[Union[int, str]]] = None
    status: Optional[str] = None

    _check_frets = field_validator("frets")(_validate_frets)
    _check_root_note = field_validator("root_note")(_validate_root_note)


class GuitarChordResponse(BaseModel):
    id: str
    name: str
    root_note: str
    description: Optional[str] = None
    frets: List[Union[int, str]]
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
