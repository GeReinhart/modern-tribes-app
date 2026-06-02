@wip
Feature: Reorder bookmarks
  As a user with platform access
  I want to reorder my bookmarks
  So that the most important ones appear first

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

  Scenario: PUT /bookmarks/order as viewer — bookmarks are reordered
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path   | page_title  | display_order | status |
      | 0010 | 0002    | /tribes/abc | Engineering | 0             | active |
      | 0011 | 0002    | /projects   | My Project  | 1             | active |
    When I PUT /api/features/bookmarks/order with body:
      """
      {"ordered_ids": ["0011", "0010"]}
      """
    Then the response status code is 200
    And the response body is:
      """
      {
        "bookmarks": [
          {
            "id": "0011",
            "page_path": "/projects",
            "page_title": "My Project",
            "display_order": 0,
            "description": null,
            "color_text": null,
            "color_background": null
          },
          {
            "id": "0010",
            "page_path": "/tribes/abc",
            "page_title": "Engineering",
            "display_order": 1,
            "description": null,
            "color_text": null,
            "color_background": null
          }
        ]
      }
      """

  @error_case
  Scenario: PUT /bookmarks/order as a user with no app access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I PUT /api/features/bookmarks/order with body:
      """
      {"ordered_ids": []}
      """
    Then the response status code is 403
