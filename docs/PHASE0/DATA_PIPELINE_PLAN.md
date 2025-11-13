# 데이터 파이프라인 계획서

> **버전**: 2.0
> **날짜**: 2025-01-14
> **상태**: 최종 (TrendPipeline 통합)
> **담당**: 데이터 엔지니어링 팀

---

## 1. 개요

Sparklio.ai의 데이터 파이프라인은 **TrendPipeline** 아키텍처를 기반으로 다양한 마케팅 데이터를 수집, 처리, 임베딩하여 RAG(Retrieval Augmented Generation) 시스템과 자가학습 엔진에 활용합니다. 이 시스템은 브랜드 분석, 마케팅 브리프, 광고·SNS 생성, 트렌드 분석 등 모든 기능의 데이터 인프라를 제공합니다.

### 1.1 핵심 목표
- **다중 소스 지원**: 웹 크롤링, SNS, 파일 업로드, API 통합
- **실시간 처리**: 업로드 즉시 처리 (< 10초)
- **자동 학습**: 브랜드/트렌드 데이터 자동 수집 및 업데이트
- **높은 정확도**: 텍스트 추출 정확도 > 95%
- **확장성**: 일일 10,000개 문서 + 100,000개 웹페이지 처리

### 1.2 TrendPipeline 구조
```
수집(Collector) → 정제(Cleaner) → 파싱(Parser) → 청킹(Chunker) → 임베딩(Embedder) → 저장(Ingestor) → 검증(Reviewer)
                                                                                              ↓
                                                                           RAG Engine ← 자가학습 엔진
```

---

## 2. TrendPipeline 아키텍처

### 2.1 전체 시스템 플로우

```mermaid
graph TB
    subgraph "Data Sources"
        WEB[웹 크롤링]
        SNS[SNS API]
        FILE[파일 업로드]
        COMP[경쟁사 모니터링]
    end

    subgraph "TrendPipeline"
        COLL[Collector<br/>데이터 수집]
        CLEAN[Cleaner<br/>정제/전처리]
        PARSE[Parser<br/>구조 분석]
        CHUNK[Chunker<br/>문서 분할]
        EMBED[Embedder<br/>임베딩 생성]
        INGEST[Ingestor<br/>DB 저장]
        REVIEW[Reviewer<br/>품질 검증]
    end

    subgraph "Storage"
        PG[(PostgreSQL<br/>+pgvector)]
        REDIS[(Redis<br/>캐시)]
        S3[(S3/MinIO<br/>미디어)]
    end

    subgraph "Intelligence"
        RAG[RAG Engine]
        LEARN[Self-Learning<br/>Engine]
        BRAND[Brand Model]
    end

    WEB --> COLL
    SNS --> COLL
    FILE --> COLL
    COMP --> COLL

    COLL --> CLEAN
    CLEAN --> PARSE
    PARSE --> CHUNK
    CHUNK --> EMBED
    EMBED --> INGEST
    INGEST --> REVIEW

    INGEST --> PG
    INGEST --> REDIS
    INGEST --> S3

    PG --> RAG
    RAG --> LEARN
    LEARN --> BRAND
    BRAND -.-> EMBED
```

### 2.2 컴포넌트 상세 구조

```python
class TrendPipeline:
    """
    TrendPipeline 메인 클래스 - 데이터 수집부터 RAG까지 전체 플로우 관리
    """

    def __init__(self):
        # 파이프라인 컴포넌트 초기화
        self.collector = DataCollector()      # 멀티소스 데이터 수집
        self.cleaner = DataCleaner()         # 노이즈 제거 및 정제
        self.parser = UniversalParser()      # 다양한 형식 파싱
        self.chunker = SmartChunker()        # 지능형 청킹
        self.embedder = EmbeddingGenerator() # 벡터 임베딩 생성
        self.ingestor = VectorIngestor()     # DB 저장 및 인덱싱
        self.reviewer = QualityReviewer()    # 품질 검증
        self.rag = RAGEngine()              # 검색 증강 생성
        self.learner = SelfLearningEngine() # 자가학습 엔진

    async def process_batch(self, sources: List[DataSource]) -> PipelineResult:
        """
        배치 처리 - 여러 소스를 동시에 처리
        """
        results = []

        # 병렬 처리를 위한 태스크 생성
        tasks = []
        for source in sources:
            task = asyncio.create_task(self.process_single(source))
            tasks.append(task)

        # 모든 태스크 완료 대기
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 자가학습 엔진 업데이트
        await self.learner.update_from_batch(results)

        return PipelineResult(
            success_count=len([r for r in results if r.success]),
            total_count=len(results),
            results=results
        )
```

---

## 3. Collector (데이터 수집기) 상세 스펙

### 3.1 수집 대상 데이터

#### 📊 **마케팅 데이터 12종**

| 카테고리 | 데이터 유형 | 수집 소스 | 우선순위 |
|---------|------------|----------|----------|
| **브랜드** | 로고, 컬러, 폰트, 키워드 | 웹사이트, SNS | P0 |
| **상품/서비스** | 상세페이지, 스펙, FAQ | 이커머스, 공식 사이트 | P0 |
| **시각 스타일** | 이미지, 배너, 영상 | SNS, 광고 플랫폼 | P0 |
| **광고 카피** | 헤드라인, CTA, 본문 | Google Ads, 네이버 | P1 |
| **성과 데이터** | CTR, CPC, ROAS | 광고 API, Analytics | P1 |
| **SNS 콘텐츠** | 포스트, 릴스, 해시태그 | Instagram, TikTok | P0 |
| **경쟁사 분석** | 경쟁사 광고, 톤앤매너 | 웹 크롤링, API | P1 |
| **트렌드** | 검색 키워드, 인기 콘텐츠 | Google Trends, 네이버 | P1 |
| **고객 피드백** | 리뷰, 댓글, Q&A | 쇼핑몰, SNS | P2 |
| **가격 정보** | 시장 가격, 할인 정보 | 가격비교 사이트 | P2 |
| **계절성 데이터** | 시즌 트렌드, 이벤트 | 캘린더, 검색 데이터 | P2 |
| **업종 특화** | 업종별 선호 패턴 | 업종 리포트, 통계 | P2 |

### 3.2 수집 기술 스택

