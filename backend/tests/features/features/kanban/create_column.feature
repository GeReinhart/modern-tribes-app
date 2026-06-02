@wip
Feature: Create a kanban column
  As a project manager
  I want to create a column in the kanban board
  So that cards can be organised by stage

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

  Scenario: POST /kanban/columns as admin — the column is created
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/kanban/columns with body:
      """
      {"feature_instance_id": "0100", "name": "To Do"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {"name": "To Do", "position": 1}
      """

  @error_case
  Scenario: POST /kanban/columns as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/kanban/columns with body:
      """
      {"feature_instance_id": "0100", "name": "To Do"}
      """
    Then the response status code is 403
