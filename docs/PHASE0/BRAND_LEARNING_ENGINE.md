# Brand Learning Engine 설계서

> **Version**: 2.0
> **Date**: 2025-01-13
> **Status**: Final
> **Owner**: AI/ML Team

---

## 1. Overview

**Brand Learning Engine**은 Sparklio.ai의 자가 학습(Self-Learning) 중심 모듈로서, 브랜드 데이터·사용자 입력·반응 데이터(SNS/광고 성과)를 통해 **브랜드 전용 AI 모델을 점점 정교하게 만드는 시스템**입니다.

### 1.1 핵심 목표

이 엔진은 다음 세 가지 목표를 가집니다:

1. **브랜드 톤·스타일·카피·이미지 일관성 유지**
2. **콘텐츠의 반응/성과 기반 자동 최적화**
3. **장기적으로 브랜드 맞춤형 생성 모델 자동 구축**

### 1.2 차별화 포인트

- **쓰면 쓸수록 브랜드와 닮아감**: 사용자의 수정 패턴을 학습하여 점점 더 정확한 초안 생성
- **성과 기반 진화**: SNS 인게이지먼트 데이터를 분석하여 고성과 패턴 자동 강화
- **투명한 학습**: 사용자 승인 기반 Opt-in 방식, 재학습 알림 제공

---

## 2. Core Architecture

Brand Learning Engine은 아래 **5개 서브 모듈**로 구성됩니다:

```
┌─────────────────────────────────────────────────────────────────┐
│                   Brand Learning Engine                          │
└─────────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Brand Intake   │  │ Brand Style    │  │ Self-Learning  │
│ Module         │  │ Extractor      │  │ Loop           │
└────────────────┘  └────────────────┘  └────────────────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │   Learning Orchestrator             │
         │   (데이터 통합 + 재학습 트리거)       │
         └─────────────────────────────────────┘
                  │                  │
                  ▼                  ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ Performance      │    │ Prompt           │
    │ Analyzer         │    │ Optimization     │
    └──────────────────┘    └──────────────────┘
                  │                  │
                  └────────┬─────────┘
                           ▼
                 ┌──────────────────┐
                 │ Style Model      │
                 │ Builder (LoRA)   │
                 └──────────────────┘
```

### 2.1 주요 컴포넌트

| 컴포넌트 | 역할 | 기술 스택 |
|---------|------|----------|
| **Brand Intake Module** | 사용자 업로드 자료 분석 (PDF/PPT/이미지/영상) | PyMuPDF, python-pptx, Playwright, OCR |
| **Brand Style Extractor** | 톤·컬러·레이아웃·단어 패턴 추출 | CLIP, SigLIP, LLM Embedding, K-means |
| **Self-Learning Loop** | 피드백 → 평가 → 업데이트 → 재학습 반복 | PostgreSQL, Redis, Celery |
| **Performance Analyzer** | SNS/광고 성과 자동 수집 및 분석 | Instagram API, Facebook API, Celery Beat |
| **Prompt Optimization Engine** | 프롬프트 자동 개선 및 A/B 테스트 | LangChain, DSPy, scipy (통계) |
| **Style Model Builder** | 브랜드별 LoRA 모델 훈련 | PyTorch, Diffusers, PEFT |

---

## 3. Brand Intake Module

### 3.1 개요

사용자가 업로드한 자료를 자동으로 분석하여 **Brand Kit**을 생성·업데이트합니다.

### 3.2 지원 파일 형식

```python
SUPPORTED_FORMATS = {
    'documents': ['.pdf', '.docx', '.pptx', '.txt', '.md'],
    'images': ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
    'videos': ['.mp4', '.mov', '.avi', '.webm'],
    'spreadsheets': ['.xlsx', '.csv'],
    'archives': ['.zip']
}
```

### 3.3 처리 단계

1. **OCR / Caption Extraction**: 텍스트 추출
2. **Layout Structure Parsing**: 문서 구조 분석 (제목, 본문, 리스트 등)
3. **색상/폰트 자동 추출**: K-means 클러스터링으로 주요 색상 추출, CSS font-family 감지
4. **텍스트 의미 분석**: LLM으로 Key Message, 톤·매너 추출
5. **메타데이터 생성**: brand_kit.json 저장

### 3.4 결과물 (JSON)

```json
{
  "brand_id": "brand_12345",
  "brand_keywords": ["프리미엄", "자연", "감성"],
  "tone": {
    "warm": true,
    "formal": false,
    "emotional": true
  },
  "palette": {
    "primary": "#F2EDE8",
    "secondary": "#7C4D3A",
    "accent": "#D4AF37"
  },
  "fonts": {
    "heading": "Montserrat",
    "body": "Noto Sans KR"
  },
  "preferred_phrases": ["자연 그대로", "균형 잡힌", "프리미엄 경험"],
  "layout_patterns": ["center-align", "large-heading", "minimal"]
}
```

### 3.5 구현 코드