```python
class DataCollector:
    """
    멀티소스 데이터 수집기
    """

    def __init__(self):
        # 웹 크롤링 도구
        self.playwright = PlaywrightCrawler()   # 동적 페이지 크롤링
        self.scrapy = ScrapyEngine()           # 대규모 정적 크롤링
        self.selenium = SeleniumDriver()       # 복잡한 인터랙션 필요시

        # API 클라이언트
        self.apis = {
            'google': GoogleSearchAPI(),        # 검색 결과
            'naver': NaverAPI(),                # 쇼핑/블로그
            'instagram': InstagramGraphAPI(),   # 인스타그램 데이터
            'tiktok': TikTokAPI(),              # 틱톡 트렌드
            'youtube': YouTubeDataAPI(),        # 유튜브 트렌드
            'twitter': TwitterAPI(),            # X(트위터) 트렌드
            'serp': SerpAPI(),                 # SERP 데이터
            'ads': {
                'google': GoogleAdsAPI(),
                'meta': MetaAdsAPI(),
                'naver': NaverAdsAPI()
            }
        }

        # 파일 처리
        self.file_processors = {
            'pdf': PDFProcessor(),
            'ppt': PPTProcessor(),
            'excel': ExcelProcessor(),
            'image': ImageProcessor(),
            'video': VideoProcessor()
        }

    async def collect_web_data(self, url: str, depth: int = 2) -> WebData:
        """
        웹사이트 크롤링 - 브랜드 사이트, 경쟁사 모니터링
        """
        # robots.txt 확인
        if not await self.check_robots_txt(url):
            return WebData(error="Robots.txt 차단")

        # Playwright로 동적 콘텐츠 수집
        pages = []
        async with self.playwright.new_context() as context:
            page = await context.new_page()

            # 메인 페이지 크롤링
            await page.goto(url)
            content = await page.content()

            # 스크린샷 (시각 스타일 분석용)
            screenshot = await page.screenshot(full_page=True)

            # 링크 추출 및 depth 크롤링
            if depth > 0:
                links = await self.extract_links(page)
                for link in links[:10]:  # 최대 10개 서브페이지
                    subpage_data = await self.collect_web_data(link, depth-1)
                    pages.append(subpage_data)

        return WebData(
            url=url,
            content=content,
            screenshot=screenshot,
            subpages=pages,
            timestamp=datetime.utcnow()
        )

    async def collect_sns_trends(self, platform: str, keywords: List[str]) -> SNSData:
        """
        SNS 트렌드 수집 - 인기 콘텐츠, 해시태그, 반응
        """
        api_client = self.apis.get(platform)
        if not api_client:
            raise ValueError(f"지원하지 않는 플랫폼: {platform}")

        trends = []
        for keyword in keywords:
            # 키워드 관련 포스트 수집
            posts = await api_client.search_posts(
                query=keyword,
                limit=100,
                sort='engagement'  # 반응 높은 순
            )

            # 각 포스트 분석
            for post in posts:
                trend_data = {
                    'platform': platform,
                    'keyword': keyword,
                    'content': post.text,
                    'media': post.media_urls,
                    'hashtags': post.hashtags,
                    'engagement': {
                        'likes': post.likes,
                        'comments': post.comments,
                        'shares': post.shares,
                        'views': post.views
                    },
                    'author': post.author,
                    'created_at': post.created_at
                }
                trends.append(trend_data)

        return SNSData(
            platform=platform,
            trends=trends,
            top_hashtags=self.extract_top_hashtags(trends),
            engagement_patterns=self.analyze_engagement(trends)
        )

    async def collect_competitor_data(self, competitors: List[str]) -> CompetitorData:
        """
        경쟁사 데이터 수집 - 광고, 콘텐츠, 전략 분석
        """
        competitor_insights = []

        for competitor in competitors:
            # 웹사이트 크롤링
            website_data = await self.collect_web_data(competitor['website'])

            # SNS 프로필 수집
            sns_profiles = {}
            for platform in ['instagram', 'facebook', 'tiktok']:
                if competitor.get(f'{platform}_handle'):
                    profile = await self.apis[platform].get_profile(
                        competitor[f'{platform}_handle']
                    )
                    sns_profiles[platform] = profile

            # 광고 데이터 수집 (Google Ads Transparency 등)
            ads_data = await self.collect_ads_data(competitor['domain'])

            competitor_insights.append({
                'name': competitor['name'],
                'website': website_data,
                'sns': sns_profiles,
                'ads': ads_data,
                'brand_style': await self.analyze_brand_style(website_data, sns_profiles)
            })

        return CompetitorData(insights=competitor_insights)
```

### 3.3 크롤링 스케줄링

```python
class CrawlingScheduler:
    """
    자동 크롤링 스케줄러
    """

    def __init__(self):
        self.scheduler = APScheduler()
        self.tasks = []

    def setup_schedules(self):
        """
        크롤링 작업 스케줄 설정
        """
        # 매일: 트렌드 데이터 수집
        self.scheduler.add_job(
            func=self.collect_daily_trends,
            trigger='cron',
            hour=6,  # 매일 오전 6시
            id='daily_trends'
        )

        # 매주: 경쟁사 모니터링
        self.scheduler.add_job(
            func=self.monitor_competitors,
            trigger='cron',
            day_of_week='mon',  # 매주 월요일
            hour=9,
            id='weekly_competitors'
        )

        # 실시간: SNS 모니터링 (15분마다)
        self.scheduler.add_job(
            func=self.monitor_sns_realtime,
            trigger='interval',
            minutes=15,
            id='realtime_sns'
        )

        # 월간: 시장 분석 리포트
        self.scheduler.add_job(
            func=self.analyze_market_trends,
            trigger='cron',
            day=1,  # 매월 1일
            hour=0,
            id='monthly_market'
        )
```

---

## 4. Cleaner (데이터 정제) 상세 스펙

### 4.1 정제 프로세스

