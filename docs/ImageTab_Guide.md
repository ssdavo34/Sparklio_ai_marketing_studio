1. **FRONTEND_ImageTab_v2_SPEC.md** – C팀 프론트엔드 구현용
    
2. **BACKEND_VisionGenerator_Mixboard_API_SPEC.md** – B팀 백엔드/에이전트 구현용
    
3. **IMAGE_PIPELINE_E2E_OVERVIEW.md** – A/B/C 공용 개요 + QA용
    

그대로 복붙해서 `docs/` 아래에 넣고,  
클로드에게 “이 문서들 먼저 읽어라”라고 하면 됩니다.

---

````markdown
# FRONTEND_ImageTab_v2_SPEC.md
버전: v2.0  
작성일: 2025-12-03  
작성자: C팀 레퍼런스용

---

## 1. 목적

Canvas Studio 내 **ImageTab**을 “이미지 전용 챗 + 생성 + 믹스보드 + 에셋 연동” 탭으로 구현한다.

- 텍스트 기반 챗 인터페이스로 이미지를 생성한다.
- 여러 이미지를 한 번에 생성하고, 선택하여:
  - 캔버스에 추가
  - 에셋으로 저장
- 업로드/생성/에셋에서 **Mixboard(참조 보드)** 에 이미지를 모아두고,
  - “모델 사진 + 옷 + 가방 + 신발 → 런던 거리를 걷는 모델” 같은 합성 요청을 할 수 있다.
- 기존 ChatPanel / 다른 탭 / 전역 useChatStore 를 **절대 수정하지 않는다.**
  - ImageTab 전용 상태와 UI만 구현한다.

---

## 2. 범위

### 반드시 수정/추가하는 파일

- `frontend/components/canvas-studio/tabs/ImageTab.tsx`  
  - **전면 재작성** (기존 스켈레톤 폐기)
- `frontend/stores/types/llm.ts`
  - `TextLLMProvider`에 `'gpt-4o-mini'` 추가
  - `ImageLLMProvider`에 `'zimage'` 추가
  - `TEXT_LLM_INFO`, `IMAGE_LLM_INFO` 상수 업데이트
- `frontend/stores/useImageTabStore.ts` (신규)
  - ImageTab 전용 zustand store
- (선택) `frontend/components/canvas-studio/image-tab/` 이하
  - `ImageTabHeader.tsx`
  - `ImageChatList.tsx`
  - `ImagePromptInput.tsx`
  - `MixboardPanel.tsx`
  - 등 UI 컴포넌트 분리용

### 절대 수정 금지

- `ChatPanel.tsx`
- `useChatStore.ts`
- `LeftPanel.tsx`, `RightDock.tsx`
- 다른 탭들: `ConceptBoardTab`, `PresentationTab` 등
- Polotno/Layerhub 등 캔버스 공용 컴포넌트

---

## 3. UI/레이아웃 요구사항

### 3.1 전체 레이아웃

```text
┌───────────────────────────────────────────────┐
│ [헤더]                                       │
│  - 프롬프트 LLM 선택 (Claude/GPT-4o-mini/Qwen)│
│  - 이미지 Provider 선택 (z-image/ComfyUI/…)  │
│  - 사이즈(비율) 선택 (1:1, 16:9, 9:16, 4:3)   │
├───────────────────────────────────────────────┤
│ [중앙] 채팅 타임라인                          │
│  - 유저 메시지 (텍스트)                        │
│  - AI 메시지 (텍스트)                          │
│  - 이미지 결과 메시지 (텍스트 + 썸네일 그리드)  │
│  - 상태/에러 메시지                            │
├───────────────────────────────────────────────┤
│ [하단 영역]                                   │
│  좌측: 프롬프트 입력 + 액션 버튼               │
│   - 텍스트 입력창                              │
│   - [텍스트만] 버튼                            │
│   - [이미지 생성] 버튼                         │
│   - (체크박스) [이 메시지로 이미지 생성도 하기] │
│                                               │
│  우측: Mixboard 패널                           │
│   - Mixboard 타이틀                            │
│   - [업로드] 버튼                              │
│   - “최근 생성에서 추가” 드롭다운/버튼          │
│   - 참고 이미지 카드 그리드                    │
└───────────────────────────────────────────────┘
````

---

## 4. 상태/스토어 설계 (`useImageTabStore`)

파일: `frontend/stores/useImageTabStore.ts`

```ts
import { create } from 'zustand';
import type { TextLLMProvider, ImageLLMProvider } from './types/llm';

