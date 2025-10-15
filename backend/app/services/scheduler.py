"""
Background scheduler for periodic tasks
Uses APScheduler to run stock price updates every 5 minutes
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime

from app.services.stock_price_updater import stock_price_updater
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class BackgroundScheduler:
    """Manages background scheduled tasks"""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        logger.info("BackgroundScheduler initialized")

    def start(self):
        """Start the scheduler with all scheduled tasks"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return

        # Schedule stock price updates every 5 minutes
        self.scheduler.add_job(
            func=stock_price_updater.update_all_stock_prices,
            trigger=IntervalTrigger(minutes=5),
            id='update_stock_prices',
            name='Update all stock prices',
            replace_existing=True,
            max_instances=1  # Prevent overlapping runs
        )

        self.scheduler.start()
        self.is_running = True

        logger.info(
            "Background scheduler started. "
            "Stock prices will update every 5 minutes."
        )

    def shutdown(self):
        """Shutdown the scheduler gracefully"""
        if not self.is_running:
            logger.warning("Scheduler is not running")
            return

        self.scheduler.shutdown(wait=True)
        self.is_running = False
        logger.info("Background scheduler shut down")

    def get_jobs(self):
        """Get list of all scheduled jobs"""
        return self.scheduler.get_jobs()

    def trigger_stock_update_now(self):
        """Manually trigger stock price update immediately"""
        if not self.is_running:
            logger.error("Cannot trigger update: scheduler is not running")
            return

        logger.info("Manually triggering stock price update")
        self.scheduler.add_job(
            func=stock_price_updater.update_all_stock_prices,
            id='manual_stock_update',
            name='Manual stock price update',
            replace_existing=True
        )


# Singleton instance
background_scheduler = BackgroundScheduler()
