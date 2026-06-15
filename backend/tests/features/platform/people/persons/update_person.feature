Feature: Update a person
  As an administrator or a user managing their own profile
  I want to update a person record
  So that their information stays up to date

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

  Scenario: PUT /persons/0010 as admin — person is updated
    Given I am authenticated as an administrator: user.id 0001
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0010 | Alice      | Dupont    | female | active |
    When I PUT /api/platform/functions/people/persons/0010 with body:
      """
      {
        "first_name": "Alicia",
        "last_name": "Martin",
        "gender": "female"
      }
      """
    Then the response status code is 200
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0010 | Alicia     | Martin    | female | active |

  Scenario: PUT /persons/0010 as the person's owner (CAN_MANAGE_OWN_PROFILE) — person is updated
    Given I am authenticated as the person's owner: user.id 0003
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0010 | Alice      | Dupont    | female | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0003    | 0010      | active |
    When I PUT /api/platform/functions/people/persons/0010 with body:
      """
      {
        "first_name": "Alicia",
        "last_name": "Martin",
        "gender": "female"
      }
      """
    Then the response status code is 200
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0010 | Alicia     | Martin    | female | active |

  @error_case
  Scenario: PUT /persons/0010 as a viewer — 403 error and the person is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0010 | Alice      | Dupont    | female | active |
    When I PUT /api/platform/functions/people/persons/0010 with body:
      """
      {
        "first_name": "Alicia",
        "last_name": "Martin",
        "gender": "female"
      }
      """
    Then the response status code is 403
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 0010 | Alice      | Dupont    | female | active |
