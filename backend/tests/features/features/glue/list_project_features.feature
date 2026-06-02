@wip
Feature: List project feature instances
  As an administrator
  I want to list the feature instances attached to a project
  So that I can manage the project's available features

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
    And the projects table contains:
      | id   | name    | status |
      | 0100 | Project | active |
    And the projects_features table contains:
      | id   | project_id | name  | feature_type | status |
      | 0010 | 0100       | Board | kanban       | active |

  Scenario: GET /feature-instances/projects/0100/features as admin — feature instances are returned
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/glue/feature-instances/projects/0100/features
    Then the response status code is 200
    And the response body includes:
      """
      [
        {
          "id": "0010",
          "project_id": "0100",
          "feature_type": "kanban",
          "name": "Board",
          "status": "active",
          "position": 0
        }
      ]
      """

  @error_case
  Scenario: GET /feature-instances/projects/0100/features as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/glue/feature-instances/projects/0100/features
    Then the response status code is 403
