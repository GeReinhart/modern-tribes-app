Feature: List feature types
  As a user with platform access
  I want to list all available feature types
  So that I can choose which features to attach to a project

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

  Scenario: GET /feature-instances/feature-types as viewer — feature types are returned
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/glue/feature-instances/feature-types
    Then the response status code is 200
    And the response body is:
      """
      [
        {"feature_type": "kanban", "label": "Kanban"},
        {"feature_type": "todo_list", "label": "Todo List"},
        {"feature_type": "guitar_notes", "label": "Guitar - Notes"},
        {"feature_type": "guitar_tuner", "label": "Guitar - Tuner"},
        {"feature_type": "guitar_metronome", "label": "Guitar - Metronome"},
        {"feature_type": "events", "label": "Events"},
        {"feature_type": "daily_journal", "label": "Daily Journal"}
      ]
      """

  @error_case
  Scenario: GET /feature-instances/feature-types as a user with no app access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I GET /api/features/glue/feature-instances/feature-types
    Then the response status code is 403
