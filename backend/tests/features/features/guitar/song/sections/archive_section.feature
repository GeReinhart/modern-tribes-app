Feature: Remove a section from a guitar song
  As a project manager
  I want to remove a section from a song's structure
  So that I can drop a part the band no longer plays

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
    And the projects table contains:
      | id   | name      | status |
      | 0020 | Rehearsal | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | status |
      | 0500 | 0200    | 1        | Bridge     | lyrics       | active |

  Scenario: Manager removes a section — it is archived
    Given I am authenticated as an administrator: user.id 0001
    When I DELETE /api/features/tasks/guitar-songs/sections/0500
    Then the response status code is 204
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | status   |
      | 0500 | 0200    | 1        | Bridge     | archived |

  @error_case
  Scenario: Member (not manager) tries to remove a section — 403 error and it stays active
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | status |
      | 0030 | Mia        | Member    | active |
    And the users table contains:
      | id   | email         | person_id | status |
      | 0002 | user@test.com | 0030      | active |
    And the tribes table contains:
      | id   | name | status |
      | 0010 | Band | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0020       | manager  |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I DELETE /api/features/tasks/guitar-songs/sections/0500
    Then the response status code is 403
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | status |
      | 0500 | 0200    | 1        | Bridge     | active |
