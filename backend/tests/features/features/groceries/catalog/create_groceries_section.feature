@wip
Feature: Add a new section to the shared groceries catalog
  As a project member
  I want to add a new section (e.g. "Boucherie", "Fruits") to the shared catalog
  So that grocery items can be grouped by shop area

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

  Scenario: POST /groceries-sections/ as a project member — the section is created in the shared catalog, alimentaire by default
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_sections table contains:
      | id | name | is_food | status |
    When I POST /api/features/tasks/groceries-sections/ with body:
      """
      {"feature_instance_id": "0100", "name": "Boucherie"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "name": "Boucherie",
        "is_food": true,
        "status": "active"
      }
      """
    And the groceries_sections table contains:
      | name      | is_food | status |
      | Boucherie | true    | active |

  Scenario: POST /groceries-sections/ with is_food false — the section is created as non-food
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_sections table contains:
      | id | name | is_food | status |
    When I POST /api/features/tasks/groceries-sections/ with body:
      """
      {"feature_instance_id": "0100", "name": "Hygiène", "is_food": false}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "name": "Hygiène",
        "is_food": false,
        "status": "active"
      }
      """
    And the groceries_sections table contains:
      | name    | is_food | status |
      | Hygiène | false   | active |

  @error_case
  Scenario: POST /groceries-sections/ as a project guest — 403 error and the catalog is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the groceries_sections table contains:
      | id | name | status |
    When I POST /api/features/tasks/groceries-sections/ with body:
      """
      {"feature_instance_id": "0100", "name": "Boucherie"}
      """
    Then the response status code is 403
    And the groceries_sections table contains:
      | id | name | status |

  @error_case
  Scenario: POST /groceries-sections/ with a missing name — 422 error and the catalog is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_sections table contains:
      | id | name | status |
    When I POST /api/features/tasks/groceries-sections/ with body:
      """
      {"feature_instance_id": "0100"}
      """
    Then the response status code is 422
    And the groceries_sections table contains:
      | id | name | status |
