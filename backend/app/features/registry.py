from dataclasses import dataclass, field
from fastapi import APIRouter

@dataclass
class FeatureDefinition:
    feature_type: str
    label: str
    router: APIRouter
    extra_routers: list[APIRouter] = field(default_factory=list)


_registry: dict[str, FeatureDefinition] = {}


def register_feature(definition: FeatureDefinition) -> None:
    _registry[definition.feature_type] = definition


def get_all_routers() -> list[APIRouter]:
    routers = []
    for d in _registry.values():
        routers.append(d.router)
        routers.extend(d.extra_routers)
    return routers


def get_available_feature_types() -> list[dict]:
    return [{"feature_type": d.feature_type, "label": d.label} for d in _registry.values()]
