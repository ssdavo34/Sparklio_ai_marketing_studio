"""
Web Crawler Service

URL에서 텍스트를 추출하는 크롤링 서비스

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-1 Brand OS Module
"""

import logging
import re
from typing import Optional, Dict, Any, List, Set, TYPE_CHECKING
from urllib.parse import urlparse, urljoin
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

    # ========================================================================
    # 다중 페이지 크롤링 (Brand DNA용)
    # ========================================================================

    # 브랜드 정보를 담고 있을 가능성이 높은 페이지 경로 패턴
    IMPORTANT_PAGE_PATTERNS = [
        # 회사 소개
        r'/about',
        r'/company',
        r'/introduction',
        r'/소개',
        r'/회사소개',
        # 서비스/제품
        r'/service',
        r'/product',
        r'/solution',
        r'/서비스',
        r'/제품',
        # 브랜드/비전
        r'/brand',
        r'/vision',
        r'/mission',
        r'/value',
        r'/philosophy',
        # 연혁/역사
        r'/history',
        r'/story',
        r'/연혁',
    ]

    async def crawl_brand_site(
        self,
        url: str,
        max_pages: int = 5,
        include_categories: bool = True
    ) -> Dict[str, Any]:
        """
        브랜드 사이트 다중 페이지 크롤링

        메인 페이지에서 시작하여 회사 소개, 서비스 페이지 등
        브랜드 정보가 담긴 중요 페이지를 자동으로 찾아 크롤링합니다.

        Args:
            url: 메인 페이지 URL
            max_pages: 최대 크롤링 페이지 수 (기본 5)
            include_categories: 카테고리 정보 포함 여부 (제품 카테고리명만 추출)

        Returns:
            Dict with:
                - pages: 각 페이지별 크롤링 결과 리스트
                - combined_text: 모든 페이지 텍스트 합본
                - categories: 발견된 카테고리 목록 (include_categories=True인 경우)
                - metadata: 전체 사이트 메타데이터
        """
        parsed_url = urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"

        logger.info(f"Starting multi-page crawl for brand site: {url}, max_pages={max_pages}")

        # 1. 메인 페이지 크롤링
        main_result = await self.crawl(url)
        pages = [{
            "url": url,
            "page_type": "main",
            "title": main_result.get("title"),
            "text": main_result.get("extracted_text", ""),
            "description": main_result.get("description"),
        }]

        # 2. 메인 페이지에서 중요 링크 추출
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            response = await client.get(url, headers=self.headers)
            soup = BeautifulSoup(response.text, 'html.parser')

        important_links = self._find_important_links(soup, base_url)
        category_links = []

        if include_categories:
            category_links = self._find_category_links(soup, base_url)

        logger.info(
            f"Found {len(important_links)} important links, "
            f"{len(category_links)} category links"
        )

        # 3. 중요 페이지 크롤링 (max_pages - 1개)
        crawled_urls: Set[str] = {url}
        pages_to_crawl = important_links[:max_pages - 1]

        for link_info in pages_to_crawl:
            link_url = link_info["url"]
            if link_url in crawled_urls:
                continue

            try:
                page_result = await self.crawl(link_url)
                pages.append({
                    "url": link_url,
                    "page_type": link_info["type"],
                    "title": page_result.get("title"),
                    "text": page_result.get("extracted_text", ""),
                    "description": page_result.get("description"),
                })
                crawled_urls.add(link_url)
                logger.info(f"Crawled {link_info['type']} page: {link_url}")
            except Exception as e:
                logger.warning(f"Failed to crawl {link_url}: {str(e)}")

        # 4. 카테고리 정보 추출 (상세 페이지는 크롤링하지 않고 카테고리명만)
        categories = []
        if include_categories and category_links:
            categories = [link["name"] for link in category_links[:20]]  # 최대 20개
            logger.info(f"Extracted {len(categories)} categories: {categories[:5]}...")

        # 5. 결과 합본
        combined_text = self._combine_page_texts(pages)

        return {
            "pages": pages,
            "combined_text": combined_text,
            "categories": categories,
            "page_count": len(pages),
            "metadata": {
                "base_url": base_url,
                "main_title": main_result.get("title"),
                "main_description": main_result.get("description"),
                "crawled_urls": list(crawled_urls),
                "category_count": len(categories),
            }
        }

    def _find_important_links(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, str]]:
        """
        브랜드 정보가 담긴 중요 페이지 링크 찾기

        회사 소개, 서비스, 비전 등 브랜드 DNA 분석에 유용한 페이지
        """
        important_links = []
        seen_urls: Set[str] = set()

        for a_tag in soup.find_all('a', href=True):
            href = a_tag.get('href', '')
            link_text = a_tag.get_text(strip=True).lower()

            # 상대 경로를 절대 경로로
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)

            # 같은 도메인만
            if parsed.netloc != urlparse(base_url).netloc:
                continue

            # 이미 본 URL 스킵
            if full_url in seen_urls:
                continue

            # 파일 링크 제외
            if re.search(r'\.(pdf|jpg|png|gif|doc|zip)$', parsed.path, re.I):
                continue

            # 중요 패턴 매칭
            path_lower = parsed.path.lower()
            page_type = None

            for pattern in self.IMPORTANT_PAGE_PATTERNS:
                if re.search(pattern, path_lower, re.I):
                    if 'about' in pattern or 'company' in pattern or '소개' in pattern:
                        page_type = "about"
                    elif 'service' in pattern or 'product' in pattern or 'solution' in pattern:
                        page_type = "service"
                    elif 'brand' in pattern or 'vision' in pattern or 'mission' in pattern:
                        page_type = "brand"
                    elif 'history' in pattern or 'story' in pattern or '연혁' in pattern:
                        page_type = "history"
                    else:
                        page_type = "info"
                    break

            # 링크 텍스트로도 판단
            if not page_type:
                if any(kw in link_text for kw in ['회사소개', '소개', 'about', 'company']):
                    page_type = "about"
                elif any(kw in link_text for kw in ['서비스', '제품', 'service', 'product']):
                    page_type = "service"
                elif any(kw in link_text for kw in ['브랜드', '비전', 'brand', 'vision']):
                    page_type = "brand"

            if page_type:
                important_links.append({
                    "url": full_url,
                    "type": page_type,
                    "text": link_text,
                })
                seen_urls.add(full_url)

        # 중요도 순서로 정렬 (about > service > brand > history > info)
        priority = {"about": 0, "service": 1, "brand": 2, "history": 3, "info": 4}
        important_links.sort(key=lambda x: priority.get(x["type"], 5))

        return important_links

    def _find_category_links(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, str]]:
        """
        제품/서비스 카테고리 링크 찾기

        상세 페이지는 크롤링하지 않고 카테고리명만 추출
        """
        category_links = []
        seen_names: Set[str] = set()

        # 카테고리를 포함할 가능성이 높은 영역
        category_containers = soup.find_all(
            ['nav', 'ul', 'div'],
            class_=re.compile(r'category|menu|product|service|gnb|lnb', re.I)
        )

        for container in category_containers:
            for a_tag in container.find_all('a', href=True):
                name = a_tag.get_text(strip=True)

                # 이름이 너무 짧거나 길면 스킵
                if len(name) < 2 or len(name) > 30:
                    continue

                # 중복 제거
                if name.lower() in seen_names:
                    continue

                # 일반적인 메뉴 항목 제외
                skip_keywords = ['홈', 'home', '로그인', 'login', '회원가입', '장바구니', 'cart', '검색']
                if any(kw in name.lower() for kw in skip_keywords):
                    continue

                href = a_tag.get('href', '')
                full_url = urljoin(base_url, href)

                category_links.append({
                    "url": full_url,
                    "name": name,
                })
                seen_names.add(name.lower())

        return category_links

    def _combine_page_texts(self, pages: List[Dict[str, Any]]) -> str:
        """
        여러 페이지의 텍스트를 하나로 합침

        각 페이지 구분을 위한 헤더 포함
        """
        sections = []

        for page in pages:
            page_type = page.get("page_type", "unknown")
            title = page.get("title", "Untitled")
            text = page.get("text", "")

            if not text:
                continue

            # 페이지 타입 한글 변환
            type_labels = {
                "main": "메인 페이지",
                "about": "회사 소개",
                "service": "서비스/제품",
                "brand": "브랜드",
                "history": "연혁",
                "info": "정보",
            }
            type_label = type_labels.get(page_type, page_type)

            section = f"=== [{type_label}] {title} ===\n\n{text}"
            sections.append(section)

        return "\n\n" + "\n\n".join(sections)


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
