"""
Database seed script for stock trading application
Seeds initial stocks, test users, and sample data
"""
import asyncio
import random
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import AsyncSessionLocal, engine, Base
from app.db.models import User, Stock, Transaction, Wallet, StockPriceHistory, TransactionType
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


# Mock data for stocks
INITIAL_STOCKS = [
    {
        "symbol": "STOCK_A",
        "name": "AuraGold Tech Corp",
        "current_price": Decimal("150.00")
    },
    {
        "symbol": "STOCK_B",
        "name": "Quantum Dynamics Inc",
        "current_price": Decimal("85.50")
    },
    {
        "symbol": "STOCK_C",
        "name": "NexGen Solutions",
        "current_price": Decimal("220.75")
    },
    {
        "symbol": "STOCK_D",
        "name": "Phoenix Energy Ltd",
        "current_price": Decimal("45.25")
    },
    {
        "symbol": "STOCK_E",
        "name": "BlueSky Ventures",
        "current_price": Decimal("310.00")
    }
]


# Mock data for test users
TEST_USERS = [
    {
        "email": "trader1@example.com",
        "username": "trader1",
        "password": "Test123!",
        "balance": Decimal("10000.00"),
        "is_active": True,
        "email_verified": True
    },
    {
        "email": "trader2@example.com",
        "username": "trader2",
        "password": "Test123!",
        "balance": Decimal("15000.00"),
        "is_active": True,
        "email_verified": True
    },
    {
        "email": "investor@example.com",
        "username": "investor",
        "password": "Test123!",
        "balance": Decimal("50000.00"),
        "is_active": True,
        "email_verified": True
    },
    {
        "email": "admin@example.com",
        "username": "admin",
        "password": "Admin123!",
        "balance": Decimal("100000.00"),
        "role": "admin",
        "is_superuser": True,
        "is_active": True,
        "email_verified": True
    }
]


def generate_price_history(base_price: Decimal, days: int = 30) -> list:
    """
    Generate realistic mock price history data

    Args:
        base_price: The current/ending price for the stock
        days: Number of days of history to generate

    Returns:
        List of (price, timestamp) tuples
    """
    history = []
    current_time = datetime.now()

    # Calculate starting price (randomly 10-30% different from current)
    volatility = random.uniform(-0.30, 0.30)
    start_price = float(base_price) * (1 - volatility)

    # Generate hourly data points for the past 'days' days
    total_hours = days * 24
    price = start_price

    for hour in range(total_hours, 0, -1):
        timestamp = current_time - timedelta(hours=hour)

        # Random walk with slight upward/downward bias toward base_price
        change_percent = random.uniform(-0.03, 0.03)  # ±3% per hour max

        # Add bias to move toward the target base_price
        target_bias = (float(base_price) - price) / float(base_price) * 0.02
        change_percent += target_bias

        price = price * (1 + change_percent)

        # Ensure price stays reasonable (not below 20% of base or above 200%)
        price = max(float(base_price) * 0.2, min(price, float(base_price) * 2.0))

        history.append((Decimal(str(round(price, 2))), timestamp))

    # Add current price as the final data point
    history.append((base_price, current_time))

    return history


async def create_stocks(session: AsyncSession) -> dict:
    """Create initial stock data with historical price data"""
    logger.info("Creating initial stocks with historical price data...")
    stocks = {}

    for stock_data in INITIAL_STOCKS:
        stock = Stock(**stock_data)
        session.add(stock)
        await session.flush()
        stocks[stock_data["symbol"]] = stock

        # Generate 30 days of historical price data
        logger.info(f"Generating price history for {stock.symbol}...")
        price_history_data = generate_price_history(stock_data["current_price"], days=30)

        # Add all price history records
        for price, timestamp in price_history_data:
            price_history = StockPriceHistory(
                stock_id=stock.id,
                price=price,
                timestamp=timestamp
            )
            session.add(price_history)

        logger.info(f"Created stock: {stock.symbol} - {stock.name} @ ${stock.current_price} with {len(price_history_data)} price history points")

    await session.commit()
    return stocks


async def create_users(session: AsyncSession) -> dict:
    """Create test users"""
    logger.info("Creating test users...")
    users = {}

    for user_data in TEST_USERS:
        password = user_data.pop("password")
        user = User(**user_data)
        user.set_password(password)
        session.add(user)
        await session.flush()
        users[user_data["username"]] = user

        logger.info(f"Created user: {user.username} with balance ${user.balance}")

    await session.commit()
    return users


