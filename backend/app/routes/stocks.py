"""
Stock routes for listing and managing stocks
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional

from app.db.database import get_db
from app.db.models import Stock, StockPriceHistory
from app.schemas.stock import (
    StockListResponse,
    StockResponse,
    StockHistoryListResponse,
    StockPriceHistoryResponse
)
from app.utils.logger import setup_logger

router = APIRouter(prefix="/v1/stocks", tags=["stocks"])
logger = setup_logger(__name__)


@router.get("", response_model=StockListResponse, status_code=status.HTTP_200_OK)
async def get_all_stocks(db: AsyncSession = Depends(get_db)):
    """
    Get all available stocks with current prices

    Returns list of all stocks with their current prices and metadata
    """
    try:
        result = await db.execute(select(Stock))
        stocks = result.scalars().all()

        return StockListResponse(
            stocks=[StockResponse.model_validate(stock) for stock in stocks],
            last_updated=datetime.now()
        )

    except Exception as e:
        logger.error(f"Error fetching stocks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching stocks"
        )


@router.get("/{stock_id}", response_model=StockResponse, status_code=status.HTTP_200_OK)
async def get_stock_by_id(
    stock_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific stock by ID

    Returns stock details including current price
    """
    try:
        result = await db.execute(select(Stock).where(Stock.id == stock_id))
        stock = result.scalar_one_or_none()

        if not stock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock with id {stock_id} not found"
            )

        return StockResponse.model_validate(stock)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stock {stock_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching the stock"
        )


@router.get("/{stock_id}/history", response_model=StockHistoryListResponse, status_code=status.HTTP_200_OK)
async def get_stock_price_history(
    stock_id: int,
    time_range: Optional[str] = Query("24h", regex="^(1h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get price history for a specific stock

    - **stock_id**: ID of the stock
    - **time_range**: Time range for history (1h, 24h, 7d, 30d). Default: 24h
    """
    try:
        # Fetch stock
        stock_result = await db.execute(select(Stock).where(Stock.id == stock_id))
        stock = stock_result.scalar_one_or_none()

        if not stock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock with id {stock_id} not found"
            )

        # Calculate time range
        time_delta_map = {
            "1h": timedelta(hours=1),
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30)
        }

        start_time = datetime.now() - time_delta_map[time_range]

        # Fetch price history
        history_result = await db.execute(
            select(StockPriceHistory)
            .where(
                StockPriceHistory.stock_id == stock_id,
                StockPriceHistory.timestamp >= start_time
            )
            .order_by(StockPriceHistory.timestamp.asc())
        )
        history = history_result.scalars().all()

        return StockHistoryListResponse(
            stock_id=stock.id,
            symbol=stock.symbol,
            history=[StockPriceHistoryResponse.model_validate(h) for h in history]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stock history for {stock_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching stock price history"
        )
