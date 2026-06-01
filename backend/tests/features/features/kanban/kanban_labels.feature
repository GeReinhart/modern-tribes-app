@wip
Feature: Manage kanban labels
  As an administrator
  I want to manage labels for a kanban board
  So that cards can be categorised

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
      | 0002 | user@test.com  | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
      | viewer        | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | administrator | admin                      |
      | viewer        | can_access_attached_tribes |
    And the user_roles table contains:
      | user           | role          |
      | admin@test.com | administrator |
      | user@test.com  | viewer        |

  Scenario: GET /kanban/labels/0100 as admin — labels are returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/kanban/labels/0100
    Then the response status code is 200

  Scenario: POST /kanban/labels as admin — label is created
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/kanban/labels with body:
      """
      {"feature_instance_id": "0100", "name": "Bug", "color": "#ff0000"}
      """
    Then the response status code is 201

  Scenario: PATCH /kanban/labels/0010 as admin — label is updated
    Given I am authenticated as an administrator: user.id 0001
    When I PATCH /api/features/tasks/kanban/labels/0010 with body:
      """
      {"name": "Feature"}
      """
    Then the response status code is 200

  @error_case
  Scenario: POST /kanban/labels as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/kanban/labels with body:
      """
      {"feature_instance_id": "0100", "name": "Bug", "color": "#ff0000"}
      """
    Then the response status code is 403
