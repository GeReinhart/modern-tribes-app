@wip
Feature: List bookmarks
  As a user with platform access
  I want to list my bookmarks
  So that I can navigate to my saved pages

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

  Scenario: GET /bookmarks as viewer — bookmarks are returned
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path  | page_title | display_order | status |
      | 1001 | 0002    | /dashboard | Dashboard  | 0             | active |
    When I GET /api/features/bookmarks
    Then the response status code is 200
    And the response body is:
      """
      {
        "bookmarks": [
          {
            "id": "1001",
            "page_path": "/dashboard",
            "page_title": "Dashboard",
            "display_order": 0,
            "description": null,
            "color_text": null,
            "color_background": null
          }
        ]
      }
      """

  @error_case
  Scenario: GET /bookmarks as a user with no app access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I GET /api/features/bookmarks
    Then the response status code is 403
