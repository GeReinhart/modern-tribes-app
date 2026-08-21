@wip
Feature: Reorder the shared groceries catalog sections
  As a project member
  I want to choose the display order of the catalog sections (e.g. "Boucherie" before "Fruits")
  So that the sections appear in the order I shop the aisles

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
    And the groceries_sections table contains:
      | id   | name      | position | status |
      | 4001 | Boucherie | 0        | active |
      | 4002 | Fruits    | 1        | active |
      | 4003 | Surgeles  | 2        | active |

  Scenario: PUT /groceries-sections/reorder as a project member — the sections are returned and stored in the new order
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PUT /api/features/tasks/groceries-sections/reorder with body:
      """
      {"feature_instance_id": "0100", "ordered_ids": ["4003", "4001", "4002"]}
      """
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "4003", "name": "Surgeles"},
        {"id": "4001", "name": "Boucherie"},
        {"id": "4002", "name": "Fruits"}
      ]
      """
    And the groceries_sections table contains:
      | id   | name      | position |
      | 4001 | Boucherie | 1        |
      | 4002 | Fruits    | 2        |
      | 4003 | Surgeles  | 0        |

  @error_case
  Scenario: PUT /groceries-sections/reorder as a project guest — 403 error and the order is not changed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    When I PUT /api/features/tasks/groceries-sections/reorder with body:
      """
      {"feature_instance_id": "0100", "ordered_ids": ["4003", "4001", "4002"]}
      """
    Then the response status code is 403
    And the groceries_sections table contains:
      | id   | name      | position |
      | 4001 | Boucherie | 0        |
      | 4002 | Fruits    | 1        |
      | 4003 | Surgeles  | 2        |
