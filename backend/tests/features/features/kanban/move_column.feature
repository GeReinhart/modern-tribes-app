@wip
Feature: Move a kanban column
  As an administrator
  I want to move a kanban column left or right
  So that I can reorder the board layout

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
      | 0010 | 0100                | To Do | 1        | active |
      | 0011 | 0100                | Done  | 2        | active |

  Scenario: POST /kanban/columns/0010/move as admin — column is moved
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/kanban/columns/0010/move with body:
      """
      {"direction": "next"}
      """
    Then the response status code is 200

  @error_case
  Scenario: POST /kanban/columns/0010/move as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/kanban/columns/0010/move with body:
      """
      {"direction": "next"}
      """
    Then the response status code is 403
