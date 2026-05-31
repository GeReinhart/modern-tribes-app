@wip
Feature: Update a represents link
  As an administrator
  I want to update a user–person link
  So that it reflects changes in the organisation

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

  Scenario: PUT /represents/0030 with valid fields as admin — link is updated
    Given I am authenticated as an administrator: user.id 0001
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0020 | Alice      | Dupont    | female | active |
      | 0021 | Bob        | Martin    | male   | active |
    And the represents table contains:
      | id   | user_id | person_id | status |
      | 0030 | 0002    | 0020      | active |
    When I PUT /api/platform/functions/people/represents/0030 with body:
      """
      {
        "person_id": "0021"
      }
      """
    Then the response status code is 200
    And the represents table contains:
      | id   | user_id | person_id | status |
      | 0030 | 0002    | 0021      | active |

  @error_case
  Scenario: PUT /represents/0030 as a viewer — 403 error and the link is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0020 | Alice      | Dupont    | female | active |
      | 0021 | Bob        | Martin    | male   | active |
    And the represents table contains:
      | id   | user_id | person_id | status |
      | 0030 | 0002    | 0020      | active |
    When I PUT /api/platform/functions/people/represents/0030 with body:
      """
      {
        "person_id": "0021"
      }
      """
    Then the response status code is 403
    And the represents table contains:
      | id   | user_id | person_id | status |
      | 0030 | 0002    | 0020      | active |