```python
# backend/brand_learning/intake_module.py

from typing import Dict, List, Any
from pathlib import Path
import fitz  # PyMuPDF

class BrandIntakeModule:
    """
    사용자 업로드 자료 자동 분석
    """

    def __init__(self, brand_id: str):
        self.brand_id = brand_id
        self.parsers = {
            'pdf': self._parse_pdf,
            'pptx': self._parse_pptx,
            'docx': self._parse_docx,
            'image': self._parse_image,
            'video': self._parse_video
        }

    async def process_upload(self, file_path: Path) -> Dict[str, Any]:
        """
        업로드된 파일 자동 처리

        Args:
            file_path: 업로드된 파일 경로

        Returns:
            추출된 브랜드 데이터
        """
        file_type = self._detect_file_type(file_path)
        parser = self.parsers.get(file_type)

        if not parser:
            raise ValueError(f"지원하지 않는 파일 형식: {file_path.suffix}")

        # 파일 파싱
        parsed_data = await parser(file_path)

        # Brand Kit 업데이트
        await self._update_brand_kit(parsed_data)

        # RAG 임베딩 생성
        await self._create_embeddings(parsed_data)

        return parsed_data

    async def _parse_pdf(self, file_path: Path) -> Dict[str, Any]:
        """PDF 파일에서 텍스트, 이미지, 메타데이터 추출"""
        result = {
            'type': 'pdf',
            'text': [],
            'images': [],
            'colors': [],
            'fonts': [],
            'metadata': {}
        }

        doc = fitz.open(file_path)

        for page_num, page in enumerate(doc):
            # 텍스트 추출
            text = page.get_text()
            result['text'].append({
                'page': page_num + 1,
                'content': text
            })

            # 이미지 추출
            image_list = page.get_images()
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                result['images'].append({
                    'page': page_num + 1,
                    'data': base_image['image'],
                    'ext': base_image['ext']
                })

            # 폰트 정보 추출
            fonts = page.get_fonts()
            for font in fonts:
                result['fonts'].append({
                    'name': font[3],
                    'type': font[1]
                })

        result['metadata'] = doc.metadata

        return result

    async def _parse_image(self, file_path: Path) -> Dict[str, Any]:
        """이미지에서 색상, 스타일 분석"""
        from PIL import Image
        from sklearn.cluster import KMeans
        import numpy as np

        img = Image.open(file_path)

        # Dominant Color 추출 (K-means)
        img_resized = img.resize((150, 150))
        img_array = np.array(img_resized)
        pixels = img_array.reshape(-1, 3)

        kmeans = KMeans(n_clusters=5, random_state=42)
        kmeans.fit(pixels)

        colors = []
        for color in kmeans.cluster_centers_:
            hex_color = '#{:02x}{:02x}{:02x}'.format(
                int(color[0]), int(color[1]), int(color[2])
            )
            colors.append(hex_color)

        # Vision API로 스타일 분석
        style_analysis = await self._analyze_image_style(file_path)

        return {
            'type': 'image',
            'colors': colors,
            'style': style_analysis,
            'dimensions': img.size
        }

    async def _analyze_image_style(self, file_path: Path) -> Dict[str, Any]:
        """Vision API로 이미지 스타일 분석"""
        from app.llm.vision_client import VisionClient

        vision = VisionClient()

        analysis = await vision.analyze_image(
            image_path=str(file_path),
            prompt="""
            이 이미지의 스타일을 분석해주세요:
            1. 전체적인 톤 (밝음/어두움, 채도, 대비)
            2. 디자인 스타일 (미니멀/복잡, 모던/클래식 등)
            3. 주요 색상 조합
            4. 타겟 오디언스 추정

            JSON 형식으로 반환:
            {
                "tone": "warm/bright",
                "style": "minimal/modern",
                "color_mood": "calm/energetic",
                "target_audience": "20-30대 여성"
            }
            """
        )

        return analysis

    async def _update_brand_kit(self, parsed_data: Dict[str, Any]):
        """파싱된 데이터로 Brand Kit 업데이트"""
        from app.db.models import BrandKit

        brand_kit = await BrandKit.get_or_create(brand_id=self.brand_id)

        # 색상 병합
        if 'colors' in parsed_data:
            brand_kit.colors = self._merge_colors(
                brand_kit.colors, parsed_data['colors']
            )

        # 폰트 병합
        if 'fonts' in parsed_data:
            brand_kit.fonts = self._merge_fonts(
                brand_kit.fonts, parsed_data['fonts']
            )

        # 톤·매너 업데이트
        if 'style' in parsed_data:
            brand_kit.tone_manner = self._update_tone(
                brand_kit.tone_manner, parsed_data['style']
            )

        await brand_kit.save()
```

---

## 4. Brand Style Extractor

### 4.1 개요

텍스트/이미지/레이아웃의 인사이트를 추출하여 **Brand Style Vector**를 생성합니다.

### 4.2 추출 항목

#### 4.2.1 Text

- **톤앤매너**: 격식/캐주얼, 감성/이성, 따뜻함/차가움
- **문장 구조**: 평균 문장 길이, 단/복문 비율, 접속사 사용 패턴
- **CTA 유형**: "지금 구매", "자세히 보기", "문의하기" 등 선호 CTA
- **주로 쓰는 단어**: TF-IDF로 브랜드 고유 키워드 추출

#### 4.2.2 Image

- **색상**: 주요 색상, 채도, 명도, 색상 조화
- **구도**: 센터/좌우정렬, 여백 비율, 피사체 위치
- **배경**: 단색/그라데이션/패턴/사진
- **질감**: 매끈함/거친 질감, 광택/무광
- **피사체 스타일**: 사람/제품/추상, 클로즈업/전경

#### 4.2.3 Presentation / Brochure

- **그리드 패턴**: 1컬럼/2컬럼/그리드, 대칭/비대칭
- **Heading/Subheading 계층**: 폰트 크기 비율, 간격
- **아이콘/일러스트 사용**: 라인/실루엣/컬러, 스타일 일관성

#### 4.2.4 Video

- **장면 분위기**: 밝기, 감정(긍정/중립/강렬), 속도(빠름/느림)
- **컷 스타일**: 정적/동적, 트랜지션 유형
- **자막 스타일**: 위치, 폰트, 애니메이션

### 4.3 Embedding 기반 벡터화

