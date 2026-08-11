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

  Scenario: GET a project's songs filtered by title — only the matching song is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs?q=wonder
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0200", "title": "Wonderwall"}
      ]
      """

  Scenario: GET a project's songs filtered by author — only the matching song is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs?q=cranberries
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0201", "title": "Zombie"}
      ]
      """

  Scenario: GET a project's songs filtered by lyrics text — only the song with matching lyrics is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | status |
      | 0300 | 0200    | 1        | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | status |
      | 0310 | 0300   | 0200    | 1        | 12              | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | lyrics_text                 | status |
      | 0320 | 0310      | 0200    | 1        | sections   | Today is gonna be the day   | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs?q=gonna
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0200", "title": "Wonderwall"}
      ]
      """

  Scenario: GET a project's songs filtered by label — only songs carrying that label are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the labels table contains:
      | id   | project_id | name     | color   | status |
      | 0400 | 0020       | Setlist  | #6b7280 | active |
    And the label_entities table contains:
      | label_id | entity_type  | entity_id |
      | 0400     | guitar_song  | 0200      |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs?label_id=0400
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0200", "title": "Wonderwall"}
      ]
      """

  Scenario: GET a project's songs filtered by several labels at once — songs carrying any of them are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the labels table contains:
      | id   | project_id | name       | color   | status |
      | 0400 | 0020       | Setlist    | #6b7280 | active |
      | 0401 | 0020       | Needs work | #ef4444 | active |
    And the label_entities table contains:
      | label_id | entity_type  | entity_id |
      | 0400     | guitar_song  | 0200      |
      | 0401     | guitar_song  | 0201      |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs?label_id=0400&label_id=0401
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0200", "title": "Wonderwall"},
        {"id": "0201", "title": "Zombie"}
      ]
      """

  Scenario: GET a project's songs filtered by several states at once — songs in either state are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title       | author  | song_state | status |
      | 0210 | 0020       | Yellow      | Coldplay| completed  | active |
      | 0211 | 0020       | Fix You     | Coldplay| draft      | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs?song_state=completed&song_state=draft
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0211", "title": "Fix You"},
        {"id": "0200", "title": "Wonderwall"},
        {"id": "0210", "title": "Yellow"},
        {"id": "0201", "title": "Zombie"}
      ]
      """

  Scenario: GET a project's songs filtered by state — only completed songs are returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title       | author  | song_state | status |
      | 0210 | 0020       | Yellow      | Coldplay| completed  | active |
      | 0211 | 0020       | Fix You     | Coldplay| draft      | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs?song_state=completed
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0210", "title": "Yellow"}
      ]
      """

  Scenario: GET a project's songs with a search text matching nothing — an empty list is returned
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs?q=nonexistent
    Then the response status code is 200
    And the response body includes:
      """
      []
      """

  Scenario: GET a project's songs shows each song's chord count and difficult chord count
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title    | status |
      | 0240 | 0020       | Freebird | active |
    And the guitar_chords table contains:
      | id   | name  | root_note | frets              | difficulty | status |
      | 0700 | Bm7b5 | B         | [0, 2, 0, 2, 0, 2] | 5          | active |
      | 0701 | Em    | E         | [0, 2, 2, 0, 0, 0] | 1          | active |
    And the guitar_songs_layout_rows table contains:
      | id   | song_id | position | status |
      | 0340 | 0240    | 1        | active |
    And the guitar_songs_layout_columns table contains:
      | id   | row_id | song_id | position | width_twelfths | status |
      | 0350 | 0340   | 0240    | 1        | 12              | active |
    And the guitar_songs_layout_column_blocks table contains:
      | id   | column_id | song_id | position | block_type | chords                                                                                                       | status |
      | 0360 | 0350      | 0240    | 1        | chords     | [{"comment": null, "chord_id": "00000000-0000-0000-0000-000000000700"}, {"comment": null, "chord_id": "00000000-0000-0000-0000-000000000701"}] | active |
    When I GET /api/features/tasks/guitar-songs/projects/0020/songs?q=freebird
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0240", "title": "Freebird", "chord_count": 2, "difficult_chord_count": 1}
      ]
      """

  Scenario: GET a project's songs filtered by difficulty — songs without a difficulty stay visible
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the projects table contains:
      | id   | name          | status |
      | 0021 | Solo Practice | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0021       | manager  |
    And the guitar_songs table contains:
      | id   | project_id | title      | difficulty | status |
      | 0220 | 0021       | Easy One   | 1          | active |
      | 0221 | 0021       | Medium One | 3          | active |
      | 0222 | 0021       | Unrated One|            | active |
    When I GET /api/features/tasks/guitar-songs/projects/0021/songs?difficulty=3
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0221", "title": "Medium One"},
        {"id": "0222", "title": "Unrated One"}
      ]
      """

  Scenario: GET a project's songs filtered by several difficulties at once — songs matching any of them stay visible, plus unrated ones
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the projects table contains:
      | id   | name          | status |
      | 0021 | Solo Practice | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0021       | manager  |
    And the guitar_songs table contains:
      | id   | project_id | title      | difficulty | status |
      | 0220 | 0021       | Easy One   | 1          | active |
      | 0221 | 0021       | Medium One | 3          | active |
      | 0223 | 0021       | Hard One   | 5          | active |
      | 0222 | 0021       | Unrated One|            | active |
    When I GET /api/features/tasks/guitar-songs/projects/0021/songs?difficulty=1&difficulty=5
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0220", "title": "Easy One"},
        {"id": "0223", "title": "Hard One"},
        {"id": "0222", "title": "Unrated One"}
      ]
      """

  Scenario: GET a project's songs filtered by my mastery — songs I have not rated stay visible
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the projects table contains:
      | id   | name          | status |
      | 0021 | Solo Practice | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0021       | manager  |
    And the guitar_songs table contains:
      | id   | project_id | title       | status |
      | 0230 | 0021       | Known One   | active |
      | 0231 | 0021       | Mastered One| active |
      | 0232 | 0021       | Never Tried | active |
    And the guitar_songs_mastery table contains:
      | id   | song_id | user_id | mastery_level | status |
      | 0810 | 0230    | 0002    | 1             | active |
      | 0811 | 0231    | 0002    | 5             | active |
    When I GET /api/features/tasks/guitar-songs/projects/0021/songs?mastery=5
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0231", "title": "Mastered One"},
        {"id": "0232", "title": "Never Tried"}
      ]
      """

  Scenario: GET a project's songs filtered by several of my mastery levels at once — songs matching any of them stay visible, plus unrated ones
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the projects table contains:
      | id   | name          | status |
      | 0021 | Solo Practice | active |
    And the tribes_projects table contains:
      | tribe_id | project_id | relation |
      | 0010     | 0021       | manager  |
    And the guitar_songs table contains:
      | id   | project_id | title       | status |
      | 0230 | 0021       | Known One   | active |
      | 0231 | 0021       | Mastered One| active |
      | 0233 | 0021       | Rusty One   | active |
      | 0232 | 0021       | Never Tried | active |
    And the guitar_songs_mastery table contains:
      | id   | song_id | user_id | mastery_level | status |
      | 0810 | 0230    | 0002    | 1             | active |
      | 0811 | 0231    | 0002    | 5             | active |
      | 0812 | 0233    | 0002    | 3             | active |
    When I GET /api/features/tasks/guitar-songs/projects/0021/songs?mastery=1&mastery=5
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"id": "0230", "title": "Known One"},
        {"id": "0231", "title": "Mastered One"},
        {"id": "0232", "title": "Never Tried"}
      ]
      """
