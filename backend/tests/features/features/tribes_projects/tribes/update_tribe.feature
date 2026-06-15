Feature: Update a tribe
  As an administrator
  I want to update a tribe's name
  So that it stays accurately named

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

  Scenario: PUT /tribes/0010 with valid body as admin — the tribe is updated
    Given I am authenticated as an administrator: user.id 0001
    And the tribes table contains:
      | id   | url_param_id | name        | status |
      | 0010 | url001       | Engineering | active |
    When I PUT /api/features/tribes-projects/tribes/0010 with body:
      """
      {"name": "Platform"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "0010",
        "name": "Platform",
        "status": "active"
      }
      """
    And the tribes table contains:
      | id   | name     | status |
      | 0010 | Platform | active |

  @error_case
  Scenario: PUT /tribes/0010 as a viewer — 403 error and the tribe is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the tribes table contains:
      | id   | url_param_id | name        | status |
      | 0010 | url001       | Engineering | active |
    When I PUT /api/features/tribes-projects/tribes/0010 with body:
      """
      {"name": "Platform"}
      """
    Then the response status code is 403
    And the tribes table contains:
      | id   | name        | status |
      | 0010 | Engineering | active |
