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

FEATURE = "../../../../../features/features/guitar/song/layout/add_layout_row.feature"


@scenario(FEATURE, "POST a row with two columns summing to 8/8 — it is added at position 1")
def test_add_layout_row():
    pass


@scenario(FEATURE, "POST a row with a column stacking two blocks — both are saved in order")
def test_add_layout_row_multi_block_column():
    pass


@scenario(FEATURE, "POST a row with a custom block — its title and rich text are saved as a document")
def test_add_layout_row_custom_block():
    pass


@scenario(FEATURE, "POST a row with two custom blocks in the same column — both are kept, no conflict")
def test_add_layout_row_two_custom_blocks():
    pass


@scenario(
    FEATURE,
    "POST a row with a custom block with no title yet — it's created untitled, ready to be named from the song's page",
)
def test_add_layout_row_custom_block_no_title():
    pass


@scenario(FEATURE, "POST a row with a custom block width outside 1-8 — 422 and the database is not modified")
def test_add_layout_row_custom_block_invalid_width():
    pass


@scenario(FEATURE, "POST a second row — it lands after the first")
def test_add_second_layout_row():
    pass


@scenario(FEATURE, "POST a row with insert_before_row_id — it lands before that row, pushing it down")
def test_add_layout_row_insert_before():
    pass


@scenario(FEATURE, "POST a row whose column widths sum to less than 8/8 — it is added with room left unused")
def test_add_layout_row_partial_width_sum():
    pass


@scenario(FEATURE, "POST a row whose column widths sum to more than 8/8 — 422 and the database is not modified")
def test_add_layout_row_invalid_width_sum():
    pass


@scenario(FEATURE, "POST a row reusing a block already used by another row — 422 and the database is not modified")
def test_add_layout_row_block_conflict():
    pass


@scenario(FEATURE, "POST a row using the same block twice in one column — 422 and the database is not modified")
def test_add_layout_row_duplicate_block_in_column():
    pass


@scenario(FEATURE, "POST a row with a block's zoom and card framing set — both are saved")
def test_add_layout_row_block_zoom_and_card():
    pass


@scenario(FEATURE, "POST a row with a block's zoom outside 30-200 — 422 and the database is not modified")
def test_add_layout_row_block_invalid_zoom():
    pass


@scenario(FEATURE, "POST a row with a block's title heading level set — it is saved")
def test_add_layout_row_block_title_heading_level():
    pass


@scenario(FEATURE, "POST a row without a title heading level for a block — it defaults to h3")
def test_add_layout_row_block_default_title_heading_level():
    pass


@scenario(FEATURE, "POST a row with an invalid title heading level for a block — 422 and the database is not modified")
def test_add_layout_row_block_invalid_title_heading_level():
    pass


@scenario(FEATURE, "POST a row as a project guest — 403 and the database is not modified")
def test_add_layout_row_as_guest():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
