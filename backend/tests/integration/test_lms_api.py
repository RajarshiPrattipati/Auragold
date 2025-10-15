import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_lms_config(test_client: AsyncClient):
    resp = await test_client.get("/api/v1/lms/config")
    assert resp.status_code == 200
    data = resp.json()
    # Basic structure checks
    assert "buy_screen" in data
    assert "portfolio_screen" in data
    assert "dashboard_screen" in data
    assert isinstance(data.get("version"), str)

    # Some key fields exist
    assert "show_price_chart" in data["buy_screen"]
    assert "show_gain_loss" in data["portfolio_screen"]
    assert "card_layout" in data["dashboard_screen"]

