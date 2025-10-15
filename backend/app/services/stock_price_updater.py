"""
Stock Price Updater Service
Updates stock prices every 5 minutes with random fluctuations
"""
import random
from decimal import Decimal
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.db.models import Stock, StockPriceHistory
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class StockPriceUpdater:
    """Service to update stock prices with random fluctuations"""

    def __init__(self):
        self.min_change_percent = -10  # -10%
        self.max_change_percent = 10   # +10%
        logger.info("StockPriceUpdater initialized")

    async def update_all_stock_prices(self):
        """
        Update all stock prices with random fluctuation

        Algorithm:
        - Generate random percentage change between -10% and +10%
        - Apply change to current price
        - Ensure price doesn't go below minimum threshold ($1.00)
        - Store new price in stock table
        - Record price in history table
        """
        try:
            async with AsyncSessionLocal() as session:
                # Fetch all stocks
                result = await session.execute(select(Stock))
                stocks = result.scalars().all()

                if not stocks:
                    logger.warning("No stocks found to update")
                    return

                updated_count = 0

                for stock in stocks:
                    old_price = stock.current_price

                    # Generate random price change percentage
                    change_percent = random.uniform(
                        self.min_change_percent,
                        self.max_change_percent
                    )

                    # Calculate new price
                    change_multiplier = Decimal(1 + (change_percent / 100))
                    new_price = old_price * change_multiplier

                    # Ensure minimum price of $1.00
                    new_price = max(new_price, Decimal("1.00"))

                    # Round to 2 decimal places
                    new_price = new_price.quantize(Decimal('0.01'))

                    # Update stock price
                    stock.current_price = new_price
                    stock.updated_at = datetime.now()

                    # Add to price history
                    price_history = StockPriceHistory(
                        stock_id=stock.id,
                        price=new_price,
                        timestamp=datetime.now()
                    )
                    session.add(price_history)

                    updated_count += 1

                    change_direction = "↑" if change_percent > 0 else "↓"
                    logger.info(
                        f"Updated {stock.symbol}: ${old_price} → ${new_price} "
                        f"({change_direction} {abs(change_percent):.2f}%)"
                    )

                # Commit all changes
                await session.commit()

                logger.info(
                    f"Successfully updated {updated_count} stock prices at "
                    f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                )

        except Exception as e:
            logger.error(f"Error updating stock prices: {str(e)}")
            raise

    async def update_single_stock_price(self, stock_id: int):
        """
        Update a single stock's price

        Args:
            stock_id: ID of the stock to update
        """
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(Stock).where(Stock.id == stock_id)
                )
                stock = result.scalar_one_or_none()

                if not stock:
                    logger.error(f"Stock with id {stock_id} not found")
                    return

                old_price = stock.current_price

                # Generate random price change
                change_percent = random.uniform(
                    self.min_change_percent,
                    self.max_change_percent
                )

                change_multiplier = Decimal(1 + (change_percent / 100))
                new_price = max(old_price * change_multiplier, Decimal("1.00"))
                new_price = new_price.quantize(Decimal('0.01'))

                stock.current_price = new_price
                stock.updated_at = datetime.now()

                # Add to history
                price_history = StockPriceHistory(
                    stock_id=stock.id,
                    price=new_price,
                    timestamp=datetime.now()
                )
                session.add(price_history)

                await session.commit()

                logger.info(
                    f"Updated {stock.symbol}: ${old_price} → ${new_price} "
                    f"({change_percent:+.2f}%)"
                )

        except Exception as e:
            logger.error(f"Error updating stock {stock_id}: {str(e)}")
            raise


# Singleton instance
stock_price_updater = StockPriceUpdater()
