Feature: Event force on dashboard
  As a project member
  I want to flag an event as "force on dashboard"
  So that it is highlighted for all project members

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
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 0030 | 0020       | Calendar  | events       | active |

  Scenario: POST /events — create event with force_on_dashboard true
    Given I am authenticated as admin: user.id 0001
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | all_day | force_on_dashboard | status |
    When I POST /api/events/ with body:
      """
      {
        "feature_instance_id": "0030",
        "title": "Company All-Hands",
        "start_at": "2026-07-01T09:00:00Z",
        "end_at": "2026-07-01T10:00:00Z",
        "all_day": false,
        "force_on_dashboard": true
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "title": "Company All-Hands", "force_on_dashboard": true }
      """
    And the events table contains:
      | feature_instance_id | title            | force_on_dashboard | status |
      | 0030                | Company All-Hands | true               | active |

  Scenario: PATCH /events/{id} — set force_on_dashboard to true on existing event
    Given I am authenticated as admin: user.id 0001
    And the events table contains:
      | id   | feature_instance_id | title      | start_at             | end_at               | all_day | force_on_dashboard | status |
      | 0050 | 0030                | Team sync  | 2026-07-01T09:00:00Z | 2026-07-01T10:00:00Z | false   | false              | active |
    When I PATCH /api/events/0050 with body:
      """
      { "force_on_dashboard": true }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "id": "0050", "force_on_dashboard": true }
      """
    And the events table contains:
      | id   | feature_instance_id | title     | force_on_dashboard | status |
      | 0050 | 0030                | Team sync | true               | active |
