from typing import List, Optional

from pydantic import BaseModel


class ProjectDirectoryEntry(BaseModel):
    project_id: str
    project_url_param_id: str
    project_name: str
    tribe_url_param_id: str
    tribe_name: str
    open_task_count: int
    upcoming_event_count: int


class TaskInstanceDirectoryEntry(BaseModel):
    feature_instance_id: str
    feature_type: str
    instance_name: Optional[str] = None
    project_url_param_id: str
    project_name: str
    tribe_url_param_id: str
    tribe_name: str
    open_count: int


class EventInstanceDirectoryEntry(BaseModel):
    feature_instance_id: str
    instance_name: Optional[str] = None
    project_url_param_id: str
    project_name: str
    tribe_url_param_id: str
    tribe_name: str
    upcoming_count: int


class DashboardDirectoryResponse(BaseModel):
    projects: List[ProjectDirectoryEntry]
    task_instances: List[TaskInstanceDirectoryEntry]
    event_instances: List[EventInstanceDirectoryEntry]
