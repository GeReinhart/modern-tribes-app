Feature: Refresh an access token
  As a user who signed in once on a device
  I want my session to be renewed silently and never expire while I keep using the device
  So that I am not asked to sign in again

  Background:
    Given the users table contains:
      | id   | email         | status |
      | 0002 | user@test.com | active |

  Scenario: POST /authentication/refresh with a valid refresh token — new tokens are issued and the session lasts another 365 days
    Given the user_sessions table contains:
      | user_id | session_id | refresh_token | refresh_expires | previous_refresh_token | rotated_ago |
      | 0002    | session-1  | refresh-A     | +10d            |                        |             |
    When I POST /api/platform/core/authentication/refresh with body:
      """
      { "refresh_token": "refresh-A" }
      """
    Then the response status code is 200
    And the refresh token of session session-1 is no longer refresh-A
    And the refresh token of session session-1 expires in 365 days

  Scenario: POST /authentication/refresh with a token that was rotated 1 minute ago (two tabs refreshing at once) — the session is still valid
    Given the user_sessions table contains:
      | user_id | session_id | refresh_token | refresh_expires | previous_refresh_token | rotated_ago |
      | 0002    | session-1  | refresh-B     | +365d           | refresh-A              | 60s         |
    When I POST /api/platform/core/authentication/refresh with body:
      """
      { "refresh_token": "refresh-A" }
      """
    Then the response status code is 200

  @error_case
  Scenario: POST /authentication/refresh with a token that was rotated more than 2 minutes ago — 401 refresh_token_reused
    Given the user_sessions table contains:
      | user_id | session_id | refresh_token | refresh_expires | previous_refresh_token | rotated_ago |
      | 0002    | session-1  | refresh-B     | +365d           | refresh-A              | 300s        |
    When I POST /api/platform/core/authentication/refresh with body:
      """
      { "refresh_token": "refresh-A" }
      """
    Then the response status code is 401
    And the response body includes:
      """
      { "detail": { "code": "refresh_token_reused" } }
      """

  @error_case
  Scenario: POST /authentication/refresh with an unknown token — 401 refresh_token_unknown
    Given the user_sessions table contains:
      | user_id | session_id | refresh_token | refresh_expires | previous_refresh_token | rotated_ago |
      | 0002    | session-1  | refresh-B     | +365d           |                        |             |
    When I POST /api/platform/core/authentication/refresh with body:
      """
      { "refresh_token": "refresh-unknown" }
      """
    Then the response status code is 401
    And the response body includes:
      """
      { "detail": { "code": "refresh_token_unknown" } }
      """

  @error_case
  Scenario: POST /authentication/refresh after more than 365 days of inactivity — 401 refresh_token_expired
    Given the user_sessions table contains:
      | user_id | session_id | refresh_token | refresh_expires | previous_refresh_token | rotated_ago |
      | 0002    | session-1  | refresh-A     | -1d             |                        |             |
    When I POST /api/platform/core/authentication/refresh with body:
      """
      { "refresh_token": "refresh-A" }
      """
    Then the response status code is 401
    And the response body includes:
      """
      { "detail": { "code": "refresh_token_expired" } }
      """

  @error_case
  Scenario: POST /authentication/refresh after the session was deleted (signed out) — 401 refresh_token_unknown
    Given the user_sessions table contains:
      | user_id | session_id | refresh_token | refresh_expires | previous_refresh_token | rotated_ago |
    When I POST /api/platform/core/authentication/refresh with body:
      """
      { "refresh_token": "refresh-A" }
      """
    Then the response status code is 401
    And the response body includes:
      """
      { "detail": { "code": "refresh_token_unknown" } }
      """
