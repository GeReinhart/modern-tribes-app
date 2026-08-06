Feature: Edit a lyrics-mode section's text
  As a project member
  I want to freely rewrite a section's lyrics without losing unrelated chord attachments
  So that fixing a typo doesn't force me to redo every chord in the section

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
      | id   | project_id | title      | author | status |
      | 0200 | 0020       | Wonderwall | Oasis  | active |
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | status |
      | 0500 | 0200    | 1        | Couplet    | lyrics       | active |
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |

  Scenario: PATCH lyrics text onto a section with no words yet — the text is tokenized into words
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_section_words table contains:
      | id | section_id | line_index | word_index | word_text | status |
    When I PATCH /api/features/tasks/guitar-songs/sections/0500/lyrics with body:
      """
      {"text": "Twinkle twinkle little star"}
      """
    Then the response status code is 200
    And the guitar_songs_section_words table contains:
      | line_index | word_index | word_text | status |
      | 0          | 0          | Twinkle   | active |
      | 0          | 1          | twinkle   | active |
      | 0          | 2          | little    | active |
      | 0          | 3          | star      | active |

  Scenario: PATCH lyrics text with 3 spaces between two words — an empty chord-only slot is inserted
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_section_words table contains:
      | id | section_id | line_index | word_index | word_text | status |
    When I PATCH /api/features/tasks/guitar-songs/sections/0500/lyrics with body:
      """
      {"text": "Twinkle   twinkle little star   "}
      """
    Then the response status code is 200
    And the guitar_songs_section_words table contains:
      | line_index | word_index | word_text | status |
      | 0          | 0          | Twinkle   | active |
      | 0          | 1          |           | active |
      | 0          | 2          | twinkle   | active |
      | 0          | 3          | little    | active |
      | 0          | 4          | star      | active |
      | 0          | 5          |           | active |

  Scenario: PATCH lyrics text replacing one word — only that word's chords are lost, the rest survive
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_chords table contains:
      | id   | name | root_note | frets         | status |
      | 0300 | Em7  | E         | [0,2,0,0,0,0] | active |
      | 0301 | G    | G         | [3,2,0,0,0,3] | active |
    And the guitar_songs_section_words table contains:
      | id   | section_id | line_index | word_index | word_text | status |
      | 0600 | 0500       | 0          | 0          | Twinkle   | active |
      | 0601 | 0500       | 0          | 1          | twinkle   | active |
      | 0602 | 0500       | 0          | 2          | little    | active |
      | 0603 | 0500       | 0          | 3          | star      | active |
    And the guitar_songs_section_word_chords table contains:
      | word_id | position | chord_id |
      | 0600    | start    | 0300     |
      | 0602    | end      | 0301     |
    When I PATCH /api/features/tasks/guitar-songs/sections/0500/lyrics with body:
      """
      {"text": "Twinkle twinkle big star"}
      """
    Then the response status code is 200
    And the guitar_songs_section_words table contains:
      | line_index | word_index | word_text | status |
      | 0          | 0          | Twinkle   | active |
      | 0          | 1          | twinkle   | active |
      | 0          | 2          | big       | active |
      | 0          | 3          | star      | active |
    And the guitar_songs_section_word_chords table contains:
      | position | chord_id |
      | start    | 0300     |

  @error_case
  Scenario: PATCH the lyrics of a chords-only section — 409 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | status |
      | 0510 | 0200    | 2        | Intro      | chords_only  | active |
    When I PATCH /api/features/tasks/guitar-songs/sections/0510/lyrics with body:
      """
      {"text": "should not be accepted"}
      """
    Then the response status code is 409
    And the guitar_songs_sections table contains:
      | id   | song_id | position | type_label | content_mode | status |
      | 0500 | 0200    | 1        | Couplet    | lyrics       | active |
      | 0510 | 0200    | 2        | Intro      | chords_only  | active |