```python
class DataCleaner:
    """
    데이터 정제 및 전처리
    """

    def __init__(self):
        self.rules = {
            'remove_html': True,              # HTML 태그 제거
            'remove_ads': True,               # 광고성 콘텐츠 제거
            'normalize_text': True,           # 텍스트 정규화
            'remove_duplicates': True,        # 중복 제거
            'fix_encoding': True,             # 인코딩 수정
            'mask_pii': True,                # 개인정보 마스킹
            'remove_noise': True,            # 노이즈 제거
            'extract_key_sentences': True    # 핵심 문장 추출
        }

        # 광고성 키워드 필터
        self.ad_keywords = [
            '클릭', '구매하기', '할인', '무료배송', '한정판매',
            '지금 바로', '놓치지 마세요', '단독 특가'
        ]

        # 노이즈 패턴
        self.noise_patterns = [
            r'[^\w\s가-힣]',  # 특수문자 과다
            r'(.)\1{5,}',     # 반복 문자
            r'\s{3,}',        # 과도한 공백
        ]

    async def clean(self, data: RawData) -> CleanedData:
        """
        데이터 정제 메인 프로세스
        """
        # 1. HTML 및 마크업 제거
        if self.rules['remove_html']:
            data.text = self.remove_html_tags(data.text)

        # 2. 광고성 콘텐츠 필터링
        if self.rules['remove_ads']:
            data.text = self.filter_ad_content(data.text)

        # 3. 텍스트 정규화
        if self.rules['normalize_text']:
            data.text = self.normalize_text(data.text)

        # 4. 중복 제거 (문장 단위)
        if self.rules['remove_duplicates']:
            data.text = self.remove_duplicate_sentences(data.text)

        # 5. 개인정보 마스킹
        if self.rules['mask_pii']:
            data.text = await self.mask_personal_info(data.text)

        # 6. 노이즈 제거
        if self.rules['remove_noise']:
            data.text = self.remove_noise(data.text)

        # 7. 핵심 문장 추출 (요약)
        if self.rules['extract_key_sentences']:
            data.key_sentences = await self.extract_key_sentences(data.text)

        # 8. 품질 검증
        quality_score = self.assess_quality(data.text)

        return CleanedData(
            text=data.text,
            key_sentences=data.key_sentences,
            metadata=data.metadata,
            quality_score=quality_score,
            cleaned_at=datetime.utcnow()
        )

    def filter_ad_content(self, text: str) -> str:
        """
        광고성 콘텐츠 필터링
        """
        lines = text.split('\n')
        filtered_lines = []

        for line in lines:
            # 광고 키워드 밀도 계산
            ad_score = sum(1 for keyword in self.ad_keywords if keyword in line)

            # 임계값 이하만 유지
            if ad_score < 3:
                filtered_lines.append(line)

        return '\n'.join(filtered_lines)

    async def extract_key_sentences(self, text: str) -> List[str]:
        """
        핵심 문장 추출 (TextRank 알고리즘)
        """
        sentences = self.split_sentences(text)

        if len(sentences) < 3:
            return sentences

        # 문장 임베딩 생성
        embeddings = await self.generate_sentence_embeddings(sentences)

        # 유사도 매트릭스 계산
        similarity_matrix = cosine_similarity(embeddings)

        # TextRank 점수 계산
        scores = self.textrank(similarity_matrix)

        # 상위 30% 문장 선택
        top_k = max(3, len(sentences) // 3)
        top_indices = np.argsort(scores)[-top_k:]

        return [sentences[i] for i in sorted(top_indices)]
```

---

## 5. Parser (구조 분석) 상세 스펙

### 5.1 통합 파서

```python
class UniversalParser:
    """
    다양한 형식의 데이터 파싱
    """

    def __init__(self):
        self.parsers = {
            'html': HTMLParser(),
            'pdf': PDFParser(),
            'pptx': PPTParser(),
            'xlsx': ExcelParser(),
            'docx': WordParser(),
            'image': ImageParser(),
            'video': VideoParser(),
            'json': JSONParser(),
            'csv': CSVParser()
        }

    async def parse(self, data: CleanedData) -> ParsedData:
        """
        데이터 타입별 파싱
        """
        # 파일 타입 감지
        file_type = self.detect_type(data)

        # 적절한 파서 선택
        parser = self.parsers.get(file_type)
        if not parser:
            raise UnsupportedFormatError(f"지원하지 않는 형식: {file_type}")

        # 파싱 실행
        parsed = await parser.parse(data)

        # 구조 정보 추출
        structure = self.extract_structure(parsed)

        # 메타데이터 보강
        metadata = self.enrich_metadata(parsed, structure)

        return ParsedData(
            content=parsed.content,
            structure=structure,
            metadata=metadata,
            tables=parsed.tables,
            images=parsed.images,
            links=parsed.links
        )

    def extract_structure(self, parsed: dict) -> DocumentStructure:
        """
        문서 구조 분석
        """
        return DocumentStructure(
            sections=self.identify_sections(parsed),
            hierarchy=self.build_hierarchy(parsed),
            toc=self.generate_toc(parsed),
            summary=self.generate_summary(parsed)
        )
```

### 5.2 특수 파서: 마케팅 데이터

```python
class MarketingDataParser:
    """
    마케팅 특화 데이터 파싱
    """

    async def parse_brand_data(self, website_content: str) -> BrandData:
        """
        브랜드 웹사이트에서 브랜드 정보 추출
        """
        soup = BeautifulSoup(website_content, 'html.parser')

        # 로고 추출
        logo = self.extract_logo(soup)

        # 색상 팔레트 추출
        colors = self.extract_brand_colors(soup)

        # 폰트 정보 추출
        fonts = self.extract_fonts(soup)

        # 키 메시지 추출
        messages = self.extract_key_messages(soup)

        # 톤앤매너 분석
        tone = await self.analyze_tone(soup.get_text())

        return BrandData(
            logo=logo,
            colors=colors,
            fonts=fonts,
            key_messages=messages,
            tone_and_manner=tone
        )

    async def parse_ad_performance(self, ad_data: dict) -> AdPerformance:
        """
        광고 성과 데이터 파싱
        """
        return AdPerformance(
            impressions=ad_data.get('impressions', 0),
            clicks=ad_data.get('clicks', 0),
            ctr=ad_data.get('ctr', 0.0),
            cpc=ad_data.get('cpc', 0.0),
            conversions=ad_data.get('conversions', 0),
            conversion_rate=ad_data.get('conversion_rate', 0.0),
            cost=ad_data.get('cost', 0.0),
            roas=ad_data.get('roas', 0.0),
            campaign_info={
                'name': ad_data.get('campaign_name'),
                'type': ad_data.get('campaign_type'),
                'objective': ad_data.get('objective'),
                'targeting': ad_data.get('targeting'),
                'creatives': ad_data.get('creatives', [])
            }
        )

    def extract_brand_colors(self, soup: BeautifulSoup) -> List[str]:
        """
        웹페이지에서 브랜드 컬러 추출
        """
        colors = set()

        # CSS에서 색상 추출
        styles = soup.find_all('style')
        for style in styles:
            # HEX 색상 패턴
            hex_colors = re.findall(r'#[0-9a-fA-F]{3,6}', style.string or '')
            colors.update(hex_colors)

            # RGB 색상 패턴
            rgb_colors = re.findall(r'rgb\([^)]+\)', style.string or '')
            colors.update(rgb_colors)

        # 인라인 스타일에서 색상 추출
        elements = soup.find_all(style=True)
        for elem in elements:
            style_str = elem.get('style', '')
            hex_colors = re.findall(r'#[0-9a-fA-F]{3,6}', style_str)
            colors.update(hex_colors)

        # 빈도 기반 주요 색상 선택
        return self.select_primary_colors(list(colors))
```

---

## 6. Chunker (청킹 전략) 상세 스펙

### 6.1 스마트 청킹

