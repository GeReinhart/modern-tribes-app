@wip
Feature: Remove an item from a grocery list
  As a project member
  I want to remove an item I added by mistake
  So that the list only has what I actually need

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
    And the groceries_lists table contains:
      | id   | feature_instance_id | name        | scheduled_date | list_status | status |
      | 0201 | 0100                | Weekly shop | 2026-08-22      | planned     | active |

  Scenario: DELETE /groceries-list-items/4001 as a project member — the item is removed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
      | 4001 | 0201               | 3001               | 2.00      | false     | 1        | active |
    When I DELETE /api/features/tasks/groceries-list-items/4001
    Then the response status code is 204
    And the groceries_list_items table contains:
      | id | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |

  @error_case
  Scenario: DELETE /groceries-list-items/4001 as a project guest — 403 error and the item is not removed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
      | 4001 | 0201               | 3001               | 2.00      | false     | 1        | active |
    When I DELETE /api/features/tasks/groceries-list-items/4001
    Then the response status code is 403
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
      | 4001 | 0201               | 3001               | 2.00      | false     | 1        | active |

  @error_case
  Scenario: DELETE /groceries-list-items/9999 on a non-existent item — 404 error
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I DELETE /api/features/tasks/groceries-list-items/9999
    Then the response status code is 404