export type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16';

export type ImageChatRole = 'user' | 'assistant' | 'system';

export type ImageChatMessage =
  | {
      id: string;
      role: ImageChatRole;
      type: 'text';
      content: string;
      createdAt: string;
    }
  | {
      id: string;
      role: 'assistant';
      type: 'image-result';
      content: string;      // "이 프롬프트로 4장을 생성했어요" 등 설명
      imageIds: string[];   // ImageResult.id 리스트
      status: 'pending' | 'done' | 'error';
      createdAt: string;
    }
  | {
      id: string;
      role: 'system';
      type: 'status';
      content: string;      // "z-image 서버 응답 지연..." 등
      createdAt: string;
    };

export type MixRole =
  | 'model'
  | 'top'
  | 'bottom'
  | 'bag'
  | 'shoes'
  | 'hair'
  | 'background'
  | 'style'
  | 'other';

export type MixRefSource = 'upload' | 'generated' | 'asset';

export type MixRefImage = {
  id: string;
  sourceType: MixRefSource;
  imageResultId?: string;
  assetId?: string;
  uploadId?: string;
  url: string;
  role: MixRole;
  weight: number; // 0~1 or 0~100
  metadata?: {
    width?: number;
    height?: number;
    fileName?: string;
  };
};

export type ImageResultStatus = 'generated' | 'saving' | 'saved' | 'error';

export type ImageResult = {
  id: string;
  tempUrl: string;          // 생성 직후 URL (백엔드 응답)
  assetId?: string;         // 저장 후 에셋 ID
  status: ImageResultStatus;
  provider: ImageLLMProvider;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  promptRaw: string;        // 유저 원문
  promptFinal: string;      // LLM 최종 프롬프트(영어)
  seed?: number;
};

type ReplyContext = {
  basedOnImageId?: string;
};

type ImageTabState = {
  // 설정
  selectedPromptLLM: TextLLMProvider;
  selectedImageProvider: ImageLLMProvider;
  selectedSize: AspectRatio;

  // 챗
  messages: ImageChatMessage[];

  // 이미지 결과
  images: ImageResult[];

  // 선택 상태
  selectedForCanvas: Set<string>;
  selectedForSave: Set<string>;

  // 입력창
  inputValue: string;
  replyContext?: ReplyContext;
  isGenerating: boolean;

  // Mixboard
  mixRefs: MixRefImage[];

  // 액션들 (대표적인 것만, 나머지는 구현 시 보강)
  setInputValue: (value: string) => void;
  sendTextOnly: () => Promise<void>;
  sendWithImageGeneration: () => Promise<void>;
  toggleSelectForCanvas: (id: string) => void;
  toggleSelectForSave: (id: string) => void;
  addImagesToCanvas: (ids: string[], options?: { autoSaveIfNeeded?: boolean }) => Promise<void>;
  saveSelectedImages: () => Promise<void>;
  addToMixboardFromUpload: (file: File) => Promise<void>;
  addToMixboardFromImageResult: (id: string, defaultRole?: MixRole) => void;
};
```

> 실제 구현 시 액션 메서드는 필요에 따라 추가/세분화.

---

## 5. LLM/Provider 선택 로직

### 5.1 `llm.ts` 변경

파일: `frontend/stores/types/llm.ts`

- `TextLLMProvider`에 `'gpt-4o-mini'` 추가
    
- `ImageLLMProvider`에 `'zimage'` 추가
    

예시:

```ts
export type TextLLMProvider =
  | 'claude-3.5-sonnet'
  | 'gpt-4o'
  | 'gpt-4o-mini'   // 신규
  | 'qwen2.5-14b';

export type ImageLLMProvider =
  | 'zimage'        // 신규 (Backend VisionGeneratorAgent에서 이미 구현)
  | 'comfyui'
  | 'nanobanana';
