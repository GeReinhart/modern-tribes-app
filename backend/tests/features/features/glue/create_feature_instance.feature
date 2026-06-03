Feature: Create a feature instance on a project
  As a project manager
  I want to attach a feature to a project
  So that the team can use it via a tab

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

  Scenario: POST /feature-instances/projects/0100/features as admin — the instance is created
    Given I am authenticated as an administrator: user.id 0001
    And the projects_features table contains:
      | id | project_id | name | feature_type | status |
    When I POST /api/features/glue/feature-instances/projects/0100/features with body:
      """
      {"name": "Team Board", "feature_type": "kanban"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "project_id": "0100",
        "feature_type": "kanban",
        "name": "Team Board",
        "status": "active",
        "position": 0
      }
      """
    And the projects_features table contains:
      | project_id | name       | feature_type | status |
      | 0100       | Team Board | kanban       | active |

  @error_case
  Scenario: POST /feature-instances/projects/0100/features as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the projects_features table contains:
      | id | project_id | name | feature_type | status |
    When I POST /api/features/glue/feature-instances/projects/0100/features with body:
      """
      {"name": "Team Board", "feature_type": "kanban"}
      """
    Then the response status code is 403
    And the projects_features table contains:
      | id | project_id | name | feature_type | status |
