@wip
Feature: Set an icon on a groceries item
  As a project member
  I want to pick an icon for a catalog item
  So that it's easier to spot at a glance

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
      | id   | name     | description | unit | status |
      | 3001 | Tomatoes |             | kg   | active |

  Scenario: PATCH /groceries-items/3001 as a project member — the icon is set
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-items/3001 with body:
      """
      {"feature_instance_id": "0100", "icon": "apple"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "3001",
        "icon": "apple"
      }
      """
    And the groceries_items table contains:
      | id   | name     | icon  | status |
      | 3001 | Tomatoes | apple | active |

  Scenario: PATCH /groceries-items/3001 with a new name and unit — they are updated
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-items/3001 with body:
      """
      {"feature_instance_id": "0100", "name": "Cherry Tomatoes", "unit": "piece"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "3001",
        "name": "Cherry Tomatoes",
        "unit": "piece"
      }
      """
    And the groceries_items table contains:
      | id   | name            | unit  | status |
      | 3001 | Cherry Tomatoes | piece | active |

  Scenario: PATCH /groceries-items/3001 with status archived — the item is archived
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-items/3001 with body:
      """
      {"feature_instance_id": "0100", "status": "archived"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "3001",
        "status": "archived"
      }
      """
    And the groceries_items table contains:
      | id   | name     | status   |
      | 3001 | Tomatoes | archived |

  @error_case
  Scenario: PATCH /groceries-items/3001 as a project guest — 403 error and the icon is not set
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    When I PATCH /api/features/tasks/groceries-items/3001 with body:
      """
      {"feature_instance_id": "0100", "icon": "apple"}
      """
    Then the response status code is 403
    And the groceries_items table contains:
      | id   | name     | icon | status |
      | 3001 | Tomatoes |      | active |

  @error_case
  Scenario: PATCH /groceries-items/9999 on a non-existent item — 404 error
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-items/9999 with body:
      """
      {"feature_instance_id": "0100", "icon": "apple"}
      """
    Then the response status code is 404
