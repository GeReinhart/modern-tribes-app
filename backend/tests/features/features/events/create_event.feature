Feature: Create an event
  As a project member
  I want to create an event in a project tab
  So that the team can see upcoming gatherings on the calendar

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
      | id   | project_id | feature_type | name   | position | status |
      | 0040 | 0020       | events       | Events | 0        | active |

  Scenario: POST /events with valid body as admin — the event is created
    Given I am authenticated as an administrator: user.id 0001
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | all_day | status |
    When I POST /api/features/tasks/events/ with body:
      """
      {
        "feature_instance_id": "0040",
        "title": "Team kickoff",
        "start_at": "2026-07-01T10:00:00Z",
        "end_at": "2026-07-01T11:00:00Z",
        "all_day": false
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "title": "Team kickoff",
        "all_day": false
      }
      """
    And the events table contains:
      | title        | all_day | status |
      | Team kickoff | false   | active |

  Scenario: POST /events with all_day true — end time stored as given
    Given I am authenticated as an administrator: user.id 0001
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | all_day | status |
    When I POST /api/features/tasks/events/ with body:
      """
      {
        "feature_instance_id": "0040",
        "title": "Company day off",
        "start_at": "2026-08-15T00:00:00Z",
        "end_at": "2026-08-15T23:59:00Z",
        "all_day": true
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {"title": "Company day off", "all_day": true}
      """
    And the events table contains:
      | title           | all_day | status |
      | Company day off | true    | active |

  Scenario: POST /events with document_content_html — note is saved and linked
    Given I am authenticated as an administrator: user.id 0001
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | all_day | status |
    And the documents table contains:
      | id | content_html | content_text |
    When I POST /api/features/tasks/events/ with body:
      """
      {
        "feature_instance_id": "0040",
        "title": "Team retrospective",
        "start_at": "2026-07-10T14:00:00Z",
        "end_at": "2026-07-10T15:00:00Z",
        "all_day": false,
        "document_content_html": "<p>Discuss sprint results</p>"
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "title": "Team retrospective",
        "document_content_html": "<p>Discuss sprint results</p>"
      }
      """
    And the events table contains:
      | title              | status |
      | Team retrospective | active |
    And the documents table contains:
      | content_html                   |
      | <p>Discuss sprint results</p>  |

  Scenario: POST /events with size — effort points are stored
    Given I am authenticated as an administrator: user.id 0001
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | all_day | status |
    When I POST /api/features/tasks/events/ with body:
      """
      {
        "feature_instance_id": "0040",
        "title": "Planning session",
        "start_at": "2026-07-15T09:00:00Z",
        "end_at": "2026-07-15T10:00:00Z",
        "all_day": false,
        "size": 5
      }
      """
    Then the response status code is 201
    And the response body includes:
      """
      {"title": "Planning session", "size": 5}
      """
    And the events table contains:
      | title            | size | status |
      | Planning session | 5    | active |

  @error_case
  Scenario: POST /events as user with no app access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | all_day | status |
    When I POST /api/features/tasks/events/ with body:
      """
      {
        "feature_instance_id": "0040",
        "title": "Hidden event",
        "start_at": "2026-07-01T10:00:00Z",
        "end_at": "2026-07-01T11:00:00Z",
        "all_day": false
      }
      """
    Then the response status code is 403
    And the events table contains:
      | id | feature_instance_id | title | start_at | end_at | all_day | status |
