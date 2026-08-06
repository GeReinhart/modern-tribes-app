Feature: Add a video to a guitar song
  As a project member
  I want to add one or more videos to a song
  So that the band can watch a reference performance while practicing

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

  Scenario: POST a video onto a song — it lands at the next position
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_videos table contains:
      | id | song_id | title | url | position | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/videos with body:
      """
      {"title": "Official video", "url": "https://www.youtube.com/watch?v=bx1Bh8ZvH84"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {"title": "Official video", "url": "https://www.youtube.com/watch?v=bx1Bh8ZvH84", "position": 1}
      """
    And the guitar_songs_videos table contains:
      | song_id | title           | url                                        | position | status |
      | 0200    | Official video  | https://www.youtube.com/watch?v=bx1Bh8ZvH84 | 1        | active |

  Scenario: POST a second video onto the same song — it lands after the first
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_videos table contains:
      | id   | song_id | title          | url                          | position | status |
      | 0600 | 0200    | Official video | https://example.com/official | 1        | active |
    When I POST /api/features/tasks/guitar-songs/songs/0200/videos with body:
      """
      {"url": "https://example.com/acoustic-cover"}
      """
    Then the response status code is 201
    And the guitar_songs_videos table contains:
      | song_id | title          | url                            | position | status |
      | 0200    | Official video | https://example.com/official   | 1        | active |
      | 0200    |                | https://example.com/acoustic-cover | 2   | active |

  @error_case
  Scenario: POST a video with a non-http(s) URL — 422 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_videos table contains:
      | id | song_id | title | url | position | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/videos with body:
      """
      {"url": "javascript:alert(1)"}
      """
    Then the response status code is 422
    And the guitar_songs_videos table contains:
      | id | song_id | title | url | position | status |

  @error_case
  Scenario: POST a video as a guest — 403 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1002 | 0010     | 0030      | guest    | active |
    And the guitar_songs_videos table contains:
      | id | song_id | title | url | position | status |
    When I POST /api/features/tasks/guitar-songs/songs/0200/videos with body:
      """
      {"url": "https://example.com/video"}
      """
    Then the response status code is 403
    And the guitar_songs_videos table contains:
      | id | song_id | title | url | position | status |
