@wip
Feature: Archive a kanban card
  As a project member
  I want to archive a card
  So that completed or cancelled tasks are removed from the board

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
      | id   | feature_instance_id | column_id | title | position | status |
      | 0010 | 0100                | 0200      | Task  | 1        | active |

  Scenario: DELETE /kanban/cards/0010 as admin — the card is archived
    Given I am authenticated as an administrator: user.id 0001
    When I DELETE /api/features/tasks/kanban/cards/0010
    Then the response status code is 204

  @error_case
  Scenario: DELETE /kanban/cards/0010 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I DELETE /api/features/tasks/kanban/cards/0010
    Then the response status code is 403
