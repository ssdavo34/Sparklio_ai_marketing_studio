# B_TEAM_CANVAS_STUDIO_BACKEND_TASKS.md

# Canvas Studio v3 — B팀(Backend) 작업 지시서

- 작성일: 2025-11-15
- 작성자: A팀 (Infrastructure Team)
- 버전: v1.0
- 상태: **최종 확정본 - 즉시 작업 시작 가능**

---

## 0. 개요

### 목적

Canvas Studio v3 Frontend 구현을 지원하기 위한 Backend API를 개발합니다.

**Canvas Studio란?**
- VSCode 스타일의 원페이지 에디터
- Concept Board, Pitch Deck, Product Story 등 멀티 모드 지원
- Spark Chat → Generator → Canvas 편집 → Export 전체 플로우

### B팀의 역할

Frontend의 Canvas Studio가 원활히 동작하도록 다음 Backend API를 구현:
1. **Document 관리 API** (문서 저장/로드/버전 관리)
2. **Editor Action API** (Chat 명령 → Canvas 업데이트)
3. **Template 관리 API** (모드별 템플릿 제공)
4. **Concept Board API** (이미 작성된 CONCEPT_BOARD_B_TEAM_TASKS.md 참조)

---

## 1. 전체 아키텍처

### 1.1 Canvas Studio Backend 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Canvas Studio)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Activity │  │  Canvas  │  │  Spark   │  │Inspector │   │
│  │   Bar    │  │ Viewport │  │   Chat   │  │  Panel   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│                     Backend APIs                             │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   Generator    │  │   Document     │  │   Template   │  │
│  │      API       │  │   Management   │  │   Provider   │  │
│  │  (기존 완료)   │  │      API       │  │     API      │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Editor Action  │  │ Concept Board  │  │    Asset     │  │
│  │      API       │  │      API       │  │   Storage    │  │
│  │                │  │ (별도 문서)    │  │   (MinIO)    │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Database & Storage                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │documents │  │templates │  │  assets  │  │  MinIO   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 핵심 데이터 플로우

**1) 문서 생성 플로우**
```
1. Frontend: "10장짜리 프리젠테이션 만들어줘" (Chat)
   ↓
2. POST /api/v1/generate (kind: "pitch_deck")
   ↓
3. Generator가 textBlocks + editorDocument 생성
   ↓
4. POST /api/v1/documents/{docId}/save
   ↓
5. Frontend: Canvas에 로딩
```

**2) 문서 편집 플로우**
```
1. Frontend: "제목을 48px로 바꿔줘" (Chat)
   ↓
2. POST /api/v1/editor/action
   {
     "documentId": "doc_123",
     "actions": [{"type": "update_font_size", "target": "TITLE", "value": 48}]
   }
   ↓
3. EditorAgent가 Canvas JSON 업데이트
   ↓
4. Frontend: Canvas 리렌더링
```

**3) 문서 로드 플로우**
```
1. Frontend: /studio?docId=doc_123 접속
   ↓
2. GET /api/v1/documents/{docId}
   ↓
3. 문서 JSON 반환
   ↓
4. Frontend: Canvas에 로딩
```

---

## 2. 데이터베이스 스키마

### 2.1 documents 테이블

