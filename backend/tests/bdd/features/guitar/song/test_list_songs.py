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

FEATURE = "../../../../features/features/guitar/song/list_songs.feature"


@scenario(FEATURE, "GET a project's songs as a member — the project's active songs are returned")
def test_list_songs_as_member():
    pass


@scenario(FEATURE, "GET a project's songs as a guest — read access is allowed")
def test_list_songs_as_guest():
    pass


@scenario(FEATURE, "GET a project's songs with no project membership — 403 error")
def test_list_songs_forbidden():
    pass


@scenario(FEATURE, "GET a project's songs filtered by title — only the matching song is returned")
def test_list_songs_filtered_by_title():
    pass


@scenario(FEATURE, "GET a project's songs filtered by author — only the matching song is returned")
def test_list_songs_filtered_by_author():
    pass


@scenario(FEATURE, "GET a project's songs filtered by lyrics text — only the song with matching lyrics is returned")
def test_list_songs_filtered_by_lyrics():
    pass


@scenario(FEATURE, "GET a project's songs filtered by label — only songs carrying that label are returned")
def test_list_songs_filtered_by_label():
    pass


@scenario(FEATURE, "GET a project's songs filtered by several labels at once — songs carrying any of them are returned")
def test_list_songs_filtered_by_multiple_labels():
    pass


@scenario(FEATURE, "GET a project's songs filtered by state — only completed songs are returned")
def test_list_songs_filtered_by_state():
    pass


@scenario(FEATURE, "GET a project's songs filtered by several states at once — songs in either state are returned")
def test_list_songs_filtered_by_multiple_states():
    pass


@scenario(FEATURE, "GET a project's songs with a search text matching nothing — an empty list is returned")
def test_list_songs_search_no_match():
    pass


@scenario(FEATURE, "GET a project's songs shows each song's chord count and difficult chord count")
def test_list_songs_chord_stats():
    pass


@scenario(FEATURE, "GET a project's songs filtered by difficulty — songs without a difficulty stay visible")
def test_list_songs_filtered_by_difficulty():
    pass


@scenario(
    FEATURE,
    "GET a project's songs filtered by several difficulties at once — songs matching any of them stay visible, plus unrated ones",
)
def test_list_songs_filtered_by_multiple_difficulties():
    pass


@scenario(FEATURE, "GET a project's songs filtered by my mastery — songs I have not rated stay visible")
def test_list_songs_filtered_by_mastery():
    pass


@scenario(
    FEATURE,
    "GET a project's songs filtered by several of my mastery levels at once — songs matching any of them stay visible, plus unrated ones",
)
def test_list_songs_filtered_by_multiple_masteries():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
