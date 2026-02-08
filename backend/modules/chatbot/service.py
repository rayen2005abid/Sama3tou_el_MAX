from sqlalchemy.orm import Session
from ..sentiment.service import SentimentService
from ..anomaly.service import AnomalyService
import re

class ChatbotService:
    def __init__(self, db: Session):
        self.db = db
        self.sentiment_service = SentimentService(db)
        self.anomaly_service = AnomalyService(db)

    def process_query(self, query: str):
        query = query.lower()
        
        # 1. Safety Filter
        forbidden = ['buy', 'sell', 'invest', 'advice', 'profit', 'guarantee', 'prediction']
        if any(word in query for word in forbidden):
            return {
                "answer": "I cannot provide financial advice or investment recommendations. This system is for educational and decision-support purposes only.",
                "type": "refusal"
            }

        # 2. Extract Stock Symbol (Simple heuristic or from entities)
        # Assuming query mentions ticker like "sfbt" or "biat"
        # In a real app, we'd have a list of valid tickers to match against
        stock_match = re.search(r'\b(sfbt|biat|sah|telnet|sotuver|carthage|poulina|tjari|bna|stp|ubci|uib)\b', query)
        stock_symbol = stock_match.group(0).upper() if stock_match else None

        # 3. Intent Detection & RAG
        context = ""
        
        # Intent: Explain Sentiment
        if 'sentiment' in query or 'news' in query or 'opinion' in query:
            if stock_match:
                signal = self.sentiment_service.update_stock_sentiment(stock_symbol)
                if signal:
                    context += f"Sentiment for {stock_symbol}: {signal.sentiment_label} (Score: {signal.sentiment_score:.2f}, Confidence: {signal.confidence:.2f}). "
                    # Retrieve recent articles from DB
                    from ..sentiment.models import NewsArticle
                    articles = self.db.query(NewsArticle).filter(
                        NewsArticle.stock_symbol == stock_symbol
                    ).order_by(NewsArticle.published_date.desc()).limit(3).all()
                    if articles:
                        context += f"Recent news: {'; '.join([a.title for a in articles])}. "
            
        # Intent: Explain Anomalies/Alerts
        if 'alert' in query or 'anomaly' in query or 'unusual' in query or 'spike' in query:
             if stock_match:
                 alerts = self.anomaly_service.get_latest_alerts(stock_symbol)
                 if alerts:
                     latest = alerts[0]
                     context += f"Anomaly detected for {stock_symbol}: {latest.alert_type} ({latest.description}). "

        # 4. Generate Response with Gemini
        try:
            from google import genai
            from google.genai import types
            import os
            from backend.config import settings

            api_key = settings.GOOGLE_API_KEY
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not found in environment variables")
                
            client = genai.Client(api_key=api_key)
            
            prompt = f"""
            You are a helpful financial trading assistant. 
            User Query: "{query}"
            Context Data: {context}
            
            Provide a concise, helpful answer based on the context. If no context is provided, answer generally about stock market concepts but refuse specific financial advice.
            """
            
            response = client.models.generate_content(
                model='gemini-2.0-flash', 
                contents=prompt
            )
            return {
                "answer": response.text,
                "type": "ai_response"
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Gemini Error Details: {str(e)}")
            # Fallback
            return {
                "answer": f"I couldn't generate a smart response at the moment. Error: {str(e)}. {context}",
                "type": "fallback"
            }