```

`TEXT_LLM_INFO`, `IMAGE_LLM_INFO` 상수에 displayName 및 provider 등 정보 추가.

---

## 6. 주요 플로우

### 6.1 텍스트만 질문 플로우

1. `sendTextOnly()` 호출
    
2. `messages`에 `user/text` 추가
    
3. 선택된 `selectedPromptLLM`으로 텍스트 LLM 호출
    
4. 응답을 `assistant/text` 메시지로 추가
    

> 이 때 이미지 생성은 하지 않음.

---

### 6.2 텍스트 + 이미지 생성 플로우

1. `sendWithImageGeneration()` 호출
    
2. `messages`에 `user/text` 추가
    
3. `selectedPromptLLM`, `mixRefs`, `history` 등을 포함해 백엔드 텍스트 LLM(또는 Gateway) 호출:
    
    - 목적: 영어 최종 프롬프트/파라미터 생성
        
4. `assistant/image-result(pending)` 메시지를 추가:
    
    - `status = 'pending'`
        
    - `imageIds = []`
        
5. `useImageGeneration` hook 또는 `vision-generator-api` 통해 이미지 생성 API 호출
    
6. 응답으로 받은 이미지들을 `ImageResult[]`로 변환하여 store에 추가
    
7. 방금 추가된 이미지들의 ID를 `imageIds`로 연결하고,
    
    - `status = 'done'`으로 업데이트
        

에러 시:

- `assistant/status` 메시지로 안내
    
- `image-result` 메시지 `status = 'error'` 설정
    

---

### 6.3 캔버스에 추가 플로우

- 카드 개별: `캔버스에 추가` 버튼
    
- 하단 글로벌 버튼: `선택한 이미지 캔버스에 추가`
    

동작:

1. 아직 `assetId` 없는 이미지일 경우:
    
    - 옵션: `autoSaveIfNeeded = true`이면 먼저 에셋 저장 API 호출
        
    - 성공 시 `assetId` 업데이트
        
2. 캔버스에 이미지 레이어 추가:
    
    - 기존에 존재하는 “이미지 추가” 헬퍼 사용
        
    - 파라미터로 `imageUrl` 또는 `assetId` 전달
        
3. 실패 시:
    
    - `assistant/status` 메시지 + 토스트 표시
        

---

### 6.4 에셋 저장 플로우

버튼: `선택한 이미지 저장`

1. `selectedForSave` 집합에서 ID 추출
    
2. 해당 `ImageResult`들을 모아 백엔드 `/assets/images/batch` 호출
    
    - 구체 스펙은 `BACKEND_VisionGenerator_Mixboard_API_SPEC.md` 참고
        
3. 응답으로 assetId / 최종 URL / 썸네일 URL 받으면:
    
    - `ImageResult.status = 'saved'`
        
    - `ImageResult.assetId = ...`
        
4. 실패한 항목은 `status = 'error'`로 표시
    

---

### 6.5 Mixboard 플로우

#### 6.5.1 업로드

- Mixboard 오른쪽 상단: `[업로드]` 버튼
    
- 파일 선택 → 로컬에서 임시 URL 생성 (`URL.createObjectURL`)
    
- `mixRefs`에 `sourceType='upload'`로 추가
    
- (백엔드 업로드는 이미지 생성 시점에 따라 B팀 설계 반영)
    

#### 6.5.2 생성된 이미지에서 추가

- 각 이미지 카드에 `Mixboard에 추가` 버튼
    
- 클릭 시:
    
    - `mixRefs`에 `sourceType='generated'`, `imageResultId=...`로 추가
        
    - 기본 역할: `style` 또는 유저가 선택한 role
        

#### 6.5.3 채팅/이미지 생성 시 Mixboard 전달

- `sendWithImageGeneration()` 내에서
    
    - 현재 `mixRefs`를 `mix_refs` 배열로 변환해 백엔드에 전달
        
    - `{ url, role, weight }` 구조
        
- LLM/에이전트는 이 정보를 활용해 프롬프트와 이미지 생성 파라미터를 구성
    

---

## 7. 컴포넌트 구조 제안

필수는 아니지만, 유지보수와 가독성을 위해 분리 권장.

- `ImageTab.tsx`
    
    - 전체 레이아웃 구성
        
    - store와 서브 컴포넌트 조립
        
- `image-tab/ImageTabHeader.tsx`
    
    - LLM/Provider/사이즈 선택 UI
        
- `image-tab/ImageChatList.tsx`
    
    - `messages` 렌더링
        
    - `type='image-result'`일 때 썸네일 그리드 렌더링
        
- `image-tab/ImagePromptInput.tsx`
    
    - 입력창 + 버튼들
        
- `image-tab/MixboardPanel.tsx`
    
    - Mixboard UI/역할/가중치 설정
        

---

## 8. Mock / Demo 모드

데모 안정성을 위해, Backend에서 mock 모드 지원 시:

- 환경변수 `IMAGE_MOCK_MODE=1` 가 설정되면:
    
    - 실제 VisionGenerator 대신 mock 이미지셋을 반환
        
- 프론트에서는:
    
    - 헤더 오른쪽에 작은 배지:
        
        - `[DEMO MODE] Mock 이미지`
            

C팀 측에서는:

- 단순히 백엔드 응답을 그대로 렌더링하면 되고,
    
- Mock 여부는 “UI 표시만” 담당.
    

---

## 9. TODO 체크리스트 (C팀)

1. `llm.ts`에 `gpt-4o-mini`, `zimage` 타입 추가
    
2. `useImageTabStore.ts` 신규 생성
    
3. `ImageTab.tsx` 전면 재작성
    
4. 기본 플로우:
    
    - 텍스트만 Q&A
        
    - 텍스트 + 이미지 생성
        
    - 이미지 카드 리스트 렌더링
        
5. 선택 후:
    
    - 캔버스에 추가
        
    - 에셋 저장
        
6. Mixboard:
    
    - 업로드/생성에서 추가
        
    - 역할/가중치 편집
        
    - 이미지 생성 요청에 `mix_refs` 전달
        
7. 로딩/에러 상태 표시
    

이 문서를 C팀 세션 시작 전에 읽힌 뒤,  
B팀 스펙(`BACKEND_VisionGenerator_Mixboard_API_SPEC.md`)과 맞춰 구현을 진행한다.

````

---

```markdown
# BACKEND_VisionGenerator_Mixboard_API_SPEC.md
버전: v1.0  
작성일: 2025-12-03  
작성자: B팀 레퍼런스용