Canvas Studio에서 생성/편집한 모든 문서를 저장합니다.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,  -- 'concept_board', 'pitch_deck', 'product_story', 'ad_studio' 등
  brand_id UUID REFERENCES brands(id),
  owner_id UUID NOT NULL REFERENCES users(id),

  -- 문서 JSON
  document_json JSONB NOT NULL,  -- Canvas 구조 (pages, objects 등)

  -- 메타데이터
  metadata JSONB DEFAULT '{}',  -- 추가 메타데이터 (tags, description 등)
  thumbnail_url TEXT,  -- 썸네일 이미지 URL

  -- 버전 관리
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id),  -- 복제/버전 관리용

  -- 상태
  status VARCHAR(20) DEFAULT 'draft',  -- 'draft', 'published', 'archived'

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,

  -- 인덱스
  INDEX idx_documents_brand_id (brand_id),
  INDEX idx_documents_owner_id (owner_id),
  INDEX idx_documents_type (document_type),
  INDEX idx_documents_status (status)
);
```

**document_json 구조 예시**:
```json
{
  "documentId": "doc_abc123",
  "type": "pitch_deck",
  "brandId": "brand_001",
  "pages": [
    {
      "id": "page_1",
      "name": "Title Slide",
      "width": 1920,
      "height": 1080,
      "background": "#FFFFFF",
      "objects": [
        {
          "id": "obj_1",
          "type": "text",
          "role": "TITLE",
          "bounds": {"x": 100, "y": 100, "width": 800, "height": 100},
          "props": {
            "text": "회사 소개",
            "fontFamily": "Pretendard",
            "fontSize": 48,
            "fill": "#000000"
          }
        }
      ]
    }
  ]
}
```

### 2.2 templates 테이블

각 모드별 기본 템플릿을 저장합니다.

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,  -- 'concept_board', 'pitch_deck', 'product_story' 등
  category VARCHAR(100),  -- 'business', 'marketing', 'education' 등

  -- 템플릿 JSON
  template_json JSONB NOT NULL,  -- Canvas 구조

  -- 메타데이터
  description TEXT,
  thumbnail_url TEXT,
  preview_images JSONB DEFAULT '[]',  -- 여러 미리보기 이미지
  tags JSONB DEFAULT '[]',

  -- 사용 통계
  usage_count INTEGER DEFAULT 0,

  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 인덱스
  INDEX idx_templates_type (template_type),
  INDEX idx_templates_active (is_active)
);
```

### 2.3 document_history 테이블 (선택사항 - P1)

문서 편집 히스토리를 저장합니다 (Undo/Redo 지원).

```sql
CREATE TABLE document_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  -- 변경 내용
  document_json JSONB NOT NULL,
  changes_summary TEXT,  -- "제목 폰트 크기 변경: 36px → 48px"

  -- 생성 정보
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  -- 인덱스
  INDEX idx_document_history_doc_id (document_id),
  INDEX idx_document_history_version (document_id, version)
);
```

---

## 3. API 엔드포인트

### 3.1 Document 관리 API

#### 3.1.1 문서 저장

**POST /api/v1/documents**

새 문서를 생성합니다.

**요청**:
```json
{
  "name": "회사 소개 프레젠테이션",
  "document_type": "pitch_deck",
  "brandId": "brand_001",
  "document_json": {
    "documentId": "doc_abc123",
    "type": "pitch_deck",
    "pages": [...]
  },
  "metadata": {
    "description": "10장짜리 회사 소개",
    "tags": ["presentation", "company"]
  }
}
```

**응답** (201 Created):
```json
{
  "id": "doc_abc123",
  "name": "회사 소개 프레젠테이션",
  "document_type": "pitch_deck",
  "brandId": "brand_001",
  "ownerId": "user_001",
  "status": "draft",
  "version": 1,
  "createdAt": "2025-11-15T10:00:00Z",
  "updatedAt": "2025-11-15T10:00:00Z"
}
```

---

#### 3.1.2 문서 업데이트

**PATCH /api/v1/documents/{documentId}**

기존 문서를 업데이트합니다.

**요청**:
```json
{
  "name": "회사 소개 프레젠테이션 v2",
  "document_json": {
    "documentId": "doc_abc123",
    "type": "pitch_deck",
    "pages": [...]
  },
  "metadata": {
    "description": "업데이트된 버전"
  }
}
```

**응답** (200 OK):
```json
{
  "id": "doc_abc123",
  "name": "회사 소개 프레젠테이션 v2",
  "version": 2,
  "updatedAt": "2025-11-15T11:00:00Z"
}
```

---

#### 3.1.3 문서 조회

**GET /api/v1/documents/{documentId}**