```python
class SmartChunker:
    """
    지능형 문서 청킹
    """

    def __init__(self):
        self.strategies = {
            'fixed_size': FixedSizeChunker(),      # 고정 크기
            'sentence': SentenceChunker(),         # 문장 단위
            'paragraph': ParagraphChunker(),       # 단락 단위
            'semantic': SemanticChunker(),         # 의미 단위
            'recursive': RecursiveChunker(),       # 재귀적 분할
            'document': DocumentChunker(),         # 문서 구조 기반
            'marketing': MarketingChunker()        # 마케팅 특화
        }

        self.config = {
            'chunk_size': 512,          # 토큰 수
            'chunk_overlap': 128,       # 오버랩 토큰 수
            'min_chunk_size': 100,      # 최소 청크 크기
            'max_chunk_size': 1024,     # 최대 청크 크기
        }

    async def chunk(self, data: ParsedData, strategy: str = 'auto') -> List[Chunk]:
        """
        데이터 청킹 실행
        """
        # 전략 자동 선택
        if strategy == 'auto':
            strategy = self.select_strategy(data)

        # 선택된 전략으로 청킹
        chunker = self.strategies[strategy]
        chunks = await chunker.chunk(data, self.config)

        # 청크 품질 검증 및 최적화
        optimized_chunks = await self.optimize_chunks(chunks)

        # 메타데이터 추가
        final_chunks = []
        for i, chunk_data in enumerate(optimized_chunks):
            chunk = Chunk(
                id=self.generate_chunk_id(),
                text=chunk_data['text'],
                position=i,
                token_count=self.count_tokens(chunk_data['text']),
                metadata={
                    'strategy': strategy,
                    'source_type': data.metadata.get('type'),
                    'brand_id': data.metadata.get('brand_id'),
                    'chunk_index': i,
                    'total_chunks': len(optimized_chunks),
                    'semantic_tags': chunk_data.get('tags', [])
                }
            )
            final_chunks.append(chunk)

        return final_chunks

    def select_strategy(self, data: ParsedData) -> str:
        """
        데이터 특성에 따른 청킹 전략 선택
        """
        # 마케팅 데이터인 경우
        if data.metadata.get('type') in ['ad', 'sns', 'brand']:
            return 'marketing'

        # 구조화된 문서인 경우
        if data.structure and data.structure.sections:
            return 'document'

        # 대화형 텍스트인 경우
        if self.is_conversational(data.content):
            return 'sentence'

        # 긴 문서인 경우
        if len(data.content) > 10000:
            return 'semantic'

        # 기본
        return 'paragraph'
```

### 6.2 마케팅 특화 청킹

```python
class MarketingChunker:
    """
    마케팅 콘텐츠 특화 청킹 전략
    """

    async def chunk(self, data: ParsedData, config: dict) -> List[dict]:
        """
        마케팅 데이터를 의미 단위로 청킹
        """
        chunks = []

        # 광고 카피는 캠페인 단위로
        if data.metadata.get('type') == 'ad':
            chunks = self.chunk_by_campaign(data)

        # SNS 콘텐츠는 포스트 단위로
        elif data.metadata.get('type') == 'sns':
            chunks = self.chunk_by_post(data)

        # 브랜드 데이터는 카테고리별로
        elif data.metadata.get('type') == 'brand':
            chunks = self.chunk_by_brand_element(data)

        # 상품 정보는 섹션별로
        elif data.metadata.get('type') == 'product':
            chunks = self.chunk_by_product_section(data)

        else:
            # 기본 청킹
            chunks = self.default_chunk(data, config)

        return chunks

    def chunk_by_campaign(self, data: ParsedData) -> List[dict]:
        """
        광고 캠페인 단위 청킹
        """
        chunks = []

        for campaign in data.campaigns:
            chunk = {
                'text': f"""
                캠페인: {campaign['name']}
                목표: {campaign['objective']}
                헤드라인: {campaign['headline']}
                본문: {campaign['body']}
                CTA: {campaign['cta']}
                """,
                'tags': ['campaign', campaign['objective']],
                'metadata': {
                    'campaign_id': campaign['id'],
                    'performance': campaign.get('performance', {})
                }
            }
            chunks.append(chunk)

        return chunks
```

---

## 7. Embedder (임베딩 생성) 상세 스펙

### 7.1 멀티모델 임베딩

```python
class EmbeddingGenerator:
    """
    임베딩 생성 관리
    """

    def __init__(self):
        # 임베딩 모델 레지스트리
        self.models = {
            # 텍스트 임베딩
            'text-embedding-3-large': OpenAIEmbeddings(
                model='text-embedding-3-large',
                dimensions=3072
            ),
            'text-embedding-ada-002': OpenAIEmbeddings(
                model='text-embedding-ada-002',
                dimensions=1536
            ),
            'bge-large': HuggingFaceEmbeddings(
                model_name='BAAI/bge-large-en-v1.5',
                dimensions=1024
            ),
            'e5-large': HuggingFaceEmbeddings(
                model_name='intfloat/e5-large-v2',
                dimensions=1024
            ),
            'llama-embed': LocalLlamaEmbeddings(
                model_path='/models/llama3.1-8b',
                dimensions=4096
            ),

            # 이미지 임베딩
            'clip': CLIPEmbeddings(
                model='ViT-L/14',
                dimensions=768
            ),
            'blip': BLIPEmbeddings(
                model='blip-large',
                dimensions=768
            )
        }

        # 기본 설정
        self.default_text_model = 'text-embedding-3-large'
        self.default_image_model = 'clip'
        self.batch_size = 100

        # 캐시
        self.cache = EmbeddingCache()

    async def generate(
        self,
        chunks: List[Chunk],
        model: str = None,
        use_cache: bool = True
    ) -> List[EmbeddedChunk]:
        """
        청크 임베딩 생성
        """
        model = model or self.default_text_model
        embedder = self.models[model]

        embedded_chunks = []

        # 배치 처리
        for batch_start in range(0, len(chunks), self.batch_size):
            batch = chunks[batch_start:batch_start + self.batch_size]

            # 캐시 확인
            if use_cache:
                cached_embeddings = await self.get_cached_embeddings(batch, model)
                uncached_batch = [
                    chunk for chunk, emb in zip(batch, cached_embeddings)
                    if emb is None
                ]
            else:
                uncached_batch = batch
                cached_embeddings = [None] * len(batch)

            # 캐시되지 않은 청크만 임베딩 생성
            if uncached_batch:
                new_embeddings = await self.generate_batch(uncached_batch, embedder)

                # 캐시 저장
                if use_cache:
                    await self.cache_embeddings(uncached_batch, new_embeddings, model)
            else:
                new_embeddings = []

            # 결과 병합
            new_emb_iter = iter(new_embeddings)
            for chunk, cached_emb in zip(batch, cached_embeddings):
                if cached_emb is not None:
                    embedding = cached_emb
                else:
                    embedding = next(new_emb_iter)

                embedded_chunk = EmbeddedChunk(
                    chunk_id=chunk.id,
                    text=chunk.text,
                    embedding=embedding,
                    model=model,
                    metadata={
                        **chunk.metadata,
                        'embedded_at': datetime.utcnow().isoformat(),
                        'embedding_model': model,
                        'embedding_dim': len(embedding)
                    }
                )
                embedded_chunks.append(embedded_chunk)

        # 품질 검증
        await self.validate_embeddings(embedded_chunks)

        return embedded_chunks

    async def generate_hybrid_embedding(
        self,
        text: str,
        metadata: dict,
        image: Optional[bytes] = None
    ) -> np.ndarray:
        """
        하이브리드 임베딩 (텍스트 + 메타데이터 + 이미지)
        """
        embeddings = []

        # 텍스트 임베딩
        text_emb = await self.generate_text_embedding(text)
        embeddings.append(text_emb)

        # 메타데이터 임베딩
        if metadata:
            meta_emb = await self.generate_metadata_embedding(metadata)
            embeddings.append(meta_emb * 0.3)  # 가중치 적용

        # 이미지 임베딩
        if image:
            image_emb = await self.generate_image_embedding(image)
            embeddings.append(image_emb * 0.5)  # 가중치 적용

        # 결합 및 정규화
        combined = np.concatenate(embeddings)
        normalized = combined / np.linalg.norm(combined)

        return normalized

    async def generate_metadata_embedding(self, metadata: dict) -> np.ndarray:
        """
        메타데이터를 임베딩으로 변환
        """
        # 메타데이터를 텍스트로 변환
        meta_text = self.metadata_to_text(metadata)

        # 텍스트 임베딩 생성
        embedding = await self.generate_text_embedding(meta_text)

        return embedding

    def metadata_to_text(self, metadata: dict) -> str:
        """
        메타데이터를 자연어 텍스트로 변환
        """
        parts = []

        if 'brand' in metadata:
            parts.append(f"브랜드: {metadata['brand']}")

        if 'category' in metadata:
            parts.append(f"카테고리: {metadata['category']}")

        if 'tags' in metadata:
            parts.append(f"태그: {', '.join(metadata['tags'])}")

        if 'performance' in metadata:
            perf = metadata['performance']
            if 'ctr' in perf:
                parts.append(f"CTR: {perf['ctr']:.2%}")
            if 'roas' in perf:
                parts.append(f"ROAS: {perf['roas']:.2f}")

        return ' '.join(parts)
```

