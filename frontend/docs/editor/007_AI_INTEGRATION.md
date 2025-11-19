# Canvas Studio v3 — AI Integration

**관련 문서**: [000_MASTER_PLAN.md](./000_MASTER_PLAN.md), [002_DATA_MODEL.md](./002_DATA_MODEL.md), [009_TREND_ENGINE.md](./009_TREND_ENGINE.md)
**작성일**: 2025-11-19

---

## 📋 목차

1. [개요](#개요)
2. [Meeting AI Integration](#meeting-ai-integration)
3. [Spark Chat Integration](#spark-chat-integration)
4. [Auto Template Generator](#auto-template-generator)
5. [EditorCommand 프로토콜](#editorcommand-프로토콜)
6. [API 설계](#api-설계)
7. [Frontend 통합](#frontend-통합)

---

## 개요

### AI 통합의 3가지 축

Canvas Studio v3는 **3가지 AI 기능**을 핵심으로 합니다:

1. **Meeting AI**: 회의록 → 자동 문서 생성
2. **Spark Chat**: 자연어 → 에디터 명령
3. **Auto Template**: 트렌드 패턴 → 템플릿 생성

### 통합 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Interface                                │
│  [Meeting Panel] [Chat Panel] [Template Library]                    │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EditorCommand Protocol                          │
│  (AI → Editor 통신의 표준 인터페이스)                                  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                   ┌───────────┼───────────┐
                   ▼           ▼           ▼
           ┌──────────┐ ┌──────────┐ ┌──────────┐
           │Meeting AI│ │Spark Chat│ │  Trend   │
           │  Engine  │ │  Engine  │ │  Engine  │
           └──────────┘ └──────────┘ └──────────┘
                   │           │           │
                   └───────────┼───────────┘
                               ▼
                    ┌─────────────────────┐
                    │   EditorStore       │
                    │   (Zustand)         │
                    └─────────────────────┘
```

---

## Meeting AI Integration

### 개요

**Meeting AI**는 Sparklio의 가장 강력한 차별화 요소로, **회의 내용을 자동으로 분석하여 마케팅 문서를 생성**합니다.

### 워크플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Meeting Input                                                │
│   사용자가 회의 녹음 또는 회의록 파일 업로드                             │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: Speech-to-Text (if needed)                                  │
│   음성 파일 → 텍스트 변환 (Whisper API)                                │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: Meeting Analysis (LLM)                                      │
│   - 콘텐츠 타입 분류 (Product Detail / Pitch Deck / Ad / Blog)        │
│   - 핵심 결정사항 추출 (액션 아이템, 마일스톤)                           │
│   - 섹션별 콘텐츠 추출 (제목, 부제목, 본문, CTA)                         │
│   - ObjectRole 매핑 (headline, body, product-image, cta-button)      │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 4: Template Selection                                          │
│   - Trend Engine에서 적합한 템플릿 조회                                 │
│   - 브랜드 컨텍스트 로드 (브랜드 ID 기반)                                │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 5: Document Generation                                         │
│   - EditorDocument 생성                                              │
│   - 회의록 내용 → 각 Object에 매핑                                     │
│   - 브랜드 DesignTokens 적용                                          │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 6: Editor 로드                                                  │
│   - Frontend에서 EditorDocument 수신                                 │
│   - EditorStore에 로드                                               │
│   - 사용자는 바로 편집 시작                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### API 엔드포인트

#### POST `/api/v1/meetings/analyze`

```typescript
// Request
interface MeetingAnalysisRequest {
  meetingId?: string;           // 기존 회의 ID (옵션)
  transcript?: string;          // 회의록 텍스트
  audioFile?: File;             // 음성 파일 (옵션)
  brandId?: string;             // 브랜드 ID (옵션)
  contentTypeHint?: string;     // 콘텐츠 타입 힌트 (옵션)
}

// Response
interface MeetingAnalysisResponse {
  meetingId: string;
  summary: {
    contentType: 'product-detail' | 'pitch-deck' | 'ad' | 'blog';
    sections: {
      role: ObjectRole;         // 'headline', 'body', 'cta-button', etc.
      content: string;          // 실제 텍스트 내용
      priority: number;         // 중요도 (1-10)
    }[];
    actionItems: string[];      // 액션 아이템
    brandContext?: {
      brandId: string;
      brandName: string;
    };
  };
  recommendedTemplates: string[];  // 추천 템플릿 ID 목록
}
```

#### POST `/api/v1/meetings/generate-document`

```typescript
// Request
interface GenerateDocumentRequest {
  meetingId: string;
  templateId?: string;          // 특정 템플릿 사용 (옵션)
  brandId?: string;             // 브랜드 ID
  customization?: {
    includeSections?: ObjectRole[];  // 포함할 섹션
    excludeSections?: ObjectRole[];  // 제외할 섹션
  };
}

// Response
interface GenerateDocumentResponse {
  document: EditorDocument;     // 생성된 문서
  templateUsed: string;         // 사용된 템플릿 ID
  generationTime: number;       // 생성 소요 시간 (ms)
}
```

### Backend 구현

```python
# backend/app/api/v1/meetings.py

from fastapi import APIRouter, UploadFile, File
from services.meeting_ai import MeetingAIService
from services.openai_service import OpenAIService

router = APIRouter()

@router.post('/analyze')
async def analyze_meeting(request: MeetingAnalysisRequest):
    """회의록 분석"""

    # 1. 음성 파일이 있으면 STT
    if request.audioFile:
        openai_service = OpenAIService()
        transcript = await openai_service.transcribe_audio(request.audioFile)
    else:
        transcript = request.transcript

    # 2. LLM으로 회의록 분석
    meeting_service = MeetingAIService()
    analysis = await meeting_service.analyze_transcript(
        transcript=transcript,
        brand_id=request.brandId,
        content_type_hint=request.contentTypeHint
    )

    # 3. 추천 템플릿 조회
    recommended_templates = await meeting_service.get_recommended_templates(
        content_type=analysis['contentType'],
        market='kr'  # 브랜드 기반 결정
    )

    return MeetingAnalysisResponse(
        meetingId=request.meetingId or str(uuid.uuid4()),
        summary=analysis,
        recommendedTemplates=recommended_templates
    )

@router.post('/generate-document')
async def generate_document(request: GenerateDocumentRequest):
    """회의록 기반 문서 자동 생성"""
    start_time = time.time()

    # 1. 회의 분석 결과 로드
    meeting = db.query(Meeting).filter(Meeting.id == request.meetingId).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # 2. 브랜드 정보 로드
    brand = db.query(Brand).filter(Brand.id == request.brandId).first()
    brand_tokens = brand.design_tokens if brand else None

    # 3. 템플릿 선택
    if request.templateId:
        template = db.query(TemplateDefinition).filter(
            TemplateDefinition.id == request.templateId
        ).first()
    else:
        # 첫 번째 추천 템플릿 사용
        template_id = meeting.recommended_templates[0]
        template = db.query(TemplateDefinition).filter(
            TemplateDefinition.id == template_id
        ).first()

    # 4. 템플릿 복사 및 내용 채우기
    meeting_service = MeetingAIService()
    document = meeting_service.fill_template_with_meeting_content(
        template=template,
        meeting_summary=meeting.summary,
        brand_tokens=brand_tokens,
        customization=request.customization
    )

    # 5. EditorDocument 메타데이터 설정
    document.source = {
        'kind': 'meeting',
        'sourceId': request.meetingId
    }
    document.templateId = template.id
    document.brandId = request.brandId

    generation_time = (time.time() - start_time) * 1000

    return GenerateDocumentResponse(
        document=document,
        templateUsed=template.id,
        generationTime=generation_time
    )
```

### Meeting AI Service 핵심 로직

```python
# backend/app/services/meeting_ai.py

from typing import Dict, List
from models.editor import EditorDocument, EditorObject, ObjectRole
from services.openai_service import OpenAIService

class MeetingAIService:
    def __init__(self):
        self.openai_service = OpenAIService()

    async def analyze_transcript(
        self,
        transcript: str,
        brand_id: Optional[str] = None,
        content_type_hint: Optional[str] = None
    ) -> Dict:
        """회의록 텍스트 분석"""

        # LLM 프롬프트
        system_prompt = """
        당신은 마케팅 회의록을 분석하여 구조화된 콘텐츠를 추출하는 전문가입니다.

        회의록을 분석하여 다음을 추출하세요:
        1. 콘텐츠 타입 (product-detail, pitch-deck, ad, blog 중 하나)
        2. 섹션별 콘텐츠 (각 섹션의 role과 content)
        3. 액션 아이템

        섹션 role 종류:
        - headline: 주제목
        - subheadline: 부제목
        - body: 본문
        - price: 가격
        - product-image: 제품 이미지 설명
        - cta-button: CTA 버튼 텍스트
        - badge: 배지 텍스트 (예: "NEW", "SALE")

        응답은 JSON 형식으로 반환하세요.
        """

        user_prompt = f"""
        회의록:
        {transcript}

        {f"콘텐츠 타입 힌트: {content_type_hint}" if content_type_hint else ""}
        """

        # OpenAI API 호출
        response = await self.openai_service.chat_completion(
            system=system_prompt,
            user=user_prompt,
            response_format={"type": "json_object"}
        )

        analysis = json.loads(response)

        # 브랜드 컨텍스트 추가
        if brand_id:
            brand = db.query(Brand).filter(Brand.id == brand_id).first()
            if brand:
                analysis['brandContext'] = {
                    'brandId': brand.id,
                    'brandName': brand.name
                }

        return analysis

    def fill_template_with_meeting_content(
        self,
        template: TemplateDefinition,
        meeting_summary: Dict,
        brand_tokens: Optional[DesignTokens] = None,
        customization: Optional[Dict] = None
    ) -> EditorDocument:
        """템플릿을 회의록 내용으로 채우기"""

        # 템플릿 복사
        document = EditorDocument(
            id=str(uuid.uuid4()),
            title=f"Generated from Meeting",
            mode=template.mode,
            pages=[],
            tokens=brand_tokens or template.tokens,
            createdAt=datetime.utcnow().isoformat(),
            updatedAt=datetime.utcnow().isoformat()
        )

        # 각 페이지 복사 및 내용 채우기
        for template_page in template.pages:
            page = EditorPage(
                id=str(uuid.uuid4()),
                name=template_page.name,
                kind=template_page.kind,
                width=template_page.width,
                height=template_page.height,
                objects=[],
                background=template_page.background
            )

            # 각 객체 복사 및 내용 채우기
            for template_obj in template_page.objects:
                obj = self.fill_object_with_content(
                    template_obj=template_obj,
                    meeting_summary=meeting_summary
                )
                page.objects.append(obj)

            document.pages.append(page)

        return document

    def fill_object_with_content(
        self,
        template_obj: EditorObject,
        meeting_summary: Dict
    ) -> EditorObject:
        """단일 객체를 회의록 내용으로 채우기"""

        # 객체 복사
        obj = template_obj.copy(deep=True)

        # role이 있으면 회의록에서 매칭
        if hasattr(obj, 'role') and obj.role:
            matching_section = next(
                (s for s in meeting_summary['sections'] if s['role'] == obj.role),
                None
            )

            if matching_section:
                # TextObject면 텍스트 채우기
                if obj.type == 'text':
                    obj.text = matching_section['content']

                # ImageObject면 플레이스홀더 유지 (사용자가 나중에 업로드)
                elif obj.type == 'image':
                    obj.placeholder = True
                    obj.src = 'placeholder.jpg'

        # source 정보 업데이트
        obj.source = {
            'kind': 'meeting',
            'generatedAt': datetime.utcnow().isoformat()
        }

        return obj
```

---

## Spark Chat Integration

### 개요

**Spark Chat**은 사용자가 **자연어로 에디터를 조작**할 수 있게 하는 AI 어시스턴트입니다.

### 사용 사례

```
사용자: "헤드라인을 더 크게 만들어줘"
→ EditorCommand: UPDATE_STYLE { targetIds: [headline-obj-id], style: { fontSize: 64 } }

사용자: "이 버튼들을 가로로 정렬해줘"
→ EditorCommand: ALIGN_OBJECTS { targetIds: [btn-1, btn-2], alignment: 'horizontal' }

사용자: "제품 이미지를 왼쪽으로 옮겨줘"
→ EditorCommand: UPDATE_POSITION { targetId: product-image-id, x: 100, y: 200 }

사용자: "이번 달 트렌드에 맞는 레이아웃으로 변경해줘"
→ EditorCommand: APPLY_TREND_LAYOUT { market: 'kr', channel: 'instagram' }
```

### API 엔드포인트

#### POST `/api/v1/chat/command`

```typescript
interface ChatCommandRequest {
  documentId: string;           // 현재 문서 ID
  message: string;              // 사용자 메시지
  context?: {
    selectedIds?: string[];     // 현재 선택된 객체 ID
    activePageId?: string;      // 현재 활성 페이지 ID
  };
}

interface ChatCommandResponse {
  commands: EditorCommand[];    // 실행할 명령 목록
  explanation: string;          // AI의 설명
  success: boolean;
}
```

### Backend 구현

```python
# backend/app/api/v1/chat.py

@router.post('/command')
async def parse_chat_command(request: ChatCommandRequest):
    """자연어 메시지 → EditorCommand 변환"""

    # 1. 현재 문서 로드
    document = db.query(EditorDocument).filter(
        EditorDocument.id == request.documentId
    ).first()

    # 2. LLM으로 명령 파싱
    chat_service = SparkChatService()
    commands = await chat_service.parse_natural_language(
        message=request.message,
        document=document,
        context=request.context
    )

    # 3. 명령 실행 (Frontend에서 실행할 수도 있음)
    # executor = CommandExecutor()
    # for command in commands:
    #     executor.execute(command, document)

    return ChatCommandResponse(
        commands=commands,
        explanation=f"'{request.message}' 명령을 {len(commands)}개의 에디터 명령으로 변환했습니다.",
        success=True
    )
```

### Spark Chat Service

```python
# backend/app/services/spark_chat.py

class SparkChatService:
    async def parse_natural_language(
        self,
        message: str,
        document: EditorDocument,
        context: Optional[Dict] = None
    ) -> List[EditorCommand]:
        """자연어 → EditorCommand 파싱"""

        # 문서 컨텍스트 준비
        doc_context = self.prepare_document_context(document, context)

        # LLM 프롬프트
        system_prompt = """
        당신은 에디터 AI 어시스턴트입니다.
        사용자의 자연어 명령을 EditorCommand JSON 배열로 변환하세요.

        사용 가능한 EditorCommand 타입:
        1. UPDATE_STYLE: 스타일 변경 (fontSize, fontWeight, fill 등)
        2. REPLACE_TEXT: 텍스트 교체
        3. SWAP_IMAGE: 이미지 교체
        4. REARRANGE_LAYOUT: 레이아웃 재배치
        5. ALIGN_OBJECTS: 객체 정렬
        6. UPDATE_POSITION: 위치 변경

        예시:
        입력: "헤드라인을 48px로 만들어줘"
        출력: [{"type": "UPDATE_STYLE", "targetIds": ["headline-1"], "style": {"fontSize": 48}}]

        항상 JSON 배열 형식으로 응답하세요.
        """

        user_prompt = f"""
        문서 컨텍스트:
        {json.dumps(doc_context, indent=2)}

        사용자 명령:
        "{message}"

        EditorCommand JSON 배열을 생성하세요.
        """

        # OpenAI API 호출
        response = await self.openai_service.chat_completion(
            system=system_prompt,
            user=user_prompt,
            response_format={"type": "json_object"}
        )

        commands_json = json.loads(response)
        commands = [EditorCommand(**cmd) for cmd in commands_json['commands']]

        return commands

    def prepare_document_context(
        self,
        document: EditorDocument,
        context: Optional[Dict] = None
    ) -> Dict:
        """문서 컨텍스트 준비 (LLM에 전달)"""

        active_page_id = context.get('activePageId') if context else None
        active_page = next(
            (p for p in document.pages if p.id == active_page_id),
            document.pages[0] if document.pages else None
        )

        if not active_page:
            return {}

        # 객체 목록 (role 정보 포함)
        objects_info = []
        for obj in active_page.objects:
            obj_info = {
                'id': obj.id,
                'type': obj.type,
                'role': obj.role if hasattr(obj, 'role') else None,
                'name': obj.name
            }

            # TextObject면 텍스트 내용 포함
            if obj.type == 'text':
                obj_info['text'] = obj.text[:100]  # 최대 100자

            objects_info.append(obj_info)

        # 선택된 객체 정보
        selected_ids = context.get('selectedIds', []) if context else []

        return {
            'documentId': document.id,
            'pageId': active_page.id,
            'objects': objects_info,
            'selectedIds': selected_ids
        }
```

---

## Auto Template Generator

### 개요

**Auto Template Generator**는 Trend Engine의 패턴을 기반으로 **자동으로 템플릿을 생성**합니다.

자세한 내용은 [009_TREND_ENGINE.md](./009_TREND_ENGINE.md)의 "Stage 4: Template Generator" 참고.

### 핵심 API

```typescript
POST /api/v1/templates/auto-generate

Request:
{
  brandId: "nike-kr",
  contentType: "instagram-story",
  market: "kr",
  count: 5,
  trendPreference: "high"
}

Response:
{
  documents: EditorDocument[],   // 5개 변형
  templates_used: string[],
  generation_time: 1234  // ms
}
```

---

## EditorCommand 프로토콜

### 개요

**EditorCommand**는 AI → Editor 통신의 **표준 프로토콜**입니다.

Meeting AI, Spark Chat, Auto Template 모두 EditorCommand를 통해 에디터를 조작합니다.

### 전체 Command 타입

```typescript
// frontend/src/modules/editor/types/commands.ts

export type EditorCommand =
  // 스타일 업데이트
  | {
      type: 'UPDATE_STYLE';
      targetIds: string[];
      style: Partial<EditorObjectBase>;
    }

  // 텍스트 교체
  | {
      type: 'REPLACE_TEXT';
      targetIds: string[];
      text: string;
    }

  // 이미지 교체
  | {
      type: 'SWAP_IMAGE';
      targetId: string;
      imageUrl: string;
    }

  // 레이아웃 재배치
  | {
      type: 'REARRANGE_LAYOUT';
      pageId: string;
      layout: 'grid' | 'stack' | 'hero-left' | 'hero-right';
    }

  // 브랜드 프리셋 적용
  | {
      type: 'APPLY_BRAND_PRESET';
      presetId: string;
    }

  // 객체 추가
  | {
      type: 'ADD_OBJECT';
      pageId: string;
      object: EditorObject;
    }

  // 객체 제거
  | {
      type: 'REMOVE_OBJECT';
      targetIds: string[];
    }

  // 페이지 생성 (템플릿 기반)
  | {
      type: 'CREATE_PAGE_FROM_TEMPLATE';
      templateId: string;
      position?: number;
    }

  // 디자인 토큰 설정
  | {
      type: 'SET_TOKENS';
      tokens: DesignTokens;
    }

  // 🆕 객체 정렬
  | {
      type: 'ALIGN_OBJECTS';
      targetIds: string[];
      alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
    }

  // 🆕 위치 업데이트
  | {
      type: 'UPDATE_POSITION';
      targetId: string;
      x: number;
      y: number;
    }

  // 🆕 트렌드 레이아웃 적용
  | {
      type: 'APPLY_TREND_LAYOUT';
      market: string;
      channel: string;
      format?: string;
    }

  // 🆕 실험 이벤트 로깅 (성과 추적)
  | {
      type: 'LOG_EXPERIMENT_EVENT';
      eventType: 'publish' | 'click' | 'conversion';
      metadata?: Record<string, any>;
    }

  // 🆕 성과 메트릭 첨부
  | {
      type: 'ATTACH_METRICS';
      documentId: string;
      metrics: {
        ctr?: number;
        cvr?: number;
        revenue?: number;
      };
    };
```

### Command Executor

```typescript
// frontend/components/canvas-studio/core/CommandExecutor.ts

import { EditorCommand } from '../types/commands';
import { useEditorStore } from '../stores/useEditorStore';

export class CommandExecutor {
  static execute(command: EditorCommand): void {
    const store = useEditorStore.getState();

    switch (command.type) {
      case 'UPDATE_STYLE':
        store.updateObjectsStyle(command.targetIds, command.style);
        break;

      case 'REPLACE_TEXT':
        store.replaceText(command.targetIds, command.text);
        break;

      case 'SWAP_IMAGE':
        store.swapImage(command.targetId, command.imageUrl);
        break;

      case 'ALIGN_OBJECTS':
        store.alignObjects(command.targetIds, command.alignment);
        break;

      case 'UPDATE_POSITION':
        store.updateObjectPosition(command.targetId, command.x, command.y);
        break;

      case 'APPLY_TREND_LAYOUT':
        // Trend Engine API 호출 → 레이아웃 적용
        this.applyTrendLayout(command.market, command.channel, command.format);
        break;

      // ... 나머지 명령들
    }

    // History 저장
    store.saveHistory();
  }

  static async applyTrendLayout(market: string, channel: string, format?: string): Promise<void> {
    const response = await fetch('/api/v1/templates/auto-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId: useEditorStore.getState().document?.brandId,
        contentType: `${channel}-${format || 'feed'}`,
        market,
        count: 1
      })
    });

    const data = await response.json();
    const newDocument = data.documents[0];

    // 현재 문서를 새 레이아웃으로 교체
    useEditorStore.getState().loadDocument(newDocument);
  }
}
```

---

## API 설계

### API 엔드포인트 목록

```
# Meeting AI
POST   /api/v1/meetings/analyze
POST   /api/v1/meetings/generate-document
GET    /api/v1/meetings/:meetingId

# Spark Chat
POST   /api/v1/chat/command
GET    /api/v1/chat/history/:sessionId

# Auto Template
POST   /api/v1/templates/auto-generate
GET    /api/v1/templates/trending
GET    /api/v1/templates/:templateId

# Trend Engine (Admin)
GET    /api/v1/admin/trends/patterns
GET    /api/v1/admin/trends/learning-plans
POST   /api/v1/admin/trends/learning-plans
PUT    /api/v1/admin/trends/learning-plans/:planId

# Performance Tracking
POST   /api/v1/documents/:documentId/metrics
GET    /api/v1/documents/:documentId/performance
```

---

## Frontend 통합

### Meeting Panel

```typescript
// frontend/components/canvas-studio/layout/RightDock/tabs/MeetingTab.tsx

export function MeetingTab() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);

    // 1. 회의록 분석
    const analysisRes = await fetch('/api/v1/meetings/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        brandId: 'nike-kr'
      })
    });

    const analysis = await analysisRes.json();

    // 2. 문서 자동 생성
    const docRes = await fetch('/api/v1/meetings/generate-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId: analysis.meetingId,
        brandId: 'nike-kr'
      })
    });

    const docData = await docRes.json();

    // 3. Editor에 로드
    useEditorStore.getState().loadDocument(docData.document);

    setLoading(false);
  };

  return (
    <div className="p-4">
      <h3>Meeting AI</h3>
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="회의록을 입력하거나 붙여넣기..."
        className="w-full h-64 p-2 border rounded"
      />
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? '생성 중...' : '문서 자동 생성'}
      </button>
    </div>
  );
}
```

### Chat Panel

```typescript
// frontend/components/canvas-studio/layout/RightDock/tabs/ChatTab.tsx

export function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const document = useEditorStore((state) => state.document);

  const handleSend = async () => {
    if (!input.trim() || !document) return;

    // 사용자 메시지 추가
    setMessages([...messages, { role: 'user', content: input }]);

    // API 호출
    const res = await fetch('/api/v1/chat/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: document.id,
        message: input,
        context: {
          selectedIds: useEditorStore.getState().selectedIds,
          activePageId: useEditorStore.getState().activePageId
        }
      })
    });

    const data = await res.json();

    // 명령 실행
    for (const command of data.commands) {
      CommandExecutor.execute(command);
    }

    // AI 응답 추가
    setMessages([
      ...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: data.explanation }
    ]);

    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <div className="inline-block p-2 rounded bg-gray-100 my-1">
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="에디터에게 명령하기..."
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}
```

---

**문서 버전**: v3.0.0
**마지막 업데이트**: 2025-11-19
