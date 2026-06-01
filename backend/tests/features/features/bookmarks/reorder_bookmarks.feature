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
    When I PUT /api/features/bookmarks/order with body:
      """
      {"ordered_ids": []}
      """
    Then the response status code is 200

  @error_case
  Scenario: PUT /bookmarks/order as a user with no app access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I PUT /api/features/bookmarks/order with body:
      """
      {"ordered_ids": []}
      """
    Then the response status code is 403
