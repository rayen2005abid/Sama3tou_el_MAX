import logging
from sqlalchemy.orm import Session
from datetime import datetime
from .models import SentimentSignal, NewsArticle
from .scraper import ScraperFactory
from .nlp import SentimentAnalyzer

logger = logging.getLogger(__name__)

class SentimentService:
    def __init__(self, db: Session):
        self.db = db
        self.analyzer = SentimentAnalyzer()
        self.scrapers = ScraperFactory.get_scrapers()

    def update_stock_sentiment(self, stock_symbol: str):
        """
        Scrapes all sources for a stock, analyzes sentiment, and updates DB.
        """
        logger.info(f"Updating sentiment for {stock_symbol}...")
        all_articles = []

        # 1. Scrape from all sources
        for scraper in self.scrapers:
            try:
                articles = scraper.scrape(stock_symbol)
                all_articles.extend(articles)
            except Exception as e:
                logger.error(f"Scraper failed for {stock_symbol}: {e}")

        if not all_articles:
            logger.warning(f"No news found for {stock_symbol}")
            return None

        total_score = 0
        count = 0
        
        # 2. Process and Store
        for art in all_articles:
            # Deduplication
            exists = self.db.query(NewsArticle).filter(NewsArticle.url == art['url']).first()
            if not exists:
                # Detect Language
                lang = self.analyzer.detect_language(art['content'])
                
                # Analyze Sentiment
                score = self.analyzer.analyze(art['content'], lang)
                
                db_art = NewsArticle(
                    stock_symbol=stock_symbol,
                    title=art['title'],
                    url=art['url'],
                    source=art['source'],
                    content=art['content'],
                    published_date=art['published_date'],
                    sentiment_score=score,
                    language=lang
                )
                self.db.add(db_art)
                total_score += score
                count += 1
            else:
                 # Even if exists, we might want to include it in today's calculation?
                 # ideally we only count 'fresh' news or news within a window (e.g. 24h)
                 # For simplicity, let's assume valid scraping only returns recent news (scraper logic needed)
                 # But valid approach: check if 'published_date' is recent.
                 # Let's count it if it was published today.
                 if (datetime.utcnow() - exists.published_date).days < 1:
                     total_score += exists.sentiment_score
                     count += 1
        
        self.db.commit()
        
        if count > 0:
            avg_score = total_score / count
            
            label = "neutral"
            if avg_score > 0.05: label = "positive"
            if avg_score < -0.05: label = "negative"
            
            signal = SentimentSignal(
                stock_symbol=stock_symbol,
                sentiment_score=avg_score,
                sentiment_label=label,
                confidence=0.5 + (abs(avg_score) / 2),
                article_count=count,
                date=datetime.utcnow()
            )
            self.db.add(signal)
            self.db.commit()
            return signal
            
        return None

    def update_all_sentiments(self):
        """
        Iterates through all stocks and updates sentiment.
        Designed for Scheduler.
        """
        # Ideally fetch list of stocks from DB
        # from backend.modules.market.models import Stock
        # stocks = self.db.query(Stock).all()
        # symbols = [s.symbol for s in stocks]
        
        # For prototype, use a fixed list or fetch distinct symbols from somewhere
        symbols = ["SFBT", "BIAT", "SAH", "TELNET", "SOTUVER"] # Top liquid stocks
        
        results = {}
        for symbol in symbols:
            signal = self.update_stock_sentiment(symbol)
            if signal:
                results[symbol] = signal.sentiment_label
                
        return results
