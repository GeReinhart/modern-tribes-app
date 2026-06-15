import re
from enum import Enum

_SHORT_ID_RE = re.compile(r'^\d{1,4}$')


def expand_id(value: str) -> str:
    """Expand a 1–4 digit short ID to a zero-padded UUID (e.g. '0001' → '00000000-0000-0000-0000-000000000001')."""
    if _SHORT_ID_RE.match(value):
        return f"00000000-0000-0000-0000-{int(value):012d}"
    return value


def expand_path_ids(path: str) -> str:
    """Expand short IDs in URL path segments (e.g. /persons/0010 → /persons/00000000-...-000000000010)."""
    return '/'.join(expand_id(segment) for segment in path.split('/'))


def expand_json_ids(data: object) -> object:
    """Recursively expand short IDs in parsed JSON values."""
    if isinstance(data, dict):
        return {k: expand_json_ids(v) for k, v in data.items()}
    if isinstance(data, list):
        return [expand_json_ids(v) for v in data]
    if isinstance(data, str) and _SHORT_ID_RE.match(data):
        return expand_id(data)
    return data


def field_str(value: object) -> str:
    """Return the string representation of a field value, using .value for Enum types."""
    return value.value if isinstance(value, Enum) else str(value)


def assert_table(actual: list[dict], datatable: list, label: str = "table") -> None:
    """Assert that actual records exactly match a Gherkin datatable (short-ID expansion applied)."""
    headers = datatable[0]
    expected_rows = datatable[1:]
    assert len(actual) == len(expected_rows), (
        f"Expected {len(expected_rows)} record(s) in {label}, got {len(actual)}"
    )
    for expected, record in zip(expected_rows, actual):
        for i, col in enumerate(headers):
            assert field_str(record[col]) == expand_id(expected[i]), (
                f"{label}.{col}: expected {expected[i]!r}, got {record[col]!r}"
            )


def assert_table_contains(actual: list[dict], datatable: list, label: str = "table") -> None:
    """Assert that actual records contain every row from datatable (subset check, short-ID expansion applied)."""
    headers = datatable[0]
    for row in datatable[1:]:
        expected = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
        actual_projections = [
            {col: field_str(r[col]) for col in headers if col in r}
            for r in actual
        ]
        assert expected in actual_projections, (
            f"{label}: expected row {expected!r} not found in {actual_projections!r}"
        )


def seed_store(store: object, datatable: list) -> None:
    """Clear a store and populate it from a Gherkin datatable (short-ID expansion applied)."""
    from datetime import datetime
    _default_ts = datetime(2024, 1, 1, 0, 0, 0)
    store.clear()
    headers = datatable[0]
    for row in datatable[1:]:
        record = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
        record.setdefault("created_at", _default_ts)
        record.setdefault("updated_at", _default_ts)
        store.insert(record)
