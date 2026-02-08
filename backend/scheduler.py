
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from backend.database import SessionLocal
from backend.modules.sentiment.service import SentimentService
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

def update_sentiments_job():
    logger.info("Running scheduled sentiment update...")
    db = SessionLocal()
    try:
        service = SentimentService(db)
        results = service.update_all_sentiments()
        logger.info(f"Sentiment update completed: {results}")
    except Exception as e:
        logger.error(f"Sentiment update failed: {e}")
    finally:
        db.close()

def start_scheduler():
    # Schedule to run every day at 8:00 AM UTC (adjust for Tunis time if needed, typically UTC+1)
    # Tunis is UTC+1. So 8:00 AM Tunis is 7:00 AM UTC.
    # Let's set it to 7:00 UTC (8:00 Tunis)
    trigger = CronTrigger(hour=7, minute=0)
    
    # Also run once on startup for demo purposes if needed, but best not to slow down startup
    # scheduler.add_job(update_sentiments_job, 'date', run_date=datetime.now() + timedelta(seconds=10)) 
    
    scheduler.add_job(update_sentiments_job, trigger, id="daily_sentiment_update", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started.")