---

## 8. Ingestor (저장 및 인덱싱) 상세 스펙

### 8.1 벡터 DB 저장

```python
class VectorIngestor:
    """
    벡터 데이터베이스 저장 관리
    """

    def __init__(self):
        # PostgreSQL + pgvector
        self.pg_pool = asyncpg.create_pool(
            host='localhost',
            database='sparklio',
            user='sparklio',
            password=os.getenv('DB_PASSWORD')
        )

        # Redis 캐시
        self.redis = aioredis.create_redis_pool(
            'redis://localhost:6379'
        )

        # S3/MinIO 객체 스토리지
        self.s3 = aioboto3.Session().client(
            's3',
            endpoint_url='http://localhost:9000',
            aws_access_key_id=os.getenv('MINIO_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('MINIO_SECRET_KEY')
        )

    async def ingest(
        self,
        embedded_chunks: List[EmbeddedChunk],
        source_metadata: dict
    ) -> IngestResult:
        """
        임베딩 데이터 저장
        """
        async with self.pg_pool.acquire() as conn:
            async with conn.transaction():
                # 1. 소스 문서 저장
                source_id = await self.save_source(conn, source_metadata)

                # 2. 벡터 저장
                chunk_ids = []
                for chunk in embedded_chunks:
                    chunk_id = await self.save_vector(
                        conn,
                        chunk,
                        source_id
                    )
                    chunk_ids.append(chunk_id)

                # 3. 인덱스 업데이트
                await self.update_indices(conn, chunk_ids)

                # 4. 브랜드 프로필 업데이트
                if source_metadata.get('brand_id'):
                    await self.update_brand_profile(
                        conn,
                        source_metadata['brand_id'],
                        embedded_chunks
                    )

                # 5. 트렌드 인사이트 업데이트
                await self.update_trend_insights(
                    conn,
                    embedded_chunks,
                    source_metadata
                )

        # 6. 캐시 무효화
        await self.invalidate_cache(source_metadata.get('brand_id'))

        # 7. 미디어 파일 저장 (S3/MinIO)
        if source_metadata.get('media_files'):
            await self.save_media_files(
                source_metadata['media_files'],
                source_id
            )

        return IngestResult(
            success=True,
            source_id=source_id,
            chunk_count=len(chunk_ids),
            chunk_ids=chunk_ids,
            ingested_at=datetime.utcnow()
        )

    async def save_vector(
        self,
        conn,
        chunk: EmbeddedChunk,
        source_id: str
    ) -> str:
        """
        벡터 레코드 저장
        """
        query = """
        INSERT INTO vectors (
            id,
            source_id,
            chunk_text,
            embedding,
            model,
            metadata,
            created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        """

        chunk_id = await conn.fetchval(
            query,
            chunk.chunk_id,
            source_id,
            chunk.text,
            chunk.embedding.tolist(),  # pgvector 형식
            chunk.model,
            json.dumps(chunk.metadata),
            datetime.utcnow()
        )

        return chunk_id

    async def update_brand_profile(
        self,
        conn,
        brand_id: str,
        chunks: List[EmbeddedChunk]
    ):
        """
        브랜드 프로필 업데이트
        """
        # 브랜드 관련 청크 분석
        brand_data = await self.analyze_brand_chunks(chunks)

        # 프로필 업데이트
        query = """
        UPDATE brand_profiles
        SET
            keywords = array_cat(keywords, $2),
            tone_vectors = array_cat(tone_vectors, $3),
            style_vectors = array_cat(style_vectors, $4),
            updated_at = $5
        WHERE brand_id = $1
        """

        await conn.execute(
            query,
            brand_id,
            brand_data['keywords'],
            brand_data['tone_vectors'],
            brand_data['style_vectors'],
            datetime.utcnow()
        )
```

### 8.2 인덱스 관리

```python
class IndexManager:
    """
    벡터 인덱스 관리
    """

    async def create_indices(self, conn):
        """
        필요한 인덱스 생성
        """
        # IVFFlat 인덱스 (pgvector)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS vectors_embedding_idx
            ON vectors
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """)

        # HNSW 인덱스 (고정밀 검색용)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS vectors_embedding_hnsw_idx
            ON vectors
            USING hnsw (embedding vector_l2_ops)
            WITH (m = 16, ef_construction = 64);
        """)

        # 메타데이터 인덱스
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS vectors_metadata_idx
            ON vectors
            USING gin (metadata);
        """)

        # 브랜드 인덱스
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS vectors_brand_idx
            ON vectors ((metadata->>'brand_id'));
        """)

    async def optimize_indices(self, conn):
        """
        인덱스 최적화
        """
        # 테이블 크기 확인
        row_count = await conn.fetchval(
            "SELECT COUNT(*) FROM vectors"
        )

        # IVFFlat 리스트 수 재조정
        optimal_lists = int(math.sqrt(row_count))

        if optimal_lists > 100:  # 현재 설정보다 크면
            await conn.execute(f"""
                DROP INDEX vectors_embedding_idx;
                CREATE INDEX vectors_embedding_idx
                ON vectors
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = {optimal_lists});
            """)
```

---

## 9. Reviewer (품질 검증) 상세 스펙

### 9.1 품질 검증 엔진

