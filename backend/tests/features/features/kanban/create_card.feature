@wip
Feature: Create a kanban card
  As a project member
  I want to create a card in the kanban board
  So that a task is tracked

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

  Scenario: POST /kanban/cards as admin — the card is created
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/kanban/cards with body:
      """
      {
        "feature_instance_id": "0100",
        "column_id": "0200",
        "title": "Fix login bug"
      }
      """
    Then the response status code is 201

  @error_case
  Scenario: POST /kanban/cards as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/tasks/kanban/cards with body:
      """
      {
        "feature_instance_id": "0100",
        "column_id": "0200",
        "title": "Fix login bug"
      }
      """
    Then the response status code is 403
