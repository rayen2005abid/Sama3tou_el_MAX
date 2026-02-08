
import os
import warnings
import time
import re
from google import genai
from google.genai import types

class SentimentAnalyzer:
    def __init__(self):
        # Allow API key to be passed or env
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            print("Warning: GOOGLE_API_KEY not found. Using local fallback.")
            self.client = None

        # Simple lexicons for fallback
        self.positive_keywords_fr = ['hausse', 'croissance', 'bénéfice', 'positif', 'bond', 'gain', 'performant']
        self.negative_keywords_fr = ['baisse', 'chute', 'perte', 'négatif', 'déficit', 'repli', 'faillite']
        self.positive_keywords_ar = ['ارتفاع', 'نمو', 'ربح', 'إيجابي', 'صعود', 'مكسب', 'أداء']
        self.negative_keywords_ar = ['انخفاض', 'هبوط', 'خسارة', 'سلبي', 'تراجع', 'عجز', 'إفلاس']

    def analyze(self, text: str, lang: str = 'fr') -> float:
        """
        Analyze sentiment score (-1.0 to 1.0).
        Tries Gemini API first, falls back to keyword counting.
        """
        if self.client:
            try:
                # Retry logic for rate limits
                for attempt in range(2):
                    try:
                        score = self._analyze_with_gemini(text)
                        return score
                    except Exception as e:
                        if "429" in str(e): # Rate limit
                            time.sleep(2)
                            continue
                        print(f"Gemini API Error: {e}")
                        break
            except Exception as e:
                print(f"Gemini Analysis Failed: {e}")

        # Fallback
        return self._analyze_local(text, lang)

    def _analyze_with_gemini(self, text: str) -> float:
        prompt = f"""
        Analyze the financial sentiment of the following news text regarding the stock market or specific companies.
        Provide a single sentiment score between -1.0 (very negative) and 1.0 (very positive).
        0.0 is neutral.
        
        Return ONLY the number. No text.
        
        Text: "{text[:1000]}"
        """ 
        # Truncate text to save tokens/cost and purely focusing on lead paragraph usually enough for news
        
        response = self.client.models.generate_content(
            model='gemini-2.0-flash', 
            contents=prompt
        )
        
        # Extract number
        match = re.search(r"[-+]?\d*\.\d+|[-+]?\d+", response.text)
        if match:
            val = float(match.group())
            return max(-1.0, min(1.0, val)) # Clamp
        return 0.0

    def _analyze_local(self, text: str, lang: str) -> float:
        text = text.lower()
        if lang == 'fr':
            pos_keywords = self.positive_keywords_fr
            neg_keywords = self.negative_keywords_fr
        else:
            pos_keywords = self.positive_keywords_ar
            neg_keywords = self.negative_keywords_ar

        pos_count = sum(text.count(w) for w in pos_keywords)
        neg_count = sum(text.count(w) for w in neg_keywords)
        
        total = pos_count + neg_count
        if total == 0:
            return 0.0
        
        return (pos_count - neg_count) / total

    def detect_language(self, text: str) -> str:
        # Simple heuristic: presence of Arabic characters
        if re.search(r'[\u0600-\u06FF]', text):
            return 'ar'
        return 'fr'
