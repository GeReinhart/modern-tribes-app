from pytest_bdd import scenario
from tests.db_helpers import db_lifespan

FEATURE = "../../../../features/platform/people/persons/add_person.feature"

@scenario(FEATURE, "POST /persons with a valid body — the new record appears in the database")
def test_add_person_success():
    pass

@scenario(FEATURE, "POST /persons with a missing required field — 422 error and the database is not modified")
def test_add_person_missing_field():
    pass

@scenario(FEATURE, "POST /persons as a non-admin user — 403 error and the database is not modified")
def test_add_person_forbidden():
    pass

