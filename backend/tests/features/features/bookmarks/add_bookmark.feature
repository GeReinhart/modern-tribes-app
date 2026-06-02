@wip
Feature: Add a bookmark
  As a user with platform access
  I want to add a bookmark to a page
  So that I can quickly return to it later

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

  Scenario: POST /bookmarks with valid body as viewer — the bookmark is created
    Given I am authenticated as a regular user: user.id 0002
    When I POST /api/features/bookmarks with body:
      """
      {"page_path": "/tribes/abc", "page_title": "Engineering tribe"}
      """
    Then the response status code is 201
    And the response body includes:
      """
      {
        "page_path": "/tribes/abc",
        "page_title": "Engineering tribe",
        "display_order": 0,
        "description": null,
        "color_text": null,
        "color_background": null
      }
      """

  @error_case
  Scenario: POST /bookmarks as a user with no app access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I POST /api/features/bookmarks with body:
      """
      {"page_path": "/tribes/abc", "page_title": "Engineering tribe"}
      """
    Then the response status code is 403
