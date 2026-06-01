@wip
Feature: Get kanban board
  As an administrator
  I want to retrieve a kanban board
  So that I can view its columns and cards

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

  Scenario: GET /kanban/board/0100 as admin — board is returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/kanban/board/0100
    Then the response status code is 200

  @error_case
  Scenario: GET /kanban/board/0100 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/kanban/board/0100
    Then the response status code is 403
