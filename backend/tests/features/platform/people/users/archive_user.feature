@wip
Feature: Archive a user
  As an administrator
  I want to archive a user account
  So that they can no longer access the platform

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

  Scenario: DELETE /users/0010 as admin — user is archived
    Given I am authenticated as an administrator: user.id 0001
    And the managed_users table contains:
      | id   | url_param_id | login | email        | status |
      | 0010 | url001       | bob   | bob@test.com | active |
    When I DELETE /api/platform/functions/people/users/0010
    Then the response status code is 204
    And the managed_users table contains:
      | id | login | email | status |

  @error_case
  Scenario: DELETE /users/0010 as a viewer — 403 error and the user is not archived
    Given I am authenticated as a regular user: user.id 0002
    And the managed_users table contains:
      | id   | url_param_id | login | email        | status |
      | 0010 | url001       | bob   | bob@test.com | active |
    When I DELETE /api/platform/functions/people/users/0010
    Then the response status code is 403
    And the managed_users table contains:
      | id   | login | email        | status |
      | 0010 | bob   | bob@test.com | active |
