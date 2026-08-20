@wip
Feature: Add a new item to the shared groceries catalog
  As a project member
  I want to add a new grocery item to the shared catalog
  So that it can be reused across every grocery list

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

  Scenario: POST /groceries-items/ as a project member — the item is created in the shared catalog
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_items table contains:
      | id | name | description | unit | status |
    When I POST /api/features/tasks/groceries-items/ with body:
      """
      {"feature_instance_id": "0100", "name": "Tomatoes", "description": "Ripe red tomatoes", "unit": "kg"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "name": "Tomatoes",
        "description": "Ripe red tomatoes",
        "unit": "kg",
        "status": "active"
      }
      """
    And the groceries_items table contains:
      | name     | description       | unit | status |
      | Tomatoes | Ripe red tomatoes | kg   | active |

  Scenario: POST /groceries-items/ without a description — it defaults to empty
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_items table contains:
      | id | name | description | unit | status |
    When I POST /api/features/tasks/groceries-items/ with body:
      """
      {"feature_instance_id": "0100", "name": "Rice", "unit": "kg"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "name": "Rice",
        "description": "",
        "unit": "kg",
        "status": "active"
      }
      """
    And the groceries_items table contains:
      | name | description | unit | status |
      | Rice |             | kg   | active |

  @error_case
  Scenario: POST /groceries-items/ as a project guest — 403 error and the catalog is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the groceries_items table contains:
      | id | name | description | unit | status |
    When I POST /api/features/tasks/groceries-items/ with body:
      """
      {"feature_instance_id": "0100", "name": "Tomatoes", "description": "Ripe red tomatoes", "unit": "kg"}
      """
    Then the response status code is 403
    And the groceries_items table contains:
      | id | name | description | unit | status |

  @error_case
  Scenario: POST /groceries-items/ without project access — 403 error and the catalog is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the groceries_items table contains:
      | id | name | description | unit | status |
    When I POST /api/features/tasks/groceries-items/ with body:
      """
      {"feature_instance_id": "0100", "name": "Tomatoes", "description": "Ripe red tomatoes", "unit": "kg"}
      """
    Then the response status code is 403
    And the groceries_items table contains:
      | id | name | description | unit | status |

  @error_case
  Scenario: POST /groceries-items/ with an invalid unit — 422 error and the catalog is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_items table contains:
      | id | name | description | unit | status |
    When I POST /api/features/tasks/groceries-items/ with body:
      """
      {"feature_instance_id": "0100", "name": "Tomatoes", "unit": "liters"}
      """
    Then the response status code is 422
    And the groceries_items table contains:
      | id | name | description | unit | status |

  @error_case
  Scenario: POST /groceries-items/ with a missing name — 422 error and the catalog is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_items table contains:
      | id | name | description | unit | status |
    When I POST /api/features/tasks/groceries-items/ with body:
      """
      {"feature_instance_id": "0100", "unit": "kg"}
      """
    Then the response status code is 422
    And the groceries_items table contains:
      | id | name | description | unit | status |