```python
# backend/brand_learning/style_extractor.py

from typing import Dict, List, Any
import torch
from transformers import CLIPModel, CLIPProcessor

class BrandStyleExtractor:
    """
    브랜드 스타일 패턴 추출 및 벡터화
    """

    def __init__(self):
        # CLIP 모델 로드 (이미지 임베딩)
        self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

        # 텍스트 임베딩 모델
        from sentence_transformers import SentenceTransformer
        self.text_embedder = SentenceTransformer('all-MiniLM-L6-v2')

    async def extract_text_style(self, texts: List[str]) -> Dict[str, Any]:
        """텍스트 스타일 분석"""
        # 1. 톤 분석
        tone = self._analyze_tone(texts)

        # 2. 문장 구조 분석
        structure = self._analyze_structure(texts)

        # 3. 키워드 추출
        keywords = self._extract_keywords(texts)

        # 4. 임베딩 생성
        embeddings = self.text_embedder.encode(texts)

        return {
            'tone': tone,
            'structure': structure,
            'keywords': keywords,
            'embeddings': embeddings.tolist()
        }

    def _analyze_tone(self, texts: List[str]) -> Dict[str, Any]:
        """톤 분석 (격식/캐주얼, 감성/이성 등)"""
        # 존댓말 패턴
        formal_patterns = ['습니다', '입니다', '해요', '합니다']
        informal_patterns = ['해', '야', '임', '다']

        # 감성 단어
        emotional_words = ['사랑', '행복', '따뜻', '감동', '설렘', '기쁨']
        rational_words = ['효과', '기능', '성능', '효율', '검증', '데이터']

        all_text = ' '.join(texts)

        formal_score = sum(1 for p in formal_patterns if p in all_text)
        informal_score = sum(1 for p in informal_patterns if p in all_text)

        emotional_score = sum(1 for w in emotional_words if w in all_text)
        rational_score = sum(1 for w in rational_words if w in all_text)

        return {
            'formality': 'formal' if formal_score > informal_score else 'casual',
            'emotion_ratio': emotional_score / (emotional_score + rational_score + 1)
        }

    async def extract_image_style(self, image_paths: List[str]) -> Dict[str, Any]:
        """이미지 스타일 분석"""
        from PIL import Image

        styles = []

        for img_path in image_paths:
            img = Image.open(img_path)

            # CLIP 임베딩
            inputs = self.clip_processor(images=img, return_tensors="pt")
            with torch.no_grad():
                embedding = self.clip_model.get_image_features(**inputs)

            # 색상 분석
            colors = self._extract_colors(img)

            # 구도 분석
            composition = self._analyze_composition(img)

            styles.append({
                'embedding': embedding.squeeze().tolist(),
                'colors': colors,
                'composition': composition
            })

        return {
            'styles': styles,
            'average_embedding': self._average_embeddings([s['embedding'] for s in styles])
        }

    def _extract_colors(self, img: Image.Image) -> Dict[str, Any]:
        """색상 추출 및 분석"""
        from sklearn.cluster import KMeans
        import numpy as np

        img_resized = img.resize((150, 150))
        img_array = np.array(img_resized)
        pixels = img_array.reshape(-1, 3)

        kmeans = KMeans(n_clusters=5, random_state=42)
        kmeans.fit(pixels)

        colors = []
        for color in kmeans.cluster_centers_:
            hex_color = '#{:02x}{:02x}{:02x}'.format(
                int(color[0]), int(color[1]), int(color[2])
            )
            colors.append(hex_color)

        # 채도·명도 계산
        hsv = img.convert('HSV')
        hsv_array = np.array(hsv)
        saturation_avg = np.mean(hsv_array[:, :, 1])
        value_avg = np.mean(hsv_array[:, :, 2])

        return {
            'dominant_colors': colors,
            'saturation': saturation_avg / 255.0,
            'brightness': value_avg / 255.0
        }

    async def create_brand_style_vector(
        self,
        brand_id: str,
        text_styles: Dict[str, Any],
        image_styles: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Brand Style Vector 생성"""
        import numpy as np

        # 텍스트 + 이미지 임베딩 결합
        text_emb = np.array(text_styles['embeddings'])
        image_emb = np.array(image_styles['average_embedding'])

        # 평균 임베딩
        combined_emb = np.concatenate([
            text_emb.mean(axis=0),
            image_emb
        ])

        # Brand Style Vector 저장
        brand_vector = {
            'brand_id': brand_id,
            'text_tone': text_styles['tone'],
            'text_keywords': text_styles['keywords'],
            'image_colors': image_styles['styles'][0]['colors'] if image_styles['styles'] else [],
            'embedding': combined_emb.tolist()
        }

        await self._save_brand_vector(brand_vector)

        return brand_vector
```

### 4.4 출력

- **Brand Style Vector**: 768차원 임베딩 벡터
- **Brand Layout Pattern Map**: 레이아웃 선호도 매핑

---

## 5. Self-Learning Loop (Core)

### 5.1 개요

시스템의 **핵심 루프 구조**로, 입력 → 평가 → 업데이트 → 강화 과정을 반복합니다.

### 5.2 Loop 단계

#### Loop 단계 1 — Input

```yaml
입력 데이터:
  - 사용자 업로드 자료
  - AI 생성 콘텐츠 초안
  - 사용자 수정 이력 (Edit History)
  - SNS/광고 반응 데이터
```

#### Loop 단계 2 — Evaluate (Reviewer Agent)

AI가 다음 항목을 평가합니다:

```python
# backend/brand_learning/reviewer_agent.py

class ReviewerAgent:
    """
    생성물 품질 평가 에이전트
    """

    async def evaluate_content(
        self,
        content: Dict[str, Any],
        brand_kit: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        콘텐츠 품질 평가

        Returns:
            평가 점수 (0.0 ~ 1.0)
        """
        scores = {
            'tone_consistency': await self._evaluate_tone(content, brand_kit),
            'visual_consistency': await self._evaluate_visual(content, brand_kit),
            'style_alignment': await self._evaluate_style(content, brand_kit),
            'message_clarity': await self._evaluate_clarity(content),
            'cta_strength': await self._evaluate_cta(content)
        }

        # 가중 평균
        weights = {
            'tone_consistency': 0.25,
            'visual_consistency': 0.25,
            'style_alignment': 0.20,
            'message_clarity': 0.15,
            'cta_strength': 0.15
        }

        overall_score = sum(scores[k] * weights[k] for k in scores)

        return {
            'scores': scores,
            'overall': overall_score,
            'suggestions': await self._generate_suggestions(scores)
        }
```

