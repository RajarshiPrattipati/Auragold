"""
Portfolio routes for viewing user portfolio summaries
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from decimal import Decimal
from typing import List

from app.db.database import get_db
from app.db.models import User, Stock, Transaction, Wallet, TransactionType
from app.schemas.portfolio import (
    PortfolioSummaryResponse,
    HoldingDetail
)
from app.utils.logger import setup_logger

router = APIRouter(prefix="/v1/portfolio", tags=["portfolio"])
logger = setup_logger(__name__)


@router.get("/{user_id}", response_model=PortfolioSummaryResponse, status_code=status.HTTP_200_OK)
async def get_portfolio_summary(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive portfolio summary for a user

    Includes:
    - Total invested amount
    - Current portfolio value
    - Gain/loss (amount and percentage)
    - Cash balance
    - Detailed holdings for each stock
    """
    try:
        # Fetch user
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )

        # Fetch all wallet entries with stock info
        wallet_result = await db.execute(
            select(Wallet, Stock)
            .join(Stock, Wallet.stock_id == Stock.id)
            .where(Wallet.user_id == user_id, Wallet.quantity > 0)
        )
        wallet_stocks = wallet_result.all()

        # Fetch all user transactions for calculations
        transactions_result = await db.execute(
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .order_by(Transaction.timestamp.desc())
        )
        all_transactions = transactions_result.scalars().all()

        # Calculate totals
        total_invested = Decimal("0")
        current_value = Decimal("0")
        holdings: List[HoldingDetail] = []

        # Calculate per-stock metrics
        for wallet, stock in wallet_stocks:
            # Get transactions for this stock
            stock_transactions = [
                t for t in all_transactions if t.stock_id == stock.id
            ]

            # Calculate average buy price
            total_buy_amount = Decimal("0")
            total_buy_quantity = Decimal("0")

            for trans in stock_transactions:
                if trans.type == TransactionType.BUY:
                    total_buy_amount += trans.amount
                    total_buy_quantity += trans.quantity

            # Calculate invested and current value for this holding
            if total_buy_quantity > 0:
                average_buy_price = total_buy_amount / total_buy_quantity
            else:
                average_buy_price = Decimal("0")

            invested_in_stock = wallet.quantity * average_buy_price
            current_stock_value = wallet.quantity * stock.current_price
            gain_loss = current_stock_value - invested_in_stock

            if invested_in_stock > 0:
                gain_loss_percentage = (gain_loss / invested_in_stock) * Decimal("100")
            else:
                gain_loss_percentage = Decimal("0")

            # Add to holdings list
            holdings.append(HoldingDetail(
                stock_id=stock.id,
                stock_symbol=stock.symbol,
                stock_name=stock.name,
                quantity=wallet.quantity,
                average_buy_price=average_buy_price,
                current_price=stock.current_price,
                invested=invested_in_stock,
                current_value=current_stock_value,
                gain_loss=gain_loss,
                gain_loss_percentage=gain_loss_percentage
            ))

            # Add to totals
            total_invested += invested_in_stock
            current_value += current_stock_value

        # Calculate overall gain/loss
        gain_loss_amount = current_value - total_invested

        if total_invested > 0:
            gain_loss_percentage = (gain_loss_amount / total_invested) * Decimal("100")
        else:
            gain_loss_percentage = Decimal("0")

        # Round values for clean display
        total_invested = total_invested.quantize(Decimal('0.01'))
        current_value = current_value.quantize(Decimal('0.01'))
        gain_loss_amount = gain_loss_amount.quantize(Decimal('0.01'))
        gain_loss_percentage = gain_loss_percentage.quantize(Decimal('0.01'))

        logger.info(f"Portfolio summary generated for user {user_id}")

        return PortfolioSummaryResponse(
            user_id=user.id,
            total_invested=total_invested,
            current_value=current_value,
            gain_loss_amount=gain_loss_amount,
            gain_loss_percentage=gain_loss_percentage,
            cash_balance=user.balance,
            holdings=holdings
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating portfolio summary for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating portfolio summary"
        )
