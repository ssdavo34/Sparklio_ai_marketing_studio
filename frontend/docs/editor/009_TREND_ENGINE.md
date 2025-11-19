# Canvas Studio v3 — Trend Learning Engine

**관련 문서**: [000_MASTER_PLAN.md](./000_MASTER_PLAN.md), [002_DATA_MODEL.md](./002_DATA_MODEL.md), [008_AGENTS_INTEGRATION.md](./008_AGENTS_INTEGRATION.md)
**작성일**: 2025-11-19

---

## 📋 목차

1. [개요](#개요)
2. [파이프라인 아키텍처](#파이프라인-아키텍처)
3. [Stage 1: Collector (데이터 수집)](#stage-1-collector-데이터-수집)
4. [Stage 2: Cleaner & Normalizer (데이터 정제)](#stage-2-cleaner--normalizer-데이터-정제)
5. [Stage 3: Pattern Miner (패턴 추출)](#stage-3-pattern-miner-패턴-추출)
6. [Stage 4: Template Generator (템플릿 생성)](#stage-4-template-generator-템플릿-생성)
7. [Stage 5: Exporter (API 제공)](#stage-5-exporter-api-제공)
8. [Learning Plan 관리](#learning-plan-관리)
9. [성능 최적화](#성능-최적화)

---

## 개요

### Trend Engine이란?

**Trend Learning Engine**은 Sparklio의 핵심 차별화 요소로, **마케팅 트렌드 데이터를 자동으로 수집하고 학습하여 고성능 템플릿을 생성**하는 시스템입니다.

### 왜 필요한가?

**문제점**:
- 자체 템플릿/마케팅 트렌드 데이터셋이 부족함
- 마케팅 트렌드는 시장/채널/시기별로 빠르게 변화함
- 수동으로 템플릿을 제작하면 트렌드를 따라가기 어려움
- 어떤 레이아웃이 실제로 성과가 좋은지 알기 어려움

**해결책**:
- **자동 크롤링**: 공신력 있는 마케팅 데이터 소스를 정기적으로 수집
- **패턴 학습**: 성공 사례에서 레이아웃/구성/스타일 패턴 추출
- **템플릿 자동 생성**: 학습한 패턴을 EditorDocument로 변환
- **성과 추적**: 생성된 템플릿의 실제 성과를 모니터링하여 지속 개선

### 핵심 가치

1. **Zero to Hero**: 데이터가 없는 상태에서도 빠르게 고품질 템플릿 확보
2. **Always Up-to-date**: 시장 트렌드를 실시간으로 반영
3. **Data-Driven**: 실제 성과 데이터 기반의 템플릿 랭킹
4. **Automated Learning**: 사람 개입 없이 지속적으로 개선

---

## 파이프라인 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Trend Learning Pipeline                           │
└─────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │   Stage 1    │      │   Stage 2    │      │   Stage 3    │
   │  Collector   │ ───▶ │   Cleaner    │ ───▶ │Pattern Miner │
   │  (크롤링)     │      │   (정제)      │      │  (패턴추출)   │
   └──────────────┘      └──────────────┘      └──────────────┘
         │                                               │
         ▼                                               ▼
   [Raw HTML/JSON]                              [TrendPattern[]]
         │                                               │
         │                                               │
         ▼                                               ▼
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │   Stage 5    │ ◀─── │   Stage 4    │      │              │
   │   Exporter   │      │  Template    │      │  PostgreSQL  │
   │  (API 제공)   │      │  Generator   │      │  (저장소)     │
   └──────────────┘      └──────────────┘      └──────────────┘
         │
         ▼
   [/api/v1/templates/auto-generate]
         │
         ▼
   [Editor v2.0 Frontend]
```

### 기술 스택

- **Backend**: Python (FastAPI)
- **크롤러**: Scrapy / Playwright (JavaScript 렌더링)
- **이미지 처리**: Pillow / OpenCV
- **패턴 학습**: scikit-learn (Clustering, Classification)
- **데이터베이스**: PostgreSQL (메타데이터), MinIO (이미지)
- **스케줄러**: Celery + Redis (정기 실행)
- **모니터링**: Prometheus + Grafana

---

## Stage 1: Collector (데이터 수집)

### 역할

공신력 있는 마케팅 데이터 소스로부터 **성공 사례**를 자동으로 수집합니다.

### 데이터 소스

#### 1. SNS 플랫폼 광고 라이브러리

```python
DATA_SOURCES = {
    # Meta (Facebook/Instagram) 광고 라이브러리
    'meta_ad_library': {
        'url': 'https://www.facebook.com/ads/library/',
        'method': 'api',  # Meta Ad Library API 사용
        'filters': {
            'ad_reached_countries': ['KR', 'US', 'JP'],
            'ad_active_status': 'ACTIVE',
            'ad_delivery_date_min': '2025-11-01',
            'impressions_min': 10000,  # 최소 노출 수
        },
        'extract': ['image_url', 'text', 'cta_type', 'layout'],
        'frequency': 'daily'
    },

    # TikTok Creative Center
    'tiktok_creative_center': {
        'url': 'https://ads.tiktok.com/business/creativecenter',
        'method': 'scraper',  # Playwright로 렌더링 후 스크래핑
        'filters': {
            'region': ['KR', 'US'],
            'industry': ['E-commerce', 'Fashion', 'Beauty'],
            'trend_period': 'last_7_days'
        },
        'extract': ['video_thumbnail', 'caption', 'hashtags', 'music'],
        'frequency': 'daily'
    },

    # Pinterest Trends
    'pinterest_trends': {
        'url': 'https://trends.pinterest.com/',
        'method': 'scraper',
        'filters': {
            'country': 'KR',
            'category': ['fashion', 'home-decor', 'food']
        },
        'extract': ['image_url', 'description', 'category', 'search_volume'],
        'frequency': 'weekly'
    }
}
```

#### 2. 마케팅 리포트 & 통계 사이트

```python
REPORT_SOURCES = {
    # Think with Google (광고 성과 리포트)
    'think_with_google': {
        'url': 'https://www.thinkwithgoogle.com/',
        'extract': ['case_studies', 'best_practices', 'performance_metrics'],
        'frequency': 'weekly'
    },

    # HubSpot Marketing Statistics
    'hubspot_stats': {
        'url': 'https://www.hubspot.com/marketing-statistics',
        'extract': ['ctr_benchmarks', 'layout_performance', 'color_psychology'],
        'frequency': 'monthly'
    }
}
```

#### 3. E-commerce 베스트셀러 상세페이지

```python
ECOMMERCE_SOURCES = {
    # 쿠팡 베스트셀러
    'coupang_bestsellers': {
        'url': 'https://www.coupang.com/np/bestsellers',
        'filters': {
            'category': ['fashion', 'beauty', 'electronics'],
            'rank_max': 100  # 상위 100개만
        },
        'extract': ['product_images', 'description_layout', 'review_section'],
        'frequency': 'daily'
    },

    # Amazon Best Sellers
    'amazon_bestsellers': {
        'url': 'https://www.amazon.com/Best-Sellers',
        'filters': {
            'category': ['All Departments'],
            'rank_max': 50
        },
        'extract': ['product_detail_layout', 'a_plus_content', 'bullet_points'],
        'frequency': 'weekly'
    }
}
```

### Collector 구현

```python
# backend/app/trend_engine/collector.py

from typing import List, Dict
from datetime import datetime
import asyncio
from playwright.async_api import async_playwright
from models.trend import RawTrendData, DataSource

class TrendCollector:
    """트렌드 데이터 수집기"""

    def __init__(self, source_config: Dict):
        self.source_config = source_config
        self.collected_data: List[RawTrendData] = []

    async def collect_from_meta_ad_library(self, filters: Dict) -> List[RawTrendData]:
        """Meta Ad Library API로부터 데이터 수집"""
        # Meta Graph API 사용
        access_token = os.getenv('META_AD_LIBRARY_TOKEN')
        url = f"https://graph.facebook.com/v18.0/ads_archive"

        params = {
            'access_token': access_token,
            'ad_reached_countries': filters['ad_reached_countries'],
            'ad_active_status': filters['ad_active_status'],
            'ad_delivery_date_min': filters['ad_delivery_date_min'],
            'limit': 100,
            'fields': 'ad_creative_bodies,ad_creative_link_captions,ad_snapshot_url'
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                data = await response.json()

                raw_data_list = []
                for ad in data.get('data', []):
                    raw_data = RawTrendData(
                        source='meta_ad_library',
                        source_url=ad['ad_snapshot_url'],
                        market='kr' if 'KR' in filters['ad_reached_countries'] else 'global',
                        channel='instagram',
                        format='feed',
                        raw_content={
                            'body': ad.get('ad_creative_bodies', ''),
                            'caption': ad.get('ad_creative_link_captions', ''),
                            'snapshot_url': ad['ad_snapshot_url']
                        },
                        collected_at=datetime.utcnow()
                    )
                    raw_data_list.append(raw_data)

                return raw_data_list

    async def collect_from_tiktok_creative_center(self, filters: Dict) -> List[RawTrendData]:
        """TikTok Creative Center에서 Playwright로 스크래핑"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            await page.goto('https://ads.tiktok.com/business/creativecenter/inspiration/popular/pc/en')
            await page.wait_for_selector('.creative-card')

            # 크리에이티브 카드 스크래핑
            cards = await page.query_selector_all('.creative-card')
            raw_data_list = []

            for card in cards[:20]:  # 상위 20개만
                try:
                    thumbnail = await card.query_selector('img')
                    thumbnail_url = await thumbnail.get_attribute('src')

                    caption_elem = await card.query_selector('.caption')
                    caption = await caption_elem.inner_text()

                    raw_data = RawTrendData(
                        source='tiktok_creative_center',
                        source_url='https://ads.tiktok.com/business/creativecenter',
                        market=filters['region'][0].lower(),
                        channel='tiktok',
                        format='short',
                        raw_content={
                            'thumbnail_url': thumbnail_url,
                            'caption': caption
                        },
                        collected_at=datetime.utcnow()
                    )
                    raw_data_list.append(raw_data)

                except Exception as e:
                    print(f"Error extracting card: {e}")
                    continue

            await browser.close()
            return raw_data_list

    async def run_collection(self, source_name: str) -> List[RawTrendData]:
        """특정 소스에서 데이터 수집 실행"""
        config = self.source_config[source_name]

        if config['method'] == 'api':
            if source_name == 'meta_ad_library':
                return await self.collect_from_meta_ad_library(config['filters'])

        elif config['method'] == 'scraper':
            if source_name == 'tiktok_creative_center':
                return await self.collect_from_tiktok_creative_center(config['filters'])

        return []

# Celery Task
@celery_app.task
def collect_trend_data(source_name: str):
    """Celery로 정기 실행되는 수집 태스크"""
    collector = TrendCollector(DATA_SOURCES)
    raw_data_list = asyncio.run(collector.run_collection(source_name))

    # DB 저장
    for raw_data in raw_data_list:
        db.session.add(raw_data)
    db.session.commit()

    return {
        'source': source_name,
        'collected_count': len(raw_data_list),
        'timestamp': datetime.utcnow().isoformat()
    }
```

### Learning Plan (수집 스케줄)

```python
# backend/app/models/learning_plan.py

from sqlalchemy import Column, String, JSON, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class LearningPlan(Base):
    """학습 계획 (관리자가 설정)"""
    __tablename__ = 'learning_plans'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)  # "Instagram Reels (KR)"
    description = Column(String)
    source_name = Column(String, nullable=False)  # DATA_SOURCES의 키
    schedule = Column(String, nullable=False)  # "0 9 * * *" (매일 오전 9시)
    enabled = Column(Boolean, default=True)
    filters = Column(JSON)  # 추가 필터
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

# 예시
learning_plan = LearningPlan(
    id='plan-ig-reels-kr',
    name='Instagram Reels (KR) - Daily',
    description='한국 시장 인스타그램 릴스 최근 7일 CTR > 5% 게시물 수집',
    source_name='meta_ad_library',
    schedule='0 9 * * *',  # 매일 오전 9시
    enabled=True,
    filters={
        'ad_reached_countries': ['KR'],
        'impressions_min': 10000,
        'ctr_min': 5.0
    }
)
```

---

## Stage 2: Cleaner & Normalizer (데이터 정제)

### 역할

수집한 원시 데이터를 **정제하고 정규화**하여 패턴 추출에 적합한 형태로 변환합니다.

### 처리 과정

```python
# backend/app/trend_engine/cleaner.py

from typing import List
from models.trend import RawTrendData, CleanedTrendData
from PIL import Image
import requests
from io import BytesIO

class TrendCleaner:
    """데이터 정제기"""

    def clean_raw_data(self, raw_data: RawTrendData) -> CleanedTrendData:
        """원시 데이터 정제"""

        # 1. 이미지 다운로드 및 분석
        image_analysis = self.analyze_image(raw_data.raw_content.get('thumbnail_url'))

        # 2. 텍스트 정제
        clean_text = self.clean_text(raw_data.raw_content.get('body', ''))

        # 3. 레이아웃 분석
        layout_info = self.analyze_layout(image_analysis)

        # 4. CleanedTrendData 생성
        cleaned_data = CleanedTrendData(
            raw_data_id=raw_data.id,
            market=raw_data.market,
            channel=raw_data.channel,
            format=raw_data.format,

            # 이미지 정보
            image_url=raw_data.raw_content.get('thumbnail_url'),
            image_width=image_analysis['width'],
            image_height=image_analysis['height'],
            dominant_colors=image_analysis['dominant_colors'],

            # 텍스트 정보
            text_content=clean_text,
            text_length=len(clean_text),
            has_emoji=self.detect_emoji(clean_text),

            # 레이아웃 정보
            layout_type=layout_info['type'],  # 'left-image-right-text', 'hero-center', etc.
            text_position=layout_info['text_position'],  # 'top', 'bottom', 'left', 'right'
            text_area_ratio=layout_info['text_area_ratio'],  # 0.3 (30%)

            # 메타데이터
            source_url=raw_data.source_url,
            cleaned_at=datetime.utcnow()
        )

        return cleaned_data

    def analyze_image(self, image_url: str) -> dict:
        """이미지 다운로드 및 분석"""
        try:
            response = requests.get(image_url)
            img = Image.open(BytesIO(response.content))

            # 크기
            width, height = img.size

            # 주요 색상 추출 (K-means clustering)
            pixels = np.array(img.convert('RGB'))
            pixels = pixels.reshape(-1, 3)

            kmeans = KMeans(n_clusters=5, random_state=42)
            kmeans.fit(pixels)
            dominant_colors = kmeans.cluster_centers_.astype(int).tolist()

            # MinIO에 저장
            img_bytes = BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)

            minio_client.put_object(
                bucket_name='trend-images',
                object_name=f"{uuid.uuid4()}.jpg",
                data=img_bytes,
                length=img_bytes.getbuffer().nbytes,
                content_type='image/jpeg'
            )

            return {
                'width': width,
                'height': height,
                'aspect_ratio': width / height,
                'dominant_colors': dominant_colors
            }

        except Exception as e:
            print(f"Image analysis failed: {e}")
            return {}

    def analyze_layout(self, image_analysis: dict) -> dict:
        """레이아웃 타입 분석"""
        aspect_ratio = image_analysis.get('aspect_ratio', 1.0)

        # 간단한 휴리스틱 (실제로는 CV 모델 사용)
        if aspect_ratio > 1.5:  # 가로로 긴 이미지
            return {
                'type': 'left-image-right-text',
                'text_position': 'right',
                'text_area_ratio': 0.4
            }
        elif aspect_ratio < 0.7:  # 세로로 긴 이미지
            return {
                'type': 'top-image-bottom-text',
                'text_position': 'bottom',
                'text_area_ratio': 0.3
            }
        else:  # 정사각형 근처
            return {
                'type': 'hero-center',
                'text_position': 'center',
                'text_area_ratio': 0.2
            }

    def clean_text(self, text: str) -> str:
        """텍스트 정제"""
        # HTML 태그 제거
        text = re.sub(r'<[^>]+>', '', text)
        # 불필요한 공백 제거
        text = ' '.join(text.split())
        # 특수문자 정리 (이모지는 유지)
        return text.strip()

    def detect_emoji(self, text: str) -> bool:
        """이모지 포함 여부 감지"""
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "]+", flags=re.UNICODE
        )
        return bool(emoji_pattern.search(text))
```

---

## Stage 3: Pattern Miner (패턴 추출)

### 역할

정제된 데이터로부터 **성공 패턴**을 추출하여 `TrendPattern` 객체를 생성합니다.

### 패턴 추출 알고리즘

```python
# backend/app/trend_engine/pattern_miner.py

from typing import List
from models.trend import CleanedTrendData, TrendPattern
from sklearn.cluster import DBSCAN
from collections import Counter

class PatternMiner:
    """패턴 추출 엔진"""

    def mine_patterns(
        self,
        cleaned_data_list: List[CleanedTrendData],
        market: str,
        channel: str,
        format: str
    ) -> List[TrendPattern]:
        """패턴 추출 실행"""

        # 1. 레이아웃 타입별 그룹화
        layout_groups = self.group_by_layout(cleaned_data_list)

        # 2. 각 그룹에서 패턴 추출
        patterns = []
        for layout_type, group_data in layout_groups.items():
            if len(group_data) < 10:  # 최소 10개 샘플 필요
                continue

            pattern = self.extract_pattern(
                layout_type=layout_type,
                data_list=group_data,
                market=market,
                channel=channel,
                format=format
            )
            patterns.append(pattern)

        # 3. 인기도 점수 계산
        patterns = self.calculate_popularity(patterns)

        return patterns

    def group_by_layout(self, data_list: List[CleanedTrendData]) -> dict:
        """레이아웃 타입별 그룹화"""
        groups = {}
        for data in data_list:
            layout_type = data.layout_type
            if layout_type not in groups:
                groups[layout_type] = []
            groups[layout_type].append(data)
        return groups

    def extract_pattern(
        self,
        layout_type: str,
        data_list: List[CleanedTrendData],
        market: str,
        channel: str,
        format: str
    ) -> TrendPattern:
        """단일 패턴 추출"""

        # 평균 메트릭 계산
        avg_text_area_ratio = np.mean([d.text_area_ratio for d in data_list])
        avg_image_aspect_ratio = np.mean([d.image_width / d.image_height for d in data_list])

        # 주요 색상 추출 (가장 많이 사용된 색상)
        all_colors = []
        for d in data_list:
            all_colors.extend(d.dominant_colors or [])

        # 레이아웃 구조 추론
        layout_structure = self.infer_layout_structure(data_list)

        # 샘플 소스 수집
        sample_sources = [d.source_url for d in data_list[:10]]  # 상위 10개

        # TrendPattern 생성
        pattern = TrendPattern(
            id=f"trend-{channel}-{market}-{layout_type}-{datetime.utcnow().strftime('%Y%m')}",
            name=f"{channel.title()} {format.title()} - {layout_type.replace('-', ' ').title()} ({market.upper()} {datetime.utcnow().strftime('%Y-%m')})",
            market=market,
            channel=channel,
            format=format,
            layout_pattern=layout_type,
            layout_structure=layout_structure,
            popularity_score=0,  # 나중에 계산
            performance_metrics={
                'avgCtr': None,  # 실제 성과 데이터는 Publishing 후 수집
                'avgEngagement': None,
                'sampleSize': len(data_list)
            },
            sample_sources=sample_sources,
            collected_at=datetime.utcnow(),
            valid_until=datetime.utcnow() + timedelta(days=90),  # 3개월 유효
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        return pattern

    def infer_layout_structure(self, data_list: List[CleanedTrendData]) -> dict:
        """레이아웃 구조 추론"""
        # 통계 기반 구조 추론
        text_positions = Counter([d.text_position for d in data_list])
        most_common_position = text_positions.most_common(1)[0][0]

        # ObjectRole 매핑 (휴리스틱)
        sections = []

        if 'image' in data_list[0].layout_type:
            sections.append({
                'role': 'product-image',
                'position': 'left' if 'left' in data_list[0].layout_type else 'top',
                'sizeRatio': 0.5
            })

        sections.append({
            'role': 'headline',
            'position': most_common_position,
            'sizeRatio': 0.3
        })

        sections.append({
            'role': 'cta-button',
            'position': 'bottom',
            'sizeRatio': 0.2
        })

        return {'sections': sections}

    def calculate_popularity(self, patterns: List[TrendPattern]) -> List[TrendPattern]:
        """인기도 점수 계산"""
        # 샘플 크기 기반 점수 (로그 스케일)
        max_sample_size = max([p.performance_metrics.get('sampleSize', 0) for p in patterns])

        for pattern in patterns:
            sample_size = pattern.performance_metrics.get('sampleSize', 0)
            # 로그 스케일 점수 (0-100)
            if sample_size > 0:
                score = min(100, int(math.log(sample_size + 1) / math.log(max_sample_size + 1) * 100))
                pattern.popularity_score = score
            else:
                pattern.popularity_score = 0

        return patterns
```

---

## Stage 4: Template Generator (템플릿 생성)

### 역할

`TrendPattern`을 기반으로 실제 사용 가능한 `TemplateDefinition` (EditorDocument)을 생성합니다.

### 템플릿 생성 로직

```python
# backend/app/trend_engine/template_generator.py

from typing import List
from models.trend import TrendPattern
from models.editor import TemplateDefinition, EditorPage, EditorObject

class TemplateGenerator:
    """템플릿 자동 생성기"""

    def generate_template(
        self,
        pattern: TrendPattern,
        brand_tokens: Optional[DesignTokens] = None
    ) -> TemplateDefinition:
        """TrendPattern → TemplateDefinition 변환"""

        # 1. 페이지 생성
        page = self.create_page_from_pattern(pattern)

        # 2. 브랜드 토큰 적용 (옵션)
        if brand_tokens:
            page = self.apply_brand_tokens(page, brand_tokens)

        # 3. TemplateDefinition 생성
        template = TemplateDefinition(
            id=f"tpl-{pattern.id}",
            name=pattern.name,
            description=f"트렌드 기반 자동 생성 템플릿 (인기도: {pattern.popularity_score}/100)",
            category=self.map_channel_to_category(pattern.channel),
            tags=[pattern.channel, pattern.format, pattern.market, pattern.layout_pattern],

            mode=self.map_channel_to_mode(pattern.channel),
            pages=[page],
            tokens=brand_tokens,

            # 트렌드 연동
            trend_pattern=pattern,
            popularity_score=pattern.popularity_score,
            performance_metrics={
                'avgCtr': pattern.performance_metrics.get('avgCtr'),
                'avgCvr': pattern.performance_metrics.get('avgCvr'),
                'usageCount': 0
            },

            thumbnail=None,  # 나중에 렌더링
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by='system'
        )

        return template

    def create_page_from_pattern(self, pattern: TrendPattern) -> EditorPage:
        """패턴으로부터 EditorPage 생성"""

        # 페이지 크기 결정
        page_size = self.get_page_size(pattern.channel, pattern.format)

        # 객체 생성
        objects = []
        for section in pattern.layout_structure.get('sections', []):
            obj = self.create_object_from_section(section, page_size)
            objects.append(obj)

        # EditorPage 생성
        page = EditorPage(
            id=f"page-{uuid.uuid4()}",
            name=f"{pattern.channel.title()} {pattern.format.title()}",
            kind='ad' if 'ad' in pattern.channel else 'social',
            width=page_size['width'],
            height=page_size['height'],
            objects=objects,
            background={'type': 'color', 'color': '#FFFFFF'}
        )

        return page

    def create_object_from_section(self, section: dict, page_size: dict) -> EditorObject:
        """섹션 정보 → EditorObject 변환"""
        role = section['role']
        position = section['position']
        size_ratio = section['sizeRatio']

        # 위치 계산
        x, y, width, height = self.calculate_bounds(
            position, size_ratio, page_size['width'], page_size['height']
        )

        # ObjectRole에 따라 객체 타입 결정
        if role in ['headline', 'subheadline', 'body', 'caption', 'price', 'cta-text']:
            return TextObject(
                id=f"obj-{uuid.uuid4()}",
                type='text',
                role=role,
                source={'kind': 'auto-generated', 'trendId': pattern.id},
                name=role.replace('-', ' ').title(),
                x=x,
                y=y,
                width=width,
                height=height,
                rotation=0,
                opacity=1.0,
                visible=True,
                locked=False,

                text=f"{{{{{role}}}}}",  # 플레이스홀더
                fontSize=self.get_default_font_size(role),
                fontFamily='Pretendard',
                fontWeight='bold' if role == 'headline' else 'normal',
                textAlign='left',
                fill='#000000'
            )

        elif role in ['product-image', 'hero-image', 'logo', 'icon']:
            return ImageObject(
                id=f"obj-{uuid.uuid4()}",
                type='image',
                role=role,
                source={'kind': 'auto-generated', 'trendId': pattern.id},
                name=role.replace('-', ' ').title(),
                x=x,
                y=y,
                width=width,
                height=height,
                rotation=0,
                opacity=1.0,
                visible=True,
                locked=False,

                src='placeholder.jpg',
                fit='cover',
                placeholder=True
            )

        elif role in ['cta-button', 'badge']:
            return ShapeObject(
                id=f"obj-{uuid.uuid4()}",
                type='shape',
                role=role,
                source={'kind': 'auto-generated', 'trendId': pattern.id},
                name=role.replace('-', ' ').title(),
                x=x,
                y=y,
                width=width,
                height=height,
                rotation=0,
                opacity=1.0,
                visible=True,
                locked=False,

                shapeType='rect',
                fill='#FF5733',
                cornerRadius=8
            )

        else:
            # 기본 도형
            return ShapeObject(...)

    def calculate_bounds(self, position: str, size_ratio: float, page_width: int, page_height: int) -> tuple:
        """위치 문자열 → 실제 좌표 변환"""
        if position == 'left':
            return (0, 0, int(page_width * size_ratio), page_height)
        elif position == 'right':
            width = int(page_width * size_ratio)
            return (page_width - width, 0, width, page_height)
        elif position == 'top':
            height = int(page_height * size_ratio)
            return (0, 0, page_width, height)
        elif position == 'bottom':
            height = int(page_height * size_ratio)
            return (0, page_height - height, page_width, height)
        elif position == 'center':
            width = int(page_width * size_ratio)
            height = int(page_height * size_ratio)
            x = (page_width - width) // 2
            y = (page_height - height) // 2
            return (x, y, width, height)
        else:
            return (0, 0, 100, 100)

    def get_page_size(self, channel: str, format: str) -> dict:
        """채널/포맷 → 페이지 크기 매핑"""
        PAGE_SIZES = {
            ('instagram', 'feed'): {'width': 1080, 'height': 1080},
            ('instagram', 'story'): {'width': 1080, 'height': 1920},
            ('instagram', 'reels'): {'width': 1080, 'height': 1920},
            ('tiktok', 'short'): {'width': 1080, 'height': 1920},
            ('facebook', 'feed'): {'width': 1200, 'height': 630},
        }
        return PAGE_SIZES.get((channel, format), {'width': 1080, 'height': 1350})

    def get_default_font_size(self, role: str) -> int:
        """역할 → 기본 폰트 크기 매핑"""
        FONT_SIZES = {
            'headline': 48,
            'subheadline': 32,
            'body': 16,
            'caption': 14,
            'price': 36,
            'cta-text': 20
        }
        return FONT_SIZES.get(role, 16)
```

---

## Stage 5: Exporter (API 제공)

### API 엔드포인트: `/api/v1/templates/auto-generate`

```python
# backend/app/api/v1/templates.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from models.editor import EditorDocument, TemplateDefinition

router = APIRouter()

class AutoGenerateRequest(BaseModel):
    brandId: str
    contentType: str  # 'instagram-story', 'product-detail', etc.
    market: str  # 'kr', 'us', 'jp', 'global'
    count: int = 5  # 생성할 변형 수
    trendPreference: str = 'medium'  # 'high', 'medium', 'low'

class AutoGenerateResponse(BaseModel):
    documents: List[EditorDocument]
    templates_used: List[str]  # 사용된 템플릿 ID
    generation_time: float

@router.post('/auto-generate', response_model=AutoGenerateResponse)
async def auto_generate_templates(request: AutoGenerateRequest):
    """
    트렌드 기반 템플릿 자동 생성 API

    **플로우**:
    1. 브랜드 정보 로드 (DesignTokens)
    2. 트렌드 패턴 조회 (market, channel, trendPreference 기준)
    3. 상위 N개 패턴으로 템플릿 생성
    4. 각 템플릿을 EditorDocument로 변환
    5. 브랜드 토큰 적용
    """
    start_time = time.time()

    # 1. 브랜드 정보 로드
    brand = db.query(Brand).filter(Brand.id == request.brandId).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand_tokens = brand.design_tokens

    # 2. contentType → (channel, format) 매핑
    channel, format = parse_content_type(request.contentType)

    # 3. 트렌드 패턴 조회 (인기도 순)
    trend_patterns = db.query(TrendPattern).filter(
        TrendPattern.market == request.market,
        TrendPattern.channel == channel,
        TrendPattern.format == format
    ).order_by(TrendPattern.popularity_score.desc()).limit(request.count).all()

    if not trend_patterns:
        raise HTTPException(status_code=404, detail="No trend patterns found")

    # 4. 각 패턴으로 템플릿 생성
    generator = TemplateGenerator()
    documents = []
    template_ids = []

    for i, pattern in enumerate(trend_patterns):
        # TemplateDefinition 생성
        template = generator.generate_template(pattern, brand_tokens)

        # EditorDocument로 변환
        doc = EditorDocument(
            id=f"doc-{uuid.uuid4()}",
            title=f"{request.contentType.replace('-', ' ').title()} - Variant {i+1}",
            mode=template.mode,
            brandId=request.brandId,
            pages=template.pages,
            tokens=brand_tokens,
            createdAt=datetime.utcnow().isoformat(),
            updatedAt=datetime.utcnow().isoformat(),
            source={
                'kind': 'auto-generated',
                'sourceId': template.id
            },

            # 서비스 레벨 필드
            templateId=template.id,
            trendSnapshotId=pattern.id,
            variantId=f"variant-{i+1}"
        )

        documents.append(doc)
        template_ids.append(template.id)

    generation_time = time.time() - start_time

    return AutoGenerateResponse(
        documents=documents,
        templates_used=template_ids,
        generation_time=generation_time
    )

def parse_content_type(content_type: str) -> tuple:
    """contentType 문자열 → (channel, format) 파싱"""
    CONTENT_TYPE_MAP = {
        'instagram-feed': ('instagram', 'feed'),
        'instagram-story': ('instagram', 'story'),
        'instagram-reels': ('instagram', 'reels'),
        'tiktok-short': ('tiktok', 'short'),
        'facebook-feed': ('facebook', 'feed'),
        'product-detail': ('blog', 'section'),  # E-commerce
    }
    return CONTENT_TYPE_MAP.get(content_type, ('instagram', 'feed'))
```

### 사용 예시

```typescript
// Frontend: Auto Template 생성 요청

const response = await fetch('/api/v1/templates/auto-generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brandId: 'nike-kr',
    contentType: 'instagram-story',
    market: 'kr',
    count: 5,
    trendPreference: 'high'
  })
});

const data = await response.json();
// data.documents = EditorDocument[] (5개 변형)

// Editor에 로드
useEditorStore.getState().loadDocument(data.documents[0]);
```

---

## Learning Plan 관리

### 관리자 대시보드

```python
# backend/app/api/v1/admin/learning_plans.py

@router.get('/learning-plans')
async def list_learning_plans():
    """Learning Plan 목록 조회"""
    plans = db.query(LearningPlan).all()
    return plans

@router.post('/learning-plans')
async def create_learning_plan(plan: LearningPlanCreate):
    """새 Learning Plan 생성"""
    new_plan = LearningPlan(**plan.dict())
    db.add(new_plan)
    db.commit()

    # Celery Beat 스케줄 등록
    register_celery_schedule(new_plan)

    return new_plan

@router.put('/learning-plans/{plan_id}/toggle')
async def toggle_learning_plan(plan_id: str):
    """Learning Plan 활성화/비활성화"""
    plan = db.query(LearningPlan).filter(LearningPlan.id == plan_id).first()
    plan.enabled = not plan.enabled
    db.commit()
    return plan

def register_celery_schedule(plan: LearningPlan):
    """Celery Beat 스케줄 동적 등록"""
    from celery.schedules import crontab

    celery_app.conf.beat_schedule[f"collect-{plan.id}"] = {
        'task': 'app.trend_engine.collector.collect_trend_data',
        'schedule': crontab(*plan.schedule.split()),  # '0 9 * * *' → crontab(0, 9)
        'args': (plan.source_name,)
    }
```

---

## 성능 최적화

### 1. 배치 처리

```python
# 한 번에 100개씩 배치 처리
BATCH_SIZE = 100

@celery_app.task
def process_cleaned_data_batch(cleaned_data_ids: List[str]):
    """CleanedData → TrendPattern 배치 추출"""
    data_list = db.query(CleanedTrendData).filter(
        CleanedTrendData.id.in_(cleaned_data_ids)
    ).all()

    pattern_miner = PatternMiner()
    patterns = pattern_miner.mine_patterns(data_list, 'kr', 'instagram', 'feed')

    for pattern in patterns:
        db.add(pattern)

    db.commit()
```

### 2. 캐싱

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_top_trend_patterns(market: str, channel: str, format: str, limit: int = 10) -> List[TrendPattern]:
    """인기 트렌드 패턴 캐싱 (1시간)"""
    return db.query(TrendPattern).filter(
        TrendPattern.market == market,
        TrendPattern.channel == channel,
        TrendPattern.format == format
    ).order_by(TrendPattern.popularity_score.desc()).limit(limit).all()
```

### 3. 비동기 처리

```python
# 크롤링은 비동기로 병렬 실행
async def collect_all_sources():
    tasks = []
    for source_name in DATA_SOURCES.keys():
        task = collector.run_collection(source_name)
        tasks.append(task)

    results = await asyncio.gather(*tasks)
    return results
```

---

**문서 버전**: v3.0.0
**마지막 업데이트**: 2025-11-19
