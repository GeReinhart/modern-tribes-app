Feature: Reorder chords within a chords-only section
  As a project manager
  I want to move a chord up or down in a chords-only section's sequence
  So that the strumming order matches how the part is actually played

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
    And the role_permissions table contains:
      | role          | permission |
      | administrator | admin      |
    And the user_roles table contains:
      | user           | role          |
      | admin@test.com | administrator |
    And the projects table contains:
      | id   | name      | status |
      | 0020 | Rehearsal | active |
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
    And the guitar_songs_section_chords table contains:
      | id   | section_id | chord_id | position | status |
      | 0800 | 0510       | 0300     | 1        | active |
      | 0801 | 0510       | 0301     | 2        | active |

  Scenario: Manager moves the second chord up — it swaps position with the first
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/guitar-songs/section-chords/0801/move with body:
      """
      {"direction": "prev"}
      """
    Then the response status code is 200
    And the guitar_songs_section_chords table contains:
      | id   | section_id | chord_id | position | status |
      | 0800 | 0510       | 0300     | 2        | active |
      | 0801 | 0510       | 0301     | 1        | active |
