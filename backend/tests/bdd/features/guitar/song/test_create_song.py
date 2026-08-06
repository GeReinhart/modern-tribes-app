import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/guitar/song/create_song.feature"


@scenario(FEATURE, "POST a song as a project member — the song is created with defaults")
def test_create_song_as_member():
    pass


@scenario(FEATURE, "POST a song without a capo — it defaults to 0")
def test_create_song_default_capo():
    pass


@scenario(FEATURE, "POST a song with a chord diagram style and size — they are saved")
def test_create_song_chord_diagram_prefs():
    pass


@scenario(FEATURE, "POST a song with an invalid chord diagram style — 422 error and the database is not modified")
def test_create_song_invalid_chord_diagram_style():
    pass


@scenario(FEATURE, "POST a song with a description — a document is created for it")
def test_create_song_with_description():
    pass


@scenario(FEATURE, "POST a song without a description — no document is created")
def test_create_song_without_description():
    pass


@scenario(FEATURE, "POST a song as a project guest — 403 error and the database is not modified")
def test_create_song_as_guest():
    pass


@scenario(FEATURE, "POST a song with a tempo out of range — 422 error and the database is not modified")
def test_create_song_tempo_out_of_range():
    pass


@scenario(FEATURE, "POST a song with a beats_per_bar out of range — 422 error and the database is not modified")
def test_create_song_beats_per_bar_out_of_range():
    pass


@scenario(FEATURE, "POST a song with a capo out of range — 422 error and the database is not modified")
def test_create_song_capo_out_of_range():
    pass


@scenario(FEATURE, "POST a song — it is seeded with the default presentation layout template")
def test_create_song_seeds_default_layout():
    pass


@scenario(FEATURE, "POST a song with a template_song_id — the template's layout is copied instead of the default")
def test_create_song_with_layout_template():
    pass


@scenario(FEATURE, "POST a song with a template_song_id from another project — 404 and no song is created")
def test_create_song_with_cross_project_template():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
