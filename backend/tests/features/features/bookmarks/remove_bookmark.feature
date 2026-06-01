@wip
Feature: Remove a bookmark
  As a user with platform access
  I want to remove a bookmark
  So that my bookmark list stays clean

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

  Scenario: DELETE /bookmarks/0010 as viewer — bookmark is removed
    Given I am authenticated as a regular user: user.id 0002
    When I DELETE /api/features/bookmarks/0010
    Then the response status code is 204

  @error_case
  Scenario: DELETE /bookmarks/0010 as a user with no app access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I DELETE /api/features/bookmarks/0010
    Then the response status code is 403
