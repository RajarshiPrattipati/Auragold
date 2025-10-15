import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(test_client: AsyncClient):
    resp = await test_client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "healthy"}