---

## 1. 목적

- ImageTab v2에서 필요한 백엔드 기능/계약을 정의한다.
- 핵심:
  - 프롬프트 LLM + VisionGeneratorAgent 호출 시 `mix_refs` 지원
  - 이미지 배치 생성 응답 구조 통일
  - 생성된 이미지를 에셋으로 저장하는 `/assets/images/batch` API 정의
  - (선택) 벡터라이징(텍스트/이미지 임베딩) 워커 큐 구조

---

## 2. Vision Generation API

### 2.1 요청 스키마

엔드포인트 예시:

- `POST /api/v1/vision/generate`  
  (기존 엔드포인트가 있다면 v2 스펙으로 확장)

요청 Body 예시 (JSON):

```json
{
  "prompt_raw": "런던 거리를 걷고 있는 모델을 만들어줘. 함께한 이미지를 모두 적용해서.",
  "prompt_final": "A fashion model walking down a London street, wearing ...",
  "provider": "zimage",
  "width": 1024,
  "height": 1024,
  "num_images": 4,
  "project_id": "proj_123",
  "brand_id": "brand_456",
  "mix_refs": [
    {
      "url": "https://.../mix/model.png",
      "role": "model",
      "weight": 1.0
    },
    {
      "url": "https://.../mix/top.png",
      "role": "top",
      "weight": 0.9
    },
    {
      "url": "https://.../mix/bag.png",
      "role": "bag",
      "weight": 0.7
    },
    {
      "url": "https://.../mix/shoes.png",
      "role": "shoes",
      "weight": 0.8
    }
  ]
}
````

필드 설명:

- `prompt_raw`: 유저 한국어 원문 (로그/분석용)
    
- `prompt_final`: 텍스트 LLM이 생성한 영어 프롬프트
    
- `provider`: `zimage` | `comfyui` | `nanobanana`
    
- `width`, `height`: 최종 목표 해상도
    
    - provider에서 직접 지원하지 못하면 내부에서 가까운 비율로 생성 후 크롭/패딩
        
- `num_images`: 생성 이미지 개수
    
- `mix_refs`: Mixboard에서 온 참조 이미지 목록
    
    - `url`: 백엔드에서 직접 접근 가능한 URL
        
        - 업로드의 경우, 사전 업로드 or 임시 버킷에 저장된 URL
            
    - `role`: `model`, `top`, `bottom`, `bag`, `shoes`, `hair`, `background`, `style`, `other`
        
    - `weight`: 0~1.0 (가중치)
        

---

### 2.2 응답 스키마

```json
{
  "generation_id": "gen_abc",
  "provider": "zimage",
  "images": [
    {
      "id": "img_1",
      "url": "https://.../tmp/gen_abc_1.png",
      "width": 1024,
      "height": 1024,
      "seed": 123456,
      "metadata": {
        "provider_raw": {
          "cfg_scale": 7,
          "steps": 30
        }
      }
    },
    {
      "id": "img_2",
      "url": "https://.../tmp/gen_abc_2.png",
      "width": 1024,
      "height": 1024,
      "seed": 987654,
      "metadata": {}
    }
  ]
}
```

- `url`: **임시 URL** (에셋 저장 전)
    
    - C팀은 이 URL을 그대로 썸네일/이미지에 사용
        
    - 에셋 저장 시 B팀 `/assets/images/batch` API에 다시 전달
        

---

## 3. Mixboard 지원 – VisionGeneratorAgent 내부 처리

### 3.1 공통 처리

- `mix_refs`가 존재할 때:
    
    - LLM 또는 프롬프트 빌더가 `prompt_final`을 생성할 때  
        다음 정보를 이용:
        
        - 어떤 역할의 이미지들이 있는지
            
        - 역할별 가중치
            
    - 예:  
        `"Use the provided reference images: model, clothes, bag, shoes. Preserve the outfit and bag from the references while changing only the background to a London street."`
        

### 3.2 Provider별 처리 전략

#### zimage

- SDXL 또는 유사 모델 기반:
    
    - 가능한 경우 IP-Adapter / ControlNet에 `mix_refs` 반영
        
    - 역할별로 다른 노드에 매핑 가능 (추후 구현)
        

초기 버전(데모용):

- `mix_refs`를 프롬프트 강화에만 사용
    
- 이미지 자체는 텍스트 기반으로 생성
    

#### comfyui

- ComfyUI 워크플로우에서:
    
    - `role='model'` → 인체/포즈 ControlNet
        
    - `role='top'/'bottom'/'bag'/'shoes'` → IP-Adapter 또는 이미지 마스크 기반 합성
        
    - `role='background'/'style'` → 스타일/배경 ControlNet
        
- `weight`는 각 노드의 strength 파라미터와 매핑
    
- 최소 버전:
    
    - `mix_refs`의 첫 이미지 하나를 전체 스타일 레퍼런스로 사용
        
    - 추후 역할/가중치별 세분화
        

#### nanobanana

- 제약이 크다고 가정:
    
    - `mix_refs`를 텍스트 프롬프트 강화용으로만 사용
        
    - 실제 이미지 참조 기능은 없을 수 있음
        

---

## 4. 이미지 에셋 저장 API

### 4.1 엔드포인트

- `POST /api/v1/assets/images/batch`
    

### 4.2 요청 Body

```json
{
  "project_id": "proj_123",
  "items": [
    {
      "temp_url": "https://.../tmp/gen_abc_1.png",
      "prompt_raw": "런던 거리를 걷는 모델...",
      "prompt_final": "A fashion model walking down a London street...",
      "provider": "zimage",
      "provider_model": "sdxl-1.0",
      "width": 1024,
      "height": 1024,
      "aspect_ratio": "1:1",
      "seed": 123456,
      "generation_id": "gen_abc",
      "source": "image_tab"
    }
  ]
}
```

- `temp_url`: VisionGenerator 응답값 `url`
    
- `source`: `'image_tab'` 고정 (ImageTab에서 저장한 자산)
    

### 4.3 응답 Body

```json
{
  "items": [
    {
      "temp_url": "https://.../tmp/gen_abc_1.png",
      "status": "ok",
      "asset_id": "asset_1",
      "image_url": "https://.../images-original/2025/12/03/asset_1.png",
      "thumbnail_url": "https://.../images-thumb/2025/12/03/asset_1.jpg"
    }
  ]
}
```

- 실패 시:
    

```json
{
  "items": [
    {
      "temp_url": "https://.../tmp/gen_abc_1.png",
      "status": "error",
      "error_message": "download_failed"
    }
  ]
}
```

---

## 5. DB 스키마 (요약)

### 5.1 assets 테이블 (이미지 핵심 필드)

```sql
CREATE TABLE assets (
  id              UUID PRIMARY KEY,
  project_id      UUID NOT NULL,
  type            TEXT NOT NULL,        -- 'image'
  source          TEXT NOT NULL,        -- 'image_tab', 'video_storyboard', ...
  original_url    TEXT NOT NULL,
  thumbnail_url   TEXT NOT NULL,
  width           INT,
  height          INT,
  aspect_ratio    TEXT,                 -- '1:1', '16:9', ...
  provider        TEXT,
  provider_model  TEXT,
  prompt_raw      TEXT,
  prompt_final    TEXT,
  seed            BIGINT,
  metadata        JSONB,
  parent_asset_id UUID NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID NULL
);
```

### 5.2 image_embeddings (선택)

```sql
CREATE TABLE image_embeddings (
  asset_id  UUID PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL
);
```

---

## 6. 워커/벡터라이징 플로우 (옵션)

1. `POST /assets/images/batch`에서 에셋 생성 완료 후:
    
    - `IMAGE_EMBEDDING_QUEUE`에 `asset_id` push
        
2. Worker:
    
    - `original_url`에서 이미지 다운로드
        
    - 텍스트 임베딩:
        
        - `prompt_final` 기준 OpenAI or 로컬 임베딩 모델 사용
            
    - 이미지 임베딩(선택):
        
        - CLIP 계열 모델로 이미지 자체 임베딩
            
    - `image_embeddings` 테이블에 upsert
        

---

## 7. Mock / Demo 모드

- 환경 변수:
    
    - `IMAGE_MOCK_MODE=1` 일 경우:
        
        - `/vision/generate`에서 실제 모델 호출 대신 predefined mock 이미지셋 반환
            
    - `VIDEO_MOCK_IMAGES`와 동일한 패턴으로 구현 가능
        
- C팀은 Mock 여부를 UI에서 배지만 표시
    

---

## 8. TODO 체크리스트 (B팀)

1. `POST /vision/generate` 요청 스키마에 `mix_refs` 필드 추가
    
2. VisionGeneratorAgent에서 provider별 `mix_refs` 처리 전략 구현 (최소한 프롬프트 강화)
    
3. 임시 URL 발급/관리 (MinIO or 임시 경로)
    
4. `POST /assets/images/batch` 엔드포인트 구현
    
    - temp_url 다운로드 → original/thumbnail 업로드 → DB insert
        
    - 벡터라이징 워커 큐 push
        
5. (옵션) image_embeddings 테이블 + Worker 구현
    
6. Mock 모드 지원
    

이 문서와 C팀 스펙을 기준으로,  
A팀은 E2E 흐름과 QA 시나리오를 `IMAGE_PIPELINE_E2E_OVERVIEW.md` 를 바탕으로 설계한다.

````

---

```markdown
# IMAGE_PIPELINE_E2E_OVERVIEW.md
버전: v1.0  
작성일: 2025-12-03  

