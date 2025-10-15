"""
Pydantic schemas for transaction operations
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


class TransactionTypeEnum(str, Enum):
    """Transaction type enum for validation"""
    BUY = "BUY"
    SELL = "SELL"


class BuyTransactionRequest(BaseModel):
    """Schema for buy transaction request"""
    user_id: int = Field(..., gt=0)
    stock_id: int = Field(..., gt=0)
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Amount of cash to spend")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v


class SellTransactionRequest(BaseModel):
    """Schema for sell transaction request"""
    user_id: int = Field(..., gt=0)
    stock_id: int = Field(..., gt=0)
    quantity: Decimal = Field(..., gt=0, decimal_places=6, description="Quantity of stock to sell")

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v


class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    transaction_id: int
    status: str
    message: str
    quantity: Optional[Decimal] = None
    new_balance: Decimal
    proceeds: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)


class TransactionDetail(BaseModel):
    """Schema for transaction details"""
    id: int
    user_id: int
    stock_id: int
    type: TransactionTypeEnum
    amount: Decimal
    quantity: Decimal
    price_per_unit: Decimal
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionHistoryResponse(BaseModel):
    """Schema for transaction history"""
    transactions: list[TransactionDetail]
    total_count: int