문서 전체 JSON을 조회합니다.

**응답** (200 OK):
```json
{
  "id": "doc_abc123",
  "name": "회사 소개 프레젠테이션",
  "document_type": "pitch_deck",
  "brandId": "brand_001",
  "ownerId": "user_001",
  "document_json": {
    "documentId": "doc_abc123",
    "type": "pitch_deck",
    "pages": [...]
  },
  "metadata": {},
  "thumbnailUrl": "https://cdn.sparklio.ai/thumbnails/doc_abc123.png",
  "status": "draft",
  "version": 2,
  "createdAt": "2025-11-15T10:00:00Z",
  "updatedAt": "2025-11-15T11:00:00Z"
}
```

---

#### 3.1.4 문서 목록 조회

**GET /api/v1/documents**

사용자의 문서 목록을 조회합니다.

**쿼리 파라미터**:
- `brandId` (optional): 브랜드 ID 필터
- `document_type` (optional): 문서 타입 필터 ('pitch_deck', 'concept_board' 등)
- `status` (optional): 상태 필터 ('draft', 'published', 'archived')
- `skip` (optional): 페이지네이션 오프셋 (기본: 0)
- `limit` (optional): 페이지 크기 (기본: 20, 최대: 100)

**응답** (200 OK):
```json
{
  "documents": [
    {
      "id": "doc_abc123",
      "name": "회사 소개 프레젠테이션",
      "document_type": "pitch_deck",
      "brandId": "brand_001",
      "thumbnailUrl": "...",
      "status": "draft",
      "createdAt": "2025-11-15T10:00:00Z",
      "updatedAt": "2025-11-15T11:00:00Z"
    }
  ],
  "total": 25,
  "skip": 0,
  "limit": 20
}
```

---

#### 3.1.5 문서 삭제

**DELETE /api/v1/documents/{documentId}**

문서를 삭제합니다.

**쿼리 파라미터**:
- `hard_delete` (optional, default: false): true면 영구 삭제, false면 soft delete (status='archived')

**응답** (204 No Content)

---

### 3.2 Editor Action API

Chat에서 자연어 명령을 받아 Canvas JSON을 업데이트합니다.

#### 3.2.1 Editor Action 실행

**POST /api/v1/editor/action**

**요청**:
```json
{
  "documentId": "doc_abc123",
  "actions": [
    {
      "type": "update_font_size",
      "target": {"role": "TITLE"},
      "payload": {"fontSize": 48}
    },
    {
      "type": "update_color",
      "target": {"id": "obj_123"},
      "payload": {"fill": "#FF0000"}
    }
  ]
}
```

**응답** (200 OK):
```json
{
  "documentId": "doc_abc123",
  "appliedActions": 2,
  "document_json": {
    "documentId": "doc_abc123",
    "type": "pitch_deck",
    "pages": [...]  // 업데이트된 JSON
  },
  "changes_summary": "제목 폰트 크기 48px 적용, 색상 #FF0000 적용"
}
```

**지원하는 Action 타입** (P0):
1. `update_font_size`: 폰트 크기 변경
2. `update_color`: 색상 변경
3. `update_text`: 텍스트 내용 변경
4. `move_object`: 오브젝트 위치 이동
5. `resize_object`: 오브젝트 크기 변경
6. `delete_object`: 오브젝트 삭제
7. `add_object`: 오브젝트 추가

**target 지정 방식**:
- `{"id": "obj_123"}`: ID로 지정
- `{"role": "TITLE"}`: 역할(role)로 지정
- `{"type": "text"}`: 타입으로 지정 (여러 개 매칭 가능)

---

#### 3.2.2 Chat 명령 파싱 (선택사항 - P1)

**POST /api/v1/editor/parse-command**

자연어 명령을 Editor Action으로 변환합니다.

**요청**:
```json
{
  "documentId": "doc_abc123",
  "command": "제목을 빨간색으로 바꾸고 크기를 48px로 해줘"
}
```

