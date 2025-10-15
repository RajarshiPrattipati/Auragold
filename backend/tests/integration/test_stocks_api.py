import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Stock, StockPriceHistory


async def _create_stock(session: AsyncSession, symbol: str, name: str, price: float) -> Stock:
    stock = Stock(symbol=symbol, name=name, current_price=price)
    session.add(stock)
    await session.commit()
    await session.refresh(stock)
    return stock


async def _add_history_points(session: AsyncSession, stock_id: int):
    now = datetime.now()
    points = [
        (now - timedelta(days=2), 150.12),
        (now - timedelta(hours=2), 151.55),
        (now - timedelta(minutes=30), 152.75),
        (now - timedelta(minutes=10), 153.33),
    ]
    for ts, price in points:
        session.add(StockPriceHistory(stock_id=stock_id, price=price, timestamp=ts))
    await session.commit()


@pytest.mark.asyncio
async def test_list_stocks_empty_ok(test_client: AsyncClient):
    resp = await test_client.get("/api/v1/stocks")
    assert resp.status_code == 200
    data = resp.json()
    assert "stocks" in data
    assert isinstance(data["stocks"], list)


@pytest.mark.asyncio
async def test_create_and_get_stock(test_client: AsyncClient, db_session: AsyncSession):
    s = await _create_stock(db_session, "STOCK_X", "Test Corp X", 123.45)

    # List
    list_resp = await test_client.get("/api/v1/stocks")
    assert list_resp.status_code == 200
    symbols = [item["symbol"] for item in list_resp.json()["stocks"]]
    assert "STOCK_X" in symbols

    # Get by id
    get_resp = await test_client.get(f"/api/v1/stocks/{s.id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["symbol"] == "STOCK_X"


@pytest.mark.asyncio
async def test_get_stock_not_found(test_client: AsyncClient):
    resp = await test_client.get("/api/v1/stocks/999999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_stock_history_ranges(test_client: AsyncClient, db_session: AsyncSession):
    s = await _create_stock(db_session, "STOCK_H", "History Inc", 200.00)
    await _add_history_points(db_session, s.id)

    for rng in ("1h", "24h", "7d", "30d"):
        r = await test_client.get(f"/api/v1/stocks/{s.id}/history", params={"time_range": rng})
        assert r.status_code == 200
        data = r.json()
        assert data["stock_id"] == s.id
        assert data["symbol"] == s.symbol
        assert "history" in data
        assert isinstance(data["history"], list)

    # Invalid range should 422
    bad = await test_client.get(f"/api/v1/stocks/{s.id}/history", params={"time_range": "bad"})
    assert bad.status_code == 422

