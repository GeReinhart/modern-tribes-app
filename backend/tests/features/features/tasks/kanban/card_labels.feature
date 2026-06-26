Feature: Manage card labels
  As an administrator
  I want to toggle labels on a kanban card
  So that the card is properly categorised

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
      | id   | feature_instance_id | name  | position | status |
      | 0200 | 0100                | To Do | 1        | active |
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title | position | status |
      | 0010 | 0100                | 0200      | Task  | 1        | active |
    And the labels table contains:
      | id   | name    | color    | status |
      | 0020 | Bug     | #ff0000  | active |

  Scenario: POST /kanban/cards/0010/labels/0020 as admin — label is toggled on card
    Given I am authenticated as an administrator: user.id 0001
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
    When I POST /api/features/tasks/kanban/cards/0010/labels/0020
    Then the response status code is 200
    And the response body is:
      """
      {
        "id": "0010",
        "feature_instance_id": "0100",
        "column_id": "0200",
        "title": "Task",
        "assigned_person_id": null,
        "assigned_person_name": null,
        "document_id": null,
        "document_content_html": null,
        "position": 1,
        "status": "active",
        "size": null,
        "due_date": null,
        "force_on_dashboard": false,
        "label_ids": ["0020"],
        "created_at": null,
        "updated_at": null,
        "created_by": null,
        "updated_by": null
      }
      """
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
      | 0020     | kanban_card | 0010      |

  @error_case
  Scenario: POST /kanban/cards/0010/labels/0020 as a viewer without project access — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
    When I POST /api/features/tasks/kanban/cards/0010/labels/0020
    Then the response status code is 403
    And the label_entities table contains:
      | label_id | entity_type | entity_id |
