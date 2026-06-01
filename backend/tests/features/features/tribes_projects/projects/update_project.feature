@wip
Feature: Update a project
  As an administrator
  I want to update a project's name
  So that it stays accurately described

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

  Scenario: PUT /projects/0010 with valid body as admin — the project is updated
    Given I am authenticated as an administrator: user.id 0001
    And the projects table contains:
      | id   | url_param_id | name             | status |
      | 0010 | url001       | Website Redesign | active |
    When I PUT /api/features/tribes-projects/projects/0010 with body:
      """
      {"name": "Mobile App"}
      """
    Then the response status code is 200
    And the projects table contains:
      | id   | name       | status |
      | 0010 | Mobile App | active |

  @error_case
  Scenario: PUT /projects/0010 as a viewer — 403 error and the project is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the projects table contains:
      | id   | url_param_id | name             | status |
      | 0010 | url001       | Website Redesign | active |
    When I PUT /api/features/tribes-projects/projects/0010 with body:
      """
      {"name": "Mobile App"}
      """
    Then the response status code is 403
    And the projects table contains:
      | id   | name             | status |
      | 0010 | Website Redesign | active |
