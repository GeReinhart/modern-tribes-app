Feature: List accessible events
  As a project member
  I want to see all events from projects I can access
  So that I can plan across all my projects

  Background:
    Given the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Alice      | Smith     | active |
      | 0031 | Bob        | Jones     | active |
    And the users table contains:
      | id   | email             | person_id | status |
      | 0001 | admin@test.com    |           | active |
      | 0002 | member@test.com   | 0030      | active |
      | 0003 | outsider@test.com |           | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
      | viewer        | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | administrator | admin                      |
      | viewer        | can_access_attached_tribes |
    And the user_roles table contains:
      | user              | role          |
      | admin@test.com    | administrator |
      | member@test.com   | viewer        |
      | outsider@test.com | viewer        |
    And the tribes table contains:
      | id   | name    | status |
      | 0010 | DevTeam | active |
    And the projects table contains:
      | id   | name  | status |
      | 0020 | Alpha | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0010     | 0020       |
    And the positions table contains:
      | tribe_id | person_id | position |
      | 0010     | 0030      | member   |
    And the projects_features table contains:
      | id   | project_id | feature_type | name   | position | status |
      | 0040 | 0020       | events       | Events | 0        | active |
    And the events table contains:
      | id   | feature_instance_id | title        | start_at                  | end_at                    | all_day | status |
      | 0050 | 0040                | Team kickoff | 2026-07-01T10:00:00+00:00 | 2026-07-01T11:00:00+00:00 | false   | active |

  Scenario: GET /events/accessible as a project member — returns events from accessible projects
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/events/accessible
    Then the response status code is 200
    And the response body includes:
      """
      [{"title": "Team kickoff", "project_name": "Alpha"}]
      """

  Scenario: GET /events/accessible as admin — returns all events
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/events/accessible
    Then the response status code is 200
    And the response body includes:
      """
      [{"title": "Team kickoff"}]
      """

  Scenario: GET /events/accessible as outsider with no project access — returns empty list
    Given I am authenticated as the person's owner: user.id 0003
    When I GET /api/features/tasks/events/accessible
    Then the response status code is 200
    And the response body is:
      """
      []
      """
