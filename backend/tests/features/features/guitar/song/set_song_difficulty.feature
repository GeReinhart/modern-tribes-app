Feature: Set a guitar song's difficulty level
  As a project member
  I want to rate how hard a song is to play
  So that the band can pick songs that match their skill level

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

  Scenario: PATCH a song's difficulty as a member — it is updated
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | difficulty | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  |            | draft      | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"difficulty": 1}
      """
    Then the response status code is 200
    And the guitar_songs table contains:
      | id   | project_id | title      | author | difficulty | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | 1          | draft      | active |

  @error_case
  Scenario: PATCH a song's difficulty on a completed song — 409 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | difficulty | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  |            | completed  | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"difficulty": 4}
      """
    Then the response status code is 409
    And the guitar_songs table contains:
      | id   | project_id | title      | author | difficulty | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  |            | completed  | active |

  @error_case
  Scenario: PATCH a song's difficulty out of range — 422 error and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | difficulty | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  |            | draft      | active |
    When I PATCH /api/features/tasks/guitar-songs/songs/0200 with body:
      """
      {"difficulty": 6}
      """
    Then the response status code is 422
    And the guitar_songs table contains:
      | id   | project_id | title      | author | difficulty | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  |            | draft      | active |