점수 출력 예:

```json
{
  "scores": {
    "tone_consistency": 0.84,
    "visual_consistency": 0.78,
    "style_alignment": 0.81,
    "message_clarity": 0.89,
    "cta_strength": 0.76
  },
  "overall": 0.82,
  "suggestions": [
    "색상 팔레트를 브랜드 키트와 더 일치시켜주세요",
    "CTA 문구를 더 명확하게 수정해주세요"
  ]
}
```

#### Loop 단계 3 — Update

점수 기반으로 브랜드 스타일 업데이트:

```python
# backend/brand_learning/style_updater.py

class BrandStyleUpdater:
    """
    피드백 기반 브랜드 스타일 자동 업데이트
    """

    async def update_brand_style(
        self,
        brand_id: str,
        feedback: Dict[str, Any]
    ):
        """
        브랜드 스타일 업데이트

        Args:
            brand_id: 브랜드 ID
            feedback: Reviewer 평가 + 사용자 수정 이력
        """
        brand_kit = await self._get_brand_kit(brand_id)

        # 1. 브랜드 키워드 강화/약화
        if feedback['scores']['tone_consistency'] < 0.7:
            await self._adjust_keywords(brand_id, feedback['user_edits'])

        # 2. 선호 문장 패턴 업데이트
        if feedback['user_edits']:
            await self._update_sentence_patterns(brand_id, feedback['user_edits'])

        # 3. 이미지 생성 프롬프트 조정
        if feedback['scores']['visual_consistency'] < 0.7:
            await self._adjust_image_prompts(brand_id, feedback)

        # 4. 템플릿/레이아웃 가중치 변경
        await self._update_template_weights(brand_id, feedback)

    async def _adjust_keywords(
        self,
        brand_id: str,
        user_edits: List[Dict[str, Any]]
    ):
        """사용자 수정 패턴 기반 키워드 조정"""
        # 자주 추가된 단어 → 키워드 강화
        added_words = []
        removed_words = []

        for edit in user_edits:
            if edit['type'] == 'text':
                added_words.extend(edit['diff']['added_words'])
                removed_words.extend(edit['diff']['removed_words'])

        # 빈도 계산
        from collections import Counter
        added_freq = Counter(added_words)
        removed_freq = Counter(removed_words)

        brand_kit = await self._get_brand_kit(brand_id)

        # 키워드 가중치 업데이트
        for word, count in added_freq.most_common(10):
            if word in brand_kit['keywords']:
                brand_kit['keywords'][word]['weight'] += count * 0.1
            else:
                brand_kit['keywords'][word] = {'weight': count * 0.1}

        for word, count in removed_freq.most_common(10):
            if word in brand_kit['keywords']:
                brand_kit['keywords'][word]['weight'] -= count * 0.1

        await brand_kit.save()
```

#### Loop 단계 4 — Reinforce

업데이트된 Brand Style Vector는 **다음 생성물에 즉시 반영**됩니다.

```python
# backend/agents/copywriter_agent.py

class CopywriterAgent:
    """
    카피라이팅 에이전트
    """

    async def generate_copy(
        self,
        brief: Dict[str, Any],
        brand_id: str
    ) -> str:
        """
        카피 생성 (최신 Brand Style Vector 자동 반영)
        """
        # 최신 Brand Style Vector 로드
        brand_vector = await self._get_latest_brand_vector(brand_id)

        # 프롬프트에 브랜드 스타일 반영
        prompt = f"""
        다음 브랜드 가이드를 따라 카피를 작성해주세요:

        브랜드 톤: {brand_vector['text_tone']}
        핵심 키워드: {', '.join(brand_vector['text_keywords'])}
        선호 문장 패턴: {brand_vector['sentence_patterns']}

        브리프:
        {brief['description']}

        카피를 작성해주세요.
        """

        copy = await self.llm_client.generate(prompt)
        return copy
```

→ **Sparklio는 쓰면 쓸수록 사용자의 브랜드와 닮아갑니다.**

---

## 6. Performance Analyzer

### 6.1 개요

SNS 및 광고 성과 데이터를 자동으로 수집·분석하여 **성공 패턴**을 탐지합니다.

### 6.2 입력 데이터

```yaml
SNS 플랫폼:
  Instagram:
    - 좋아요, 저장, 댓글, 도달, 노출
    - 스토리 조회수, 링크 클릭
  Shorts/Reels:
    - 재생수, 평균 시청 유지율, 좋아요, 공유
  Facebook:
    - 반응(좋아요/하트/웃음), 댓글, 공유, 클릭

광고 플랫폼:
  Google Ads:
    - CTR, CPC, CPA, ROAS, 전환율
  Naver Ads:
    - CTR, CPC, 전환율
  Kakao Moment:
    - 도달, CTR, CPC
```

### 6.3 분석 항목

- **성공 패턴 탐지**: 고성과 콘텐츠의 공통점 (색상·각도·문구·길이)
- **실패 패턴 탐지**: 저성과 콘텐츠의 특징
- **시간대·해시태그 효과 분석**: 시간대별 인게이지먼트 비교
- **A/B 테스트 결과**: variants 간 성과 비교

### 6.4 출력

```json
{
  "brand_id": "brand_12345",
  "analysis_period": "2025-01-01 ~ 2025-01-31",
  "insights": [
    "이 브랜드는 감성형 짧은 카피의 CTR이 평균 대비 35% 높습니다",
    "밝은 톤 이미지가 전환율 상승에 27% 기여했습니다",
    "영상 길이 15초 이하일 때 완주율이 85%로 최고입니다",
    "해시태그 #자연스러운 사용 시 도달률이 22% 증가합니다"
  ],
  "recommendations": [
    "향후 콘텐츠는 15초 이하 영상 + 감성 카피 조합 권장",
    "밝은 톤 + #자연스러운 해시태그 활용"
  ]
}
```

### 6.5 구현 코드

