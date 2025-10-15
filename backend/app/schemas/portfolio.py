"""
Pydantic schemas for portfolio operations
"""
from pydantic import BaseModel, ConfigDict
from typing import List
from decimal import Decimal


class HoldingDetail(BaseModel):
    """Schema for individual stock holding"""
    stock_id: int
    stock_symbol: str
    stock_name: str
    quantity: Decimal
    average_buy_price: Decimal
    current_price: Decimal
    invested: Decimal
    current_value: Decimal
    gain_loss: Decimal
    gain_loss_percentage: Decimal

    model_config = ConfigDict(from_attributes=True)


class PortfolioSummaryResponse(BaseModel):
    """Schema for portfolio summary response"""
    user_id: int
    total_invested: Decimal
    current_value: Decimal
    gain_loss_amount: Decimal
    gain_loss_percentage: Decimal
    cash_balance: Decimal
    holdings: List[HoldingDetail]

    model_config = ConfigDict(from_attributes=True)


class WalletResponse(BaseModel):
    """Schema for wallet item"""
    id: int
    user_id: int
    stock_id: int
    stock_symbol: str
    stock_name: str
    quantity: Decimal
    current_price: Decimal

    model_config = ConfigDict(from_attributes=True)
