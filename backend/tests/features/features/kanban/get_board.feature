@wip
Feature: Get kanban board
  As an administrator
  I want to retrieve a kanban board
  So that I can view its columns and cards

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

  Scenario: GET /kanban/board/0100 as admin — board is returned
    Given I am authenticated as an administrator: user.id 0001
    And the kanban_columns table contains:
      | id   | feature_instance_id | name | position | status |
      | 1001 | 0100                | Todo | 1        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title      | position | status |
      | 1002 | 0100                | 1001      | First task | 0        | active |
    When I GET /api/features/tasks/kanban/board/0100
    Then the response status code is 200
    And the response body is:
      """
      {
        "columns": [{"id": "1001", "name": "Todo", "position": 1}],
        "cards": [
          {
            "id": "1002",
            "feature_instance_id": "0100",
            "column_id": "1001",
            "title": "First task",
            "assigned_person_id": null,
            "assigned_person_name": null,
            "document_id": null,
            "document_content_html": null,
            "position": 0,
            "status": "active",
            "size": null,
            "due_date": null,
            "label_ids": [],
            "created_at": null,
            "updated_at": null,
            "created_by": null,
            "updated_by": null
          }
        ],
        "labels": []
      }
      """

  @error_case
  Scenario: GET /kanban/board/0100 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    When I GET /api/features/tasks/kanban/board/0100
    Then the response status code is 403
