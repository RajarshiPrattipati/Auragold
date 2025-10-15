"""
LMS (Layout Management System) routes for dynamic UI configuration
"""
from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas.lms import (
    LMSConfigResponse,
    BuyScreenConfig,
    PortfolioScreenConfig,
    DashboardScreenConfig,
    UIConfigPayload,
    UIConfigResponse,
)
from app.utils.logger import setup_logger
from app.db.database import get_db
from app.db.models import UserUIConfig, User
from app.routes.auth import get_current_user

router = APIRouter(prefix="/v1/lms", tags=["lms"])
logger = setup_logger(__name__)


# Default LMS configuration
# In production, this could be stored in database or Redis for dynamic updates
DEFAULT_LMS_CONFIG = {
    "buy_screen": {
        "show_price_chart": True,
        "theme": "light",
        "fields": ["stock", "amount"],
        "layout": "grid"
    },
    "portfolio_screen": {
        "show_gain_loss": True,
        "show_graph": False,
        "refresh_interval": 300
    },
    "dashboard_screen": {
        "show_all_stocks": True,
        "sort_by": "price",
        "card_layout": "compact"
    }
}


@router.get("/config", response_model=LMSConfigResponse, status_code=status.HTTP_200_OK)
async def get_lms_config():
    """
    Get current LMS configuration for frontend

    Returns UI configuration for:
    - Buy screen layout and features
    - Portfolio screen display options
    - Dashboard layout preferences

    This configuration can be cached by frontend and synced periodically
    """
    logger.info("LMS configuration requested")

    return LMSConfigResponse(
        buy_screen=BuyScreenConfig(**DEFAULT_LMS_CONFIG["buy_screen"]),
        portfolio_screen=PortfolioScreenConfig(**DEFAULT_LMS_CONFIG["portfolio_screen"]),
        dashboard_screen=DashboardScreenConfig(**DEFAULT_LMS_CONFIG["dashboard_screen"]),
        version="1.0.0"
    )


@router.get("/user-config", response_model=UIConfigResponse, status_code=status.HTTP_200_OK)
async def get_user_ui_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the authenticated user's saved UI configuration (layout prefs, etc)."""
    result = await db.execute(select(UserUIConfig).where(UserUIConfig.user_id == current_user.id))
    row = result.scalar_one_or_none()
    if row:
        return UIConfigResponse(user_id=current_user.id, config=row.config or {}, updated_at=str(row.updated_at) if row.updated_at else None)
    # default: empty config
    return UIConfigResponse(user_id=current_user.id, config={})


@router.put("/user-config", response_model=UIConfigResponse, status_code=status.HTTP_200_OK)
async def put_user_ui_config(
    payload: UIConfigPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upsert the authenticated user's UI configuration."""
    result = await db.execute(select(UserUIConfig).where(UserUIConfig.user_id == current_user.id))
    row = result.scalar_one_or_none()
    if row:
        row.config = payload.config
    else:
        row = UserUIConfig(user_id=current_user.id, config=payload.config)
        db.add(row)
    await db.commit()
    await db.refresh(row)
    return UIConfigResponse(user_id=current_user.id, config=row.config or {}, updated_at=str(row.updated_at) if row.updated_at else None)


@router.put("/global-config", response_model=LMSConfigResponse)
async def update_global_lms_config(
    payload: LMSConfigResponse,
    current_user: User = Depends(get_current_user),
):
    """Update global LMS configuration (temporarily open to any authenticated user)."""
    DEFAULT_LMS_CONFIG["buy_screen"] = payload.buy_screen.model_dump()
    DEFAULT_LMS_CONFIG["portfolio_screen"] = payload.portfolio_screen.model_dump()
    DEFAULT_LMS_CONFIG["dashboard_screen"] = payload.dashboard_screen.model_dump()
    return payload


@router.post("/push-user-config", status_code=status.HTTP_200_OK)
async def push_user_config_to_all(
    payload: UIConfigPayload,
    db: AsyncSession = Depends(get_db),
):
    """Push a given UI config blob to all users (open to all without auth)."""
    # Fetch all users
    result = await db.execute(select(User.id))
    user_ids = [row[0] for row in result.all()]
    # Upsert per user
    for uid in user_ids:
        res = await db.execute(select(UserUIConfig).where(UserUIConfig.user_id == uid))
        cfg = res.scalar_one_or_none()
        if cfg:
            cfg.config = payload.config
        else:
            db.add(UserUIConfig(user_id=uid, config=payload.config))
    await db.commit()
    return {"updated_users": len(user_ids)}