**응답** (200 OK):
```json
{
  "actions": [
    {
      "type": "update_color",
      "target": {"role": "TITLE"},
      "payload": {"fill": "#FF0000"}
    },
    {
      "type": "update_font_size",
      "target": {"role": "TITLE"},
      "payload": {"fontSize": 48}
    }
  ],
  "confirmation": "제목의 색상을 빨간색으로, 폰트 크기를 48px로 변경하시겠습니까?"
}
```

---

### 3.3 Template 관리 API

#### 3.3.1 템플릿 목록 조회

**GET /api/v1/templates**

**쿼리 파라미터**:
- `template_type` (optional): 템플릿 타입 ('pitch_deck', 'concept_board' 등)
- `category` (optional): 카테고리 ('business', 'marketing' 등)
- `skip`, `limit`: 페이지네이션

**응답** (200 OK):
```json
{
  "templates": [
    {
      "id": "tpl_001",
      "name": "Modern Business Deck",
      "template_type": "pitch_deck",
      "category": "business",
      "thumbnailUrl": "...",
      "description": "현대적인 비즈니스 프레젠테이션 템플릿",
      "tags": ["modern", "business", "minimal"],
      "usageCount": 1250,
      "isPremium": false
    }
  ],
  "total": 50
}
```

---

#### 3.3.2 템플릿 상세 조회

**GET /api/v1/templates/{templateId}**

**응답** (200 OK):
```json
{
  "id": "tpl_001",
  "name": "Modern Business Deck",
  "template_type": "pitch_deck",
  "category": "business",
  "template_json": {
    "pages": [...]  // 전체 템플릿 JSON
  },
  "description": "...",
  "thumbnailUrl": "...",
  "previewImages": ["...", "..."],
  "tags": ["modern", "business"],
  "usageCount": 1250,
  "isPremium": false,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

#### 3.3.3 템플릿으로 문서 생성

**POST /api/v1/templates/{templateId}/instantiate**

템플릿을 기반으로 새 문서를 생성합니다.

**요청**:
```json
{
  "name": "내 회사 소개",
  "brandId": "brand_001",
  "variables": {
    "companyName": "Sparklio",
    "year": "2025"
  }
}
```

**응답** (201 Created):
```json
{
  "documentId": "doc_new_123",
  "name": "내 회사 소개",
  "document_type": "pitch_deck",
  "document_json": {
    "pages": [...]  // 변수 치환된 문서
  }
}
```

---

## 4. 구현 가이드

### 4.1 폴더 구조

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── generate.py         # 기존 Generator API
│   │           ├── documents.py        # NEW: Document 관리 API
│   │           ├── editor.py           # NEW: Editor Action API
│   │           └── templates.py        # NEW: Template API
│   │
│   ├── models/
│   │   ├── document.py                 # NEW: Document 모델
│   │   ├── template.py                 # NEW: Template 모델
│   │   └── document_history.py         # NEW: DocumentHistory 모델
│   │
│   ├── schemas/
│   │   ├── document.py                 # NEW: Document Pydantic 스키마
│   │   ├── template.py                 # NEW: Template Pydantic 스키마
│   │   └── editor.py                   # NEW: Editor Action 스키마
│   │
│   ├── services/
│   │   ├── document_service.py         # NEW: Document 비즈니스 로직
│   │   ├── editor_service.py           # NEW: Editor Action 비즈니스 로직
│   │   └── template_service.py         # NEW: Template 비즈니스 로직
│   │
│   └── generators/
│       └── ...                         # 기존 Generator 유지
```

### 4.2 Document 모델 구현

```python
# app/models/document.py
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 기본 정보
    name = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=False, index=True)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # 문서 JSON
    document_json = Column(JSONB, nullable=False)

    # 메타데이터
    metadata = Column(JSONB, default={})
    thumbnail_url = Column(Text)

    # 버전 관리
    version = Column(Integer, default=1)
    parent_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))

    # 상태
    status = Column(String(20), default="draft", index=True)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))
```

