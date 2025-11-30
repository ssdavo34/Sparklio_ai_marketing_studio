"""
Web Crawler Service

URL에서 텍스트를 추출하는 크롤링 서비스

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-1 Brand OS Module
"""

import logging
import re
from typing import Optional, Dict, Any, TYPE_CHECKING
from urllib.parse import urlparse
import asyncio

if TYPE_CHECKING:
    from bs4 import BeautifulSoup

try:
    import httpx
    from bs4 import BeautifulSoup
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False
    BeautifulSoup = None  # type: ignore

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
        4. <body> 전체 (불필요한 div 추가 제거 후)

        개선 사항 (2025-11-30):
        - separator='\n'으로 변경하여 줄바꿈 보존
        - class 기반 불필요 요소 추가 제거
        - 텍스트 밀도 기반 필터링
        """
        # 추가 정리: class 기반 네비게이션/푸터 제거
        self._remove_boilerplate_by_class(soup)

        # main 태그 우선
        main_content = soup.find('main')
        if main_content:
            text = main_content.get_text(separator='\n', strip=True)
            if len(text) > 100:  # 충분한 텍스트가 있으면
                return self._clean_text_preserve_lines(text)

        # article 태그
        article = soup.find('article')
        if article:
            text = article.get_text(separator='\n', strip=True)
            if len(text) > 100:
                return self._clean_text_preserve_lines(text)

        # content 관련 div
        content_div = soup.find('div', class_=re.compile(r'content|main|body', re.I))
        if content_div:
            text = content_div.get_text(separator='\n', strip=True)
            if len(text) > 100:
                return self._clean_text_preserve_lines(text)

        # body 전체 (텍스트 밀도 기반 추출)
        body = soup.find('body')
        if body:
            text = self._extract_main_content_from_body(body)
            return self._clean_text_preserve_lines(text)

        # fallback: 전체 HTML
        return self._clean_text_preserve_lines(soup.get_text(separator='\n', strip=True))

    def _remove_boilerplate_by_class(self, soup: BeautifulSoup) -> None:
        """
        class/id 기반 불필요 요소 제거

        시맨틱 태그를 사용하지 않는 사이트를 위한 추가 정리
        """
        # 제거할 class/id 패턴
        boilerplate_patterns = [
            # 네비게이션
            r'nav|navigation|menu|sidebar|breadcrumb',
            # 헤더/푸터
            r'header|footer|foot|copyright',
            # 광고/배너
            r'ad|ads|advertisement|banner|promo|popup|modal',
            # 위젯
            r'widget|social|share|follow|subscribe|newsletter',
            # 검색/필터
            r'search|filter|sort|pagination',
            # 기타 UI
            r'cookie|consent|notice|alert|toast',
        ]

        combined_pattern = '|'.join(boilerplate_patterns)

        # class 기반 제거
        for element in soup.find_all(class_=re.compile(combined_pattern, re.I)):
            # 메인 콘텐츠 영역은 보존
            el_class = ' '.join(element.get('class', []))
            if re.search(r'content|main|article|body|post', el_class, re.I):
                continue
            element.decompose()

        # id 기반 제거
        for element in soup.find_all(id=re.compile(combined_pattern, re.I)):
            el_id = element.get('id', '')
            if re.search(r'content|main|article|body|post', el_id, re.I):
                continue
            element.decompose()

    def _extract_main_content_from_body(self, body) -> str:
        """
        body에서 텍스트 밀도가 높은 영역만 추출

        쇼핑몰처럼 상품 목록이 많은 페이지에서
        카탈로그 블록을 제외하고 설명 텍스트만 추출
        """
        # 각 div의 텍스트 밀도 계산
        paragraphs = []

        # p, h1-h6 태그에서 텍스트 추출 (가장 의미 있는 콘텐츠)
        for tag in body.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            text = tag.get_text(strip=True)
            # 최소 길이 필터 (너무 짧은 텍스트 제외)
            if len(text) > 20:
                paragraphs.append(text)

        # p/h 태그가 충분하면 사용
        if len(paragraphs) >= 3:
            return '\n\n'.join(paragraphs)

        # 부족하면 div에서 긴 텍스트 블록 찾기
        for div in body.find_all('div'):
            # 하위 div가 많은 컨테이너는 스킵
            if len(div.find_all('div')) > 5:
                continue

            text = div.get_text(strip=True)
            # 길이와 단어 수 기준
            word_count = len(text.split())
            if len(text) > 100 and word_count > 20:
                # 가격, 상품코드 패턴이 많으면 스킵
                if re.search(r'\d{1,3}(,\d{3})+\s*원', text):
                    price_matches = len(re.findall(r'\d{1,3}(,\d{3})+\s*원', text))
                    if price_matches > 3:  # 가격이 3개 이상이면 상품 목록
                        continue
                paragraphs.append(text)

        if paragraphs:
            return '\n\n'.join(paragraphs)

        # 최후의 수단: body 전체
        return body.get_text(separator='\n', strip=True)

    def _clean_text(self, text: str) -> str:
        """텍스트 정리 (중복 공백, 줄바꿈 제거)"""
        # 연속된 공백을 하나로
        text = re.sub(r'\s+', ' ', text)
        # 앞뒤 공백 제거
        text = text.strip()
        return text

    def _clean_text_preserve_lines(self, text: str) -> str:
        """
        텍스트 정리 (줄바꿈 보존)

        DataCleanerAgent가 줄 단위로 정제하므로
        논리적인 줄바꿈을 유지합니다.
        """
        lines = text.split('\n')
        cleaned_lines = []

        for line in lines:
            # 줄 내 연속 공백 정리
            line = re.sub(r'[ \t]+', ' ', line).strip()
            # 빈 줄 제외
            if line:
                cleaned_lines.append(line)

        # 연속 빈 줄은 하나로 (2줄 이상 줄바꿈 → 2줄로)
        result = '\n'.join(cleaned_lines)
        result = re.sub(r'\n{3,}', '\n\n', result)

        return result

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
