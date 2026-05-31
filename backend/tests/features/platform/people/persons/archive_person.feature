@wip
Feature: Archive a person
  As an administrator
  I want to archive a person record
  So that they are no longer active in the system

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

  Scenario: DELETE /persons/0010 as admin — person is archived
    Given I am authenticated as an administrator: user.id 0001
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0010 | Alice      | Dupont    | female | active |
    When I DELETE /api/platform/functions/people/persons/0010
    Then the response status code is 204
    And the persons table contains:
      | id   | first_name | last_name | gender | status   |
      | 0010 | Alice      | Dupont    | female | archived |

  @error_case
  Scenario: DELETE /persons/0010 as a viewer — 403 error and the person is not archived
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0010 | Alice      | Dupont    | female | active |
    When I DELETE /api/platform/functions/people/persons/0010
    Then the response status code is 403
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0010 | Alice      | Dupont    | female | active |