```python
# backend/brand_learning/performance_analyzer.py

from typing import Dict, List, Any
from datetime import datetime, timedelta

class PerformanceAnalyzer:
    """
    SNS 및 광고 성과 자동 분석
    """

    def __init__(self):
        self.collectors = {
            'instagram': self._collect_instagram,
            'facebook': self._collect_facebook,
            'youtube_shorts': self._collect_youtube_shorts,
            'google_ads': self._collect_google_ads
        }

    async def collect_performance(
        self,
        content_id: str,
        brand_id: str,
        platform: str,
        post_id: str
    ) -> Dict[str, Any]:
        """
        플랫폼별 성과 지표 수집
        """
        collector = self.collectors.get(platform)
        if not collector:
            raise ValueError(f"지원하지 않는 플랫폼: {platform}")

        metrics = await collector(post_id)

        # DB 저장
        await self._store_performance({
            'content_id': content_id,
            'brand_id': brand_id,
            'platform': platform,
            'post_id': post_id,
            'metrics': metrics,
            'collected_at': datetime.utcnow()
        })

        # 성과 기반 학습
        await self._analyze_performance(brand_id, content_id, metrics)

        return metrics

    async def _collect_instagram(self, post_id: str) -> Dict[str, Any]:
        """Instagram Graph API로 성과 수집"""
        # 실제 구현에서는 OAuth 토큰 관리 필요
        import httpx

        access_token = await self._get_instagram_token()

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.instagram.com/{post_id}",
                params={
                    'fields': 'like_count,comments_count,shares_count,saved,reach,impressions',
                    'access_token': access_token
                }
            )

        data = response.json()

        return {
            'likes': data.get('like_count', 0),
            'comments': data.get('comments_count', 0),
            'shares': data.get('shares_count', 0),
            'saves': data.get('saved', 0),
            'reach': data.get('reach', 0),
            'impressions': data.get('impressions', 0),
            'engagement_rate': self._calculate_engagement_rate(data)
        }

    def _calculate_engagement_rate(self, data: Dict[str, Any]) -> float:
        """인게이지먼트율 계산"""
        engagement = (
            data.get('like_count', 0) +
            data.get('comments_count', 0) +
            data.get('shares_count', 0)
        )
        reach = data.get('reach', 1)

        return engagement / reach if reach > 0 else 0.0

    async def _analyze_performance(
        self,
        brand_id: str,
        content_id: str,
        metrics: Dict[str, Any]
    ):
        """성과 분석 및 패턴 추출"""
        # 콘텐츠 메타데이터 조회
        content = await self._get_content_metadata(content_id)

        # 성과 등급 계산
        performance_grade = self._calculate_grade(metrics)

        # 고성과 콘텐츠 → Positive 학습 샘플
        if performance_grade >= 0.8:
            await self._mark_as_positive_sample(
                brand_id=brand_id,
                content_id=content_id,
                features={
                    'headline': content['headline'],
                    'image_style': content['image_style'],
                    'cta': content['cta'],
                    'length': content['length'],
                    'colors': content['colors']
                },
                performance_score=performance_grade
            )

        # 저성과 콘텐츠 → 개선 필요
        elif performance_grade < 0.4:
            await self._mark_for_improvement(
                brand_id=brand_id,
                content_id=content_id,
                issues=['low_engagement', 'below_average_reach']
            )

    async def generate_insights(
        self,
        brand_id: str,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """브랜드별 성과 인사이트 생성"""
        # 최근 N일 성과 데이터 조회
        performance_data = await self._get_performance_history(
            brand_id=brand_id,
            days=period_days
        )

        # 고성과 콘텐츠 공통 패턴 추출
        high_performers = [p for p in performance_data if p['grade'] >= 0.8]
        patterns = self._extract_patterns(high_performers)

        # 인사이트 생성
        insights = []

        # 카피 길이 분석
        short_copy_avg = np.mean([p['engagement_rate'] for p in high_performers if p['copy_length'] < 50])
        long_copy_avg = np.mean([p['engagement_rate'] for p in high_performers if p['copy_length'] >= 50])

        if short_copy_avg > long_copy_avg * 1.2:
            insights.append(f"이 브랜드는 짧은 카피(50자 이하)의 인게이지먼트가 {(short_copy_avg / long_copy_avg - 1) * 100:.0f}% 높습니다")

        # 색상 분석
        color_performance = {}
        for p in high_performers:
            for color in p['colors']:
                if color not in color_performance:
                    color_performance[color] = []
                color_performance[color].append(p['engagement_rate'])

        best_color = max(color_performance, key=lambda c: np.mean(color_performance[c]))
        insights.append(f"색상 {best_color} 사용 시 평균 인게이지먼트가 가장 높습니다")

        return {
            'brand_id': brand_id,
            'analysis_period': f"{period_days}일",
            'insights': insights,
            'patterns': patterns
        }
```

---

## 7. A/B Testing Engine

### 7.1 개요

광고/이미지/영상의 A/B 성능을 자동으로 비교하여 **승자 패턴**을 학습합니다.

### 7.2 기능

- **CTR/CPA 기반 승자 선택**: 통계적 유의성 검증 (t-test)
- **자동 Budget Reallocation**: 승자에게 예산 재배분 (로드맵)
- **승자 패턴 → 브랜드 스타일 업데이트**: 고성과 variant 특징 반영

### 7.3 구현 코드

