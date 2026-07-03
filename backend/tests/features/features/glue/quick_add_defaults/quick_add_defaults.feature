Feature: Dashboard quick-add defaults
  As a project member
  I want to configure a default feature instance for the dashboard's quick-add popups
  So that I can add a task or event without repicking the project every time

  Background:
    Given the users table contains:
      | id   | email                 | status |
      | 0002 | user@test.com         | active |
      | 0003 | profile_user@test.com | active |
    And the roles table contains:
      | name          | status |
      | viewer        | active |
      | profile-owner | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | viewer        | can_access_attached_tribes |
      | profile-owner | can_manage_own_profile     |
    And the user_roles table contains:
      | user                  | role          |
      | user@test.com         | viewer        |
      | profile_user@test.com | profile-owner |
    And the tribes table contains:
      | id   | name    | status |
      | 0010 | DevTeam | active |
    And the projects table contains:
      | id   | name  | status |
      | 0020 | Alpha | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0010     | 0020       |
    And the projects_features table contains:
      | id   | project_id | name     | feature_type | status |
      | 0030 | 0020       | Backlog  | kanban       | active |
      | 0031 | 0020       | Todo     | todo_list    | active |
      | 0032 | 0020       | Calendar | events       | active |

  Scenario: GET quick-add defaults — nothing configured yet
    Given I am authenticated as a regular user: user.id 0002
    And the user_quick_add_defaults table contains:
      | id | user_id | quick_add_type | feature_instance_id | status |
    When I GET /api/features/glue/dashboard/quick-add-defaults
    Then the response status code is 200
    And the response body includes:
      """
      {
        "task": { "feature_instance_id": null },
        "event": { "feature_instance_id": null }
      }
      """

  Scenario: PUT quick-add default — configure an explicit default for task
    Given I am authenticated as a regular user: user.id 0002
    And the user_quick_add_defaults table contains:
      | id | user_id | quick_add_type | feature_instance_id | status |
    When I PUT /api/features/glue/dashboard/quick-add-defaults/task with body:
      """
      { "feature_instance_id": "0030" }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "feature_instance_id": "0030" }
      """
    And the user_quick_add_defaults table contains:
      | user_id | quick_add_type | feature_instance_id | status |
      | 0002    | task           | 0030                | active |

  Scenario: PUT quick-add default — configure an explicit default for event
    Given I am authenticated as a regular user: user.id 0002
    And the user_quick_add_defaults table contains:
      | id | user_id | quick_add_type | feature_instance_id | status |
    When I PUT /api/features/glue/dashboard/quick-add-defaults/event with body:
      """
      { "feature_instance_id": "0032" }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "feature_instance_id": "0032" }
      """
    And the user_quick_add_defaults table contains:
      | user_id | quick_add_type | feature_instance_id | status |
      | 0002    | event          | 0032                | active |

  Scenario: PUT quick-add default — clear a previously configured default
    Given I am authenticated as a regular user: user.id 0002
    And the user_quick_add_defaults table contains:
      | id   | user_id | quick_add_type | feature_instance_id | status |
      | 0400 | 0002    | task           | 0030                | active |
    When I PUT /api/features/glue/dashboard/quick-add-defaults/task with body:
      """
      { "feature_instance_id": null }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "feature_instance_id": null }
      """
    And the user_quick_add_defaults table contains:
      | id   | user_id | quick_add_type | feature_instance_id | status |
      | 0400 | 0002    | task           |                      | active |

  Scenario: GET quick-add defaults — returns the previously configured value
    Given I am authenticated as a regular user: user.id 0002
    And the user_quick_add_defaults table contains:
      | id   | user_id | quick_add_type | feature_instance_id | status |
      | 0400 | 0002    | task           | 0030                | active |
      | 0401 | 0002    | event          | 0032                | active |
    When I GET /api/features/glue/dashboard/quick-add-defaults
    Then the response status code is 200
    And the response body includes:
      """
      {
        "task": { "feature_instance_id": "0030" },
        "event": { "feature_instance_id": "0032" }
      }
      """

  Scenario: PUT quick-add default — feature instance of the wrong type is rejected
    Given I am authenticated as a regular user: user.id 0002
    And the user_quick_add_defaults table contains:
      | id | user_id | quick_add_type | feature_instance_id | status |
    When I PUT /api/features/glue/dashboard/quick-add-defaults/task with body:
      """
      { "feature_instance_id": "0032" }
      """
    Then the response status code is 400

  @error_case
  Scenario: GET quick-add defaults as profile-only user — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I GET /api/features/glue/dashboard/quick-add-defaults
    Then the response status code is 403
