"""
Transaction routes for stock trading operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

from app.db.database import get_db
from app.db.models import User, Stock, Transaction, Wallet, TransactionType
from app.schemas.transaction import (
    BuyTransactionRequest,
    SellTransactionRequest,
    TransactionResponse
)
from app.utils.logger import setup_logger

router = APIRouter(prefix="/v1/transactions", tags=["transactions"])
logger = setup_logger(__name__)


@router.post("/buy", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def buy_stock(
    request: BuyTransactionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Buy stocks using cash balance

    - Validates user balance
    - Calculates stock quantity from amount
    - Creates transaction record
    - Updates wallet
    - Deducts balance
    """
    try:
        # Fetch user
        user_result = await db.execute(select(User).where(User.id == request.user_id))
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {request.user_id} not found"
            )

        # Fetch stock
        stock_result = await db.execute(select(Stock).where(Stock.id == request.stock_id))
        stock = stock_result.scalar_one_or_none()

        if not stock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock with id {request.stock_id} not found"
            )

        # Validate sufficient balance
        if user.balance < request.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient balance. Available: ${user.balance}, Required: ${request.amount}"
            )

        # Calculate quantity
        quantity = request.amount / stock.current_price
        quantity = Decimal(str(quantity)).quantize(Decimal('0.000001'))

        # Create transaction
        transaction = Transaction(
            user_id=user.id,
            stock_id=stock.id,
            type=TransactionType.BUY,
            amount=request.amount,
            quantity=quantity,
            price_per_unit=stock.current_price
        )
        db.add(transaction)

        # Update or create wallet entry
        wallet_result = await db.execute(
            select(Wallet).where(
                Wallet.user_id == user.id,
                Wallet.stock_id == stock.id
            )
        )
        wallet = wallet_result.scalar_one_or_none()

        if wallet:
            wallet.quantity += quantity
        else:
            wallet = Wallet(
                user_id=user.id,
                stock_id=stock.id,
                quantity=quantity
            )
            db.add(wallet)

        # Update user balance
        user.balance -= request.amount

        # Commit transaction
        await db.commit()
        await db.refresh(transaction)

        logger.info(
            f"User {user.id} bought {quantity} shares of {stock.symbol} "
            f"for ${request.amount}"
        )

        return TransactionResponse(
            transaction_id=transaction.id,
            status="success",
            message=f"Successfully bought {quantity} shares of {stock.symbol}",
            quantity=quantity,
            new_balance=user.balance
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error processing buy transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the transaction"
        )


@router.post("/sell", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def sell_stock(
    request: SellTransactionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Sell stocks from user's wallet

    - Validates user owns sufficient quantity
    - Calculates proceeds
    - Creates transaction record
    - Updates wallet
    - Credits balance
    """
    try:
        # Fetch user
        user_result = await db.execute(select(User).where(User.id == request.user_id))
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {request.user_id} not found"
            )

        # Fetch stock
        stock_result = await db.execute(select(Stock).where(Stock.id == request.stock_id))
        stock = stock_result.scalar_one_or_none()

        if not stock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock with id {request.stock_id} not found"
            )

        # Fetch wallet entry
        wallet_result = await db.execute(
            select(Wallet).where(
                Wallet.user_id == user.id,
                Wallet.stock_id == stock.id
            )
        )
        wallet = wallet_result.scalar_one_or_none()

        # Validate sufficient stock quantity
        if not wallet or wallet.quantity < request.quantity:
            available = wallet.quantity if wallet else Decimal("0")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock quantity. Available: {available}, Required: {request.quantity}"
            )

        # Calculate proceeds
        proceeds = request.quantity * stock.current_price
        proceeds = Decimal(str(proceeds)).quantize(Decimal('0.01'))

        # Create transaction
        transaction = Transaction(
            user_id=user.id,
            stock_id=stock.id,
            type=TransactionType.SELL,
            amount=proceeds,
            quantity=request.quantity,
            price_per_unit=stock.current_price
        )
        db.add(transaction)

        # Update wallet
        wallet.quantity -= request.quantity

        # If quantity becomes 0, optionally delete wallet entry
        if wallet.quantity == 0:
            await db.delete(wallet)

        # Update user balance
        user.balance += proceeds

        # Commit transaction
        await db.commit()
        await db.refresh(transaction)

        logger.info(
            f"User {user.id} sold {request.quantity} shares of {stock.symbol} "
            f"for ${proceeds}"
        )

        return TransactionResponse(
            transaction_id=transaction.id,
            status="success",
            message=f"Successfully sold {request.quantity} shares of {stock.symbol}",
            quantity=request.quantity,
            new_balance=user.balance,
            proceeds=proceeds
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error processing sell transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the transaction"
        )
