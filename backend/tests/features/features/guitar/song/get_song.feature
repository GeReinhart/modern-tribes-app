Feature: Get a song with its overall chord list
  As a project member
  I want a song's own chord list to reflect every "Chords" piece on its page
  So that the chord grid and lyrics-word chord pickers offer every chord I've added, however many
    Chords pieces I've split them across

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
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | page_break_before | status |
      | 0700 | 0200    | 1        | false              | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | align | status |
      | 0710 | 0700   | 0200    | 1        | 12             | left  | active |

  Scenario: GET a song with two 'chords' blocks sharing a chord — the overall list is deduplicated, each block's own comment stays independent
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id   | name | root_note | frets             | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0]     | active |
      | 0302 | D    | D         | ["X","X",0,2,3,2] | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | custom_title | chords                                                                            | status |
      | 0731 | 0710      | 0200    | 1        | chords     | Main chords  | [{"comment": "main tip", "chord_id": "00000000-0000-0000-0000-000000000300"}]                                    | active |
      | 0732 | 0710      | 0200    | 2        | chords     | Outro chords | [{"comment": "outro tip", "chord_id": "00000000-0000-0000-0000-000000000300"}, {"comment": null, "chord_id": "00000000-0000-0000-0000-000000000302"}] | active |
    When I GET /api/features/tasks/guitar-songs/songs/0200
    Then the response status code is 200
    And the response body includes:
      """
      {
        "chords": [
          {"chord_id": "0300", "comment": "main tip", "chord": {"id": "0300", "name": "Em7"}},
          {"chord_id": "0302", "comment": null, "chord": {"id": "0302", "name": "D"}}
        ]
      }
      """
