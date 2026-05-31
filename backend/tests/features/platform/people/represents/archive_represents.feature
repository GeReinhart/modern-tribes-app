@wip
Feature: Archive a represents link
  As an administrator
  I want to archive a user–person link
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

  Scenario: DELETE /represents/0030 as admin — link is archived
    Given I am authenticated as an administrator: user.id 0001
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0020 | Alice      | Dupont    | female | active |
    And the represents table contains:
      | id   | user_id | person_id | status |
      | 0030 | 0002    | 0020      | active |
    When I DELETE /api/platform/functions/people/represents/0030
    Then the response status code is 204
    And the represents table contains:
      | id   | user_id | person_id | status   |
      | 0030 | 0002    | 0020      | archived |

  @error_case
  Scenario: DELETE /represents/0030 as a viewer — 403 error and the link is not archived
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0020 | Alice      | Dupont    | female | active |
    And the represents table contains:
      | id   | user_id | person_id | status |
      | 0030 | 0002    | 0020      | active |
    When I DELETE /api/platform/functions/people/represents/0030
    Then the response status code is 403
    And the represents table contains:
      | id   | user_id | person_id | status |
      | 0030 | 0002    | 0020      | active |
