@wip
Feature: List grocery lists for a feature instance
  As a project member
  I want to see every scheduled grocery list for a project's Groceries tab
  So that I can pick one to open or plan a new shopping trip

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
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Mia        | Member    | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name | status |
      | 0010 | Home | active |
    And the projects table contains:
      | id   | name    | status |
      | 0100 | Project | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0100       | manager  |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 0100 | 0100       | Groceries | groceries    | active |
    And the groceries_lists table contains:
      | id   | feature_instance_id | name        | scheduled_date | list_status | status |
      | 0201 | 0100                | First shop  | 2026-08-15      | done        | active |
      | 0202 | 0100                | Weekly shop | 2026-08-22      | planned     | active |

  Scenario: GET /groceries-lists/by-instance/0100 as a project member — lists are returned ordered by date
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    When I GET /api/features/tasks/groceries-lists/by-instance/0100
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0201", "name": "First shop", "scheduled_date": "2026-08-15", "list_status": "done"},
        {"id": "0202", "name": "Weekly shop", "scheduled_date": "2026-08-22", "list_status": "planned"}
      ]
      """

  @error_case
  Scenario: GET /groceries-lists/by-instance/0100 without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/groceries-lists/by-instance/0100
    Then the response status code is 403
