Feature: Reorder projects in a tribe
  As a tribe manager
  I want to reorder projects displayed in the tribe page
  So that I can control the order in which they appear

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

  Scenario: PUT /projects/by/tribe/{tribe_id}/order as manager — projects are reordered
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0030 | Alice      | Manager   | female | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | manager  | active |
    And the projects table contains:
      | id   | name  | status |
      | 0020 | Alpha | active |
      | 0021 | Beta  | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation | display_order |
      | 0010     | 0020       | member   | 0             |
      | 0010     | 0021       | member   | 1             |
    When I PUT /api/features/tribes-projects/projects/by/tribe/0010/order with body:
      """
      {"ordered_ids": ["0021", "0020"]}
      """
    Then the response status code is 200
    And the tribes_projects table contains:
      | tribe_id | project_id | display_order |
      | 0010     | 0020       | 1             |
      | 0010     | 0021       | 0             |

  @error_case
  Scenario: PUT /projects/by/tribe/{tribe_id}/order as member — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0030 | Bob        | Member    | male   | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the projects table contains:
      | id   | name  | status |
      | 0020 | Alpha | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation | display_order |
      | 0010     | 0020       | member   | 0             |
    When I PUT /api/features/tribes-projects/projects/by/tribe/0010/order with body:
      """
      {"ordered_ids": ["0020"]}
      """
    Then the response status code is 403
    And the tribes_projects table contains:
      | tribe_id | project_id | display_order |
      | 0010     | 0020       | 0             |
