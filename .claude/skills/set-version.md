# Set Version

Updates the application version across all version files.

## Usage

```
/set-version <version>
```

Example: `/set-version 1.1.0`

## Files to update

The version is stored in three places that must stay in sync (as documented in `docs/Versions.md`):

1. `frontend/.env` — `VITE_APP_VERSION=<version>`
2. `frontend/package.json` — `"version": "<version>"`
3. `frontend/src/android/twa-manifest.json` — `"appVersionName": "<version>"` and `"appVersion": "<version>"`

## Process

1. Read the version argument from the skill invocation args.
2. Update `frontend/.env`: replace the `VITE_APP_VERSION=...` line with `VITE_APP_VERSION=<version>`.
3. Update `frontend/package.json`: replace the `"version": "..."` value with `<version>`.
4. Update `frontend/src/android/twa-manifest.json`: replace both `"appVersionName"` and `"appVersion"` values with `<version>`.
5. Confirm all three files were updated and report the new version to the user.

Do NOT update `frontend/package-lock.json` manually — it is managed by npm.
