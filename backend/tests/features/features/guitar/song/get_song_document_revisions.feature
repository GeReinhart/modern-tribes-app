Feature: Get a song's description revision history
  As a project member
  I want to see previous versions of a song's description
  So that I can recover an earlier version if a change turns out to be wrong

  Background:
    Given the users table contains:
      | id   | email         | status |
      | 0002 | user@test.com | active |
    And the roles table contains:
      | name   | status |
      | viewer | active |
    And the role_permissions table contains:
      | role   | permission                 |
      | viewer | can_access_attached_tribes |
    And the user_roles table contains:
      | user          | role   |
      | user@test.com | viewer |
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Mia        | Member    | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name | status |
      | 0010 | Band | active |
    And the projects table contains:
      | id   | name      | status |
      | 0020 | Rehearsal | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | manager  |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | tempo_bpm | beats_per_bar | capo | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 87        | 4             | 2    | active |

  Scenario: GET revisions for a song that has never had a description saved — empty history
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/guitar-songs/songs/0200/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      []
      """

  Scenario: GET revisions for a song whose description was updated — the previous version is kept, current first
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"description_html": "<p>Old notes.</p>"}
      """
    And I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"description_html": "<p>New notes.</p>"}
      """
    And I GET /api/features/tasks/guitar-songs/songs/0200/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"content_html": "<p>New notes.</p>", "is_current": true},
        {"content_html": "<p>Old notes.</p>", "is_current": false}
      ]
      """

  @error_case
  Scenario: GET revisions for a song without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/guitar-songs/songs/0200/document/revisions
    Then the response status code is 403

  @error_case
  Scenario: GET revisions for an unknown song — 404 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/guitar-songs/songs/9999/document/revisions
    Then the response status code is 404
