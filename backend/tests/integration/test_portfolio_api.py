import pytest
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import User, Stock, Transaction, Wallet, TransactionType


async def _seed_portfolio(session: AsyncSession):
    user = User(email="pf@example.com", username="pfuser", balance=Decimal("10000.00"))
    user.set_password("Test123!")
    session.add(user)
    await session.flush()

    stock = Stock(symbol="PFS", name="PF Stock", current_price=Decimal("100.00"))
    session.add(stock)
    await session.flush()

    # Buy 10 shares at 80
    t = Transaction(
        user_id=user.id,
        stock_id=stock.id,
        type=TransactionType.BUY,
        amount=Decimal("800.00"),
        quantity=Decimal("10.000000"),
        price_per_unit=Decimal("80.00"),
    )
    session.add(t)

    wallet = Wallet(user_id=user.id, stock_id=stock.id, quantity=Decimal("10.000000"))
    session.add(wallet)

    await session.commit()
    await session.refresh(user)
    await session.refresh(stock)
    return user, stock


@pytest.mark.asyncio
async def test_get_portfolio_summary_success(test_client: AsyncClient, db_session: AsyncSession):
    user, stock = await _seed_portfolio(db_session)

    resp = await test_client.get(f"/api/v1/portfolio/{user.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == user.id
    assert "total_invested" in data
    assert "current_value" in data
    assert "gain_loss_amount" in data
    assert "holdings" in data and isinstance(data["holdings"], list)
    # Has one holding
    assert len(data["holdings"]) == 1
    holding = data["holdings"][0]
    assert holding["stock_symbol"] == stock.symbol


@pytest.mark.asyncio
async def test_get_portfolio_user_not_found(test_client: AsyncClient):
    resp = await test_client.get("/api/v1/portfolio/999999")
    assert resp.status_code == 404

