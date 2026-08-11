from pydantic import BaseModel, Field


class GuitarSongMasterySet(BaseModel):
    mastery_level: int = Field(ge=0, le=5)


class GuitarSongMasteryResponse(BaseModel):
    my_mastery: int
