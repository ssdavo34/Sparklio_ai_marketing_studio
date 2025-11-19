# B팀 (Backend) 작업 요청서

**발행일**: 2025-11-19
**프로젝트**: Sparklio Editor v2.0
**담당**: B팀 (Backend/Python/FastAPI)
**우선순위**: Phase 1 → Phase 8 순차 진행

---

## 📋 요청 개요

### 전체 목표

Sparklio Editor v2.0의 **모든 Backend API 및 서비스**를 구현합니다.

- **기술 스택**: Python, FastAPI, PostgreSQL, MinIO, Celery, Redis, OpenAI API
- **전략**: "메뉴 하나씩 성공시키기"
- **각 Phase 종료 시**: A팀과 통합 테스트 → 1차 성공 조건 달성

### 핵심 문서

반드시 먼저 읽어주세요:

1. [000_MASTER_PLAN.md](./000_MASTER_PLAN.md) - 프로젝트 전체 비전
2. [002_DATA_MODEL.md](./002_DATA_MODEL.md) - 데이터 모델 (EditorDocument, TrendPattern 등)
3. [007_AI_INTEGRATION.md](./007_AI_INTEGRATION.md) - AI 통합 (Meeting AI, Spark Chat)
4. [009_TREND_ENGINE.md](./009_TREND_ENGINE.md) - Trend Engine 파이프라인
5. [010_IMPLEMENTATION_ROADMAP.md](./010_IMPLEMENTATION_ROADMAP.md) - 전체 로드맵

---

## Phase 1: Canvas Studio (Week 1-3)

### 🎯 목표

**EditorDocument CRUD API + 이미지 업로드**

A팀이 에디터를 만들 수 있도록 **문서 저장/로드 API**를 제공합니다.

### ✅ 1차 성공 조건

```
[ ] Documents CRUD API 완성
[ ] EditorDocument를 PostgreSQL JSONB에 저장
[ ] MinIO 이미지 업로드 API 완성
[ ] A팀과 통합 테스트 완료
```

### 📂 작업 항목

#### Week 1: Database Schema

```sql
-- 1. documents 테이블 생성
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    mode VARCHAR(50),               -- 'pitch-deck', 'product-story', etc.
    brand_id UUID,
    content JSONB NOT NULL,         -- EditorDocument 전체 (pages, tokens 포함)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 인덱스
CREATE INDEX idx_documents_brand_id ON documents(brand_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- 3. Trigger (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

#### Week 1-2: API Endpoints

```python
# backend/app/api/v1/documents.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from models.editor import EditorDocument

router = APIRouter()

# ===== Request/Response Models =====

class CreateDocumentRequest(BaseModel):
    title: str
    mode: Optional[str] = None
    brandId: Optional[UUID] = None
    content: EditorDocument  # 002_DATA_MODEL.md 참고

class UpdateDocumentRequest(BaseModel):
    content: EditorDocument

class DocumentResponse(BaseModel):
    id: UUID
    title: str
    mode: Optional[str]
    brandId: Optional[UUID]
    content: EditorDocument
    createdAt: str
    updatedAt: str

# ===== Endpoints =====

@router.post('/documents', response_model=DocumentResponse)
async def create_document(request: CreateDocumentRequest):
    """
    새 문서 생성

    Request Body:
    {
        "title": "Product Launch Pitch Deck",
        "mode": "pitch-deck",
        "brandId": "uuid...",
        "content": { ...EditorDocument }
    }
    """
    [ ] 구현 필요:
        - request.content를 JSONB로 변환
        - documents 테이블에 INSERT
        - 생성된 document 반환

    return DocumentResponse(...)

@router.get('/documents/{document_id}', response_model=DocumentResponse)
async def get_document(document_id: UUID):
    """
    문서 조회

    Response:
    {
        "id": "uuid...",
        "title": "...",
        "content": { ...EditorDocument }
    }
    """
    [ ] 구현 필요:
        - documents 테이블에서 조회
        - 없으면 404 에러
        - JSONB → EditorDocument 변환

    return DocumentResponse(...)

@router.put('/documents/{document_id}', response_model=DocumentResponse)
async def update_document(document_id: UUID, request: UpdateDocumentRequest):
    """
    문서 업데이트

    Request Body:
    {
        "content": { ...EditorDocument }
    }
    """
    [ ] 구현 필요:
        - documents 테이블에서 UPDATE
        - updated_at 자동 업데이트 (Trigger)

    return DocumentResponse(...)

