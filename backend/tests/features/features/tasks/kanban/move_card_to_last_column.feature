Feature: Move a kanban card to the last column
  As a project member
  I want to mark a kanban card as done from my tasks view
  So that it moves to the last (done) column and disappears from my tasks

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
      | 0100 | 0100       | Board | kanban       | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 0200 | 0100                | To Do       | 1        | active |
      | 0201 | 0100                | In Progress | 2        | active |
      | 0202 | 0100                | Done        | 3        | active |

  Scenario: POST /kanban/cards/0010/move-to-last-column as admin — card is moved to last column
    Given I am authenticated as an administrator: user.id 0001
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title | position | status |
      | 0010 | 0100                | 0200      | Task  | 1        | active |
    When I POST /api/features/tasks/kanban/cards/0010/move-to-last-column with body:
      """
      {}
      """
    Then the response status code is 200
    And the response body is:
      """
      {
        "id": "0010",
        "feature_instance_id": "0100",
        "column_id": "0202",
        "title": "Task",
        "assigned_person_id": null,
        "assigned_person_name": null,
        "document_id": null,
        "document_content_html": null,
        "position": 1,
        "status": "active",
        "size": null,
        "due_date": null,
        "label_ids": [],
        "created_at": null,
        "updated_at": null,
        "created_by": null,
        "updated_by": null
      }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title | position | status |
      | 0010 | 0100                | 0202      | Task  | 1        | active |

  @error_case
  Scenario: POST /kanban/cards/0010/move-to-last-column as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title | position | status |
      | 0010 | 0100                | 0200      | Task  | 1        | active |
    When I POST /api/features/tasks/kanban/cards/0010/move-to-last-column with body:
      """
      {}
      """
    Then the response status code is 403
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title | position | status |
      | 0010 | 0100                | 0200      | Task  | 1        | active |
