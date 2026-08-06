import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.layout.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/layout/update_layout_block_content.feature"


@scenario(FEATURE, "PATCH a custom block's title and content — both update without touching the layout row")
def test_update_custom_block_content():
    pass


@scenario(FEATURE, "PATCH a chord grid's title, comment and grid — all update")
def test_update_chord_grid_content():
    pass


@scenario(FEATURE, "PATCH a chord grid referencing a chord that exists in the shared inventory — it resolves for display")
def test_update_chord_grid_resolves_chord_from_inventory():
    pass


@scenario(FEATURE, "PATCH a 'chords' block's list — chords are saved in order, each with its own comment")
def test_update_chords_block_list():
    pass


@scenario(FEATURE, "PATCH a 'chords' block with the same chord twice in its own list — 422, nothing changes")
def test_update_chords_block_duplicate_chord_rejected():
    pass


@scenario(FEATURE, "PATCH the chords of a non-'chords' block — 409 and nothing changes")
def test_update_chords_on_non_chords_block_is_rejected():
    pass


@scenario(FEATURE, "PATCH a chord grid with a jagged grid — 422 and nothing changes")
def test_update_chord_grid_jagged_rows():
    pass


@scenario(FEATURE, "PATCH a chord grid's chord size alone — it updates without touching the grid or title")
def test_update_chord_grid_chord_size():
    pass


@scenario(FEATURE, "PATCH chord_grid_chord_size_px on a non-chord-grid block — 409 and nothing changes")
def test_update_chord_grid_chord_size_on_non_chord_grid_block_is_rejected():
    pass


@scenario(FEATURE, "PATCH a chord grid's chord size out of range — 422 and nothing changes")
def test_update_chord_grid_chord_size_out_of_range():
    pass


@scenario(FEATURE, "PATCH the content of a non-custom block — 409 and nothing changes")
def test_update_non_custom_block_content():
    pass


@scenario(FEATURE, "PATCH a 'sections' block's title on its own — no need to also send its content")
def test_update_sections_block_title_alone():
    pass


@scenario(FEATURE, "PATCH a title on a block type with no title of its own — 409 and nothing changes")
def test_update_title_on_non_titleable_block_is_rejected():
    pass


@scenario(FEATURE, "PATCH a 'sections' block's lyrics — its lyrics_words are tokenized")
def test_update_sections_block_lyrics():
    pass


@scenario(FEATURE, "PATCH a 'sections' block to link to another — its content resolves from the target")
def test_link_sections_block_to_another():
    pass


@scenario(FEATURE, "PATCH a 'sections' block to link to a block that is itself a link — 422 and nothing changes")
def test_link_sections_block_to_a_link_is_rejected():
    pass


@scenario(FEATURE, "PATCH a 'sections' block to link to itself — 422 and nothing changes")
def test_link_sections_block_to_itself_is_rejected():
    pass


@scenario(FEATURE, "PATCH lyrics_text on a non-'sections' block — 409 and nothing changes")
def test_update_lyrics_on_non_sections_block_is_rejected():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
