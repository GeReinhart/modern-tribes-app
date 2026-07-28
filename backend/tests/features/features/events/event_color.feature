Feature: Event color
  As a project member
  I want to choose a color for an event from the app's available theme colors
  So that I can tell events apart at a glance on the month and day calendar views

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
      | id   | project_id | feature_type | name   | position | status |
      | 0040 | 0020       | events       | Events | 0        | active |

  Scenario: POST /events with a chosen color — the event is created with that color
    Given I am authenticated as an administrator: user.id 0001
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | all_day | color | status |
    When I POST /api/features/tasks/events/ with body:
      """
      {
        "feature_instance_id": "0040",
        "title": "Team kickoff",
        "start_at": "2026-07-01T10:00:00Z",
        "end_at": "2026-07-01T11:00:00Z",
        "all_day": false,
        "color": "#3CB371"
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "title": "Team kickoff", "color": "#3CB371" }
      """
    And the events table contains:
      | title        | color   | status |
      | Team kickoff | #3CB371 | active |

  Scenario: POST /events without a color — a default color is applied
    Given I am authenticated as an administrator: user.id 0001
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | all_day | color | status |
    When I POST /api/features/tasks/events/ with body:
      """
      {
        "feature_instance_id": "0040",
        "title": "Unplanned sync",
        "start_at": "2026-07-02T10:00:00Z",
        "end_at": "2026-07-02T11:00:00Z",
        "all_day": false
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      { "title": "Unplanned sync", "color": "#6b7280" }
      """
    And the events table contains:
      | title           | color   | status |
      | Unplanned sync  | #6b7280 | active |

  Scenario: PATCH /events/{id} — change the color of an existing event
    Given I am authenticated as an administrator: user.id 0001
    And the events table contains:
      | id   | feature_instance_id | title     | start_at             | end_at               | all_day | color   | status |
      | 0050 | 0040                 | Team sync | 2026-07-01T09:00:00Z | 2026-07-01T10:00:00Z | false   | #6b7280 | active |
    When I PATCH /api/features/tasks/events/0050 with body:
      """
      { "color": "#FF7F50" }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "id": "0050", "color": "#FF7F50" }
      """
    And the events table contains:
      | id   | feature_instance_id | title     | color   | status |
      | 0050 | 0040                 | Team sync | #FF7F50 | active |