```python
# backend/brand_learning/ab_test_engine.py

from typing import List, Dict, Any
import numpy as np
from scipy import stats

class ABTestEngine:
    """
    A/B 테스트 자동화 엔진
    """

    async def create_test(
        self,
        brand_id: str,
        content_type: str,  # 'headline', 'image', 'video' 등
        variants: List[Dict[str, Any]]
    ) -> str:
        """
        A/B 테스트 생성

        Args:
            brand_id: 브랜드 ID
            content_type: 콘텐츠 유형
            variants: 테스트할 variants 리스트

        Returns:
            테스트 ID
        """
        test_id = self._generate_test_id()

        await self._store_test({
            'test_id': test_id,
            'brand_id': brand_id,
            'content_type': content_type,
            'variants': variants,
            'status': 'active',
            'created_at': datetime.utcnow()
        })

        return test_id

    async def record_performance(
        self,
        test_id: str,
        variant_id: int,
        metrics: Dict[str, Any]
    ):
        """variant 성과 기록"""
        await self._store_performance({
            'test_id': test_id,
            'variant_id': variant_id,
            'metrics': metrics,
            'recorded_at': datetime.utcnow()
        })

        # 충분한 샘플 누적 시 통계 검증
        await self._check_significance(test_id)

    async def _check_significance(self, test_id: str):
        """통계적 유의성 검증"""
        results = await self._get_test_results(test_id)

        # variant별 성과 그룹화
        groups = {}
        for result in results:
            variant_id = result['variant_id']
            if variant_id not in groups:
                groups[variant_id] = []
            groups[variant_id].append(result['metrics']['ctr'])  # 또는 다른 주요 지표

        # 샘플 수 충분한지 확인 (최소 30개)
        if all(len(g) >= 30 for g in groups.values()):
            # t-test 수행
            variant_ids = list(groups.keys())
            t_stat, p_value = stats.ttest_ind(
                groups[variant_ids[0]],
                groups[variant_ids[1]]
            )

            # 유의 수준 0.05
            if p_value < 0.05:
                # 승자 결정
                winner_id = variant_ids[0] if np.mean(groups[variant_ids[0]]) > np.mean(groups[variant_ids[1]]) else variant_ids[1]

                await self._declare_winner(test_id, winner_id)

                # 승자 패턴을 브랜드 스타일에 반영
                await self._update_brand_style_from_winner(test_id, winner_id)

    async def _update_brand_style_from_winner(
        self,
        test_id: str,
        winner_id: int
    ):
        """승자 패턴을 브랜드 스타일에 반영"""
        test = await self._get_test(test_id)
        winner_variant = test['variants'][winner_id]

        brand_updater = BrandStyleUpdater()

        # 승자 특징 추출
        winner_features = {
            'headline_pattern': winner_variant.get('headline_pattern'),
            'image_style': winner_variant.get('image_style'),
            'color_scheme': winner_variant.get('colors')
        }

        # 브랜드 스타일 업데이트
        await brand_updater.reinforce_positive_pattern(
            brand_id=test['brand_id'],
            pattern=winner_features,
            strength=0.2  # 가중치 강화 정도
        )
```

---

## 8. Auto Prompt Optimization Engine

### 8.1 개요

브랜드별·업종별로 프롬프트를 자동 최적화합니다.

### 8.2 예시 규칙

```yaml
업종별 프롬프트 최적화:
  화장품:
    - 감정 + 임상 근거 강조
    - "피부과 테스트 완료", "저자극" 등 신뢰 키워드 포함

  피트니스:
    - Before/After 스토리 강화
    - "변화", "도전", "성취" 등 동기부여 단어

  카페:
    - 감성톤 + 음식 근접샷
    - "따뜻한", "아늑한", "신선한" 등 감각 단어

  IT/SaaS:
    - 기능 + ROI 강조
    - "생산성 2배 향상", "시간 절약" 등 정량적 표현
```

### 8.3 출력 Example

```json
{
  "brand_id": "brand_12345",
  "industry": "cosmetics",
  "prompt_rules": [
    "제품 USP는 첫 문단에 반드시 배치",
    "임상 테스트 결과는 구체적 수치로 명시",
    "고가 제품은 감정보다는 기능+근거 강조",
    "이미지는 제품 클로즈업 + 깨끗한 배경"
  ],
  "prompt_template": "..."
}
```

### 8.4 구현 코드

```python
# backend/brand_learning/prompt_optimizer.py

from typing import List, Dict, Any

class PromptOptimizer:
    """
    프롬프트 자동 최적화 엔진
    """

    def __init__(self):
        # 업종별 기본 규칙
        self.industry_rules = {
            'cosmetics': {
                'tone': 'balanced_emotional_rational',
                'keywords': ['피부과', '테스트', '저자극', '임상', '검증'],
                'structure': 'USP → 근거 → 감성'
            },
            'fitness': {
                'tone': 'motivational',
                'keywords': ['변화', '도전', '성취', 'Before/After'],
                'structure': '문제 제기 → 해결책 → 결과'
            },
            'cafe': {
                'tone': 'warm_emotional',
                'keywords': ['따뜻한', '아늑한', '신선한', '향기'],
                'structure': '감각 묘사 → 분위기 → CTA'
            }
        }

    async def optimize_prompt(
        self,
        brand_id: str,
        task_type: str,  # 'headline', 'body', 'image_generation' 등
        feedback_history: List[Dict[str, Any]]
    ) -> str:
        """
        피드백 기반 프롬프트 최적화

        Args:
            brand_id: 브랜드 ID
            task_type: 작업 유형
            feedback_history: 과거 피드백 이력

        Returns:
            최적화된 프롬프트
        """
        # 1. 브랜드 업종 확인
        brand = await self._get_brand_info(brand_id)
        industry = brand.get('industry', 'general')

        # 2. 업종별 기본 규칙 로드
        base_rules = self.industry_rules.get(industry, {})

        # 3. 피드백 패턴 분석
        patterns = self._analyze_feedback_patterns(feedback_history)

        # 4. 규칙 커스터마이징
        custom_rules = self._customize_rules(base_rules, patterns)

        # 5. 프롬프트 생성
        optimized_prompt = await self._generate_prompt(
            task_type=task_type,
            rules=custom_rules
        )

        # 6. 저장
        await self._save_prompt(brand_id, task_type, optimized_prompt)

        return optimized_prompt

    def _analyze_feedback_patterns(
        self,
        feedback_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """피드백 패턴 추출"""
        patterns = {
            'preferred_tone': None,
            'avoided_words': [],
            'preferred_structure': None
        }

        # 톤 선호도 분석
        tone_votes = {'formal': 0, 'casual': 0, 'emotional': 0, 'rational': 0}
        for feedback in feedback_history:
            if feedback.get('tone_change'):
                tone_votes[feedback['tone_change']['target']] += 1

        patterns['preferred_tone'] = max(tone_votes, key=tone_votes.get)

        # 자주 삭제된 단어 → 회피 목록
        removed_words = []
        for feedback in feedback_history:
            if feedback.get('edit_diff'):
                removed_words.extend(feedback['edit_diff'].get('removed_words', []))

        from collections import Counter
        patterns['avoided_words'] = [w for w, c in Counter(removed_words).most_common(10)]

        return patterns

    async def _generate_prompt(
        self,
        task_type: str,
        rules: Dict[str, Any]
    ) -> str:
        """규칙 기반 프롬프트 생성"""
        if task_type == 'headline':
            prompt = f"""
            다음 규칙에 따라 헤드라인을 작성해주세요:

            톤: {rules['tone']}
            필수 포함 키워드: {', '.join(rules['keywords'])}
            구조: {rules['structure']}
            회피 단어: {', '.join(rules.get('avoided_words', []))}

            브리프: {{brief}}

            헤드라인을 3개 생성해주세요.
            """

        elif task_type == 'body':
            prompt = f"""
            다음 규칙에 따라 본문을 작성해주세요:

            톤: {rules['tone']}
            구조: {rules['structure']}
            핵심 메시지: {{key_message}}

            본문을 작성해주세요 (200-300자).
            """

        elif task_type == 'image_generation':
            prompt = f"""
            다음 규칙에 따라 이미지 생성 프롬프트를 작성해주세요:

            스타일: {rules.get('image_style', 'clean and modern')}
            색상: {rules.get('colors', 'brand colors')}
            구도: {rules.get('composition', 'center-focused')}

            이미지 설명: {{description}}

            Stable Diffusion 프롬프트를 생성해주세요.
            """

        return prompt
```

