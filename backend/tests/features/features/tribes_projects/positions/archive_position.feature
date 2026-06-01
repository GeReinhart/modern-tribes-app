@wip
Feature: Archive a position
  As an administrator
  I want to archive a position
  So that a person is no longer assigned to that tribe role

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

  Scenario: DELETE /positions/0010 as admin — position is archived
    Given I am authenticated as an administrator: user.id 0001
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 0010 | 0020     | 0030      | member   | active |
    When I DELETE /api/features/tribes-projects/positions/0010
    Then the response status code is 204
    And the positions table contains:
      | id   | tribe_id | person_id | position | status   |
      | 0010 | 0020     | 0030      | member   | archived |

  @error_case
  Scenario: DELETE /positions/0010 as a viewer — 403 error and the position is not archived
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 0010 | 0020     | 0030      | member   | active |
    When I DELETE /api/features/tribes-projects/positions/0010
    Then the response status code is 403
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 0010 | 0020     | 0030      | member   | active |
