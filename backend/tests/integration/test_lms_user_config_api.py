import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import User, UserUIConfig
from app.config import get_settings

settings = get_settings()
API_PREFIX = settings.API_PREFIX


async def _register_and_login(client: AsyncClient, email: str, username: str, password: str) -> str:
    await client.post(f"{API_PREFIX}/auth/register", json={"email": email, "username": username, "password": password})
    resp = await client.post(f"{API_PREFIX}/auth/login", json={"email": email, "password": password})
    token = resp.json()["access_token"]
    return token


@pytest.mark.asyncio
async def test_user_ui_config_roundtrip(test_client: AsyncClient, db_session: AsyncSession):
    token = await _register_and_login(test_client, "uiconfig@example.com", "uiconfig", "pass12345")
    headers = {"Authorization": f"Bearer {token}"}

    # Initially empty
    get_resp = await test_client.get(f"{API_PREFIX}/v1/lms/user-config", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["config"] == {}

    # Put config
    cfg = {"dashboard_layout_v1": {"order": ["stats", "featured"], "visibility": {"stats": True}}}
    put_resp = await test_client.put(f"{API_PREFIX}/v1/lms/user-config", headers=headers, json={"config": cfg})
    assert put_resp.status_code == 200
    assert put_resp.json()["config"] == cfg

    # Confirm in DB
    res = await db_session.execute(select(User).where(User.email == "uiconfig@example.com"))
    user = res.scalar_one()
    res2 = await db_session.execute(select(UserUIConfig).where(UserUIConfig.user_id == user.id))
    row = res2.scalar_one()
    assert row.config == cfg


@pytest.mark.asyncio
async def test_push_user_config_open(test_client: AsyncClient):
    cfg = {"dashboard_layout_v1": {"order": ["stats"], "visibility": {"stats": True}}}
    push = await test_client.post(f"{API_PREFIX}/v1/lms/push-user-config", json={"config": cfg})
    assert push.status_code == 200
    assert "updated_users" in push.json()
