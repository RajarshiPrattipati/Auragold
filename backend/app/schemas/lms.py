"""
Pydantic schemas for LMS (Layout Management System) configuration
"""
from pydantic import BaseModel
from typing import Dict, Any, List, Optional


class BuyScreenConfig(BaseModel):
    """Configuration for Buy screen"""
    show_price_chart: bool = True
    theme: str = "light"
    fields: List[str] = ["stock", "amount"]
    layout: str = "grid"


class PortfolioScreenConfig(BaseModel):
    """Configuration for Portfolio screen"""
    show_gain_loss: bool = True
    show_graph: bool = False
    refresh_interval: int = 300  # seconds


class DashboardScreenConfig(BaseModel):
    """Configuration for Dashboard screen"""
    show_all_stocks: bool = True
    sort_by: str = "price"
    card_layout: str = "compact"


class LMSConfigResponse(BaseModel):
    """Complete LMS configuration response"""
    buy_screen: BuyScreenConfig
    portfolio_screen: PortfolioScreenConfig
    dashboard_screen: DashboardScreenConfig
    version: Optional[str] = "1.0.0"


class LMSConfigUpdate(BaseModel):
    """Schema for updating LMS configuration"""
    buy_screen: Optional[BuyScreenConfig] = None
    portfolio_screen: Optional[PortfolioScreenConfig] = None
    dashboard_screen: Optional[DashboardScreenConfig] = None


class UIConfigPayload(BaseModel):
    """Generic UI config blob saved per user (free-form)."""
    config: Dict[str, Any]


class UIConfigResponse(BaseModel):
    user_id: int
    config: Dict[str, Any]
    updated_at: Optional[str] = None
