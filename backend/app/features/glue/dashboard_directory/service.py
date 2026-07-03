from app.features.glue.dashboard_directory.models import (
    DashboardDirectoryResponse,
    EventInstanceDirectoryEntry,
    ProjectDirectoryEntry,
    TaskInstanceDirectoryEntry,
)
from app.features.glue.dashboard_directory import repository
from app.features.tribes_projects.projects import repository as projects_repository

_KANBAN = "kanban"
_TODO_LIST = "todo_list"
_TASK_FEATURE_TYPES = (_KANBAN, _TODO_LIST)
_EVENT_FEATURE_TYPES = ("events",)


async def get_dashboard_directory(user_id: str, pool) -> DashboardDirectoryResponse:
    projects = await projects_repository.fetch_accessible_projects_with_tribes(pool, user_id)
    projects_by_id = {p["project_id"]: p for p in projects}

    instances = await repository.fetch_feature_instances_for_projects(
        pool, list(projects_by_id.keys()), [*_TASK_FEATURE_TYPES, *_EVENT_FEATURE_TYPES]
    )
    kanban_rows = [i for i in instances if i["feature_type"] == _KANBAN]
    todo_rows = [i for i in instances if i["feature_type"] == _TODO_LIST]
    event_rows = [i for i in instances if i["feature_type"] in _EVENT_FEATURE_TYPES]

    kanban_counts = await repository.fetch_kanban_open_counts(pool, [r["feature_instance_id"] for r in kanban_rows])
    todo_counts = await repository.fetch_todo_open_counts(pool, [r["feature_instance_id"] for r in todo_rows])
    event_counts = await repository.fetch_upcoming_event_counts(pool, [r["feature_instance_id"] for r in event_rows])

    task_instances = [
        _build_task_instance(row, projects_by_id, kanban_counts if row["feature_type"] == _KANBAN else todo_counts)
        for row in [*kanban_rows, *todo_rows]
    ]
    event_instances = [_build_event_instance(row, projects_by_id, event_counts) for row in event_rows]
    project_entries = _build_project_entries(
        projects, kanban_rows, todo_rows, event_rows, kanban_counts, todo_counts, event_counts
    )

    return DashboardDirectoryResponse(
        projects=project_entries,
        task_instances=task_instances,
        event_instances=event_instances,
    )


def _build_task_instance(row: dict, projects_by_id: dict, counts: dict) -> TaskInstanceDirectoryEntry:
    project = projects_by_id[row["project_id"]]
    return TaskInstanceDirectoryEntry(
        feature_instance_id=row["feature_instance_id"],
        feature_type=row["feature_type"],
        instance_name=row["instance_name"],
        project_url_param_id=project["project_url_param_id"],
        project_name=project["project_name"],
        tribe_url_param_id=project["tribe_url_param_id"],
        tribe_name=project["tribe_name"],
        open_count=counts.get(row["feature_instance_id"], 0),
    )


def _build_event_instance(row: dict, projects_by_id: dict, counts: dict) -> EventInstanceDirectoryEntry:
    project = projects_by_id[row["project_id"]]
    return EventInstanceDirectoryEntry(
        feature_instance_id=row["feature_instance_id"],
        instance_name=row["instance_name"],
        project_url_param_id=project["project_url_param_id"],
        project_name=project["project_name"],
        tribe_url_param_id=project["tribe_url_param_id"],
        tribe_name=project["tribe_name"],
        upcoming_count=counts.get(row["feature_instance_id"], 0),
    )


def _sum_counts_by_project(rows: list[dict], counts: dict) -> dict[str, int]:
    totals: dict[str, int] = {}
    for row in rows:
        count = counts.get(row["feature_instance_id"], 0)
        totals[row["project_id"]] = totals.get(row["project_id"], 0) + count
    return totals


def _build_project_entries(
    projects: list[dict],
    kanban_rows: list[dict],
    todo_rows: list[dict],
    event_rows: list[dict],
    kanban_counts: dict,
    todo_counts: dict,
    event_counts: dict,
) -> list[ProjectDirectoryEntry]:
    kanban_by_project = _sum_counts_by_project(kanban_rows, kanban_counts)
    todo_by_project = _sum_counts_by_project(todo_rows, todo_counts)
    event_by_project = _sum_counts_by_project(event_rows, event_counts)

    entries = []
    for project in projects:
        pid = project["project_id"]
        entries.append(ProjectDirectoryEntry(
            project_id=pid,
            project_url_param_id=project["project_url_param_id"],
            project_name=project["project_name"],
            tribe_url_param_id=project["tribe_url_param_id"],
            tribe_name=project["tribe_name"],
            open_task_count=kanban_by_project.get(pid, 0) + todo_by_project.get(pid, 0),
            upcoming_event_count=event_by_project.get(pid, 0),
        ))
    return entries
