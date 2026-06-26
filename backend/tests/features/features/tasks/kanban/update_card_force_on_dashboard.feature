Feature: Update a kanban card — force on dashboard
  As a project member
  I want to toggle the force_on_dashboard flag on a kanban card
  So that important cards are visible to all project members on the dashboard

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
    And the tribes table contains:
      | id   | name    | status |
      | 0010 | DevTeam | active |
    And the projects table contains:
      | id   | name    | status |
      | 0100 | Project | active |
    And the tribes_projects table contains:
      | tribe_id | project_id |
      | 0010     | 0100       |
    And the projects_features table contains:
      | id   | project_id | name  | feature_type | status |
      | 0100 | 0100       | Board | kanban       | active |
    And the kanban_columns table contains:
      | id   | feature_instance_id | name  | position | status |
      | 0200 | 0100                | To Do | 1        | active |
      | 0201 | 0100                | Done  | 2        | active |

  Scenario: PATCH /kanban/cards/{id} — set force_on_dashboard to true
    Given I am authenticated as admin: user.id 0001
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title      | force_on_dashboard | position | status |
      | 0300 | 0100                | 0200      | My card    | false              | 0        | active |
    When I PATCH /api/kanban/cards/0300 with body:
      """
      { "force_on_dashboard": true }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "id": "0300", "force_on_dashboard": true }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title   | force_on_dashboard | status |
      | 0300 | 0100                | 0200      | My card | true               | active |

  Scenario: PATCH /kanban/cards/{id} — set force_on_dashboard to false
    Given I am authenticated as admin: user.id 0001
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title      | force_on_dashboard | position | status |
      | 0300 | 0100                | 0200      | My card    | true               | 0        | active |
    When I PATCH /api/kanban/cards/0300 with body:
      """
      { "force_on_dashboard": false }
      """
    Then the response status code is 200
    And the response body includes:
      """
      { "id": "0300", "force_on_dashboard": false }
      """
    And the kanban_cards table contains:
      | id   | feature_instance_id | column_id | title   | force_on_dashboard | status |
      | 0300 | 0100                | 0200      | My card | false              | active |
