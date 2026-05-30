import json

from pytest_bdd import given, parsers, scenario, then, when

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


@given("I am authenticated as an administrator")
def authenticated_admin(admin_client, context):
    context["client"] = admin_client


@given("I am authenticated as a regular user")
def authenticated_regular_user(non_admin_client, context):
    context["client"] = non_admin_client


def _assert_persons_table(persons_store, datatable):
    headers = datatable[0]
    expected_rows = datatable[1:]
    actual = persons_store.all()
    assert len(actual) == len(expected_rows), (
        f"Expected {len(expected_rows)} record(s) in persons table, got {len(actual)}"
    )
    for expected, record in zip(expected_rows, actual):
        for i, field in enumerate(headers):
            assert str(record[field]) == expected[i], (
                f"persons.{field}: expected {expected[i]!r}, got {record[field]!r}"
            )


@given("the persons table contains:")
def given_persons_table(persons_store, datatable):
    _assert_persons_table(persons_store, datatable)


@when(parsers.re(r"I POST (?P<path>\S+) with body:"))
def post_with_json_body(context, path, docstring):
    context["response"] = context["client"].post(path, json=json.loads(docstring))


@then(parsers.parse("the response status code is {status_code:d}"))
def check_status_code(context, status_code):
    assert context["response"].status_code == status_code


@then("the persons table contains:")
def then_persons_table(persons_store, datatable):
    _assert_persons_table(persons_store, datatable)
