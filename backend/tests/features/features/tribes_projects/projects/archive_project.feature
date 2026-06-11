Feature: Archive a project
  As a project manager or administrator
  I want to archive a project
  So that it is no longer active in the system

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

  Scenario: DELETE /projects/0010 as admin — project is archived
    Given I am authenticated as an administrator: user.id 0001
    And the projects table contains:
      | id   | name             | status |
      | 0010 | Website Redesign | active |
    When I DELETE /api/features/tribes-projects/projects/0010
    Then the response status code is 204
    And the projects table contains:
      | id   | name             | status   |
      | 0010 | Website Redesign | archived |

  Scenario: DELETE /projects/0010 as project manager — project is archived
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
      | id   | name             | status |
      | 0010 | Website Redesign | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0030     | 0010       | manager  |
    When I DELETE /api/features/tribes-projects/projects/0010
    Then the response status code is 204
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

  @error_case
  Scenario: DELETE /projects/0010 as a viewer without project access — 403 error and the project is not archived
    Given I am authenticated as a regular user: user.id 0002
    And the projects table contains:
      | id   | name             | status |
      | 0010 | Website Redesign | active |
    When I DELETE /api/features/tribes-projects/projects/0010
    Then the response status code is 403
    And the projects table contains:
      | id   | name             | status |
      | 0010 | Website Redesign | active |
