Feature: Manage the chord sequence of a chords-only section
  As a project member
  I want to build an ordered chord sequence for a chords-only section (e.g. an intro riff)
  So that I know exactly which chords to strum, in order, with no lyrics attached

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
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | status |
      | 0510 | 0200    | 1        | Intro      | chords_only  | active |
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
      | 0301 | G    | G         | [3,2,0,0,0,3] | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |

  Scenario: POST a chord onto a chords-only section — it lands at the next position and joins the song's chord list
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_section_chords table contains:
      | id | section_id | chord_id | position | status |
    And the guitar_songs_chords table contains:
      | id | song_id | chord_id | position | status |
    When I POST /api/features/tasks/guitar-songs/sections/0510/chords with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 201
    And the guitar_songs_section_chords table contains:
      | section_id | chord_id | position | status |
      | 0510       | 0300     | 1        | active |
    And the guitar_songs_chords table contains:
      | song_id | chord_id | position | status |
      | 0200    | 0300     | 1        | active |

  Scenario: POST the same chord twice onto a chords-only section — repeats are allowed, each at its own position
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_section_chords table contains:
      | id   | section_id | chord_id | position | status |
      | 0800 | 0510       | 0300     | 1        | active |
    When I POST /api/features/tasks/guitar-songs/sections/0510/chords with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 201
    And the guitar_songs_section_chords table contains:
      | section_id | chord_id | position | status |
      | 0510       | 0300     | 1        | active |
      | 0510       | 0300     | 2        | active |

  Scenario: DELETE a chord from a chords-only section — it is removed from the section but stays in the song's chord list
    Given I am authenticated as an administrator: user.id 0001
    And the guitar_songs_section_chords table contains:
      | id   | section_id | chord_id | position | status |
      | 0800 | 0510       | 0300     | 1        | active |
      | 0801 | 0510       | 0301     | 2        | active |
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0700 | 0200    | 0300     | 1        | active |
      | 0701 | 0200    | 0301     | 2        | active |
    When I DELETE /api/features/tasks/guitar-songs/section-chords/0800
    Then the response status code is 204
    And the guitar_songs_section_chords table contains:
      | section_id | chord_id | position | status |
      | 0510       | 0301     | 2        | active |
    And the guitar_songs_chords table contains:
      | song_id | chord_id | position | status |
      | 0200    | 0300     | 1        | active |
      | 0200    | 0301     | 2        | active |

  @error_case
  Scenario: POST a chord onto a lyrics-mode section — 409 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | status |
      | 0520 | 0200    | 2        | Couplet    | lyrics       | active |
    And the guitar_songs_section_chords table contains:
      | id | section_id | chord_id | position | status |
    When I POST /api/features/tasks/guitar-songs/sections/0520/chords with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 409
    And the guitar_songs_section_chords table contains:
      | id | section_id | chord_id | position | status |
