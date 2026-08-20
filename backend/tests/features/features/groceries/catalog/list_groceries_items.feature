@wip
Feature: List the shared groceries catalog items
  As a project member
  I want to browse the shared item catalog
  So that I can pick items to add to a grocery list

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
    And the groceries_items table contains:
      | id   | name     | description | unit  | status |
      | 3001 | Milk     |             | piece | active |
      | 3002 | Tomatoes |             | kg    | active |

  Scenario: GET /groceries-items/?feature_instance_id=0100 as a project member — the catalog is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    When I GET /api/features/tasks/groceries-items/?feature_instance_id=0100
    Then the response status code is 200
    And the response body includes:
      """
      [
        {
          "name": "Milk",
          "description": "",
          "unit": "piece",
          "status": "active"
        },
        {
          "name": "Tomatoes",
          "description": "",
          "unit": "kg",
          "status": "active"
        }
      ]
      """

  Scenario: GET /groceries-items/?feature_instance_id=0100 — archived items are excluded
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the groceries_items table contains:
      | id   | name  | description | unit  | status   |
      | 3003 | Bread |             | piece | archived |
    When I GET /api/features/tasks/groceries-items/?feature_instance_id=0100
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"name": "Milk"},
        {"name": "Tomatoes"}
      ]
      """

  @error_case
  Scenario: GET /groceries-items/?feature_instance_id=0100 without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/groceries-items/?feature_instance_id=0100
    Then the response status code is 403
