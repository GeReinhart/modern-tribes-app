@wip
Feature: Update a feature instance on a project
  As a project manager
  I want to rename a feature instance
  So that its tab label stays accurate

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

  Scenario: PATCH /feature-instances/projects/0100/features/0010 as admin — the instance is updated
    Given I am authenticated as an administrator: user.id 0001
    And the projects_features table contains:
      | id   | project_id | name  | feature_type | status |
      | 0010 | 0100       | Board | kanban       | active |
    When I PATCH /api/features/glue/feature-instances/projects/0100/features/0010 with body:
      """
      {"name": "Sprint Board"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {
        "id": "0010",
        "project_id": "0100",
        "feature_type": "kanban",
        "name": "Sprint Board",
        "status": "active"
      }
      """
    And the projects_features table contains:
      | id   | project_id | name         | feature_type | status |
      | 0010 | 0100       | Sprint Board | kanban       | active |

  @error_case
  Scenario: PATCH /feature-instances/projects/0100/features/0010 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the projects_features table contains:
      | id   | project_id | name  | feature_type | status |
      | 0010 | 0100       | Board | kanban       | active |
    When I PATCH /api/features/glue/feature-instances/projects/0100/features/0010 with body:
      """
      {"name": "Sprint Board"}
      """
    Then the response status code is 403
    And the projects_features table contains:
      | id   | project_id | name  | feature_type | status |
      | 0010 | 0100       | Board | kanban       | active |
