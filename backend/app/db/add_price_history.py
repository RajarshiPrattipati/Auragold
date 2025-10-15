"""
Script to add historical price data to existing stocks
"""
import asyncio
import random
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.database import AsyncSessionLocal
from app.db.models import Stock, StockPriceHistory
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


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


async def add_price_history_to_stocks():
    """Add historical price data to existing stocks"""
    logger.info("Starting to add price history to existing stocks...")

    try:
        async with AsyncSessionLocal() as session:
            # Get all stocks
            result = await session.execute(select(Stock))
            stocks = result.scalars().all()

            if not stocks:
                logger.warning("No stocks found in database!")
                return

            logger.info(f"Found {len(stocks)} stocks")

            for stock in stocks:
                # First, delete existing price history for this stock
                await session.execute(
                    delete(StockPriceHistory).where(StockPriceHistory.stock_id == stock.id)
                )
                logger.info(f"Cleared existing price history for {stock.symbol}")

                # Generate 30 days of historical price data
                logger.info(f"Generating price history for {stock.symbol}...")
                price_history_data = generate_price_history(stock.current_price, days=30)

                # Add all price history records
                for price, timestamp in price_history_data:
                    price_history = StockPriceHistory(
                        stock_id=stock.id,
                        price=price,
                        timestamp=timestamp
                    )
                    session.add(price_history)

                logger.info(
                    f"Added {len(price_history_data)} price history points for {stock.symbol}"
                )

            await session.commit()
            logger.info("Successfully added price history to all stocks!")

    except Exception as e:
        logger.error(f"Error adding price history: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(add_price_history_to_stocks())
