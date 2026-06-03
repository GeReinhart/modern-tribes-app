Feature: Update a user
  As an administrator
  I want to update a user account
  So that their information stays current

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

  Scenario: PUT /users/0010 with valid fields as admin — user is updated
    Given I am authenticated as an administrator: user.id 0001
    And the managed_users table contains:
      | id   | url_param_id | login | email        | status |
      | 0010 | url001       | bob   | bob@test.com | active |
    When I PUT /api/platform/functions/people/users/0010 with body:
      """
      {
        "login": "bobby",
        "email": "bobby@test.com"
      }
      """
    Then the response status code is 200
    And the managed_users table contains:
      | id   | login | email          | status |
      | 0010 | bobby | bobby@test.com | active |

  @error_case
  Scenario: PUT /users/0010 as a viewer — 403 error and the user is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the managed_users table contains:
      | id   | url_param_id | login | email        | status |
      | 0010 | url001       | bob   | bob@test.com | active |
    When I PUT /api/platform/functions/people/users/0010 with body:
      """
      {
        "login": "bobby",
        "email": "bobby@test.com"
      }
      """
    Then the response status code is 403
    And the managed_users table contains:
      | id   | login | email        | status |
      | 0010 | bob   | bob@test.com | active |