@router.delete('/documents/{document_id}')
async def delete_document(document_id: UUID):
    """
    문서 삭제
    """
    [ ] 구현 필요:
        - documents 테이블에서 DELETE

    return {"success": True}

@router.get('/documents', response_model=List[DocumentResponse])
async def list_documents(
    brand_id: Optional[UUID] = None,
    limit: int = 20,
    offset: int = 0
):
    """
    문서 목록 조회

    Query Params:
    - brand_id: 브랜드 필터 (옵션)
    - limit: 페이지 크기 (기본 20)
    - offset: 페이지 오프셋
    """
    [ ] 구현 필요:
        - WHERE brand_id = ? (옵션)
        - ORDER BY created_at DESC
        - LIMIT/OFFSET

    return [DocumentResponse(...), ...]
```

#### Week 2: MinIO Integration

```python
# backend/app/api/v1/upload.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from minio import Minio
from uuid import uuid4
import os

router = APIRouter()

# MinIO 클라이언트 초기화
minio_client = Minio(
    endpoint=os.getenv('MINIO_ENDPOINT'),
    access_key=os.getenv('MINIO_ACCESS_KEY'),
    secret_key=os.getenv('MINIO_SECRET_KEY'),
    secure=False  # 개발 환경에서는 False
)

BUCKET_NAME = 'editor-images'

# 버킷 생성 (없으면)
if not minio_client.bucket_exists(BUCKET_NAME):
    minio_client.make_bucket(BUCKET_NAME)

@router.post('/upload/image')
async def upload_image(file: UploadFile = File(...)):
    """
    이미지 업로드

    Request: multipart/form-data
    - file: 이미지 파일

    Response:
    {
        "url": "http://minio:9000/editor-images/uuid.jpg"
    }
    """
    [ ] 구현 필요:
        - 파일 확장자 검증 (.jpg, .png, .gif, .webp)
        - UUID 파일명 생성
        - MinIO에 업로드
        - 공개 URL 반환

    try:
        # 파일 확장자
        ext = os.path.splitext(file.filename)[1]
        if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            raise HTTPException(status_code=400, detail="Invalid file type")

        # UUID 파일명
        filename = f"{uuid4()}{ext}"

        # MinIO 업로드
        minio_client.put_object(
            bucket_name=BUCKET_NAME,
            object_name=filename,
            data=file.file,
            length=file.size,
            content_type=file.content_type
        )

        # 공개 URL
        url = f"http://{os.getenv('MINIO_ENDPOINT')}/{BUCKET_NAME}/{filename}"

        return {"url": url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/upload/image/{filename}')
async def delete_image(filename: str):
    """
    이미지 삭제 (옵션)
    """
    [ ] 구현 필요:
        - MinIO에서 삭제

    minio_client.remove_object(BUCKET_NAME, filename)
    return {"success": True}
```

### 🔗 A팀 연동 테스트

```bash
# 1. 문서 생성
curl -X POST http://localhost:8000/api/v1/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Document",
    "mode": "pitch-deck",
    "content": {
      "id": "doc-1",
      "title": "Test",
      "mode": "pitch-deck",
      "pages": [],
      "createdAt": "2025-11-19T00:00:00Z",
      "updatedAt": "2025-11-19T00:00:00Z"
    }
  }'

# 2. 문서 조회
curl http://localhost:8000/api/v1/documents/{id}

# 3. 이미지 업로드
curl -X POST http://localhost:8000/api/v1/upload/image \
  -F "file=@image.jpg"
```

### 📝 완료 기준

- [ ] Postman/Thunder Client로 모든 API 테스트 성공
- [ ] A팀이 문서 저장/로드 가능
- [ ] A팀이 이미지 업로드 → URL 받아서 캔버스에 표시 가능

---

## Phase 2: Spark Chat (Week 4-5)

### 🎯 목표

**자연어 브리프 → EditorDocument 자동 생성**

### ✅ 1차 성공 조건

```
[ ] Chat Analysis API (LLM 통합)
[ ] Document Generation API (기본 템플릿)
[ ] A팀과 통합 테스트 완료
```

### 📂 작업 항목

#### Week 4: Chat Analysis

```python
# backend/app/api/v1/chat.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.openai_service import OpenAIService

router = APIRouter()

class ChatAnalysisRequest(BaseModel):
    message: str                    # "나이키 에어맥스 인스타그램 광고 만들어줘"
    brandId: Optional[str] = None

