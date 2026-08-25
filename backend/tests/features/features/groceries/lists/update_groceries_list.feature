@wip
Feature: Archive, restore or favorite a grocery list
  As a project member
  I want to archive a grocery list once it's no longer needed, restore it, or mark it as a favorite
  So that old lists stop cluttering my view and I can reuse a favorite one as a starting point later

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

  Scenario: PATCH /groceries-lists/4001 as a project member — the list is archived
    Given the groceries_lists table contains:
      | id   | feature_instance_id | scheduled_date | is_favorite | status |
      | 4001 | 0100                | 2026-08-22      | false       | active |
    And I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-lists/4001 with body:
      """
      {"status": "archived"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "4001",
        "is_favorite": false,
        "status": "archived"
      }
      """
    And the groceries_lists table contains:
      | id   | feature_instance_id | is_favorite | status   |
      | 4001 | 0100                | false       | archived |

  Scenario: PATCH /groceries-lists/4001 as a project member — the list is marked as favorite
    Given the groceries_lists table contains:
      | id   | feature_instance_id | scheduled_date | is_favorite | status |
      | 4001 | 0100                | 2026-08-22      | false       | active |
    And I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-lists/4001 with body:
      """
      {"is_favorite": true}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "4001",
        "is_favorite": true,
        "status": "active"
      }
      """
    And the groceries_lists table contains:
      | id   | feature_instance_id | is_favorite | status |
      | 4001 | 0100                | true        | active |

  Scenario: PATCH /groceries-lists/4001 as a project member — an archived list is restored to active
    Given the groceries_lists table contains:
      | id   | feature_instance_id | scheduled_date | is_favorite | status   |
      | 4001 | 0100                | 2026-08-22      | true        | archived |
    And I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-lists/4001 with body:
      """
      {"status": "active"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "4001",
        "is_favorite": true,
        "status": "active"
      }
      """
    And the groceries_lists table contains:
      | id   | feature_instance_id | is_favorite | status |
      | 4001 | 0100                | true        | active |

  @error_case
  Scenario: PATCH /groceries-lists/4001 as a project guest — 403 error and the list is not archived
    Given the groceries_lists table contains:
      | id   | feature_instance_id | scheduled_date | is_favorite | status |
      | 4001 | 0100                | 2026-08-22      | false       | active |
    And I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    When I PATCH /api/features/tasks/groceries-lists/4001 with body:
      """
      {"status": "archived"}
      """
    Then the response status code is 403
    And the groceries_lists table contains:
      | id   | feature_instance_id | is_favorite | status |
      | 4001 | 0100                | false       | active |

  @error_case
  Scenario: PATCH /groceries-lists/9999 on a non-existent list — 404 error
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-lists/9999 with body:
      """
      {"status": "archived"}
      """
    Then the response status code is 404

  Scenario: PATCH /groceries-lists/4001 as a project member — the list is renamed
    Given the groceries_lists table contains:
      | id   | feature_instance_id | name        | scheduled_date | is_favorite | status |
      | 4001 | 0100                | Weekly shop | 2026-08-22      | false       | active |
    And I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-lists/4001 with body:
      """
      {"name": "Sunday big shop"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "4001",
        "name": "Sunday big shop",
        "is_favorite": false,
        "status": "active"
      }
      """
    And the groceries_lists table contains:
      | id   | feature_instance_id | name             | is_favorite | status |
      | 4001 | 0100                | Sunday big shop  | false       | active |