```python
class QualityReviewer:
    """
    데이터 품질 검증
    """

    def __init__(self):
        self.validators = {
            'duplicate': DuplicateValidator(),
            'quality': QualityValidator(),
            'relevance': RelevanceValidator(),
            'compliance': ComplianceValidator(),
            'brand': BrandConsistencyValidator()
        }

        self.thresholds = {
            'min_quality_score': 0.6,
            'max_duplicate_ratio': 0.3,
            'min_relevance_score': 0.7,
            'min_brand_consistency': 0.8
        }

    async def review(
        self,
        data: IngestedData
    ) -> ReviewResult:
        """
        종합 품질 검토
        """
        issues = []
        scores = {}

        # 각 검증기 실행
        for name, validator in self.validators.items():
            result = await validator.validate(data)
            scores[name] = result.score

            if result.issues:
                issues.extend(result.issues)

        # 종합 점수 계산
        overall_score = np.mean(list(scores.values()))

        # 임계값 체크
        passed = all(
            scores.get(metric, 0) >= threshold
            for metric, threshold in self.thresholds.items()
            if metric.replace('min_', '').replace('max_', '') in scores
        )

        # 문제가 있으면 자동 수정 시도
        if not passed:
            data = await self.auto_fix(data, issues)

            # 재검증
            re_review = await self.review(data)
            if re_review.passed:
                issues.append("자동 수정 완료")

        return ReviewResult(
            passed=passed,
            overall_score=overall_score,
            scores=scores,
            issues=issues,
            reviewed_at=datetime.utcnow()
        )

    async def auto_fix(
        self,
        data: IngestedData,
        issues: List[str]
    ) -> IngestedData:
        """
        품질 문제 자동 수정
        """
        for issue in issues:
            if "duplicate" in issue.lower():
                data = await self.remove_duplicates(data)

            elif "quality" in issue.lower():
                data = await self.improve_quality(data)

            elif "relevance" in issue.lower():
                data = await self.filter_irrelevant(data)

            elif "brand" in issue.lower():
                data = await self.fix_brand_consistency(data)

        return data
```

### 9.2 특수 검증기

```python
class BrandConsistencyValidator:
    """
    브랜드 일관성 검증
    """

    async def validate(self, data: IngestedData) -> ValidationResult:
        """
        브랜드 톤앤매너 일관성 검증
        """
        if not data.metadata.get('brand_id'):
            return ValidationResult(score=1.0, issues=[])

        # 브랜드 프로필 로드
        brand_profile = await self.load_brand_profile(
            data.metadata['brand_id']
        )

        issues = []
        scores = []

        # 톤 일관성 체크
        tone_score = await self.check_tone_consistency(
            data.text,
            brand_profile.tone
        )
        scores.append(tone_score)

        if tone_score < 0.8:
            issues.append(f"톤 일관성 부족: {tone_score:.2f}")

        # 키워드 일치도 체크
        keyword_score = self.check_keyword_usage(
            data.text,
            brand_profile.keywords
        )
        scores.append(keyword_score)

        # 금지어 체크
        if brand_profile.forbidden_words:
            forbidden = self.check_forbidden_words(
                data.text,
                brand_profile.forbidden_words
            )
            if forbidden:
                issues.append(f"금지어 발견: {', '.join(forbidden)}")
                scores.append(0.0)

        return ValidationResult(
            score=np.mean(scores),
            issues=issues
        )

class ComplianceValidator:
    """
    규정 준수 검증
    """

    async def validate(self, data: IngestedData) -> ValidationResult:
        """
        법적/윤리적 규정 준수 검증
        """
        issues = []

        # 개인정보 포함 여부
        if self.contains_pii(data.text):
            issues.append("개인정보 포함")

        # 저작권 침해 가능성
        if await self.check_copyright(data.text):
            issues.append("저작권 침해 가능성")

        # 부적절한 콘텐츠
        if self.contains_inappropriate(data.text):
            issues.append("부적절한 콘텐츠")

        # 광고 규정 위반
        if data.metadata.get('type') == 'ad':
            ad_violations = self.check_ad_compliance(data.text)
            if ad_violations:
                issues.extend(ad_violations)

        score = 1.0 - (len(issues) * 0.2)  # 이슈당 20% 감점

        return ValidationResult(
            score=max(0, score),
            issues=issues
        )
```

---

## 10. RAG Engine 상세 스펙

### 10.1 검색 증강 생성

```python
class RAGEngine:
    """
    검색 증강 생성 엔진
    """

    def __init__(self):
        self.retriever = VectorRetriever()
        self.reranker = CrossEncoderReranker()
        self.generator = ResponseGenerator()
        self.cache = RAGCache()

    async def query(
        self,
        query: str,
        brand_id: Optional[str] = None,
        filters: Optional[dict] = None,
        top_k: int = 10
    ) -> RAGResponse:
        """
        RAG 쿼리 실행
        """
        # 1. 캐시 확인
        cache_key = self.generate_cache_key(query, brand_id, filters)
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        # 2. 쿼리 임베딩 생성
        query_embedding = await self.generate_query_embedding(query)

        # 3. 벡터 검색
        candidates = await self.retriever.search(
            embedding=query_embedding,
            filters=self.build_filters(brand_id, filters),
            top_k=top_k * 3  # Reranking을 위해 더 많이 검색
        )

        # 4. 리랭킹
        reranked = await self.reranker.rerank(
            query=query,
            candidates=candidates,
            top_k=top_k
        )

        # 5. 컨텍스트 구성
        context = self.build_context(reranked)

        # 6. 브랜드 정보 추가
        if brand_id:
            brand_context = await self.get_brand_context(brand_id)
            context = f"{brand_context}\n\n{context}"

        # 7. 응답 생성
        response = await self.generator.generate(
            query=query,
            context=context
        )

        # 8. 메타데이터 추가
        result = RAGResponse(
            query=query,
            response=response,
            sources=reranked,
            context=context,
            metadata={
                'brand_id': brand_id,
                'filters': filters,
                'retrieval_count': len(reranked)
            }
        )

        # 9. 캐시 저장
        await self.cache.set(cache_key, result, ttl=300)

        return result

    async def hybrid_search(
        self,
        query: str,
        image: Optional[bytes] = None,
        brand_id: Optional[str] = None
    ) -> RAGResponse:
        """
        하이브리드 검색 (텍스트 + 이미지)
        """
        embeddings = []

        # 텍스트 임베딩
        if query:
            text_emb = await self.generate_query_embedding(query)
            embeddings.append(('text', text_emb, 0.7))  # 가중치

        # 이미지 임베딩
        if image:
            image_emb = await self.generate_image_embedding(image)
            embeddings.append(('image', image_emb, 0.3))  # 가중치

        # 가중 평균 임베딩
        combined_embedding = self.weighted_average_embeddings(embeddings)

        # 검색 실행
        return await self.query_with_embedding(
            embedding=combined_embedding,
            brand_id=brand_id
        )
```

