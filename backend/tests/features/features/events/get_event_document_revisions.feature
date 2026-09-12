Feature: Get an event's description revision history
  As a project member
  I want to see previous versions of an event's description
  So that I can recover an earlier version if a change turns out to be wrong

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
    And the events table contains:
      | id   | feature_instance_id | title     | start_at             | end_at               | all_day | status |
      | 0050 | 0040                 | Team sync | 2026-07-01T09:00:00Z | 2026-07-01T10:00:00Z | false   | active |

  Scenario: GET revisions for an event that has never had a description saved — empty history
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/events/0050/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      []
      """

  Scenario: GET revisions for an event whose description was updated — the previous version is kept, current first
    Given I am authenticated as an administrator: user.id 0001
    And the documents table contains:
      | id   | content_html      | status |
      | 0500 | <p>Old notes.</p> | active |
    And the events table contains:
      | id   | feature_instance_id | title     | document_id | status |
      | 0050 | 0040                 | Team sync | 0500        | active |
    When I PATCH /api/features/tasks/events/0050 with body:
      """
      { "document_content_html": "<p>New notes.</p>" }
      """
    And I GET /api/features/tasks/events/0050/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"content_html": "<p>New notes.</p>", "is_current": true},
        {"content_html": "<p>Old notes.</p>", "is_current": false}
      ]
      """

  @error_case
  Scenario: GET revisions for an event without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/events/0050/document/revisions
    Then the response status code is 403

  @error_case
  Scenario: GET revisions for an unknown event — 404 error
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/events/9999/document/revisions
    Then the response status code is 404
