Feature: Associate persons with an event
  As a project member
  I want to assign team members to an event
  So that attendees are clearly listed on the calendar

  Background:
    Given the users table contains:
      | id   | email             | status |
      | 0001 | admin@test.com    | active |
      | 0002 | outsider@test.com | active |
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
      | 0031 | Bob        | Jones     | active |
    And the positions table contains:
      | tribe_id | person_id | position |
      | 0010     | 0030      | member   |
      | 0010     | 0031      | member   |
    And the projects_features table contains:
      | id   | project_id | feature_type | name   | position | status |
      | 0040 | 0020       | events       | Events | 0        | active |
    And the events table contains:
      | id   | feature_instance_id | title     | start_at             | end_at               | all_day | status |
      | 0050 | 0040                | Team sync | 2026-07-01T10:00:00Z | 2026-07-01T11:00:00Z | false   | active |

  Scenario: POST /{event_id}/participants sets the participant list
    Given I am authenticated as an administrator: user.id 0001
    And the events_participants table contains:
      | id | event_id | person_id | status |
    When I POST /api/features/tasks/events/0050/participants with body:
      """
      ["0030", "0031"]
      """
    Then the response status code is 200
    And the events_participants table contains:
      | event_id | person_id | status |
      | 0050     | 0030      | active |
      | 0050     | 0031      | active |

  Scenario: POST /{event_id}/participants replaces existing participants
    Given I am authenticated as an administrator: user.id 0001
    And the events_participants table contains:
      | id   | event_id | person_id | status |
      | 0060 | 0050     | 0030      | active |
    When I POST /api/features/tasks/events/0050/participants with body:
      """
      ["0031"]
      """
    Then the response status code is 200
    And the events_participants table contains:
      | event_id | person_id | status   |
      | 0050     | 0030      | archived |
      | 0050     | 0031      | active   |

  @error_case
  Scenario: POST /{event_id}/participants as a non-project user — 403
    Given I am authenticated as a regular user: user.id 0002
    And the events_participants table contains:
      | id | event_id | person_id | status |
    When I POST /api/features/tasks/events/0050/participants with body:
      """
      ["0030"]
      """
    Then the response status code is 403
    And the events_participants table contains:
      | id | event_id | person_id | status |
