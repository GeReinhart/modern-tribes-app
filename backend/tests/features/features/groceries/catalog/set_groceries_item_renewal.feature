@wip
Feature: Set an item's restock renewal frequency for a feature instance
  As a project member
  I want to say how often I typically restock an item
  So that I get suggested to re-add it to future lists

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

  Scenario: PUT /groceries-items/3001/renewal as a project member — the renewal is set
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_instance_items table contains:
      | id | feature_instance_id | groceries_item_id | renewal_duration_days | status |
    When I PUT /api/features/tasks/groceries-items/3001/renewal with body:
      """
      {"feature_instance_id": "0100", "renewal_duration_days": 14}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "3001",
        "renewal_duration_days": 14
      }
      """
    And the groceries_instance_items table contains:
      | feature_instance_id | groceries_item_id | renewal_duration_days | status |
      | 0100                 | 3001               | 14                     | active |

  Scenario: PUT /groceries-items/3001/renewal again — the renewal is updated, not duplicated
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_instance_items table contains:
      | id   | feature_instance_id | groceries_item_id | renewal_duration_days | status |
      | 5001 | 0100                | 3001               | 14                     | active |
    When I PUT /api/features/tasks/groceries-items/3001/renewal with body:
      """
      {"feature_instance_id": "0100", "renewal_duration_days": 7}
      """
    Then the response status code is 200
    And the groceries_instance_items table contains:
      | feature_instance_id | groceries_item_id | renewal_duration_days | status |
      | 0100                 | 3001               | 7                      | active |

  Scenario: PUT /groceries-items/3001/renewal with no value — tracking is removed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_instance_items table contains:
      | id   | feature_instance_id | groceries_item_id | renewal_duration_days | status |
      | 5001 | 0100                | 3001               | 14                     | active |
    When I PUT /api/features/tasks/groceries-items/3001/renewal with body:
      """
      {"feature_instance_id": "0100"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "3001",
        "renewal_duration_days": null
      }
      """
    And the groceries_instance_items table contains:
      | feature_instance_id | groceries_item_id | renewal_duration_days | status |

  @error_case
  Scenario: PUT /groceries-items/3001/renewal as a project guest — 403 error and nothing is set
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the groceries_instance_items table contains:
      | id | feature_instance_id | groceries_item_id | renewal_duration_days | status |
    When I PUT /api/features/tasks/groceries-items/3001/renewal with body:
      """
      {"feature_instance_id": "0100", "renewal_duration_days": 14}
      """
    Then the response status code is 403
    And the groceries_instance_items table contains:
      | id | feature_instance_id | groceries_item_id | renewal_duration_days | status |

  @error_case
  Scenario: PUT /groceries-items/9999/renewal on a non-existent item — 404 error
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PUT /api/features/tasks/groceries-items/9999/renewal with body:
      """
      {"feature_instance_id": "0100", "renewal_duration_days": 14}
      """
    Then the response status code is 404