class SuggestedSection(BaseModel):
    role: str                       # "headline", "product-image", "cta-button"
    suggestion: str                 # "신제품 출시"

class ChatAnalysisResponse(BaseModel):
    chatSessionId: str
    contentType: str                # "instagram-ad"
    suggestedStructure: List[SuggestedSection]

@router.post('/chat/analyze', response_model=ChatAnalysisResponse)
async def analyze_chat(request: ChatAnalysisRequest):
    """
    자연어 브리프 분석

    Request:
    {
        "message": "나이키 에어맥스 신제품 인스타그램 광고"
    }

    Response:
    {
        "chatSessionId": "chat-123",
        "contentType": "instagram-ad",
        "suggestedStructure": [
            { "role": "headline", "suggestion": "신제품 출시" },
            { "role": "product-image", "suggestion": "에어맥스 이미지" },
            { "role": "cta-button", "suggestion": "지금 구매하기" }
        ]
    }
    """
    [ ] 구현 필요:
        - OpenAI Chat API 호출
        - System Prompt: "당신은 마케팅 브리프를 분석하는 전문가입니다"
        - User Prompt: request.message
        - Response Format: JSON
        - ChatSession 레코드 생성 (chat_sessions 테이블)

    openai_service = OpenAIService()

    system_prompt = """
    당신은 마케팅 브리프를 분석하는 전문가입니다.

    사용자 메시지를 분석하여 다음을 추출하세요:
    1. 콘텐츠 타입 (instagram-ad, product-detail, pitch-deck, blog 중 하나)
    2. 제안 구조 (각 섹션의 role과 suggestion)

    응답은 JSON 형식:
    {
        "contentType": "instagram-ad",
        "suggestedStructure": [
            { "role": "headline", "suggestion": "..." },
            { "role": "product-image", "suggestion": "..." },
            { "role": "cta-button", "suggestion": "..." }
        ]
    }
    """

    result = await openai_service.chat_completion(
        system=system_prompt,
        user=request.message,
        response_format={"type": "json_object"}
    )

    analysis = json.loads(result)

    # ChatSession 저장
    chat_session_id = str(uuid4())
    # ... DB 저장

    return ChatAnalysisResponse(
        chatSessionId=chat_session_id,
        contentType=analysis['contentType'],
        suggestedStructure=analysis['suggestedStructure']
    )
```

#### Week 4-5: Document Generation

```python
class GenerateDocumentRequest(BaseModel):
    chatSessionId: str
    brandId: Optional[str] = None

class GenerateDocumentResponse(BaseModel):
    documentId: str
    document: EditorDocument

@router.post('/chat/generate-document', response_model=GenerateDocumentResponse)
async def generate_document(request: GenerateDocumentRequest):
    """
    브리프 기반 문서 자동 생성

    Request:
    {
        "chatSessionId": "chat-123"
    }

    Response:
    {
        "documentId": "doc-456",
        "document": { ...EditorDocument }
    }
    """
    [ ] 구현 필요:
        - ChatSession 조회
        - contentType에 따라 기본 템플릿 선택
        - Instagram Ad → 1080x1080, 좌측 이미지 + 우측 텍스트
        - 각 Object에 role 할당
        - suggestedStructure 내용으로 텍스트 채우기
        - EditorDocument 생성 및 저장

    # ChatSession 조회
    chat_session = db.query(ChatSession).filter(
        ChatSession.id == request.chatSessionId
    ).first()

    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # 기본 템플릿 로직
    content_type = chat_session.content_type

    if content_type == 'instagram-ad':
        page_width, page_height = 1080, 1080
        layout = 'left-image-right-text'
    elif content_type == 'product-detail':
        page_width, page_height = 1080, 1920
        layout = 'hero-top'
    else:
        page_width, page_height = 1080, 1350
        layout = 'basic'

    # EditorDocument 생성
    document = EditorDocument(
        id=str(uuid4()),
        title=f"Generated from Chat",
        mode='ad-studio' if 'ad' in content_type else 'product-story',
        pages=[
            EditorPage(
                id=str(uuid4()),
                name='Page 1',
                kind='ad',
                width=page_width,
                height=page_height,
                objects=create_objects_from_structure(
                    chat_session.suggested_structure,
                    page_width,
                    page_height
                ),
                background={'type': 'color', 'color': '#FFFFFF'}
            )
        ],
        createdAt=datetime.utcnow().isoformat(),
        updatedAt=datetime.utcnow().isoformat(),
        source={'kind': 'spark-chat', 'sourceId': request.chatSessionId}
    )

    # DB 저장
    # ...

    return GenerateDocumentResponse(
        documentId=document.id,
        document=document
    )

