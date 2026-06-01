@wip
Feature: Get a mail
  As an administrator
  I want to retrieve a mail by its ID
  So that I can inspect its content and status

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

  Scenario: GET /mail/0010 as admin — mail is returned
    Given I am authenticated as an administrator: user.id 0001
    And the mails table contains:
      | id   | subject        | content_html          | mail_status | planned_at | status |
      | 0010 | Welcome aboard | <p>Welcome!</p>       | pending     | 2026-06-01 | active |
    When I GET /api/platform/tools/mail/0010
    Then the response status code is 200

  @error_case
  Scenario: GET /mail/0010 as a viewer — 403 error
    Given I am authenticated as a regular user: user.id 0002
    And the mails table contains:
      | id   | subject        | content_html          | mail_status | planned_at | status |
      | 0010 | Welcome aboard | <p>Welcome!</p>       | pending     | 2026-06-01 | active |
    When I GET /api/platform/tools/mail/0010
    Then the response status code is 403
