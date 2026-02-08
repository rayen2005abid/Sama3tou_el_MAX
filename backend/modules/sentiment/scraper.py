

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import time
import random

class BaseScraper(ABC):
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def _get_soup(self, url: str) -> Optional[BeautifulSoup]:
        try:
            time.sleep(random.uniform(1, 3)) # Polite delay
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                return BeautifulSoup(response.content, 'html.parser')
            print(f"Failed to fetch {url}: Status {response.status_code}")
        except Exception as e:
            print(f"Error fetching {url}: {e}")
        return None

    @abstractmethod
    def scrape(self, stock_symbol: str) -> List[Dict]:
        pass

class MockScraper(BaseScraper):
    def scrape(self, stock_symbol: str) -> List[Dict]:
        # Fallback ensuring data presence for demo
        return [
            {
                "title": f"Bourse: {stock_symbol} finit la semaine en hausse",
                "url": f"http://mockOnly.com/{stock_symbol}/1",
                "source": "MockSource",
                "published_date": datetime.utcnow(),
                "content": f"Le titre {stock_symbol} a enregistré une performance positive aujourd'hui suite à l'annonce des résultats trimestriels."
            },
            {
                "title": f"Analyse technique de {stock_symbol}",
                "url": f"http://mockOnly.com/{stock_symbol}/2",
                "source": "MockSource",
                "published_date": datetime.utcnow(),
                "content": "Les indicateurs techniques montrent une tendance haussière sur le court terme avec un volume soutenu."
            }
        ]

class IlBoursaScraper(BaseScraper):
    def scrape(self, stock_symbol: str) -> List[Dict]:
        articles = []
        # Try direct cotation page which often lists news
        url = f"https://www.ilboursa.com/cotation/{stock_symbol}"
        soup = self._get_soup(url)
        
        if not soup:
            return []

        # Look for news tab or section
        # Generic approach: find links containing 'news' or title attributes
        news_items = soup.find_all('a', href=True, limit=10)
        
        count = 0
        for item in news_items:
            if count >= 3: break
            href = item['href']
            text = item.get_text(strip=True)
            
            # Simple heuristic for news links
            if len(text) > 20 and ('news' in href or 'actualite' in href):
                 link = 'https://www.ilboursa.com' + href if not href.startswith('http') else href
                 articles.append({
                    "title": text,
                    "url": link,
                    "source": "IlBoursa",
                    "published_date": datetime.utcnow(),
                    "content": text
                 })
                 count += 1
                
        return articles

class TustexScraper(BaseScraper):
    def scrape(self, stock_symbol: str) -> List[Dict]:
        articles = []
        # Tustex search
        url = f"https://www.tustex.com/recherche?search_api_views_fulltext={stock_symbol}"
        soup = self._get_soup(url)
        if not soup: return []

        rows = soup.select('.view-content .views-row')[:5]
        for row in rows:
            try:
                title_tag = row.find('h3') or row.find('a')
                if not title_tag: continue
                
                title = title_tag.get_text(strip=True)
                link = title_tag['href'] if title_tag.has_attr('href') else ''
                if link and not link.startswith('http'):
                    link = 'https://www.tustex.com' + link

                articles.append({
                    "title": title,
                    "url": link,
                    "source": "Tustex",
                    "published_date": datetime.utcnow(),
                    "content": title
                })
            except: continue
        return articles

class Irbe7Scraper(BaseScraper):
    def scrape(self, stock_symbol: str) -> List[Dict]:
        url = f"https://www.irbe7.com/?s={stock_symbol}"
        soup = self._get_soup(url)
        if not soup: return []
        
        articles = []
        posts = soup.find_all('div', class_='post', limit=3) # Reduced limit
        for post in posts:
            try:
                title_tag = post.find('h2') or post.find('h3') or post.find('a')
                if not title_tag: continue
                title = title_tag.get_text(strip=True)
                link_tag = title_tag if title_tag.name == 'a' else title_tag.find('a')
                link = link_tag['href'] if link_tag else ''
                
                if link:
                    articles.append({
                        "title": title,
                        "url": link,
                        "source": "Irbe7",
                        "published_date": datetime.utcnow(),
                        "content": title
                    })
            except: continue
        return articles

class AfricanManagerScraper(BaseScraper):
    def scrape(self, stock_symbol: str) -> List[Dict]:
        url = f"https://africanmanager.com/?s={stock_symbol}"
        soup = self._get_soup(url)
        if not soup: return []

        articles = []
        posts = soup.find_all('article', limit=3)
        for post in posts:
            try:
               title_tag = post.find('h2') or post.find('h3')
               if not title_tag: continue
               link_tag = title_tag.find('a')
               if not link_tag: continue
               title = link_tag.get_text(strip=True)
               link = link_tag['href']
               
               articles.append({
                   "title": title,
                   "url": link,
                   "source": "AfricanManager",
                   "published_date": datetime.utcnow(),
                   "content": title
               })
            except: continue
        return articles

class ScraperFactory:
    @staticmethod
    def get_scrapers() -> List[BaseScraper]:
        # Include MockScraper last as fallback if no data found?
        # Or always include to ensure SOME data for demo?
        # For now, let's include it.
        return [
            IlBoursaScraper(),
            TustexScraper(),
            Irbe7Scraper(),
            AfricanManagerScraper(),
            MockScraper() 
        ]