### 4.3 Document 스키마 구현

```python
# app/schemas/document.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

class DocumentCreate(BaseModel):
    name: str
    document_type: str  # 'pitch_deck', 'concept_board', 'product_story' 등
    brand_id: Optional[str] = None
    document_json: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = {}

class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    document_json: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    name: str
    document_type: str
    brand_id: Optional[str]
    owner_id: str
    document_json: Dict[str, Any]
    metadata: Dict[str, Any]
    thumbnail_url: Optional[str]
    status: str
    version: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]

    class Config:
        from_attributes = True

class DocumentListItem(BaseModel):
    id: str
    name: str
    document_type: str
    brand_id: Optional[str]
    thumbnail_url: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

### 4.4 Editor Action 스키마 구현

```python
# app/schemas/editor.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class EditorActionTarget(BaseModel):
    id: Optional[str] = None
    role: Optional[str] = None  # "TITLE", "BODY", "IMAGE" 등
    type: Optional[str] = None  # "text", "image", "shape" 등

class EditorAction(BaseModel):
    type: str  # "update_font_size", "update_color", "move_object" 등
    target: EditorActionTarget
    payload: Dict[str, Any]

class EditorActionRequest(BaseModel):
    document_id: str
    actions: List[EditorAction]

class EditorActionResponse(BaseModel):
    document_id: str
    applied_actions: int
    document_json: Dict[str, Any]
    changes_summary: str
