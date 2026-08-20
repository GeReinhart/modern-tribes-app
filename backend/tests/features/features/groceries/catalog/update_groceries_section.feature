@wip
Feature: Rename a groceries section
  As a project member
  I want to rename a catalog section
  So that I can fix a typo or reword it

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
      | id   | name      | status |
      | 4001 | Boucherie | active |

  Scenario: PATCH /groceries-sections/4001 as a project member — the section is renamed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-sections/4001 with body:
      """
      {"feature_instance_id": "0100", "name": "Butchery"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "4001",
        "name": "Butchery"
      }
      """
    And the groceries_sections table contains:
      | id   | name     | status |
      | 4001 | Butchery | active |

  Scenario: PATCH /groceries-sections/4001 with only an icon — the name is unchanged
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-sections/4001 with body:
      """
      {"feature_instance_id": "0100", "icon": "carrot"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "4001",
        "name": "Boucherie",
        "icon": "carrot"
      }
      """
    And the groceries_sections table contains:
      | id   | name      | icon   | status |
      | 4001 | Boucherie | carrot | active |

  @error_case
  Scenario: PATCH /groceries-sections/4001 as a project guest — 403 error and the section is not renamed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    When I PATCH /api/features/tasks/groceries-sections/4001 with body:
      """
      {"feature_instance_id": "0100", "name": "Butchery"}
      """
    Then the response status code is 403
    And the groceries_sections table contains:
      | id   | name      | status |
      | 4001 | Boucherie | active |

  @error_case
  Scenario: PATCH /groceries-sections/9999 on a non-existent section — 404 error
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/groceries-sections/9999 with body:
      """
      {"feature_instance_id": "0100", "name": "Butchery"}
      """
    Then the response status code is 404
