Feature: Attach a chord to one of the 5 positions around a word of a lyrics-mode section
  As a project member
  I want to attach a chord from the shared inventory before, at the start, in the middle,
  at the end of, or after a specific word
  So that the song shows exactly where each chord change happens in the lyrics, even when
  several chords change around the same word or with no lyric under them at all

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
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | status |
      | 0500 | 0200    | 1        | Couplet    | lyrics       | active |
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
      | 0301 | G    | G         | [3,2,0,0,0,3] | active |
    And the guitar_songs_section_words table contains:
      | id   | section_id | line_index | word_index | word_text | status |
      | 0600 | 0500       | 0          | 1          | twinkle   | active |

  Scenario: PATCH a word's "start" chord — it is attached and the chord joins the song's own chord list
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_chords table contains:
      | id | song_id | chord_id | position | status |
    When I PATCH /api/features/tasks/guitar-songs/section-words/0600/chords/start with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {"text": "twinkle", "chord_start": {"id": "0300", "name": "Em7"}, "chord_before": null}
      """
    And the guitar_songs_section_word_chords table contains:
      | word_id | position | chord_id |
      | 0600    | start    | 0300     |
    And the guitar_songs_chords table contains:
      | song_id | chord_id | position | status |
      | 0200    | 0300     | 1        | active |

  Scenario: PATCH two different positions on the same word — both chords coexist
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_section_word_chords table contains:
      | id   | word_id | position | chord_id |
      | 0800 | 0600    | start    | 0300     |
    When I PATCH /api/features/tasks/guitar-songs/section-words/0600/chords/before with body:
      """
      {"chord_id": "0301"}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {"text": "twinkle", "chord_before": {"id": "0301", "name": "G"}, "chord_start": {"id": "0300", "name": "Em7"}}
      """
    And the guitar_songs_section_word_chords table contains:
      | word_id | position | chord_id |
      | 0600    | start    | 0300     |
      | 0600    | before   | 0301     |

  Scenario: PATCH a word's chord when the chord is already in the song's chord list — no duplicate is created
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0700 | 0200    | 0300     | 1        | active |
    When I PATCH /api/features/tasks/guitar-songs/section-words/0600/chords/start with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 200
    And the guitar_songs_chords table contains:
      | song_id | chord_id | position | status |
      | 0200    | 0300     | 1        | active |

  Scenario: PATCH a word's chord to null — the chord is detached from that position but stays in the song's chord list
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_section_word_chords table contains:
      | id   | word_id | position | chord_id |
      | 0800 | 0600    | start    | 0300     |
    And the guitar_songs_chords table contains:
      | id   | song_id | chord_id | position | status |
      | 0700 | 0200    | 0300     | 1        | active |
    When I PATCH /api/features/tasks/guitar-songs/section-words/0600/chords/start with body:
      """
      {"chord_id": null}
      """
    Then the response status code is 200
    And the guitar_songs_section_word_chords table contains:
      | word_id | position | chord_id |
    And the guitar_songs_chords table contains:
      | song_id | chord_id | position | status |
      | 0200    | 0300     | 1        | active |

  Scenario: PATCH a chord onto an empty word slot — a chord-only gap can carry a chord too
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_section_words table contains:
      | id   | section_id | line_index | word_index | word_text | status |
      | 0601 | 0500       | 0          | 2          |           | active |
    And the guitar_songs_chords table contains:
      | id | song_id | chord_id | position | status |
    When I PATCH /api/features/tasks/guitar-songs/section-words/0601/chords/start with body:
      """
      {"chord_id": "0300"}
      """
    Then the response status code is 200
    And the guitar_songs_section_word_chords table contains:
      | word_id | position | chord_id |
      | 0601    | start    | 0300     |