---

## 1. 목적

Canvas Studio의 ImageTab v2를 중심으로:

- 유저 입력 → LLM → 이미지 생성 → 선택 → 캔버스/에셋 저장 → 검색/재활용까지
- 전체 흐름을 A/B/C팀 공통 언어로 정리한다.

---

## 2. E2E 플로우 (요약)

### 2.1 기본 이미지 생성

```mermaid
sequenceDiagram
  participant U as User
  participant CFE as Canvas FE (ImageTab)
  participant AG as Prompt LLM / Gateway
  participant VG as VisionGeneratorAgent
  participant AS as AssetService (optional)

  U->>CFE: "런던 거리를 걷는 모델을 만들어줘"
  CFE->>CFE: messages에 user/text 추가
  CFE->>AG: prompt_raw + history + mix_refs
  AG-->>CFE: prompt_final, num_images, provider, size
  CFE->>VG: VisionGenerationRequest (prompt_final + mix_refs + provider...)
  VG-->>CFE: images (temp_url[], generation_id)
  CFE->>CFE: ImageResult[] 저장, image-result 메시지 업데이트
  U->>CFE: 일부 이미지 선택 → "캔버스에 추가" / "저장"
  CFE->>AS: (선택) /assets/images/batch
  AS-->>CFE: asset_id + image_url + thumbnail_url
  CFE->>Canvas: 선택 이미지 레이어 추가
````

---

### 2.2 Mixboard 기반 생성

```mermaid
sequenceDiagram
  participant U as User
  participant CFE as ImageTab + Mixboard
  participant AG as Prompt LLM
  participant VG as VisionGeneratorAgent

  U->>CFE: 모델/옷/가방/신발 이미지 업로드/추가 (Mixboard)
  U->>CFE: "모든 이미지를 적용해서, 런던 거리를 걷는 모델을 만들어줘"
  CFE->>AG: history + prompt_raw + mix_refs 정보
  AG-->>CFE: prompt_final (레퍼런스 반영된 영어 프롬프트)
  CFE->>VG: VisionGenerationRequest (prompt_final + mix_refs)
  VG-->>CFE: images (temp_url[])
  CFE->>CFE: ImageResult[] 저장, image-result 메시지에 묶어서 표시