def create_objects_from_structure(structure: List[dict], page_width: int, page_height: int) -> List[EditorObject]:
    """suggestedStructure → EditorObject 배열 변환"""
    [ ] 구현 필요:
        - 각 role에 따라 위치/크기 결정
        - headline → 상단 중앙
        - product-image → 좌측
        - cta-button → 하단 우측

    objects = []

    for section in structure:
        role = section['role']
        suggestion = section['suggestion']

        if role == 'headline':
            obj = TextObject(
                id=str(uuid4()),
                type='text',
                role='headline',
                text=suggestion,
                x=600, y=300,
                width=400, height=80,
                fontSize=48, fontWeight='bold',
                fill='#000000',
                # ...
            )
        elif role == 'product-image':
            obj = ImageObject(
                id=str(uuid4()),
                type='image',
                role='product-image',
                src='placeholder.jpg',
                placeholder=True,
                x=0, y=0,
                width=540, height=1080,
                fit='cover',
                # ...
            )
        # ... 나머지 role

        objects.append(obj)

    return objects
```

### 📝 완료 기준

- [ ] A팀이 Spark Chat에서 "초안 만들기" → 새 문서 생성
- [ ] 생성된 문서에 role 할당됨
- [ ] 제안 텍스트가 각 Object에 채워짐

---

## Phase 3: Meeting AI (Week 6-7)

### 🎯 목표

**음성 파일 → 텍스트 → EditorDocument 자동 생성**

### 📂 작업 항목

```python
# backend/app/api/v1/meetings.py

@router.post('/meetings/upload')
async def upload_meeting(file: UploadFile = File(...)):
    """
    음성 파일 업로드 → STT

    Request: multipart/form-data (audio file)

    Response:
    {
        "meetingId": "meeting-123",
        "transcript": "회의 텍스트..."
    }
    """
    [ ] 구현 필요:
        - Whisper API 호출 (음성 → 텍스트)
        - Meeting 레코드 생성

    # Whisper API
    openai_service = OpenAIService()
    transcript = await openai_service.transcribe_audio(file)

    # Meeting 저장
    meeting_id = str(uuid4())
    # ... DB 저장

    return {"meetingId": meeting_id, "transcript": transcript}

@router.post('/meetings/analyze')
async def analyze_meeting(request: MeetingAnalysisRequest):
    """
    회의록 분석

    Request:
    {
        "meetingId": "meeting-123"
    }

    Response:
    {
        "meetingId": "meeting-123",
        "summary": {
            "contentType": "product-detail",
            "sections": [...]
        }
    }
    """
    [ ] 구현 필요:
        - LLM으로 회의록 분석
        - 콘텐츠 타입 분류
        - 섹션별 추출 (role + content)

    # 구현은 Spark Chat과 유사

@router.post('/meetings/generate-document')
async def generate_document_from_meeting(request: GenerateDocumentRequest):
    """
    회의 기반 문서 생성

    (Spark Chat의 generate-document와 유사)
    """
    [ ] 구현 필요
```

---

## Phase 4: Asset Library (Week 8)

### 📂 작업 항목

```python
# backend/app/api/v1/assets.py

@router.get('/assets')
async def list_assets(brand_id: Optional[UUID] = None, type: str = 'image'):
    """에셋 목록 조회"""
    [ ] 구현 필요

@router.post('/assets')
async def create_asset(file: UploadFile = File(...)):
    """에셋 업로드"""
    [ ] 구현 필요

@router.delete('/assets/{asset_id}')
async def delete_asset(asset_id: UUID):
    """에셋 삭제"""
    [ ] 구현 필요

# backend/app/api/v1/templates.py

@router.get('/templates')
async def list_templates(category: Optional[str] = None):
    """템플릿 목록 조회"""
    [ ] 구현 필요

@router.get('/templates/{template_id}')
async def get_template(template_id: UUID):
    """템플릿 상세 조회"""
    [ ] 구현 필요

@router.post('/templates')  # Admin only
async def create_template(request: CreateTemplateRequest):
    """템플릿 수동 등록"""
    [ ] 구현 필요
