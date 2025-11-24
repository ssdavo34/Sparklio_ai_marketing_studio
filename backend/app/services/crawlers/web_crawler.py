"""
Web Crawler Service

URL에서 텍스트를 추출하는 크롤링 서비스

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-1 Brand OS Module
"""

import logging
import re
from typing import Optional, Dict, Any
from urllib.parse import urlparse
import asyncio

try:
    import httpx
    from bs4 import BeautifulSoup
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

logger = logging.getLogger(__name__)


class WebCrawlerError(Exception):
    """웹 크롤링 에러"""
    pass


class WebCrawler:
    """
    웹 크롤러 서비스

    BeautifulSoup을 사용하여 URL에서 텍스트를 추출합니다.

    Features:
    - HTML 파싱 및 텍스트 추출
    - 메타데이터 추출 (title, description, og:tags)
    - JavaScript 제외 (순수 HTML만)
    - Timeout 설정 (30초)
    - User-Agent 설정
    """

    def __init__(self, timeout: int = 30):
        """
        Args:
            timeout: HTTP 요청 타임아웃 (초)
        """
        if not HTTPX_AVAILABLE:
            raise ImportError(
                "httpx and beautifulsoup4 are required for web crawling. "
                "Install them with: pip install httpx beautifulsoup4"
            )

        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                         "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        }

    async def crawl(self, url: str) -> Dict[str, Any]:
        """
        URL을 크롤링하여 텍스트 및 메타데이터 추출

        Args:
            url: 크롤링할 URL

        Returns:
            Dict with:
                - extracted_text: 추출된 텍스트
                - title: 페이지 제목
                - description: 메타 설명
                - metadata: 추가 메타데이터

        Raises:
            WebCrawlerError: 크롤링 실패 시
        """
        try:
            # URL 검증
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise WebCrawlerError(f"Invalid URL: {url}")

            # HTTP 요청
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()

            # HTML 파싱
            soup = BeautifulSoup(response.text, 'html.parser')

            # 불필요한 요소 제거
            for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'form']):
                element.decompose()

            # 텍스트 추출
            extracted_text = self._extract_text(soup)

            # 메타데이터 추출
            metadata = self._extract_metadata(soup)

            # 제목 추출
            title = self._extract_title(soup)

            # 설명 추출
            description = self._extract_description(soup)

            logger.info(
                f"Successfully crawled URL: {url}, "
                f"extracted {len(extracted_text)} chars, "
                f"title: {title}"
            )

            return {
                "extracted_text": extracted_text,
                "title": title or parsed_url.netloc,
                "description": description,
                "metadata": {
                    **metadata,
                    "url": url,
                    "status_code": response.status_code,
                    "content_type": response.headers.get("content-type", ""),
                    "final_url": str(response.url),  # 리다이렉트 후 최종 URL
                }
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error crawling {url}: {e.response.status_code}")
            raise WebCrawlerError(f"HTTP {e.response.status_code}: {str(e)}")
        except httpx.TimeoutException:
            logger.error(f"Timeout crawling {url}")
            raise WebCrawlerError(f"Timeout after {self.timeout}s")
        except Exception as e:
            logger.error(f"Error crawling {url}: {str(e)}")
            raise WebCrawlerError(f"Crawling failed: {str(e)}")

    def _extract_text(self, soup: BeautifulSoup) -> str:
        """
        HTML에서 본문 텍스트 추출

        우선순위:
        1. <main> 태그
        2. <article> 태그
        3. <div class="content"> 또는 유사한 컨테이너
        4. <body> 전체
        """
        # main 태그 우선
        main_content = soup.find('main')
        if main_content:
            text = main_content.get_text(separator=' ', strip=True)
            if len(text) > 100:  # 충분한 텍스트가 있으면
                return self._clean_text(text)

        # article 태그
        article = soup.find('article')
        if article:
            text = article.get_text(separator=' ', strip=True)
            if len(text) > 100:
                return self._clean_text(text)

        # content 관련 div
        content_div = soup.find('div', class_=re.compile(r'content|main|body', re.I))
        if content_div:
            text = content_div.get_text(separator=' ', strip=True)
            if len(text) > 100:
                return self._clean_text(text)

        # body 전체
        body = soup.find('body')
        if body:
            text = body.get_text(separator=' ', strip=True)
            return self._clean_text(text)

        # fallback: 전체 HTML
        return self._clean_text(soup.get_text(separator=' ', strip=True))

    def _clean_text(self, text: str) -> str:
        """텍스트 정리 (중복 공백, 줄바꿈 제거)"""
        # 연속된 공백을 하나로
        text = re.sub(r'\s+', ' ', text)
        # 앞뒤 공백 제거
        text = text.strip()
        return text

    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """페이지 제목 추출"""
        # og:title 우선
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            return og_title['content'].strip()

        # title 태그
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.get_text().strip()

        # h1 태그 (fallback)
        h1 = soup.find('h1')
        if h1:
            return h1.get_text().strip()

        return None

    def _extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """페이지 설명 추출"""
        # og:description 우선
        og_desc = soup.find('meta', property='og:description')
        if og_desc and og_desc.get('content'):
            return og_desc['content'].strip()

        # meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            return meta_desc['content'].strip()

        return None

    def _extract_metadata(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """추가 메타데이터 추출 (OG tags, keywords 등)"""
        metadata = {}

        # OG tags
        og_tags = soup.find_all('meta', property=re.compile(r'^og:'))
        for tag in og_tags:
            prop = tag.get('property', '').replace('og:', '')
            content = tag.get('content', '')
            if prop and content:
                metadata[f"og_{prop}"] = content

        # Twitter cards
        twitter_tags = soup.find_all('meta', attrs={'name': re.compile(r'^twitter:')})
        for tag in twitter_tags:
            name = tag.get('name', '').replace('twitter:', '')
            content = tag.get('content', '')
            if name and content:
                metadata[f"twitter_{name}"] = content

        # Keywords
        keywords = soup.find('meta', attrs={'name': 'keywords'})
        if keywords and keywords.get('content'):
            metadata['keywords'] = keywords['content'].strip()

        # Author
        author = soup.find('meta', attrs={'name': 'author'})
        if author and author.get('content'):
            metadata['author'] = author['content'].strip()

        return metadata


# Singleton instance
_crawler_instance: Optional[WebCrawler] = None


def get_web_crawler(timeout: int = 30) -> WebCrawler:
    """
    WebCrawler 싱글톤 인스턴스 반환

    Args:
        timeout: HTTP 요청 타임아웃 (초)

    Returns:
        WebCrawler 인스턴스
    """
    global _crawler_instance
    if _crawler_instance is None:
        _crawler_instance = WebCrawler(timeout=timeout)
    return _crawler_instance
