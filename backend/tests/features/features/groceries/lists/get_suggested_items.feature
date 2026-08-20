@wip
Feature: Get suggested items for a new grocery list
  As a project member
  I want to see which catalog items are due for restocking
  So that I don't forget to re-add them to my next list

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
      | id   | name      | description | unit  | status |
      | 3001 | Milk      |             | piece | active |
      | 3002 | Rice      |             | kg    | active |
      | 3003 | Chocolate |             | piece | active |
      | 3004 | Butter    |             | piece | active |
    And the groceries_instance_items table contains:
      | id   | feature_instance_id | groceries_item_id | renewal_duration_days | status |
      | 5001 | 0100                | 3001               | 1                      | active |
      | 5002 | 0100                | 3002               | 7                      | active |
      | 5003 | 0100                | 3003               | 36500                  | active |
    And the groceries_lists table contains:
      | id   | feature_instance_id | scheduled_date | list_status | status |
      | 2001 | 0100                | 2020-01-01      | done        | active |
    And the groceries_list_items table contains:
      | id   | groceries_list_id | groceries_item_id | quantity | picked_up | picked_up_at        | position | status |
      | 4101 | 2001               | 3001               | 1.0       | true      | 2020-01-01T00:00:00 | 1        | active |
      | 4102 | 2001               | 3003               | 1.0       | true      | 2020-01-01T00:00:00 | 2        | active |

  Scenario: GET /groceries-lists/by-instance/0100/suggestions as a project member — items due for restock are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/groceries-lists/by-instance/0100/suggestions
    Then the response status code is 200
    And the response body is:
      """
      [
        {
          "groceries_item_id": "3001",
          "name": "Milk",
          "unit": "piece",
          "icon": null,
          "renewal_duration_days": 1
        },
        {
          "groceries_item_id": "3002",
          "name": "Rice",
          "unit": "kg",
          "icon": null,
          "renewal_duration_days": 7
        }
      ]
      """

  Scenario: GET /groceries-lists/by-instance/0100/suggestions as an administrator — items due for restock are returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/groceries-lists/by-instance/0100/suggestions
    Then the response status code is 200
    And the response body is:
      """
      [
        {
          "groceries_item_id": "3001",
          "name": "Milk",
          "unit": "piece",
          "icon": null,
          "renewal_duration_days": 1
        },
        {
          "groceries_item_id": "3002",
          "name": "Rice",
          "unit": "kg",
          "icon": null,
          "renewal_duration_days": 7
        }
      ]
      """

  @error_case
  Scenario: GET /groceries-lists/by-instance/0100/suggestions without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/groceries-lists/by-instance/0100/suggestions
    Then the response status code is 403
