#!/usr/bin/env python3
"""Map backend files changed relative to `main` to the BDD test directories
that cover them, so run-backend-tests.sh can skip unrelated suites.

Reads changed file paths (repo-root relative, one per line) from stdin.
Prints one resolved test path per line (relative to backend/), or a single
sentinel line:
  NONE  -- nothing under backend/ changed, no tests need to run
  FULL  -- a change can't be scoped down confidently, run the whole suite
"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
TESTS_BDD_DIR = BACKEND_DIR / "tests" / "bdd"

# Changing any of these affects the backend broadly and can't be scoped down.
ALWAYS_FULL_PREFIXES = (
    "backend/app/platform/core/",
    "backend/app/main.py",
    "backend/app/features/registry.py",
    "backend/alembic/",
    "backend/scripts/",
    "backend/requirements.txt",
    "backend/pyproject.toml",
    "backend/tests/bdd/conftest.py",
    "backend/tests/conftest.py",
    "backend/tests/db_helpers.py",
)

TESTS_FEATURE_FILES_PREFIX = "backend/tests/features/features/"
TESTS_BDD_PREFIX = "backend/tests/bdd/"
APP_PREFIX = "backend/app/"


def resolve_app_change(app_relative_dir: str) -> list[str]:
    """app_relative_dir is a changed file's directory, relative to backend/app/,
    e.g. 'features/groceries/catalog' or 'platform/functions/people/persons'.

    Only an exact full-depth mirror or a leaf-name match are trusted: trying
    intermediate depths risks matching an unrelated sibling directory that
    happens to exist (e.g. 'platform/functions' exists for other features
    even where 'platform/functions/people' does not mirror to tests)."""
    parts = [p for p in app_relative_dir.split("/") if p]
    if not parts:
        return []
    exact = TESTS_BDD_DIR.joinpath(*parts)
    if exact.is_dir():
        return [str(exact.relative_to(BACKEND_DIR))]
    # Path drifted from the app/ layout (e.g. platform/functions/people vs
    # tests/bdd/platform/people) -- fall back to matching the leaf dir name.
    leaf = parts[-1]
    matches = sorted(p for p in TESTS_BDD_DIR.rglob(leaf) if p.is_dir())
    return [str(m.relative_to(BACKEND_DIR)) for m in matches]


def resolve_one(changed_file: str) -> list[str]:
    """Return the resolved test dirs for one changed file, or [] if unmapped."""
    if changed_file.startswith(TESTS_BDD_PREFIX):
        return [str(Path(changed_file[len("backend/"):]).parent)]
    if changed_file.startswith(TESTS_FEATURE_FILES_PREFIX):
        rest = changed_file[len(TESTS_FEATURE_FILES_PREFIX):]
        return [str(Path("tests/bdd/features") / Path(rest).parent)]
    if changed_file.startswith(APP_PREFIX):
        app_relative_dir = str(Path(changed_file[len(APP_PREFIX):]).parent)
        return resolve_app_change(app_relative_dir)
    return []


def main() -> None:
    changed = [line.strip() for line in sys.stdin if line.strip()]
    changed = [f for f in changed if f.startswith("backend/")]

    if not changed:
        print("NONE")
        return

    if any(f.startswith(ALWAYS_FULL_PREFIXES) for f in changed):
        print("FULL")
        return

    resolved: set[str] = set()
    for f in changed:
        test_dirs = resolve_one(f)
        if not test_dirs:
            print(f"# unmapped changed file: {f}", file=sys.stderr)
            print("FULL")
            return
        resolved.update(test_dirs)

    if not resolved:
        print("NONE")
        return

    for path in sorted(resolved):
        print(path)


if __name__ == "__main__":
    main()
