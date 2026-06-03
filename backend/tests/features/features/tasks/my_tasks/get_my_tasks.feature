Feature: Get my tasks
  As a user with platform access
  I want to retrieve my tasks across all projects
  So that I can see all tasks assigned to me

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

  Scenario: GET /my-tasks as viewer — kanban and todo tasks are returned
    Given I am authenticated as a regular user: user.id 0002
    And the persons table contains:
      | id   | first_name | last_name | gender | status |
      | 1001 | John       | Doe       | male   | active |
    And the represents table contains:
      | user_id | person_id | status |
      | 0002    | 1001      | active |
    And the projects table contains:
      | id   | name       | status |
      | 2001 | My Project | active |
    And the tribes table contains:
      | id   | name        | status |
      | 3001 | Alpha Tribe | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 3001     | 2001       |
    And the projects_features table contains:
      | id   | project_id | name      | feature_type | status |
      | 4001 | 2001       | My Kanban | kanban       | active |
      | 4002 | 2001       | My Todos  | todo         | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name        | position | status |
      | 5001 | 4001                | In Progress | 1        | active |
      | 5002 | 4001                | Done        | 2        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title       | assigned_person_id | due_date   | status |
      | 6001 | 4001                | 5001      | Fix the bug | 1001               | 2026-07-01 | active |
    And the todo_items table contains:
      | id   | feature_instance_id | title      | assigned_person_id | due_date   | todo_status | status |
      | 7001 | 4002                | Write docs | 1001               | 2026-07-01 | todo        | active |
    When I GET /api/features/my-tasks
    Then the response status code is 200
    And the response body is:
      """
      {
        "kanban": [
          {
            "id": "6001",
            "source": "kanban",
            "title": "Fix the bug",
            "size": null,
            "due_date": "2026-07-01",
            "column_id": "5001",
            "column_name": "In Progress",
            "assigned_person_id": "1001",
            "assigned_person_name": "John Doe",
            "feature_instance_id": "4001",
            "feature_instance_name": "My Kanban",
            "project_id": "2001",
            "project_name": "My Project",
            "tribe_id": "3001",
            "tribe_name": "Alpha Tribe",
            "label_ids": [],
            "labels": [],
            "document_content_html": null
          }
        ],
        "todo": [
          {
            "id": "7001",
            "source": "todo",
            "title": "Write docs",
            "size": null,
            "due_date": "2026-07-01",
            "todo_status": "todo",
            "assigned_person_id": "1001",
            "assigned_person_name": "John Doe",
            "feature_instance_id": "4002",
            "feature_instance_name": "My Todos",
            "project_id": "2001",
            "project_name": "My Project",
            "tribe_id": "3001",
            "tribe_name": "Alpha Tribe",
            "label_ids": [],
            "labels": [],
            "document_content_html": null
          }
        ]
      }
      """

  @error_case
  Scenario: GET /my-tasks as a user with no app access — 403 error
    Given I am authenticated as the person's owner: user.id 0003
    When I GET /api/features/my-tasks
    Then the response status code is 403