---

## 9. Brand Fine-Tuning Model (로드맵)

### 9.1 조건

데이터가 충분히 누적된 경우 (이미지 500장 이상, 텍스트 1000샘플 이상)

### 9.2 훈련 모델

- **미니 파인튜닝 (LLM LoRA)**: 브랜드 카피 스타일 학습
- **이미지 스타일 LoRA 생성**: 브랜드 시각 스타일 일관성
- **Video Motion Style 강도 조절**: 영상 편집 스타일 학습

### 9.3 구현 계획

```python
# backend/brand_learning/model_finetuner.py

import torch
from diffusers import StableDiffusionPipeline
from peft import LoraConfig, get_peft_model

class BrandModelFineTuner:
    """
    브랜드별 LoRA 모델 파인튜닝
    """

    async def train_brand_lora(
        self,
        brand_id: str,
        training_images: List[str],
        epochs: int = 500,
        learning_rate: float = 1e-4
    ) -> str:
        """
        브랜드 이미지로 LoRA 훈련

        Returns:
            훈련된 모델 경로
        """
        # Base 모델 로드
        pipeline = StableDiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=torch.float16
        ).to("cuda")

        # LoRA Config
        lora_config = LoraConfig(
            r=8,
            lora_alpha=32,
            target_modules=["to_q", "to_v"],
            lora_dropout=0.1
        )

        # LoRA 적용
        unet = get_peft_model(pipeline.unet, lora_config)

        # 데이터셋 준비 및 훈련
        dataset = self._prepare_dataset(training_images)
        await self._train_loop(unet, dataset, epochs, learning_rate)

        # 모델 저장
        output_path = f"models/lora/{brand_id}/brand_style.safetensors"
        unet.save_pretrained(output_path)

        return output_path
```

---

## 10. Data Flow

### 10.1 전체 데이터 흐름

```
1. User Upload → Brand Intake Module
                     ↓
2. Brand Style Extractor → Brand Style Vector 생성
                     ↓
3. TrendPipeline Data 병합
                     ↓
4. Embedding 저장 (pgvector)
                     ↓
5. 생성 Agent가 최신 Brand Vector로 콘텐츠 생성
                     ↓
6. Reviewer Agent → 품질 점수 부여
                     ↓
7. 사용자 수정 → Edit History 저장
                     ↓
8. SNS 발행 → Performance Analyzer가 성과 수집
                     ↓
9. Self-Learning Loop → 브랜드 벡터 업데이트
                     ↓
10. 다음 생성 시 개선된 결과 반영
```

### 10.2 데이터베이스 스키마

