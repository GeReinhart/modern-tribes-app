@wip
Feature: Update a mail
  As an administrator
  I want to update a mail's subject or content
  So that the information is correct before sending

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

  Scenario: PUT /mail/0010 with valid body as admin — the mail is updated
    Given I am authenticated as an administrator: user.id 0001
    And the mails table contains:
      | id   | subject | content_html | mail_status | planned_at          | status  |
      | 0010 | Welcome | <p>Hello</p> | not_sent    | 2025-01-15 10:00:00 | pending |
    When I PUT /api/platform/tools/mail/0010 with body:
      """
      {"subject": "Welcome Updated"}
      """
    Then the response status code is 200
    And the mails table contains:
      | id   | subject         | status  |
      | 0010 | Welcome Updated | pending |

  @error_case
  Scenario: PUT /mail/0010 as a viewer — 403 error and the mail is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the mails table contains:
      | id   | subject | content_html | mail_status | planned_at          | status  |
      | 0010 | Welcome | <p>Hello</p> | not_sent    | 2025-01-15 10:00:00 | pending |
    When I PUT /api/platform/tools/mail/0010 with body:
      """
      {"subject": "Welcome Updated"}
      """
    Then the response status code is 403
    And the mails table contains:
      | id   | subject | status  |
      | 0010 | Welcome | pending |
