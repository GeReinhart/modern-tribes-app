Feature: Rate your own mastery of a guitar song
  As a project member
  I want to track how well I personally know each song
  So that I can tell at a glance which songs I still need to practice

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
      | id   | project_id | title      | author | song_state | status |
      | 0200 | 0020       | Wonderwall | Oasis  | draft      | active |

  Scenario: PUT my mastery on a song — it is saved and shown back to me
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_mastery table contains:
      | id | song_id | user_id | mastery_level | status |
    When I PUT /api/features/tasks/guitar-songs/songs/0200/mastery with body:
      """
      {"mastery_level": 3}
      """
    Then the response status code is 200
    And the response body includes:
      """
      {"my_mastery": 3}
      """
    And the guitar_songs_mastery table contains:
      | song_id | user_id | mastery_level | status |
      | 0200    | 0002    | 3             | active |

  Scenario: PUT my mastery again with a new value — it is updated, not duplicated
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_mastery table contains:
      | id   | song_id | user_id | mastery_level | status |
      | 0800 | 0200    | 0002    | 3             | active |
    When I PUT /api/features/tasks/guitar-songs/songs/0200/mastery with body:
      """
      {"mastery_level": 5}
      """
    Then the response status code is 200
    And the guitar_songs_mastery table contains:
      | song_id | user_id | mastery_level | status |
      | 0200    | 0002    | 5             | active |

  Scenario: A guest (not just a member) can rate their own mastery too
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | guest    | active |
    And the guitar_songs_mastery table contains:
      | id | song_id | user_id | mastery_level | status |
    When I PUT /api/features/tasks/guitar-songs/songs/0200/mastery with body:
      """
      {"mastery_level": 0}
      """
    Then the response status code is 200
    And the guitar_songs_mastery table contains:
      | song_id | user_id | mastery_level | status |
      | 0200    | 0002    | 0             | active |

  Scenario: A song I have never rated shows no mastery, even if I rated a different song
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs table contains:
      | id   | project_id | title  | author | song_state | status |
      | 0201 | 0020       | Zombie | The Cranberries | draft | active |
    And the guitar_songs_mastery table contains:
      | id   | song_id | user_id | mastery_level | status |
      | 0800 | 0200    | 0002    | 5             | active |
    When I GET /api/features/tasks/guitar-songs/songs/0201
    Then the response status code is 200
    And the response body includes:
      """
      {"my_mastery": null}
      """

  Scenario: PUT my mastery on a completed song — it succeeds even though the song is completed
    Given the guitar_songs table contains:
      | id   | project_id | title  | author          | song_state | status |
      | 0201 | 0020       | Zombie | The Cranberries | completed  | active |
    And I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_mastery table contains:
      | id | song_id | user_id | mastery_level | status |
    When I PUT /api/features/tasks/guitar-songs/songs/0201/mastery with body:
      """
      {"mastery_level": 2}
      """
    Then the response status code is 200
    And the guitar_songs_mastery table contains:
      | song_id | user_id | mastery_level | status |
      | 0201    | 0002    | 2             | active |

  @error_case
  Scenario: PUT my mastery with an out-of-range value — 422 error and nothing is saved
    Given I am authenticated as a regular user: user.id 0002
    And the positions table contains:
      | id   | tribe_id | person_id | position | status |
      | 1001 | 0010     | 0030      | member   | active |
    And the guitar_songs_mastery table contains:
      | id | song_id | user_id | mastery_level | status |
    When I PUT /api/features/tasks/guitar-songs/songs/0200/mastery with body:
      """
      {"mastery_level": 6}
      """
    Then the response status code is 422
    And the guitar_songs_mastery table contains:
      | id | song_id | user_id | mastery_level | status |