```

### 4.5 Document API 엔드포인트 구현

```python
# app/api/v1/endpoints/documents.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.core.database import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListItem
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    data: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    새 문서 생성
    """
    logger.info(f"[Documents API] Creating document: {data.name}, type: {data.document_type}")

    document = Document(
        name=data.name,
        document_type=data.document_type,
        brand_id=data.brand_id,
        owner_id=current_user.id,
        document_json=data.document_json,
        metadata=data.metadata
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    logger.info(f"[Documents API] Document created: {document.id}")
    return document


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    문서 조회
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return document


@router.patch("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    문서 업데이트
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # 업데이트
    if data.name is not None:
        document.name = data.name
    if data.document_json is not None:
        document.document_json = data.document_json
        document.version += 1  # 버전 증가
    if data.metadata is not None:
        document.metadata = data.metadata
    if data.status is not None:
        document.status = data.status

    db.commit()
    db.refresh(document)

    logger.info(f"[Documents API] Document updated: {document.id}, version: {document.version}")
    return document


@router.get("/documents", response_model=dict)
async def list_documents(
    brand_id: Optional[str] = None,
    document_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    문서 목록 조회
    """
    query = db.query(Document).filter(Document.owner_id == current_user.id)

    if brand_id:
        query = query.filter(Document.brand_id == brand_id)
    if document_type:
        query = query.filter(Document.document_type == document_type)
    if status:
        query = query.filter(Document.status == status)

    total = query.count()
    documents = query.offset(skip).limit(min(limit, 100)).all()

    return {
        "documents": documents,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    hard_delete: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    문서 삭제
    """
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if hard_delete:
        db.delete(document)
        logger.info(f"[Documents API] Document hard deleted: {document_id}")
    else:
        document.status = "archived"
        logger.info(f"[Documents API] Document soft deleted: {document_id}")

    db.commit()
```

### 4.6 Editor Action API 구현 (기본)

```python
# app/api/v1/endpoints/editor.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.editor import EditorActionRequest, EditorActionResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/editor/action", response_model=EditorActionResponse)
async def execute_editor_action(
    request: EditorActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Editor Action 실행

    Chat에서 자연어 명령을 받아 Canvas JSON을 업데이트합니다.
    """
    logger.info(
        f"[Editor API] Executing actions for document: {request.document_id}, "
        f"actions: {len(request.actions)}"
    )

    # 문서 조회
    document = db.query(Document).filter(
        Document.id == request.document_id,
        Document.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Canvas JSON 복사
    document_json = document.document_json.copy()
    changes = []

    # 각 Action 실행
    for action in request.actions:
        try:
            apply_action(document_json, action)
            changes.append(f"{action.type} applied to {action.target}")
        except Exception as e:
            logger.error(f"[Editor API] Action failed: {action.type}, error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Action failed: {action.type}, error: {str(e)}"
            )

    # 문서 업데이트
    document.document_json = document_json
    document.version += 1
    db.commit()
    db.refresh(document)

    logger.info(f"[Editor API] Actions completed: {len(request.actions)}")

    return EditorActionResponse(
        document_id=request.document_id,
        applied_actions=len(request.actions),
        document_json=document_json,
        changes_summary="; ".join(changes)
    )


def apply_action(document_json: dict, action):
    """
    개별 Action을 Canvas JSON에 적용
    """
    # 대상 오브젝트 찾기
    targets = find_targets(document_json, action.target)

    if not targets:
        raise ValueError(f"No target found for {action.target}")

    # Action 타입별 처리
    if action.type == "update_font_size":
        for obj in targets:
            if obj.get("type") == "text":
                obj["props"]["fontSize"] = action.payload.get("fontSize")

    elif action.type == "update_color":
        for obj in targets:
            if "fill" in action.payload:
                obj["props"]["fill"] = action.payload["fill"]

    elif action.type == "update_text":
        for obj in targets:
            if obj.get("type") == "text":
                obj["props"]["text"] = action.payload.get("text")

    elif action.type == "move_object":
        for obj in targets:
            obj["bounds"]["x"] = action.payload.get("x", obj["bounds"]["x"])
            obj["bounds"]["y"] = action.payload.get("y", obj["bounds"]["y"])

    elif action.type == "resize_object":
        for obj in targets:
            obj["bounds"]["width"] = action.payload.get("width", obj["bounds"]["width"])
            obj["bounds"]["height"] = action.payload.get("height", obj["bounds"]["height"])

    elif action.type == "delete_object":
        # 삭제는 별도 처리 필요
        pass

    else:
        raise ValueError(f"Unknown action type: {action.type}")


def find_targets(document_json: dict, target):
    """
    Canvas JSON에서 target 조건에 맞는 오브젝트 찾기
    """
    targets = []

    for page in document_json.get("pages", []):
        for obj in page.get("objects", []):
            # ID로 매칭
            if target.id and obj.get("id") == target.id:
                targets.append(obj)
            # role로 매칭
            elif target.role and obj.get("role") == target.role:
                targets.append(obj)
            # type으로 매칭
            elif target.type and obj.get("type") == target.type:
                targets.append(obj)

    return targets
```

---

## 5. P0 작업 단계

### Week 1: Database & Document API (1주)

**목표**: Document 관리 API 완성

- [ ] Alembic migration 작성 (documents, templates 테이블)
- [ ] Document 모델 구현
- [ ] Document Pydantic 스키마 구현
- [ ] Document API 엔드포인트 구현:
  - [ ] POST /api/v1/documents (문서 생성)
  - [ ] GET /api/v1/documents/{id} (문서 조회)
  - [ ] PATCH /api/v1/documents/{id} (문서 업데이트)
  - [ ] GET /api/v1/documents (문서 목록)
  - [ ] DELETE /api/v1/documents/{id} (문서 삭제)
- [ ] pytest 테스트 작성

**산출물**: Document CRUD API 완성

---

### Week 2: Editor Action API (1주)

**목표**: Editor Action API 완성

- [ ] Editor Action Pydantic 스키마 구현
- [ ] Editor Action API 엔드포인트 구현:
  - [ ] POST /api/v1/editor/action (Action 실행)
- [ ] Action 타입별 처리 로직 구현:
  - [ ] update_font_size
  - [ ] update_color
  - [ ] update_text
  - [ ] move_object
  - [ ] resize_object
  - [ ] delete_object
  - [ ] add_object
- [ ] pytest 테스트 작성

**산출물**: Editor Action API 완성

---

### Week 3: Template API (1주)

**목표**: Template 관리 API 완성

- [ ] Template 모델 구현
- [ ] Template Pydantic 스키마 구현
- [ ] Template API 엔드포인트 구현:
  - [ ] GET /api/v1/templates (템플릿 목록)
  - [ ] GET /api/v1/templates/{id} (템플릿 상세)
  - [ ] POST /api/v1/templates/{id}/instantiate (템플릿으로 문서 생성)
- [ ] 기본 템플릿 5개 작성 (Pitch Deck, Product Story, Concept Board 등)
- [ ] pytest 테스트 작성

**산출물**: Template API 완성, 기본 템플릿 5개

---

### Week 4: 통합 테스트 & 최적화 (1주)

**목표**: Frontend 연동 준비 및 최적화

- [ ] Frontend와 통합 테스트
- [ ] API 응답 시간 최적화 (document_json JSONB 인덱싱)
- [ ] 썸네일 생성 기능 (선택사항)
- [ ] API 문서 작성 (Swagger/OpenAPI)
- [ ] 배포 준비

**산출물**: Canvas Studio Backend API 완성

---

## 6. 완료 기준 (DoD)

**P0 완료 시나리오**:
```
1. Frontend에서 "10장짜리 프리젠테이션 만들어줘" 요청
   ↓
2. POST /api/v1/generate (Generator API) - 기존 완료
   ↓
3. POST /api/v1/documents (문서 저장)
   ↓
4. GET /api/v1/documents/{id} (문서 로드)
   ↓
5. Frontend에서 "제목을 빨간색으로 바꿔줘" 요청
   ↓
6. POST /api/v1/editor/action (Editor Action 실행)
   ↓
7. PATCH /api/v1/documents/{id} (문서 업데이트)
   ↓
8. 성공!
```

**통과 기준**:
- ✅ Document CRUD API 모두 동작
- ✅ Editor Action API 7종 동작
- ✅ Template API 동작
- ✅ Frontend 통합 테스트 성공
- ✅ pytest 테스트 커버리지 80% 이상
- ✅ API 응답 시간 < 500ms

---

## 7. 시작하기

### Step 1: 환경 확인

```bash
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate

# 의존성 확인
pip list | grep sqlalchemy
pip list | grep alembic
```

### Step 2: 필독 문서 (총 1시간)

- [ ] 이 문서 (B_TEAM_CANVAS_STUDIO_BACKEND_TASKS.md) 정독 (30분)
- [ ] C_TEAM_WORK_ORDER_CANVAS_STUDIO_v3.md 검토 (Frontend 이해, 30분)

### Step 3: 첫 커밋

```bash
git checkout -b feature/canvas-studio-backend
touch app/api/v1/endpoints/documents.py
touch app/models/document.py
touch app/schemas/document.py
git add .
git commit -m "feat(canvas-studio): Initialize Canvas Studio Backend API structure"
git push origin feature/canvas-studio-backend
```

### Step 4: Week 1 시작

- Alembic migration 작성부터 시작
- Document 모델 구현
- Document API 엔드포인트 구현

---

## 8. 금지 사항

❌ **절대 하지 마세요**:
1. 기존 Generator API 변경
2. P1 기능 구현 (document_history, 자연어 파싱 등)
3. 독단적 스키마 변경
4. 테스트 없이 배포

✅ **반드시 하세요**:
1. 모든 API에 인증 적용 (`get_current_user` Depends)
2. Pydantic 스키마로 입출력 검증
3. 로깅 추가 (`logger.info`, `logger.error`)
4. pytest 테스트 작성 (커버리지 80% 이상)

---

**작성 완료일**: 2025-11-15
**버전**: v1.0
**다음 액션**: B팀 온보딩, 필독 문서 읽기, Week 1 시작

**Good luck, B팀! 🚀**
