# Packages

We have the platform and the features. 

- The dependencies must be:
  - platform -> external dependencies
  - features -> platform or external dependencies

- **FORBIDDEN**: dependency platform -> features
- The more the file is deep in the hierarchy, the more specific it is.
- The package organization is feature-oriented (not technology-oriented).
- For a given feature, we have the same package on backend and frontend.
