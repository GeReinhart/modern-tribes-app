# Agent Coding Guidelines

## Main process

- 1 - **Check** the project is a good status first. Green light. Otherwise, you do not start anything.
   - ./scripts/check-area.sh
   - ./scripts/check-application.json.sh
   - ./scripts/check-backend.sh
   - ./scripts/check-frontend.sh
   - read ./application.json it will give you a great idea of the project structure
- 2 - **Apply changes** to the project.
- 3 - **Check** the produced code is still a good status.
  - ./scripts/check-application.json.sh
  - ./scripts/check-backend.sh
  - ./scripts/check-frontend.sh

## Testing the changes

- You **MUST NOT** try to launch neither the backend nor the frontend. To test anything.
- You **MUST** ask me to do the test for you, and I will give you the feedback from the application.
- You can check that the code is compiling, but you **MUST NOT** check that it works live.

## Code Quality — Hard Constraints

These rules apply to all code you write or modify, in any language or layer.

### Do Not Repeat Yourself

- **Never duplicate logic.** If the same logic appears in two places, extract it into a shared function, module, or utility before proceeding.
- **Never duplicate a data structure or constant.** Define it once, import it everywhere.
- **If you copy-paste code to adapt it slightly, stop.** Parameterize the difference instead.

### Function Size

- **A function must not exceed 30 lines.** If it does, split it. Each sub-function must have a single, named responsibility.
- **A function must do one thing.** If its name requires "and" to describe it, split it.

### File Size

- **A file must not exceed 300 lines.** If it does, split it by responsibility into separate files.
- **A file must have a single, clear responsibility.** Do not mix concerns in one file (e.g., routing + business logic + database access).

### Code Organization

- **Similar code must live in the same place.** Group by concern: all API calls together, all validators together, all utilities together.
- **When adding code, first check if a related file already exists.** Add to it rather than creating a new one, unless it would violate the file size rule.
- **New shared logic must go in a shared module immediately**, not inline at the call site.

- **MUST**: follow ./docs/Packages.md 

### Refactoring Triggers

When you encounter any of the following, refactor before continuing:

- A function is longer than 30 lines
- A file is longer than 300 lines
- The same logic exists in more than one place
- A function name contains "and" or describes multiple steps
- A file imports from many unrelated modules (sign of mixed concerns)


### Features

- each feature should be on a specific package under the package `features` on backend and front end
- try to use the hexagonal architecture to have the dependency from the application to this features (the features can use common element provided by the app on the front and on the back)
- the project is associated with several features, 
   - a same feature can have several instances in the project
   - the manager of the project can add the features to the project, a name is given for each instance
   - each instance of the feature is accessible by a tab in the project page
