@wip
Feature: Update a bookmark
  As a user with platform access
  I want to update a bookmark's title
  So that its label stays accurate

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

  Scenario: PUT /bookmarks/0010 with valid body as viewer — the bookmark is updated
    Given I am authenticated as a regular user: user.id 0002
    And the user_bookmarks table contains:
      | id   | user_id | page_path   | page_title | display_order | status |
      | 0010 | 0002    | /tribes/abc | Eng        | 1             | active |
    When I PUT /api/features/bookmarks/0010 with body:
      """
      {"page_title": "Updated Title"}
      """
    Then the response status code is 200
    And the response body is:
      """
      {
        "id": "0010",
        "page_path": "/tribes/abc",
        "page_title": "Updated Title",
        "display_order": 1,
        "description": null,
        "color_text": null,
        "color_background": null
      }
      """
    And the user_bookmarks table contains:
      | id   | page_path   | page_title    | display_order | status |
      | 0010 | /tribes/abc | Updated Title | 1             | active |

  @error_case
  Scenario: PUT /bookmarks/0010 as a user with no app access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    And the user_bookmarks table contains:
      | id | user_id | page_path | page_title | display_order | status |
    When I PUT /api/features/bookmarks/0010 with body:
      """
      {"page_title": "Updated Title"}
      """
    Then the response status code is 403
    And the user_bookmarks table contains:
      | id | user_id | page_path | page_title | display_order | status |
