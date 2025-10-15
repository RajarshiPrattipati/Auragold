import pytest
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, Stock, Wallet


async def _create_user(session: AsyncSession, email: str, username: str, balance: float) -> User:
    u = User(email=email, username=username, balance=Decimal(str(balance)))
    u.set_password("Test123!")
    session.add(u)
    await session.commit()
    await session.refresh(u)
    return u


async def _create_stock(session: AsyncSession, symbol: str, name: str, price: float) -> Stock:
    s = Stock(symbol=symbol, name=name, current_price=Decimal(str(price)))
    session.add(s)
    await session.commit()
    await session.refresh(s)
    return s


@pytest.mark.asyncio
async def test_buy_transaction_success(test_client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, "buyer@example.com", "buyer", 1000.00)
    stock = await _create_stock(db_session, "BUY_A", "Buyable", 100.00)

    payload = {"user_id": user.id, "stock_id": stock.id, "amount": "500.00"}
    resp = await test_client.post("/api/v1/transactions/buy", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["transaction_id"] > 0
    # Quantity should be 5.0 (as string from Decimal) with 6 decimals possible
    assert Decimal(str(data["quantity"])) == Decimal("5.000000")

    # Balance reduced
    await db_session.refresh(user)
    assert user.balance == Decimal("500.00")

    # Wallet updated
    w = (await db_session.execute(Wallet.__table__.select().where(Wallet.user_id == user.id, Wallet.stock_id == stock.id))).first()
    assert w is not None


@pytest.mark.asyncio
async def test_buy_insufficient_balance(test_client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, "poor@example.com", "poor", 100.00)
    stock = await _create_stock(db_session, "BUY_B", "Expensive", 200.00)

    resp = await test_client.post("/api/v1/transactions/buy", json={"user_id": user.id, "stock_id": stock.id, "amount": "500.00"})
    assert resp.status_code == 400
    assert "Insufficient balance" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_sell_transaction_success(test_client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, "seller@example.com", "seller", 100.00)
    stock = await _create_stock(db_session, "SELL_A", "Sellable", 50.00)

    # Give the user 10 shares in wallet
    w = Wallet(user_id=user.id, stock_id=stock.id, quantity=Decimal("10.000000"))
    db_session.add(w)
    await db_session.commit()

    resp = await test_client.post("/api/v1/transactions/sell", json={"user_id": user.id, "stock_id": stock.id, "quantity": "3.000000"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert Decimal(str(data["proceeds"])) == Decimal("150.00")

    await db_session.refresh(user)
    assert user.balance == Decimal("250.00")  # 100 + 150

    # Check remaining quantity
    await db_session.refresh(w)
    assert w.quantity == Decimal("7.000000")


@pytest.mark.asyncio
async def test_sell_insufficient_quantity(test_client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, "noshares@example.com", "noshares", 100.00)
    stock = await _create_stock(db_session, "SELL_B", "None", 10.00)

    # Wallet with fewer shares
    w = Wallet(user_id=user.id, stock_id=stock.id, quantity=Decimal("1.000000"))
    db_session.add(w)
    await db_session.commit()

    resp = await test_client.post("/api/v1/transactions/sell", json={"user_id": user.id, "stock_id": stock.id, "quantity": "5.000000"})
    assert resp.status_code == 400
    assert "Insufficient stock quantity" in resp.json()["detail"]

