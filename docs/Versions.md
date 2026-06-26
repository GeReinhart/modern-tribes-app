# Versions

2 separate versions channels
- one for the platform
- one for the platform and the features

As the application grows, we will keep quite separated the platform and the features. This idea is to be able to create easily a new application based on the last version of the platform.

## Platform and Features

version: 1.X.Y

## Platform 

version: 0.X.Y

When a release is made on the platform with some new features and that the platform itself evolves. We will create a specific version of the platform without the features  

For instance, the platform version 0.2.0 will be the version of the platform without the features of the release 1.2.0.

The skill /keep-only-platform will be used.


## Versioning

It's a git tag.

It's also defined in files:
- `@/frontend/src/android/twa-manifest.json` `appVersion`
- `@frontend/.env` `VITE_APP_VERSION`
- `frontend/package.json` `version`