```

---

## 3. 팀별 책임 범위

### 3.1 C팀 (Frontend)

- ImageTab v2 UI/스토어/플로우 구현
    
- Mixboard UI/상태 관리
    
- VisionGenerator 및 Assets API 호출
    
- 캔버스와의 연결 (이미지 레이어 추가)
    
- Mock 모드 UI 배지
    

### 3.2 B팀 (Backend/Agents)

- VisionGenerationRequest 스키마 관리 (`mix_refs` 포함)
    
- VisionGeneratorAgent provider별 구현 (zimage/comfyui/nanobanana)
    
- `/assets/images/batch` 구현 및 MinIO/DB 저장
    
- (옵션) 임베딩/벡터라이징 Worker
    

### 3.3 A팀 (QA/데모/문서)

- 데모 시나리오 구성:
    
    - “모델+옷+가방+신발 → 런던 거리” 시나리오
        
    - 브랜드/프로젝트 단위 에셋 재활용 시나리오
        
- E2E 테스트 케이스 정리:
    
    - 생성 실패/타임아웃
        
    - Mock 모드
        
    - Mixboard 없는 일반 생성
        
    - Mixboard + 다양한 role 조합
        
- 발표용 자료/스크립트 작성
    

---

## 4. 대표 데모 시나리오

### 시나리오 A: 단순 이미지 생성 + 캔버스 배치

1. ImageTab에서:
    
    - 프롬프트 LLM: Claude 3.5 Sonnet
        
    - 이미지 Provider: z-image
        
    - 사이즈: 1:1
        
2. 유저:
    
    > “브랜드 로고를 사용하는 미니멀한 제품 사진 4장 만들어줘”
    
3. ImageTab:
    
    - 챗 응답 + 이미지 4장 생성
        
4. 유저:
    
    - 2장 선택 → “캔버스에 추가”
        
5. Canvas:
    
    - 선택 이미지를 슬라이드/상세페이지 템플릿에 배치
        

### 시나리오 B: Mixboard – 모델/옷/가방/신발

1. Mixboard에:
    
    - 모델 전신 사진 업로드 (`role=model`)
        
    - 코트 사진 업로드 (`role=top`)
        
    - 가방 사진 업로드 (`role=bag`)
        
    - 신발 사진 업로드 (`role=shoes`)
        
2. 유저:
    
    > “Mixboard의 이미지를 모두 적용해서, 런던 거리를 걷고 있는 모델을 만들어줘”
    
3. ImageTab:
    
    - prompt LLM 호출 → 영어 프롬프트 + num_images = 2
        
    - VisionGenerator로 요청
        
    - 결과 이미지 2장 표시
        
4. 유저:
    
    - 마음에 드는 1장 저장 + 캔버스에 추가
        
5. Asset 페이지:
    
    - 방금 저장한 이미지를 “프로젝트 이미지”로 재사용 가능
        

---

## 5. QA 체크 포인트 (요약)

-  ImageTab에서 텍스트 Q&A만 사용 시 이미지 생성이 일어나지 않는다.
    
-  이미지 생성 중에는 상태 표시 (`생성 중...`)가 보인다.
    
-  여러 장 생성 후, 일부만 선택해서 캔버스/저장이 가능하다.
    
-  저장된 이미지는 Asset “이미지” 탭에서 조회된다.
    
-  Mixboard에 이미지가 없을 때도 정상 동작한다.
    
-  Mixboard에 여러 role이 설정된 상태에서 이미지 생성이 실패하지 않는다.
    
-  Mock 모드에서 실제 모델 호출 없이 데모가 가능하다.
    

---

이 문서 세트:

- `FRONTEND_ImageTab_v2_SPEC.md`
    
- `BACKEND_VisionGenerator_Mixboard_API_SPEC.md`
    
- `IMAGE_PIPELINE_E2E_OVERVIEW.md`
    

를 기준으로 클로드에게:

> “이 세 문서를 먼저 읽고, 구현 계획과 코드를 작성해라”
