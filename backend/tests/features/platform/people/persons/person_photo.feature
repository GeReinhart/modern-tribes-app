@wip
Feature: Manage a person's photo
  As a user managing my own profile
  I want to set or remove my photo
  So that other members see my photo instead of my initials wherever I am mentioned

  Background:
    Given the users table contains:
      | id   | email                 | status |
      | 0001 | admin@test.com        | active |
      | 0002 | user@test.com         | active |
      | 0003 | profile_user@test.com | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
      | viewer        | active |
      | profile-owner | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | administrator | admin                      |
      | viewer        | can_access_attached_tribes |
      | profile-owner | can_manage_own_profile     |
    And the user_roles table contains:
      | user                  | role          |
      | admin@test.com        | administrator |
      | user@test.com         | viewer        |
      | profile_user@test.com | profile-owner |

  Scenario: PUT /persons/0010/photo with an image as the person's owner — the photo is cropped to a square, stored, and the person's photo_url is set
    Given I am authenticated as the person's owner: user.id 0003
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url | status |
      | 0010 | Alice      | Dupont    | female |           | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0003    | 0010      | active |
    When I PUT /api/platform/functions/people/persons/0010/photo with the image file "portrait.jpg" (800x600)
    Then the response status code is 200
    And the response body includes a "photo_url"
    And the stored photo of person 0010 is a 256x256 square image
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url | status |
      | 0010 | Alice      | Dupont    | female | <set>     | active |

  Scenario: PUT /persons/0010/photo on a person who already has a photo — the photo is replaced
    Given I am authenticated as the person's owner: user.id 0003
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url          | status |
      | 0010 | Alice      | Dupont    | female | /uploads/images/old.webp | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0003    | 0010      | active |
    When I PUT /api/platform/functions/people/persons/0010/photo with the image file "portrait.jpg" (800x600)
    Then the response status code is 200
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url | status |
      | 0010 | Alice      | Dupont    | female | <set>     | active |

  Scenario: DELETE /persons/0010/photo as the person's owner — the photo is removed and the person goes back to initials
    Given I am authenticated as the person's owner: user.id 0003
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url                | status |
      | 0010 | Alice      | Dupont    | female | /uploads/images/old.webp | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0003    | 0010      | active |
    When I DELETE /api/platform/functions/people/persons/0010/photo
    Then the response status code is 204
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url | status |
      | 0010 | Alice      | Dupont    | female |           | active |

  Scenario: GET /users/0003/display for a user whose person has a photo — the display info includes the photo
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url                | status |
      | 0010 | Alice      | Dupont    | female | /uploads/images/old.webp | active |
    And the users table contains:
      | id   | email                 | person_id | status |
      | 0003 | profile_user@test.com | 0010      | active |
    When I GET /api/platform/functions/people/users/0003/display
    Then the response status code is 200
    And the response body includes:
      """
      { "first_name": "Alice", "last_name": "Dupont", "photo_url": "/uploads/images/old.webp" }
      """

  @error_case
  Scenario: PUT /persons/0010/photo with a file that is not an image — 400 and the person is unchanged
    Given I am authenticated as the person's owner: user.id 0003
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url | status |
      | 0010 | Alice      | Dupont    | female |           | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0003    | 0010      | active |
    When I PUT /api/platform/functions/people/persons/0010/photo with the image file "notes.txt" (not an image)
    Then the response status code is 400
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url | status |
      | 0010 | Alice      | Dupont    | female |           | active |

  @error_case
  Scenario: PUT /persons/0010/photo as a viewer who does not own the person — 403 and the person is unchanged
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url | status |
      | 0010 | Alice      | Dupont    | female |           | active |
    When I PUT /api/platform/functions/people/persons/0010/photo with the image file "portrait.jpg" (800x600)
    Then the response status code is 403
    And the persons table contains:
      | id   | first_name | last_name | gender | photo_url | status |
      | 0010 | Alice      | Dupont    | female |           | active |