### 10.2 브랜드 인식 RAG

```python
class BrandAwareRAG:
    """
    브랜드 특화 RAG 시스템
    """

    def __init__(self):
        self.rag = RAGEngine()
        self.brand_manager = BrandManager()
        self.style_adapter = StyleAdapter()

    async def generate_brand_content(
        self,
        prompt: str,
        brand_id: str,
        content_type: str
    ) -> BrandContent:
        """
        브랜드 맞춤 콘텐츠 생성
        """
        # 1. 브랜드 프로필 로드
        brand = await self.brand_manager.get_profile(brand_id)

        # 2. 관련 브랜드 데이터 검색
        brand_context = await self.rag.query(
            query=prompt,
            brand_id=brand_id,
            filters={'type': 'brand_data'}
        )

        # 3. 성공 사례 검색
        success_examples = await self.rag.query(
            query=f"{content_type} 고성과 사례",
            brand_id=brand_id,
            filters={'performance_score': {'gte': 0.8}}
        )

        # 4. 경쟁사 분석 데이터 검색
        competitor_insights = await self.rag.query(
            query=f"{brand.industry} 경쟁사 {content_type}",
            filters={'type': 'competitor'}
        )

        # 5. 트렌드 데이터 검색
        trends = await self.rag.query(
            query=f"{brand.industry} 최신 트렌드",
            filters={
                'type': 'trend',
                'recency': {'gte': datetime.now() - timedelta(days=30)}
            }
        )

        # 6. 컨텍스트 통합
        integrated_context = self.integrate_contexts(
            brand=brand,
            brand_context=brand_context,
            examples=success_examples,
            competitors=competitor_insights,
            trends=trends
        )

        # 7. 브랜드 스타일 적용 생성
        content = await self.style_adapter.generate(
            prompt=prompt,
            context=integrated_context,
            brand_style=brand.style_guide,
            content_type=content_type
        )

        return BrandContent(
            content=content,
            brand_id=brand_id,
            content_type=content_type,
            sources={
                'brand_data': brand_context.sources,
                'success_examples': success_examples.sources,
                'competitors': competitor_insights.sources,
                'trends': trends.sources
            }
        )
```

---

## 11. 자가학습 연동 인터페이스

### 11.1 학습 데이터 수집

```python
class LearningDataCollector:
    """
    자가학습용 데이터 수집
    """

    def __init__(self):
        self.pipeline = TrendPipeline()
        self.performance_tracker = PerformanceTracker()

    async def collect_feedback_data(
        self,
        content_id: str
    ) -> FeedbackData:
        """
        생성된 콘텐츠의 피드백 데이터 수집
        """
        # SNS 반응 수집
        sns_feedback = await self.collect_sns_metrics(content_id)

        # 광고 성과 수집
        ad_performance = await self.collect_ad_metrics(content_id)

        # 사용자 수정 내역 수집
        user_edits = await self.collect_user_edits(content_id)

        # A/B 테스트 결과 수집
        ab_results = await self.collect_ab_test_results(content_id)

        return FeedbackData(
            content_id=content_id,
            sns=sns_feedback,
            ads=ad_performance,
            edits=user_edits,
            ab_test=ab_results,
            collected_at=datetime.utcnow()
        )

    async def update_learning_pipeline(
        self,
        feedback: FeedbackData
    ):
        """
        피드백을 파이프라인에 반영
        """
        # 성공 패턴 추출
        success_patterns = await self.extract_success_patterns(feedback)

        # 실패 패턴 추출
        failure_patterns = await self.extract_failure_patterns(feedback)

        # 파이프라인 업데이트
        await self.pipeline.update_patterns(
            success=success_patterns,
            failure=failure_patterns
        )

        # 임베딩 재생성 트리거
        if self.needs_reembedding(feedback):
            await self.trigger_reembedding(feedback.content_id)
```

---

## 12. 스케줄링 및 자동화

### 12.1 파이프라인 스케줄러

```python
class PipelineScheduler:
    """
    자동 데이터 수집 및 처리 스케줄러
    """

    def __init__(self):
        self.scheduler = APScheduler()
        self.pipeline = TrendPipeline()
        self.config = SchedulerConfig()

    def setup_schedules(self):
        """
        자동 실행 스케줄 설정
        """
        # 실시간: SNS 트렌드 (15분)
        self.scheduler.add_job(
            func=self.collect_sns_trends,
            trigger='interval',
            minutes=15,
            id='sns_trends_realtime',
            args=['instagram', 'tiktok', 'twitter']
        )

        # 시간별: 검색 트렌드 (1시간)
        self.scheduler.add_job(
            func=self.collect_search_trends,
            trigger='interval',
            hours=1,
            id='search_trends_hourly'
        )

        # 일별: 경쟁사 모니터링 (매일 오전 6시)
        self.scheduler.add_job(
            func=self.monitor_competitors,
            trigger='cron',
            hour=6,
            id='competitor_daily'
        )

        # 주별: 시장 분석 (매주 월요일)
        self.scheduler.add_job(
            func=self.analyze_market,
            trigger='cron',
            day_of_week='mon',
            hour=9,
            id='market_weekly'
        )

        # 월별: 트렌드 리포트 (매월 1일)
        self.scheduler.add_job(
            func=self.generate_trend_report,
            trigger='cron',
            day=1,
            hour=0,
            id='trend_report_monthly'
        )

    async def collect_sns_trends(self, *platforms):
        """
        SNS 트렌드 수집 작업
        """
        for platform in platforms:
            try:
                # 트렌딩 해시태그 수집
                hashtags = await self.get_trending_hashtags(platform)

                # 각 해시태그별 콘텐츠 수집
                for hashtag in hashtags[:20]:  # 상위 20개
                    data = await self.pipeline.collector.collect_sns_trends(
                        platform=platform,
                        keywords=[hashtag]
                    )

                    # 파이프라인 처리
                    await self.pipeline.process_single(data)

                # 로깅
                logger.info(f"{platform} 트렌드 수집 완료: {len(hashtags)} 해시태그")

            except Exception as e:
                logger.error(f"{platform} 트렌드 수집 실패: {e}")
                await self.alert_admin(f"SNS 트렌드 수집 실패: {platform}")
```

---

## 13. 보안 및 컴플라이언스

### 13.1 데이터 보안