```

---

## Phase 5: Publish Hub (Week 9)

### 📂 작업 항목

```python
# backend/app/api/v1/export.py

@router.post('/documents/{document_id}/export')
async def export_document(
    document_id: UUID,
    format: str,  # 'png' | 'pdf'
    page_ids: Optional[List[UUID]] = None
):
    """
    문서 내보내기

    옵션 1: 서버 렌더링 (node-canvas 또는 Playwright)
    옵션 2: A팀이 Frontend에서 생성 → 업로드
    """
    [ ] 구현 필요 (A팀과 협의)

@router.post('/documents/{document_id}/publish')
async def publish_document(document_id: UUID, request: PublishRequest):
    """
    발행 이력 저장
    """
    [ ] 구현 필요
    # publishes 테이블에 INSERT
```

---

## Phase 6: Admin Console (Week 10)

### 📂 작업 항목

```python
# backend/app/api/v1/admin/brands.py

@router.get('/admin/brands')
@router.post('/admin/brands')
@router.put('/admin/brands/{brand_id}')
@router.delete('/admin/brands/{brand_id}')

# backend/app/api/v1/admin/templates.py

@router.get('/admin/templates')
@router.post('/admin/templates')
@router.put('/admin/templates/{template_id}')
@router.delete('/admin/templates/{template_id}')
```

---

## Phase 7: Trend Engine (Week 11-12)

### 📂 작업 항목 (009_TREND_ENGINE.md 참고)

```python
# backend/app/api/v1/admin/trends.py

@router.post('/admin/trends/collect')
async def collect_trends(request: CollectTrendsRequest):
    """
    트렌드 수집 실행 (수동 트리거)

    Request:
    {
        "source": "meta_ad_library",
        "market": "kr"
    }
    """
    [ ] 구현 필요:
        - Collector 실행 (Celery Task)
        - RawTrendData 저장

@router.get('/admin/trends/patterns')
async def list_trend_patterns(market: str, channel: str):
    """TrendPattern 목록 조회"""
    [ ] 구현 필요

@router.post('/admin/trends/{pattern_id}/generate-templates')
async def generate_templates_from_pattern(
    pattern_id: UUID,
    request: GenerateTemplatesRequest
):
    """
    패턴 기반 템플릿 자동 생성

    Request:
    {
        "count": 3,
        "brandId": "uuid..."
    }
    """
    [ ] 구현 필요:
        - TrendPattern 조회
        - TemplateGenerator 실행
        - TemplateDefinition 생성
```

---

## Phase 8: Insight Radar (Week 13)

### 📂 작업 항목

```python
# backend/app/api/v1/insights.py

@router.get('/insights/summary')
async def get_insights_summary():
    """
    통계 요약

    Response:
    {
        "totalDocuments": 123,
        "totalPublishes": 45,
        "documentsByType": { "instagram-ad": 30, ... },
        "topTemplates": [...]
    }
    """
    [ ] 구현 필요

@router.get('/insights/performance')
async def get_performance(document_id: Optional[UUID] = None):
    """
    성과 데이터 조회

    (외부 광고/분석 연동은 나중에)
    """
    [ ] 구현 필요
```

---

## 🚀 시작 방법

### 1. 문서 읽기 (필수)

```
1. docs/editor/002_DATA_MODEL.md (EditorDocument 스키마)
2. docs/editor/007_AI_INTEGRATION.md (Meeting AI, Spark Chat)
3. docs/editor/009_TREND_ENGINE.md (Trend Engine 파이프라인)
```

### 2. 개발 환경 설정

```bash
cd k:/sparklio_ai_marketing_studio/backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# PostgreSQL, MinIO, Redis 실행
docker-compose up -d
```

### 3. Phase 1부터 시작

```
app/api/v1/ 폴더에서 작업
- documents.py 먼저
- upload.py 두 번째
- A팀과 API 스펙 먼저 합의
```

### 4. A팀과 협업

```
- API 스펙 문서화 (Swagger/OpenAPI)
- Postman Collection 공유
- 통합 테스트 정기 실행
```

---

## 📞 질문 & 지원

- **데이터 모델**: 002_DATA_MODEL.md
- **AI 통합**: 007_AI_INTEGRATION.md
- **Trend Engine**: 009_TREND_ENGINE.md
- **A팀 협업**: TEAM_A_REQUEST.md

---

**작성자**: Sparklio Development Team
**마지막 업데이트**: 2025-11-19
