from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Enum, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from passlib.context import CryptContext
import secrets
import enum


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TransactionType(enum.Enum):
    """Transaction type enum"""
    BUY = "BUY"
    SELL = "SELL"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # Roles: "user", "admin", "moderator"
    is_superuser = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    balance = Column(Numeric(precision=15, scale=2), default=10000.00)  # Starting balance
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    reset_token = Column(String, unique=True, nullable=True)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    wallet_items = relationship("Wallet", back_populates="user", cascade="all, delete-orphan")

    def verify_password(self, password: str) -> bool:
        """Check if a plain password matches the hashed password."""
        return pwd_context.verify(password, self.hashed_password)

    def set_password(self, password: str):
        """Hash and store a password."""
        self.hashed_password = pwd_context.hash(password)

    def generate_reset_token(self):
        """Generate a secure reset token."""
        self.reset_token = secrets.token_urlsafe(32)

    def clear_reset_token(self):
        """Clear password reset token after use."""
        self.reset_token = None


class Stock(Base):
    """Stock model representing available stocks for trading"""
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, nullable=False, index=True)  # e.g., STOCK_A
    name = Column(String(100), nullable=False)  # e.g., Stock A Company
    current_price = Column(Numeric(precision=15, scale=2), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    transactions = relationship("Transaction", back_populates="stock")
    wallet_items = relationship("Wallet", back_populates="stock")
    price_history = relationship("StockPriceHistory", back_populates="stock", cascade="all, delete-orphan")


class Transaction(Base):
    """Transaction model for buy/sell operations"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Numeric(precision=15, scale=2), nullable=False)  # Cash amount
    quantity = Column(Numeric(precision=15, scale=6), nullable=False)  # Stock quantity
    price_per_unit = Column(Numeric(precision=15, scale=2), nullable=False)  # Price at transaction time
    timestamp = Column(DateTime, default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="transactions")
    stock = relationship("Stock", back_populates="transactions")


class Wallet(Base):
    """Wallet model tracking user's stock holdings"""
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    quantity = Column(Numeric(precision=15, scale=6), nullable=False, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="wallet_items")
    stock = relationship("Stock", back_populates="wallet_items")

    # Unique constraint to ensure one wallet entry per user per stock
    __table_args__ = (
        UniqueConstraint('user_id', 'stock_id', name='unique_user_stock'),
    )


class StockPriceHistory(Base):
    """Historical stock price tracking for graphing and analysis"""
    __tablename__ = "stock_price_history"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    price = Column(Numeric(precision=15, scale=2), nullable=False)
    timestamp = Column(DateTime, default=func.now(), index=True)

    # Relationships
    stock = relationship("Stock", back_populates="price_history")


class UserUIConfig(Base):
    """Per-user UI configuration storage (e.g., LMS/layout preferences)."""
    __tablename__ = "user_ui_config"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    config = Column(JSON, nullable=False, default={})
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User")
