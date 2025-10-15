"""
Pydantic schemas for stock trading operations
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class StockBase(BaseModel):
    """Base Stock schema"""
    symbol: str = Field(..., min_length=1, max_length=10)
    name: str = Field(..., min_length=1, max_length=100)
    current_price: Decimal = Field(..., gt=0, decimal_places=2)


class StockCreate(StockBase):
    """Schema for creating a new stock"""
    pass


class StockUpdate(BaseModel):
    """Schema for updating stock price"""
    current_price: Decimal = Field(..., gt=0, decimal_places=2)


class StockResponse(StockBase):
    """Schema for stock response"""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StockListResponse(BaseModel):
    """Schema for list of stocks"""
    stocks: list[StockResponse]
    last_updated: datetime


class StockPriceHistoryResponse(BaseModel):
    """Schema for stock price history"""
    id: int
    stock_id: int
    price: Decimal
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class StockHistoryListResponse(BaseModel):
    """Schema for stock price history list"""
    stock_id: int
    symbol: str
    history: list[StockPriceHistoryResponse]
