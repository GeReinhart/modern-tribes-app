@wip
Feature: View a grocery list
  As a project member
  I want to see a grocery list with every item and whether it's been picked up
  So that I can tell what's still left to grab while shopping

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
      | 3001 | Tomatoes |             | kg    | active |
      | 3002 | Bread    |             | piece | active |
    And the groceries_lists table contains:
      | id   | feature_instance_id | name        | scheduled_date | list_status | status |
      | 0201 | 0100                | Weekly shop | 2026-08-22      | planned     | active |
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | picked_up | position | status |
      | 4001 | 0201               | 3001               | 2.00      | false     | 1        | active |
      | 4002 | 0201               | 3002               | 1.00      | true      | 2        | active |

  Scenario: GET /groceries-lists/0201 as a project member — the list and its items are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    When I GET /api/features/tasks/groceries-lists/0201
    Then the response status code is 200
    And the response body is:
      """
      {
        "id": "0201",
        "feature_instance_id": "0100",
        "name": "Weekly shop",
        "scheduled_date": "2026-08-22",
        "list_status": "planned",
        "assigned_person_id": null,
        "force_on_dashboard": false,
        "is_favorite": false,
        "status": "active",
        "items": [
          {
            "id": "4001",
            "groceries_item_id": "3001",
            "name": "Tomatoes",
            "unit": "kg",
            "icon": null,
            "is_divisible": true,
            "comment": null,
            "quantity": 2.0,
            "picked_up": false,
            "section_ids": []
          },
          {
            "id": "4002",
            "groceries_item_id": "3002",
            "name": "Bread",
            "unit": "piece",
            "icon": null,
            "is_divisible": true,
            "comment": null,
            "quantity": 1.0,
            "picked_up": true,
            "section_ids": []
          }
        ]
      }
      """

  Scenario: GET /groceries-lists/0201 as an administrator — the list and its items are returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/groceries-lists/0201
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "0201",
        "list_status": "planned"
      }
      """

  @error_case
  Scenario: GET /groceries-lists/0201 without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/groceries-lists/0201
    Then the response status code is 403

  @error_case
  Scenario: GET /groceries-lists/9999 on a non-existent list — 404 error
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/groceries-lists/9999
    Then the response status code is 404
