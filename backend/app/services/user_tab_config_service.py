from ..models.app.user_tab_configs import UserTabConfigResponse, UserTabConfigRequest
from ..repositories import user_tab_configs_repository


async def get_tab_config(user_id: str, context_key: str, pool) -> UserTabConfigResponse:
    row = await user_tab_configs_repository.get_tab_config(pool, user_id, context_key)
    tab_configs = row['tab_configs'] if row else []
    return UserTabConfigResponse(context_key=context_key, tab_configs=tab_configs)


async def save_tab_config(
    user_id: str, context_key: str, data: UserTabConfigRequest, pool, current_user: dict
) -> UserTabConfigResponse:
    configs = [item.model_dump() for item in data.tab_configs]
    row = await user_tab_configs_repository.upsert_tab_config(
        pool, user_id, context_key, configs, current_user['id']
    )
    return UserTabConfigResponse(context_key=context_key, tab_configs=row['tab_configs'])
