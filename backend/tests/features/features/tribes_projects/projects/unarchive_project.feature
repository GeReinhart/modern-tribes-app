Feature: Unarchive a project
  As a project manager or administrator
  I want to reactivate an archived project
  So that it becomes active again in the tribe

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

  Scenario: PATCH /projects/0010/unarchive as admin — project is reactivated
    Given I am authenticated as an administrator: user.id 0001
    And the projects table contains:
      | id   | name             | status   |
      | 0010 | Website Redesign | archived |
    When I PATCH /api/features/tribes-projects/projects/0010/unarchive
    Then the response status code is 200
    And the projects table contains:
      | id   | name             | status |
      | 0010 | Website Redesign | active |

  Scenario: PATCH /projects/0010/unarchive as project manager — project is reactivated
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0020 | Alice      | Manager   | active |
    And the represents table contains:
      | user_id | person_id |
      | 0002    | 0020      |
    And the tribes table contains:
      | id   | name        | status |
      | 0030 | Alpha Tribe | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 0040 | 0030     | 0020      | manager  | active |
    And the projects table contains:
      | id   | name             | status   |
      | 0010 | Website Redesign | archived |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0030     | 0010       | manager  |
    When I PATCH /api/features/tribes-projects/projects/0010/unarchive
    Then the response status code is 200
    And the projects table contains:
      | id   | name             | status |
      | 0010 | Website Redesign | active |
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0020 | Alice      | Manager   | active |

  @error_case
  Scenario: PATCH /projects/0010/unarchive as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the projects table contains:
      | id   | name             | status   |
      | 0010 | Website Redesign | archived |
    When I PATCH /api/features/tribes-projects/projects/0010/unarchive
    Then the response status code is 403
    And the projects table contains:
      | id   | name             | status   |
      | 0010 | Website Redesign | archived |
