Feature: List guitar songs
  As a project member
  I want to see all the songs in the project's songbook
  So that I can pick one to practice

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
      | id   | project_id | title      | author           | tempo_bpm | beats_per_bar | status |
      | 0200 | 0020       | Wonderwall | Oasis            | 87        | 4             | active |
      | 0201 | 0020       | Zombie     | The Cranberries  | 84        | 4             | active |

  Scenario: GET a project's songs as a member — the project's active songs are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0200", "title": "Wonderwall"},
        {"id": "0201", "title": "Zombie"}
      ]
      """

  Scenario: GET a project's songs as a guest — read access is allowed
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs
    Then the response status code is 200

  @error_case
  Scenario: GET a project's songs with no project membership — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs
    Then the response status code is 403
