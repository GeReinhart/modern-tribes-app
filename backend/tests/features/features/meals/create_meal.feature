@wip
Feature: Create a meal
  As a project member
  I want to plan a meal with a date, a time range and a headcount
  So that the team knows what's for dinner and for how many people

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
    And the tribes table contains:
      | id   | name    | status |
      | 0010 | DevTeam | active |
    And the projects table contains:
      | id   | name  | status |
      | 0020 | Alpha | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0010     | 0020       |
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Alice      | Smith     | active |
    And the positions table contains:
      | tribe_id | person_id | position |
      | 0010     | 0030      | member   |
    And the projects_features table contains:
      | id   | project_id | feature_type | name  | position | status |
      | 0041 | 0020       | meals        | Meals | 0        | active |

  Scenario: POST /meals with valid body as admin — the meal is created
    Given I am authenticated as an administrator: user.id 0001
    And the meals table contains:
      | id | feature_instance_id | title | start_at | end_at | headcount | status |
    When I POST /api/features/tasks/meals/ with body:
      """
      {
        "feature_instance_id": "0041",
        "title": "Family dinner",
        "start_at": "2026-09-05T19:00:00Z",
        "end_at": "2026-09-05T20:30:00Z",
        "headcount": 8
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "title": "Family dinner",
        "headcount": 8
      }
      """
    And the meals table contains:
      | title         | headcount | status |
      | Family dinner | 8         | active |

  @error_case
  Scenario: POST /meals with a missing headcount — 422 error and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the meals table contains:
      | id | feature_instance_id | title | start_at | end_at | headcount | status |
    When I POST /api/features/tasks/meals/ with body:
      """
      {
        "feature_instance_id": "0041",
        "title": "Family dinner",
        "start_at": "2026-09-05T19:00:00Z",
        "end_at": "2026-09-05T20:30:00Z"
      }
      """
    Then the response status code is 422
    And the meals table contains:
      | id | feature_instance_id | title | start_at | end_at | headcount | status |

  @error_case
  Scenario: POST /meals as a user with no app access — 403 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the meals table contains:
      | id | feature_instance_id | title | start_at | end_at | headcount | status |
    When I POST /api/features/tasks/meals/ with body:
      """
      {
        "feature_instance_id": "0041",
        "title": "Hidden dinner",
        "start_at": "2026-09-05T19:00:00Z",
        "end_at": "2026-09-05T20:30:00Z",
        "headcount": 8
      }
      """
    Then the response status code is 403
    And the meals table contains:
      | id | feature_instance_id | title | start_at | end_at | headcount | status |
