import json
import re

from pytest_bdd import given, parsers, then, when

from tests.helpers import assert_table, assert_table_contains, expand_json_ids, expand_path_ids, seed_store
from tests.conftest import (
    FakeDocumentsStore, FakeLabelsStore, FakeRolesStore, FakeAppConfigStore,
    FakeMailsStore, FakeTribesStore, FakeProjectsStore, FakePositionsStore,
)

_USER_ID_RE = re.compile(r": user\.id (?P<user_id>\d{1,4})$")


@given(parsers.re(r"I am authenticated as an administrator: user\.id (?P<user_id>\d{1,4})"))
def authenticated_admin(user_id, admin_client, context):
    context["client"] = admin_client


@given(parsers.re(r"I am authenticated as a regular user: user\.id (?P<user_id>\d{1,4})"))
def authenticated_regular_user(user_id, non_admin_client, context):
    context["client"] = non_admin_client


@given(parsers.re(r"I am authenticated as the person's owner: user\.id (?P<user_id>\d{1,4})"))
def authenticated_profile_owner(user_id, profile_owner_client, context):
    context["client"] = profile_owner_client


@given("the users table contains:")
def given_users_table(auth_store, datatable):
    assert_table_contains(auth_store.USERS, datatable, "users")


@given("the roles table contains:")
def given_roles_table(auth_store, datatable):
    assert_table_contains(auth_store.ROLES, datatable, "roles")


@given("the role_permissions table contains:")
def given_role_permissions_table(auth_store, datatable):
    assert_table_contains(auth_store.ROLE_PERMISSIONS, datatable, "role_permissions")


@given("the user_roles table contains:")
def given_user_roles_table(auth_store, datatable):
    assert_table_contains(auth_store.USER_ROLES, datatable, "user_roles")


@given("the persons table contains:")
def given_persons_table(persons_store, datatable):
    seed_store(persons_store, datatable)
    assert_table(persons_store.all(), datatable, "persons")


@given("the represents table contains:")
def given_represents_table(represents_store, datatable):
    seed_store(represents_store, datatable)
    assert_table(represents_store.all(), datatable, "represents")


@given("the managed_users table contains:")
def given_managed_users_table(managed_users_store, datatable):
    seed_store(managed_users_store, datatable)
    assert_table(managed_users_store.all(), datatable, "managed_users")


@given("the created_users table contains:")
def given_created_users_table(created_users_store, datatable):
    seed_store(created_users_store, datatable)
    assert_table(created_users_store.all(), datatable, "created_users")


@when(parsers.re(r"I POST (?P<path>\S+) with body:"))
def post_with_json_body(context, path, docstring):
    body = expand_json_ids(json.loads(docstring))
    context["response"] = context["client"].post(expand_path_ids(path), json=body)


@when(parsers.re(r"I PUT (?P<path>\S+) with body:"))
def put_with_json_body(context, path, docstring):
    body = expand_json_ids(json.loads(docstring))
    context["response"] = context["client"].put(expand_path_ids(path), json=body)


@when(parsers.re(r"I PATCH (?P<path>\S+) with body:"))
def patch_with_json_body(context, path, docstring):
    body = expand_json_ids(json.loads(docstring))
    context["response"] = context["client"].patch(expand_path_ids(path), json=body)


@when(parsers.re(r"I POST (?P<path>\S+)$"))
def post_no_body(context, path):
    context["response"] = context["client"].post(expand_path_ids(path))


@when(parsers.re(r"I GET (?P<path>\S+)"))
def get_resource(context, path):
    context["response"] = context["client"].get(expand_path_ids(path))


@when(parsers.re(r"I DELETE (?P<path>\S+)"))
def delete_resource(context, path):
    context["response"] = context["client"].delete(expand_path_ids(path))


@then(parsers.parse("the response status code is {status_code:d}"))
def check_status_code(context, status_code):
    assert context["response"].status_code == status_code, (
        f"Expected {status_code}, got {context['response'].status_code}: {context['response'].text}"
    )


@then("the persons table contains:")
def then_persons_table(persons_store, datatable):
    assert_table(persons_store.all(), datatable, "persons")


@then("the represents table contains:")
def then_represents_table(represents_store, datatable):
    assert_table(represents_store.all(), datatable, "represents")


@then("the managed_users table contains:")
def then_managed_users_table(managed_users_store, datatable):
    assert_table(managed_users_store.all(), datatable, "managed_users")


@then("the created_users table contains:")
def then_created_users_table(created_users_store, datatable):
    assert_table(created_users_store.all(), datatable, "created_users")


@given("the documents table contains:")
def given_documents_table(documents_store: FakeDocumentsStore, datatable):
    seed_store(documents_store, datatable)
    assert_table(documents_store.all(), datatable, "documents")


@then("the documents table contains:")
def then_documents_table(documents_store: FakeDocumentsStore, datatable):
    assert_table(documents_store.all(), datatable, "documents")


@given("the labels table contains:")
def given_labels_table(labels_store: FakeLabelsStore, datatable):
    seed_store(labels_store, datatable)
    assert_table(labels_store.all(), datatable, "labels")


@then("the labels table contains:")
def then_labels_table(labels_store: FakeLabelsStore, datatable):
    assert_table(labels_store.all(), datatable, "labels")


@given("the managed_roles table contains:")
def given_managed_roles_table(managed_roles_store: FakeRolesStore, datatable):
    seed_store(managed_roles_store, datatable)
    assert_table(managed_roles_store.all(), datatable, "managed_roles")


@then("the managed_roles table contains:")
def then_managed_roles_table(managed_roles_store: FakeRolesStore, datatable):
    assert_table(managed_roles_store.all(), datatable, "managed_roles")


@given("the app_config table contains:")
def given_app_config_table(app_config_store: FakeAppConfigStore, datatable):
    seed_store(app_config_store, datatable)
    assert_table(app_config_store.all(), datatable, "app_config")


@then("the app_config table contains:")
def then_app_config_table(app_config_store: FakeAppConfigStore, datatable):
    assert_table(app_config_store.all(), datatable, "app_config")


@given("the mails table contains:")
def given_mails_table(mails_store: FakeMailsStore, datatable):
    seed_store(mails_store, datatable)
    assert_table(mails_store.all(), datatable, "mails")


@then("the mails table contains:")
def then_mails_table(mails_store: FakeMailsStore, datatable):
    assert_table(mails_store.all(), datatable, "mails")


@given("the tribes table contains:")
def given_tribes_table(tribes_store: FakeTribesStore, datatable):
    seed_store(tribes_store, datatable)
    assert_table(tribes_store.all(), datatable, "tribes")


@then("the tribes table contains:")
def then_tribes_table(tribes_store: FakeTribesStore, datatable):
    assert_table(tribes_store.all(), datatable, "tribes")


@given("the projects table contains:")
def given_projects_table(projects_store: FakeProjectsStore, datatable):
    seed_store(projects_store, datatable)
    assert_table(projects_store.all(), datatable, "projects")


@then("the projects table contains:")
def then_projects_table(projects_store: FakeProjectsStore, datatable):
    assert_table(projects_store.all(), datatable, "projects")


@given("the positions table contains:")
def given_positions_table(positions_store: FakePositionsStore, datatable):
    seed_store(positions_store, datatable)
    assert_table(positions_store.all(), datatable, "positions")


@then("the positions table contains:")
def then_positions_table(positions_store: FakePositionsStore, datatable):
    assert_table(positions_store.all(), datatable, "positions")
