@wip
Feature: Create a grocery list
  As a project member
  I want to schedule a new grocery list to a date
  So that it shows up as a shopping trip to plan for

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

  Scenario: POST /groceries-lists/ as a project member — the list is created
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_lists table contains:
      | id | feature_instance_id | name | scheduled_date | list_status | assigned_person_id | force_on_dashboard | status |
    When I POST /api/features/tasks/groceries-lists/ with body:
      """
      {"feature_instance_id": "0100", "name": "Weekly shop", "scheduled_date": "2026-08-22", "assigned_person_id": "0030"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "feature_instance_id": "0100",
        "name": "Weekly shop",
        "scheduled_date": "2026-08-22",
        "list_status": "planned",
        "assigned_person_id": "0030",
        "force_on_dashboard": false,
        "status": "active"
      }
      """
    And the groceries_lists table contains:
      | feature_instance_id | name        | scheduled_date | list_status | assigned_person_id | force_on_dashboard | status |
      | 0100                | Weekly shop | 2026-08-22      | planned     | 0030                | false               | active |

  Scenario: POST /groceries-lists/ without a name or assignee — they default to empty
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_lists table contains:
      | id | feature_instance_id | name | scheduled_date | list_status | assigned_person_id | force_on_dashboard | status |
    When I POST /api/features/tasks/groceries-lists/ with body:
      """
      {"feature_instance_id": "0100", "scheduled_date": "2026-08-22"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "feature_instance_id": "0100",
        "name": null,
        "scheduled_date": "2026-08-22",
        "list_status": "planned",
        "assigned_person_id": null,
        "force_on_dashboard": false,
        "status": "active"
      }
      """
    And the groceries_lists table contains:
      | feature_instance_id | name | scheduled_date | list_status | assigned_person_id | force_on_dashboard | status |
      | 0100                |      | 2026-08-22      | planned     |                     | false               | active |

  @error_case
  Scenario: POST /groceries-lists/ without a scheduled_date — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the groceries_lists table contains:
      | id | feature_instance_id | name | scheduled_date | list_status | assigned_person_id | force_on_dashboard | status |
    When I POST /api/features/tasks/groceries-lists/ with body:
      """
      {"feature_instance_id": "0100", "name": "Weekly shop"}
      """
    Then the response status code is 422
    And the groceries_lists table contains:
      | id | feature_instance_id | name | scheduled_date | list_status | assigned_person_id | force_on_dashboard | status |

  @error_case
  Scenario: POST /groceries-lists/ as a project guest — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the groceries_lists table contains:
      | id | feature_instance_id | name | scheduled_date | list_status | assigned_person_id | force_on_dashboard | status |
    When I POST /api/features/tasks/groceries-lists/ with body:
      """
      {"feature_instance_id": "0100", "name": "Weekly shop", "scheduled_date": "2026-08-22"}
      """
    Then the response status code is 403
    And the groceries_lists table contains:
      | id | feature_instance_id | name | scheduled_date | list_status | assigned_person_id | force_on_dashboard | status |