async def create_sample_transactions(
    session: AsyncSession,
    users: dict,
    stocks: dict
):
    """Create sample transactions and wallet entries"""
    logger.info("Creating sample transactions...")

    # Trader1 buys STOCK_A and STOCK_B
    trader1 = users["trader1"]
    stock_a = stocks["STOCK_A"]
    stock_b = stocks["STOCK_B"]

    # Buy STOCK_A
    quantity_a = Decimal("10.0")
    amount_a = quantity_a * stock_a.current_price

    transaction_a = Transaction(
        user_id=trader1.id,
        stock_id=stock_a.id,
        type=TransactionType.BUY,
        amount=amount_a,
        quantity=quantity_a,
        price_per_unit=stock_a.current_price
    )
    session.add(transaction_a)

    # Update wallet
    wallet_a = Wallet(
        user_id=trader1.id,
        stock_id=stock_a.id,
        quantity=quantity_a
    )
    session.add(wallet_a)

    # Update user balance
    trader1.balance -= amount_a

    logger.info(f"trader1 bought {quantity_a} shares of {stock_a.symbol} for ${amount_a}")

    # Buy STOCK_B
    quantity_b = Decimal("20.0")
    amount_b = quantity_b * stock_b.current_price

    transaction_b = Transaction(
        user_id=trader1.id,
        stock_id=stock_b.id,
        type=TransactionType.BUY,
        amount=amount_b,
        quantity=quantity_b,
        price_per_unit=stock_b.current_price
    )
    session.add(transaction_b)

    wallet_b = Wallet(
        user_id=trader1.id,
        stock_id=stock_b.id,
        quantity=quantity_b
    )
    session.add(wallet_b)

    trader1.balance -= amount_b

    logger.info(f"trader1 bought {quantity_b} shares of {stock_b.symbol} for ${amount_b}")

    # Trader2 buys STOCK_C
    trader2 = users["trader2"]
    stock_c = stocks["STOCK_C"]

    quantity_c = Decimal("15.0")
    amount_c = quantity_c * stock_c.current_price

    transaction_c = Transaction(
        user_id=trader2.id,
        stock_id=stock_c.id,
        type=TransactionType.BUY,
        amount=amount_c,
        quantity=quantity_c,
        price_per_unit=stock_c.current_price
    )
    session.add(transaction_c)

    wallet_c = Wallet(
        user_id=trader2.id,
        stock_id=stock_c.id,
        quantity=quantity_c
    )
    session.add(wallet_c)

    trader2.balance -= amount_c

    logger.info(f"trader2 bought {quantity_c} shares of {stock_c.symbol} for ${amount_c}")

    # Investor buys multiple stocks
    investor = users["investor"]
    stock_d = stocks["STOCK_D"]
    stock_e = stocks["STOCK_E"]

    # Buy STOCK_D
    quantity_d = Decimal("50.0")
    amount_d = quantity_d * stock_d.current_price

    transaction_d = Transaction(
        user_id=investor.id,
        stock_id=stock_d.id,
        type=TransactionType.BUY,
        amount=amount_d,
        quantity=quantity_d,
        price_per_unit=stock_d.current_price
    )
    session.add(transaction_d)

    wallet_d = Wallet(
        user_id=investor.id,
        stock_id=stock_d.id,
        quantity=quantity_d
    )
    session.add(wallet_d)

    investor.balance -= amount_d

    logger.info(f"investor bought {quantity_d} shares of {stock_d.symbol} for ${amount_d}")

    # Buy STOCK_E
    quantity_e = Decimal("25.0")
    amount_e = quantity_e * stock_e.current_price

    transaction_e = Transaction(
        user_id=investor.id,
        stock_id=stock_e.id,
        type=TransactionType.BUY,
        amount=amount_e,
        quantity=quantity_e,
        price_per_unit=stock_e.current_price
    )
    session.add(transaction_e)

    wallet_e = Wallet(
        user_id=investor.id,
        stock_id=stock_e.id,
        quantity=quantity_e
    )
    session.add(wallet_e)

    investor.balance -= amount_e

    logger.info(f"investor bought {quantity_e} shares of {stock_e.symbol} for ${amount_e}")

    await session.commit()
    logger.info("Sample transactions created successfully")


async def seed_database():
    """Main seed function"""
    logger.info("Starting database seeding...")

    try:
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created")

        async with AsyncSessionLocal() as session:
            # Seed stocks
            stocks = await create_stocks(session)

            # Seed users
            users = await create_users(session)

            # Seed sample transactions
            await create_sample_transactions(session, users, stocks)

        logger.info("Database seeding completed successfully!")

        # Print summary
        print("\n" + "="*60)
        print("DATABASE SEEDED SUCCESSFULLY")
        print("="*60)
        print("\nTest Users (username / password):")
        print("-" * 60)
        for user_data in TEST_USERS:
            print(f"  {user_data['username']} / Test123! (or Admin123! for admin)")

        print("\nStocks:")
        print("-" * 60)
        for stock in INITIAL_STOCKS:
            print(f"  {stock['symbol']}: {stock['name']} @ ${stock['current_price']}")

        print("\n" + "="*60 + "\n")

    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(seed_database())
