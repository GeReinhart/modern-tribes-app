Feature: Edit, reorder and remove a guitar song's videos
  As a project member or manager
  I want to correct a video's details, reorder them or remove one
  So that the video list stays accurate and in the order we watch them

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
    And the guitar_songs_videos table contains:
      | id   | song_id | title           | url                          | position | status |
      | 0600 | 0200    | Official video  | https://example.com/official | 1        | active |
      | 0601 | 0200    | Acoustic cover  | https://example.com/acoustic | 2        | active |

  Scenario: PATCH a video's title — it is updated
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
    When I PATCH /api/features/tasks/guitar-songs/videos/0600 with body:
      """
      {"title": "Official music video (remastered)"}
      """
    Then the response status code is 200
    And the guitar_songs_videos table contains:
      | id   | song_id | title                          | url                          | position | status |
      | 0600 | 0200    | Official music video (remastered) | https://example.com/official | 1     | active |
      | 0601 | 0200    | Acoustic cover                 | https://example.com/acoustic | 2        | active |

  Scenario: Manager moves the second video up — it swaps position with the first
    Given I am authenticated as an administrator: user.id 0001
    When I POST /api/features/tasks/guitar-songs/videos/0601/move with body:
      """
      {"direction": "prev"}
      """
    Then the response status code is 200
    And the guitar_songs_videos table contains:
      | id   | song_id | title          | position | status |
      | 0600 | 0200    | Official video | 2        | active |
      | 0601 | 0200    | Acoustic cover | 1        | active |

  Scenario: Manager removes a video — it is archived
    Given I am authenticated as an administrator: user.id 0001
    When I DELETE /api/features/tasks/guitar-songs/videos/0601
    Then the response status code is 204
    And the guitar_songs_videos table contains:
      | id   | song_id | title          | position | status   |
      | 0600 | 0200    | Official video | 1        | active   |
      | 0601 | 0200    | Acoustic cover | 2        | archived |

  @error_case
  Scenario: Member (not manager) tries to remove a video — 403 error and it stays active
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
    When I DELETE /api/features/tasks/guitar-songs/videos/0601
    Then the response status code is 403
    And the guitar_songs_videos table contains:
      | id   | song_id | title          | position | status |
      | 0600 | 0200    | Official video | 1        | active |
      | 0601 | 0200    | Acoustic cover | 2        | active |
