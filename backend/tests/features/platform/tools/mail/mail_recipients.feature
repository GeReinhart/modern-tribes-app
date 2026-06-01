@wip
Feature: Manage mail recipients
  As an administrator
  I want to manage the recipients of a mail
  So that I can control who receives a given communication

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

  Scenario: GET /mail/0010/recipients as admin — recipients are returned
    Given I am authenticated as an administrator: user.id 0001
    And the mails table contains:
      | id   | subject        | content_html    | mail_status | planned_at | status |
      | 0010 | Welcome aboard | <p>Welcome!</p> | pending     | 2026-06-01 | active |
    When I GET /api/platform/tools/mail/0010/recipients
    Then the response status code is 200

  Scenario: POST /mail/0010/recipients as admin — recipient is added
    Given I am authenticated as an administrator: user.id 0001
    And the mails table contains:
      | id   | subject        | content_html    | mail_status | planned_at | status |
      | 0010 | Welcome aboard | <p>Welcome!</p> | pending     | 2026-06-01 | active |
    When I POST /api/platform/tools/mail/0010/recipients with body:
      """
      {"mail_id": "0010", "user_id": "0001"}
      """
    Then the response status code is 201

  @error_case
  Scenario: GET /mail/0010/recipients as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the mails table contains:
      | id   | subject        | content_html    | mail_status | planned_at | status |
      | 0010 | Welcome aboard | <p>Welcome!</p> | pending     | 2026-06-01 | active |
    When I GET /api/platform/tools/mail/0010/recipients
    Then the response status code is 403
