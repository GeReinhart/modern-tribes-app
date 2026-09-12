Feature: Get a todo item's description revision history
  As a project member
  I want to see previous versions of a todo item's description
  So that I can recover an earlier version if a change turns out to be wrong

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
      | 0002 | user@test.com  | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
      | viewer        | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | administrator | admin                      |
      | viewer        | can_access_attached_tribes |
    And the user_roles table contains:
      | user           | role          |
      | admin@test.com | administrator |
      | user@test.com  | viewer        |
    And the projects table contains:
      | id   | name    | status |
      | 0100 | Project | active |
    And the projects_features table contains:
      | id   | project_id | name  | feature_type | status |
      | 0100 | 0100       | Todos | todo         | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title | todo_status | position | status |
      | 0010 | 0100                | Task  | todo        | 1        | active |

  Scenario: GET revisions for a todo item that has never had a description saved — empty history
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/todo-items/0010/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      []
      """

  Scenario: GET revisions for a todo item whose description was updated twice — the previous version is kept, current first
    Given I am authenticated as an administrator: user.id 0001
    When I PATCH /api/features/tasks/todo-items/0010 with body:
      """
      { "document_content_html": "<p>Old text.</p>" }
      """
    And I PATCH /api/features/tasks/todo-items/0010 with body:
      """
      { "document_content_html": "<p>New text.</p>" }
      """
    And I GET /api/features/tasks/todo-items/0010/document/revisions
    Then the response status code is 200
    And the response body includes:
      """
      [
        {"content_html": "<p>New text.</p>", "is_current": true},
        {"content_html": "<p>Old text.</p>", "is_current": false}
      ]
      """

  @error_case
  Scenario: GET revisions for a todo item as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/todo-items/0010/document/revisions
    Then the response status code is 403

  @error_case
  Scenario: GET revisions for an unknown todo item — 404 error
    Given I am authenticated as an administrator: user.id 0001
    When I GET /api/features/tasks/todo-items/9999/document/revisions
    Then the response status code is 404