```sql
-- 브랜드 스타일 벡터
CREATE TABLE brand_style_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    embedding VECTOR(768),
    text_tone JSONB,
    text_keywords TEXT[],
    image_colors TEXT[],
    layout_patterns JSONB,
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 학습 샘플
CREATE TABLE learning_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    sample_type VARCHAR(50),  -- 'upload', 'feedback', 'performance'
    content_id UUID,
    data JSONB,
    performance_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 피드백 이력
CREATE TABLE edit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    content_id UUID,
    original_content TEXT,
    edited_content TEXT,
    diff JSONB,
    edit_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 성과 데이터
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    content_id UUID,
    platform VARCHAR(50),
    post_id VARCHAR(255),
    metrics JSONB,
    collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B 테스트
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    content_type VARCHAR(50),
    variants JSONB,
    status VARCHAR(20) DEFAULT 'active',
    winner_variant_id INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. Agents

### 11.1 관련 Agent 목록

| Agent | 역할 | 입출력 |
|-------|------|--------|
| **BrandIntakeAgent** | 사용자 업로드 자료 파싱 및 분석 | 입력: 파일 → 출력: Brand Kit |
| **BrandStyleExtractorAgent** | 스타일 패턴 추출 및 벡터화 | 입력: 텍스트/이미지 → 출력: Style Vector |
| **ReviewerAgent** | 생성물 품질 평가 | 입력: 콘텐츠 → 출력: 점수 + 제안 |
| **PerformanceAnalyzerAgent** | SNS/광고 성과 수집 분석 | 입력: 플랫폼 데이터 → 출력: 인사이트 |
| **SelfLearningAgent** | 피드백 루프 관리 | 입력: 모든 데이터 → 출력: 업데이트 트리거 |
| **BrandModelUpdaterAgent** | 브랜드 스타일 자동 업데이트 | 입력: 학습 데이터 → 출력: 새 Brand Vector |

---

## 12. KPI

### 12.1 학습 효과 지표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **브랜드 일관성 점수** | ≥ 85% | Reviewer Agent 평가 평균 |
| **사용자 수정률 감소** | -30% | 수정 횟수 / 생성 횟수 비율 |
| **성과 개선율** | +20% | 재학습 전후 인게이지먼트 비교 |
| **A/B 테스트 승률** | 65% 이상 | 통계적 유의미한 승자 비율 |
| **프롬프트 최적화 효과** | +15% 품질 | 최적화 전후 Reviewer 점수 |

### 12.2 대시보드 지표

```yaml
학습 현황 대시보드:
  브랜드별 지표:
    - 학습 데이터 누적량 (업로드/피드백/성과)
    - 재학습 횟수 및 효과
    - Brand Consistency Score 추이
    - 최근 7일/30일 성과 추세

  시스템 지표:
    - 일일 학습 샘플 수집량
    - 재학습 대기 브랜드 수
    - A/B 테스트 진행 현황
    - Prompt 최적화 이력
```

---

## 13. Next Steps (구현 로드맵)

### Phase 0 (MVP)

- [x] Brand Intake Module: PDF/이미지 파싱
- [x] Brand Style Extractor: 기본 패턴 추출
- [ ] Reviewer Agent: 품질 평가
- [ ] Edit History Tracker: 수정 이력 저장

### Phase 1 (Post-MVP)

- [ ] Performance Analyzer: Instagram/Facebook API 연동
- [ ] Self-Learning Loop: 자동 업데이트
- [ ] Prompt Optimizer: 기본 최적화
- [ ] A/B Test Manager: 통계 검증

### Phase 2 (Advanced)

- [ ] Brand LoRA Model: 이미지 스타일 LoRA 훈련
- [ ] LLM Fine-Tuning: 브랜드 카피 스타일 학습
- [ ] Real-time Learning: 온라인 학습
- [ ] Ads Data 자동 수집: Google/Naver/Kakao API 연동

### Phase 3 (Future)

- [ ] Influencer DB 연동: 인플루언서 성과 분석
- [ ] 브랜드 모델 사전학습 구조 설계
- [ ] Transfer Learning: 브랜드 간 일반화 지식 공유 (Opt-in)

---

## 14. 개인정보 보호 및 윤리

### 14.1 데이터 사용 정책

```yaml
원칙:
  - 사용자 명시적 동의 없이 학습 데이터 미사용
  - 브랜드 간 데이터 공유 금지
  - 개인정보(PII) 자동 마스킹

Opt-in 방식:
  - 기본값: 학습 비활성화
  - 사용자 선택 시에만 활성화
  - 언제든지 철회 가능
  - 학습 데이터 확인 가능

데이터 보관:
  - 학습 데이터: 암호화 저장 (AES-256)
  - 보관 기간: 최대 2년
  - 삭제 요청 시 즉시 삭제 (GDPR Right to be Forgotten)
```

### 14.2 투명성 및 사용자 제어

```python
# backend/brand_learning/user_control.py

class UserLearningControl:
    """
    사용자 학습 제어 인터페이스
    """

    async def request_retrain_approval(self, brand_id: str):
        """재학습 전 사용자 승인 요청"""
        message = {
            'title': '브랜드 학습 모델 업데이트',
            'body': '''
            최근 생성물 피드백과 성과 데이터를 기반으로
            브랜드 맞춤형 모델을 개선할 수 있습니다.

            학습 데이터:
            - 업로드 자료: 15건
            - 피드백: 42건
            - 성과 데이터: 28건

            예상 개선 효과: 생성 품질 +12%, 수정 시간 -20%

            재학습을 진행하시겠습니까?
            ''',
            'actions': ['승인', '거부', '자세히 보기']
        }

        await self._send_notification(brand_id, message)

    async def view_learning_data(self, brand_id: str) -> Dict[str, Any]:
        """학습 데이터 확인"""
        return {
            'upload_samples': await self._get_upload_samples(brand_id),
            'feedback_samples': await self._get_feedback_samples(brand_id),
            'performance_samples': await self._get_performance_samples(brand_id)
        }

    async def opt_out(self, brand_id: str):
        """학습 비활성화"""
        await self._disable_learning(brand_id)
        await self._delete_learning_data(brand_id)
```

---

## 15. 참조 문서

### 15.1 내부 문서

- [DATA_PIPELINE_PLAN.md](./DATA_PIPELINE_PLAN.md) - TrendPipeline 및 RAG 구조
- [AGENTS_SPEC.md](./AGENTS_SPEC.md) - Reviewer Agent 상세
- [LLM_ROUTER_POLICY.md](./LLM_ROUTER_POLICY.md) - 모델 선택 정책
- [MVP_v0_SCOPE_PLAN.md](./MVP_v0_SCOPE_PLAN.md) - MVP 범위

### 15.2 외부 리소스

- **DSPy**: 프롬프트 최적화 프레임워크
- **LoRA Paper**: "Low-Rank Adaptation of Large Language Models"
- **CLIP**: "Learning Transferable Visual Models From Natural Language Supervision"
- **A/B Testing**: "Trustworthy Online Controlled Experiments" by Kohavi et al.

---

**문서 버전**: 2.0
**최종 수정**: 2025-01-13
**작성자**: AI/ML Team
