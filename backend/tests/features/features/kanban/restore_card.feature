@wip
Feature: Restore a kanban card
  As an administrator
  I want to restore an archived kanban card
  So that the task is visible again on the board

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
    And the projects table contains:
      | id   | name    | status |
      | 0100 | Project | active |
    And the projects_features table contains:
      | id   | project_id | name  | feature_type | status |
      | 0100 | 0100       | Board | kanban       | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name  | position | status |
      | 0200 | 0100                | To Do | 1        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title | position | status   |
      | 0010 | 0100                | 0200      | Task  | 1        | archived |

  Scenario: POST /kanban/cards/0010/restore as admin — card is restored
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/kanban/cards/0010/restore
    Then the response status code is 200

  @error_case
  Scenario: POST /kanban/cards/0010/restore as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/kanban/cards/0010/restore
    Then the response status code is 403