```python
class DataSecurity:
    """
    데이터 보안 관리
    """

    def __init__(self):
        self.encryptor = DataEncryptor()
        self.masker = PIIMasker()
        self.validator = ComplianceValidator()

    async def secure_data(self, data: RawData) -> SecuredData:
        """
        데이터 보안 처리
        """
        # PII 마스킹
        masked_data = await self.masker.mask(data)

        # 민감 정보 암호화
        encrypted = await self.encryptor.encrypt_sensitive(masked_data)

        # 규정 준수 검증
        compliance = await self.validator.validate(encrypted)

        if not compliance.passed:
            raise ComplianceError(compliance.issues)

        return SecuredData(
            data=encrypted,
            security_level='high',
            compliance=compliance
        )

class PIIMasker:
    """
    개인정보 마스킹
    """

    patterns = {
        'email': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        'phone': r'010-?\d{4}-?\d{4}',
        'rrn': r'\d{6}-[1-4]\d{6}',  # 주민등록번호
        'card': r'\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}',
        'account': r'\d{3,6}-\d{2,6}-\d{6,}',  # 계좌번호
    }

    async def mask(self, text: str) -> str:
        """
        개인정보 마스킹 처리
        """
        masked = text

        for pii_type, pattern in self.patterns.items():
            masked = re.sub(pattern, f'[{pii_type.upper()}_MASKED]', masked)

        return masked
```

---

## 14. 성능 모니터링

### 14.1 파이프라인 메트릭

```python
class PipelineMetrics:
    """
    파이프라인 성능 메트릭
    """

    def __init__(self):
        # Prometheus 메트릭
        self.metrics = {
            'documents_processed': Counter(
                'pipeline_documents_processed_total',
                'Total documents processed',
                ['source', 'status']
            ),
            'processing_time': Histogram(
                'pipeline_processing_seconds',
                'Processing time',
                ['stage']
            ),
            'embedding_quality': Gauge(
                'pipeline_embedding_quality',
                'Embedding quality score'
            ),
            'rag_accuracy': Gauge(
                'pipeline_rag_accuracy',
                'RAG retrieval accuracy'
            ),
            'storage_usage': Gauge(
                'pipeline_storage_bytes',
                'Storage usage in bytes',
                ['type']
            )
        }

    async def record_processing(
        self,
        source: str,
        stage: str,
        duration: float,
        status: str
    ):
        """
        처리 메트릭 기록
        """
        self.metrics['documents_processed'].labels(
            source=source,
            status=status
        ).inc()

        self.metrics['processing_time'].labels(
            stage=stage
        ).observe(duration)
```

---

## 15. KPI 및 성공 지표

### 15.1 핵심 성과 지표

| KPI | 목표 | 측정 방법 | 현재 |
|-----|------|-----------|------|
| **데이터 수집량** | 100K 문서/일 | 일별 처리 문서 수 | - |
| **처리 속도** | < 10초/문서 | P90 처리 시간 | - |
| **임베딩 품질** | > 0.85 | Cosine similarity | - |
| **RAG 정확도** | > 90% | Relevance score | - |
| **트렌드 적시성** | < 1시간 | 트렌드 발견-반영 시간 | - |
| **브랜드 일관성** | > 95% | Brand consistency score | - |
| **스토리지 효율** | < $0.01/GB | 월간 스토리지 비용 | - |
| **API 응답 시간** | < 500ms | P95 latency | - |

### 15.2 품질 지표

| 지표 | 기준 | 측정 주기 |
|------|------|-----------|
| **텍스트 추출 정확도** | > 95% | 일별 |
| **중복 제거율** | > 99% | 실시간 |
| **PII 마스킹 정확도** | 100% | 실시간 |
| **청킹 품질** | > 0.8 | 주별 |
| **검색 관련성** | > 0.85 | 실시간 |

---

## 16. Next Steps

### 16.1 Phase 1 개발 우선순위

1. **기본 파이프라인 구축** (Week 1-2)
   - Collector 기본 구현
   - Parser 통합
   - 벡터 DB 설정

2. **크롤링 시스템** (Week 3-4)
   - 웹 크롤러 구현
   - SNS API 연동
   - 스케줄러 설정

3. **RAG 엔진** (Week 5-6)
   - 검색 시스템 구현
   - 리랭킹 로직
   - 캐싱 전략

4. **자가학습 연동** (Week 7-8)
   - 피드백 수집
   - 패턴 분석
   - 모델 업데이트

### 16.2 연관 문서

- [BRAND_LEARNING_ENGINE.md](./BRAND_LEARNING_ENGINE.md) - 자가학습 상세
- [AGENTS_SPEC.md](./AGENTS_SPEC.md) - 에이전트 명세
- [LLM_ROUTER_POLICY.md](./LLM_ROUTER_POLICY.md) - 라우팅 정책

---

## 17. 부록

### 17.1 데이터베이스 스키마

```sql
-- 소스 문서 테이블
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT,
    type VARCHAR(50),
    brand_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 벡터 테이블
CREATE TABLE vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id),
    chunk_text TEXT,
    embedding vector(3072),  -- OpenAI text-embedding-3-large
    model VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 브랜드 프로필 테이블
CREATE TABLE brand_profiles (
    brand_id UUID PRIMARY KEY,
    name VARCHAR(255),
    keywords TEXT[],
    tone_vectors FLOAT[][],
    style_vectors FLOAT[][],
    forbidden_words TEXT[],
    metadata JSONB,
    updated_at TIMESTAMP
);

-- 트렌드 인사이트 테이블
CREATE TABLE trend_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(255),
    platform VARCHAR(50),
    trend_score FLOAT,
    engagement_data JSONB,
    discovered_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- 인덱스
CREATE INDEX vectors_embedding_idx ON vectors
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX vectors_metadata_idx ON vectors USING gin (metadata);
CREATE INDEX vectors_brand_idx ON vectors ((metadata->>'brand_id'));
CREATE INDEX sources_brand_idx ON sources (brand_id);
CREATE INDEX trend_insights_keyword_idx ON trend_insights (keyword);
```

### 17.2 API 엔드포인트

```python
# FastAPI 라우트 예시
@app.post("/pipeline/ingest")
async def ingest_data(
    file: UploadFile = File(...),
    brand_id: str = Form(...),
    metadata: str = Form("{}")
):
    """데이터 수집 및 처리"""
    pass

@app.get("/pipeline/search")
async def search(
    query: str,
    brand_id: Optional[str] = None,
    top_k: int = 10
):
    """RAG 검색"""
    pass

@app.post("/pipeline/crawl")
async def trigger_crawl(
    url: str,
    depth: int = 2,
    brand_id: Optional[str] = None
):
    """웹 크롤링 트리거"""
    pass

@app.get("/pipeline/trends")
async def get_trends(
    platform: str,
    limit: int = 20
):
    """트렌드 조회"""
    pass
```

### 17.3 환경 변수

```bash
# .env 파일
DATABASE_URL=postgresql://sparklio:password@localhost/sparklio
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# API Keys
OPENAI_API_KEY=sk-...
SERPAPI_KEY=...
INSTAGRAM_ACCESS_TOKEN=...
TIKTOK_API_KEY=...

# 설정
PIPELINE_BATCH_SIZE=100
EMBEDDING_MODEL=text-embedding-3-large
CHUNK_SIZE=512
CHUNK_OVERLAP=128
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2025-01-13 | 1.0 | 초기 작성 | 데이터팀 |
| 2025-01-14 | 2.0 | TrendPipeline 통합, 크롤링 시스템 추가, RAG 고도화 | 데이터팀 |