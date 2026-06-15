Feature: Update a role
  As an administrator
  I want to update a role's name
  So that roles are accurately described

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

  Scenario: PUT /roles/0010 with valid body as admin — the role is updated
    Given I am authenticated as an administrator: user.id 0001
    And the managed_roles table contains:
      | id   | name   | status |
      | 0010 | editor | active |
    When I PUT /api/platform/core/authorization/roles/0010 with body:
      """
      {"name": "reviewer"}
      """
    Then the response status code is 200
    And the managed_roles table contains:
      | id   | name     | status |
      | 0010 | reviewer | active |

  @error_case
  Scenario: PUT /roles/0010 as a viewer — 403 error and the role is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the managed_roles table contains:
      | id   | name   | status |
      | 0010 | editor | active |
    When I PUT /api/platform/core/authorization/roles/0010 with body:
      """
      {"name": "reviewer"}
      """
    Then the response status code is 403
    And the managed_roles table contains:
      | id   | name   | status |
      | 0010 | editor | active |
