# EDITOR_ENGINE_IMPLEMENTATION.md
Sparklio V4 — Editor Engine 구현 가이드
작성일: 2025-11-15
작성자: A팀 (Infrastructure Team)

---

# 1. 목적

이 문서는 [007.EDITOR_CONTEXT_MODEL.md](K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\Agent정의\007.EDITOR_CONTEXT_MODEL.md)의
**개념 모델을 실제 구현 가능한 코드로 변환**하는 상세 가이드입니다.

Sparklio Editor는 브로셔, 프레젠테이션, SNS 이미지, 상세페이지 등
**모든 시각적 결과물의 편집을 자연어로 수행**할 수 있게 합니다.

---

# 2. Editor Engine 아키텍처

```
User Natural Language Command
         ↓
  Command Parser (NLU)
         ↓
  CommandContext
         ↓
CanvasContext + EditorRules + HistoryContext
         ↓
  Target Selection Algorithm
         ↓
  Action Builder
         ↓
  Action JSON List
         ↓
Canvas Update Manager (Frontend)
```

---

# 3. 핵심 구성요소

## 3.1 CanvasContext

Fabric.js Canvas JSON을 파싱한 구조화 데이터.

### Schema
```python
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CanvasObject(BaseModel):
    id: str
    type: str  # "textbox" | "image" | "rect" | "circle" | "group"
    left: float
    top: float
    width: Optional[float] = None
    height: Optional[float] = None
    zIndex: int
    meta: Optional[Dict[str, Any]] = None  # {"layerType": "title", "brandLinked": true}

    # Type-specific fields
    text: Optional[str] = None  # for textbox
    fontSize: Optional[int] = None
    fill: Optional[str] = None  # color
    src: Optional[str] = None  # for image

class CanvasBackground(BaseModel):
    type: str  # "color" | "image"
    value: str  # "#FFFFFF" or image URL

class CanvasSize(BaseModel):
    width: int
    height: int

class CanvasContext(BaseModel):
    objects: List[CanvasObject]
    background: CanvasBackground
    size: CanvasSize
    page_index: Optional[int] = None  # for multi-page documents
```

---

## 3.2 CommandContext

자연어 명령을 파싱한 결과.

### Schema
```python
class CommandContext(BaseModel):
    raw: str  # 원본 명령
    action_type: str  # "change_font_size" | "set_color" | "move" | etc.
    target_type: str  # "text" | "image" | "group" | "background"
    target_hint: Optional[str] = None  # "title" | "headline" | "body" | "icon"
    target_selector: Optional[Dict[str, Any]] = None  # {"id": "text_001"}
    value: Optional[Dict[str, Any]] = None  # {"delta": 8} or {"color": "#FF5733"}
```

---

## 3.3 EditorRules

브랜드/템플릿/시스템 수준 규칙.

### Schema
```python
class BrandRules(BaseModel):
    allowed_colors: List[str]
    primary_font: str
    secondary_font: Optional[str] = None
    button_layout_locked: bool = False

class SystemRules(BaseModel):
    safe_mode: bool = True  # 파괴적 변경 금지
    max_resolution: Optional[Dict[str, int]] = None  # {"width": 4096, "height": 4096}
    auto_line_break: bool = True

class TemplateRules(BaseModel):
    min_margin: int = 20  # px
    hierarchy_locked: bool = True  # 제목·부제·본문 계층 유지

class EditorRules(BaseModel):
    brand: BrandRules
    system: SystemRules
    template: TemplateRules
```

---

## 3.4 HistoryContext

Undo/Redo 이력.

### Schema
```python
class HistoryItem(BaseModel):
    action: Dict[str, Any]
    timestamp: datetime
    description: str

class HistoryContext(BaseModel):
    undo_stack: List[HistoryItem] = []
    redo_stack: List[HistoryItem] = []
    version: int = 0
```

---

# 4. EditorAgent 입출력

## 4.1 Input Schema

```python
class EditorInput(BaseModel):
    canvas: CanvasContext
    command: CommandContext  # 이미 파싱된 명령
    brandkit: Optional[Dict[str, Any]] = None
    rules: EditorRules
    history: HistoryContext
```

---

## 4.2 Output Schema

```python
class EditorAction(BaseModel):
    type: str  # "set_property" | "move" | "resize" | etc.
    target: str  # object ID
    property: Optional[str] = None  # "fontSize" | "fill" | "left"
    value: Any
    metadata: Optional[Dict[str, Any]] = None

class EditorOutput(BaseModel):
    actions: List[EditorAction]
    metadata: Dict[str, Any]
    confidence: float  # 0-1
    error: Optional[str] = None
```

---

# 5. Command Parser (NLU) 구현

자연어 명령 → CommandContext 변환.

## 5.1 키워드 기반 파서 (빠름)

```python
class CommandParser:
    ACTION_KEYWORDS = {
        "change_font_size": ["크게", "작게", "글자 크기", "폰트 크기"],
        "set_color": ["색상", "컬러", "바꿔", "색"],
        "move": ["이동", "옮겨", "위로", "아래로"],
        "align": ["정렬", "가운데", "왼쪽", "오른쪽"],
        "set_text": ["텍스트", "글자", "내용"],
    }

    TARGET_KEYWORDS = {
        "title": ["제목", "타이틀", "헤드라인"],
        "body": ["본문", "내용"],
        "button": ["버튼", "CTA"],
    }

    def parse(self, raw_command: str) -> CommandContext:
        action_type = self._detect_action(raw_command)
        target_hint = self._detect_target(raw_command)
        value = self._extract_value(raw_command, action_type)

        return CommandContext(
            raw=raw_command,
            action_type=action_type,
            target_type="text",  # 기본값
            target_hint=target_hint,
            value=value
        )

    def _detect_action(self, command: str) -> str:
        for action, keywords in self.ACTION_KEYWORDS.items():
            if any(kw in command for kw in keywords):
                return action
        return "unknown"

    def _detect_target(self, command: str) -> Optional[str]:
        for target, keywords in self.TARGET_KEYWORDS.items():
            if any(kw in command for kw in keywords):
                return target
        return None

    def _extract_value(self, command: str, action_type: str) -> Optional[Dict]:
        if action_type == "change_font_size":
            if "크게" in command:
                return {"delta": 8}
            elif "작게" in command:
                return {"delta": -8}

        if action_type == "set_color":
            # 색상 이름 추출 (간단한 예시)
            if "빨간색" in command:
                return {"color": "#FF0000"}
            elif "파란색" in command:
                return {"color": "#0000FF"}

        return None
```

---

## 5.2 LLM 기반 파서 (정확함)

```python
from app.integrations.ollama_client import OllamaClient

class LLMCommandParser:
    def __init__(self, llm_client: OllamaClient):
        self.llm = llm_client

    async def parse(self, raw_command: str) -> CommandContext:
        prompt = f"""
        Parse the following user command for a canvas editor.

        Command: "{raw_command}"

        Extract:
        - action_type: (e.g., "change_font_size", "set_color", "move", "align")
        - target_hint: (e.g., "title", "body", "button")
        - value: (e.g., {{"delta": 8}}, {{"color": "#FF0000"}})

        Return JSON only.
        """

        response = await self.llm.generate(model="qwen2.5-7b", prompt=prompt)

        # JSON 파싱
        import json
        parsed = json.loads(response)

        return CommandContext(
            raw=raw_command,
            action_type=parsed.get("action_type", "unknown"),
            target_type="text",
            target_hint=parsed.get("target_hint"),
            value=parsed.get("value")
        )
```

---

# 6. Target Selection Algorithm

CommandContext + CanvasContext → 대상 객체 선택.

## 6.1 알고리즘

```python
class TargetSelector:
    def select(self, canvas: CanvasContext, command: CommandContext) -> Optional[str]:
        # 1. Semantic hint 우선
        if command.target_hint:
            obj = self._find_by_semantic_layer(canvas, command.target_hint)
            if obj:
                return obj.id

        # 2. 가장 큰 텍스트 영역
        if command.target_type == "text":
            largest_text = self._find_largest_text(canvas)
            if largest_text:
                return largest_text.id

        # 3. 최근 편집된 객체 (HistoryContext 활용)
        # (생략)

        return None

    def _find_by_semantic_layer(self, canvas: CanvasContext, hint: str) -> Optional[CanvasObject]:
        for obj in canvas.objects:
            if obj.meta and obj.meta.get("layerType") == hint:
                return obj
        return None

    def _find_largest_text(self, canvas: CanvasContext) -> Optional[CanvasObject]:
        text_objects = [obj for obj in canvas.objects if obj.type == "textbox"]
        if not text_objects:
            return None

        return max(text_objects, key=lambda obj: obj.fontSize or 0)
```

---

# 7. Action Builder

CommandContext + Target → Action JSON 생성.

## 7.1 구현

```python
class ActionBuilder:
    def build(self, command: CommandContext, target_id: str) -> List[EditorAction]:
        actions = []

        if command.action_type == "change_font_size":
            delta = command.value.get("delta", 0)
            actions.append(EditorAction(
                type="set_property",
                target=target_id,
                property="fontSize",
                value={"delta": delta}  # Frontend에서 현재값 + delta 계산
            ))

        elif command.action_type == "set_color":
            color = command.value.get("color")
            actions.append(EditorAction(
                type="set_property",
                target=target_id,
                property="fill",
                value=color
            ))

        elif command.action_type == "move":
            # (생략)
            pass

        return actions
```

---

# 8. Rules Validation

Action 실행 전 규칙 검증.

## 8.1 구현

```python
class RulesValidator:
    def validate(self, actions: List[EditorAction], rules: EditorRules, canvas: CanvasContext) -> bool:
        for action in actions:
            # 1. 브랜드 색상 검증
            if action.property == "fill":
                color = action.value
                if color not in rules.brand.allowed_colors:
                    raise ValueError(f"Brand guardrail violation: {color} is not allowed.")

            # 2. 파괴적 변경 금지 (Safe Mode)
            if rules.system.safe_mode and action.type == "delete":
                obj = self._find_object(canvas, action.target)
                if obj and (obj.width or 0) * (obj.height or 0) > 100000:  # 큰 객체
                    raise ValueError("Safe mode: Cannot delete large objects.")

        return True

    def _find_object(self, canvas: CanvasContext, target_id: str) -> Optional[CanvasObject]:
        for obj in canvas.objects:
            if obj.id == target_id:
                return obj
        return None
```

---

# 9. EditorAgent 통합 구현

## 9.1 전체 클래스

```python
class EditorAgent:
    def __init__(self, llm_client: OllamaClient):
        self.parser = LLMCommandParser(llm_client)
        self.selector = TargetSelector()
        self.builder = ActionBuilder()
        self.validator = RulesValidator()

    async def process(self, input_data: EditorInput) -> EditorOutput:
        try:
            # 1. Command 파싱 (이미 파싱된 경우 생략 가능)
            # (EditorInput.command가 이미 CommandContext이므로 생략)

            # 2. Target 선택
            target_id = self.selector.select(input_data.canvas, input_data.command)
            if not target_id:
                return EditorOutput(
                    actions=[],
                    metadata={"error": "No target found"},
                    confidence=0.0,
                    error="Could not find target object"
                )

            # 3. Action 생성
            actions = self.builder.build(input_data.command, target_id)

            # 4. Rules 검증
            try:
                self.validator.validate(actions, input_data.rules, input_data.canvas)
            except ValueError as e:
                return EditorOutput(
                    actions=[],
                    metadata={"error": str(e)},
                    confidence=0.0,
                    error=str(e)
                )

            # 5. 성공 응답
            return EditorOutput(
                actions=actions,
                metadata={
                    "target_id": target_id,
                    "reasoning": f"Applied {input_data.command.action_type} to {target_id}"
                },
                confidence=0.9
            )

        except Exception as e:
            return EditorOutput(
                actions=[],
                metadata={},
                confidence=0.0,
                error=str(e)
            )
```

---

# 10. Canvas Update Manager (Frontend)

Frontend에서 Action JSON을 받아 Canvas를 업데이트합니다.

## 10.1 TypeScript 구현 (Next.js + Fabric.js)

```typescript
// frontend/lib/canvasUpdateManager.ts

import { fabric } from 'fabric';

interface EditorAction {
  type: string;
  target: string;
  property?: string;
  value: any;
}

export class CanvasUpdateManager {
  constructor(private canvas: fabric.Canvas) {}

  applyActions(actions: EditorAction[]) {
    actions.forEach(action => {
      const obj = this.findObject(action.target);
      if (!obj) return;

      switch (action.type) {
        case 'set_property':
          this.setProperty(obj, action.property!, action.value);
          break;
        case 'move':
          this.move(obj, action.value);
          break;
        // ... other action types
      }
    });

    this.canvas.renderAll();
  }

  private setProperty(obj: fabric.Object, property: string, value: any) {
    if (property === 'fontSize' && typeof value === 'object' && 'delta' in value) {
      const currentSize = (obj as fabric.Textbox).fontSize || 16;
      (obj as fabric.Textbox).set('fontSize', currentSize + value.delta);
    } else {
      obj.set(property as any, value);
    }
  }

  private findObject(targetId: string): fabric.Object | undefined {
    return this.canvas.getObjects().find(obj => (obj as any).id === targetId);
  }

  private move(obj: fabric.Object, value: { x?: number; y?: number }) {
    if (value.x !== undefined) obj.set('left', value.x);
    if (value.y !== undefined) obj.set('top', value.y);
  }
}
```

---

## 10.2 Frontend API 호출

```typescript
// frontend/app/editor/page.tsx

import { useState } from 'react';
import { CanvasUpdateManager } from '@/lib/canvasUpdateManager';

export default function EditorPage() {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  const handleNaturalCommand = async (command: string) => {
    // 1. Backend EditorAgent 호출
    const response = await fetch('/api/editor/process', {
      method: 'POST',
      body: JSON.stringify({
        canvas: canvas?.toJSON(['id', 'meta']),
        command: { raw: command },
        rules: { /* ... */ },
      }),
    });

    const result = await response.json();

    // 2. Canvas 업데이트
    if (canvas && result.actions) {
      const manager = new CanvasUpdateManager(canvas);
      manager.applyActions(result.actions);
    }
  };

  return (
    <div>
      <canvas id="editor-canvas" />
      <input
        type="text"
        placeholder="명령어 입력 (예: 제목 글자를 크게 해줘)"
        onKeyPress={e => {
          if (e.key === 'Enter') {
            handleNaturalCommand(e.currentTarget.value);
          }
        }}
      />
    </div>
  );
}
```

---

# 11. Action 타입 전체 정의

## 11.1 Property Actions
- `set_color`: 색상 변경
- `set_font`: 폰트 변경
- `set_font_size`: 폰트 크기 변경
- `set_opacity`: 투명도 변경
- `set_shadow`: 그림자 추가/수정
- `set_radius`: 모서리 둥글기
- `set_line_height`: 행간 변경

## 11.2 Layout Actions
- `move`: 위치 이동
- `align`: 정렬 (left/center/right/top/bottom)
- `distribute`: 균등 배치
- `reorder`: z-index 변경

## 11.3 Resize Actions
- `resize`: 크기 조정
- `auto_fit_text`: 텍스트 자동 맞춤
- `auto_crop_image`: 이미지 자동 크롭

## 11.4 Structure Actions
- `group`: 그룹화
- `ungroup`: 그룹 해제
- `duplicate`: 복제
- `lock`/`unlock`: 잠금

## 11.5 Background Actions
- `set_background_color`: 배경색 변경
- `set_background_image`: 배경 이미지 설정
- `blur_background`: 배경 흐림 효과

## 11.6 Text Actions
- `rewrite_text`: 텍스트 재작성 (LLM)
- `shorten`/`lengthen`: 텍스트 길이 조정
- `emphasize_keywords`: 키워드 강조

---

# 12. Multi-Page Support

프레젠테이션, 브로셔 등 멀티 페이지 문서 지원.

## 12.1 Schema 확장

```python
class MultiPageCanvas(BaseModel):
    pages: List[CanvasContext]
    current_page: int = 0
    master_layout: Optional[Dict[str, Any]] = None
```

---

## 12.2 페이지별 Action 적용

```python
def apply_to_page(actions: List[EditorAction], page_index: int, multi_canvas: MultiPageCanvas):
    canvas = multi_canvas.pages[page_index]
    # ... apply actions to canvas
```

---

# 13. Undo/Redo 구현

## 13.1 History 기록

```python
def record_action(action: EditorAction, history: HistoryContext):
    history.undo_stack.append(HistoryItem(
        action=action.dict(),
        timestamp=datetime.now(),
        description=f"{action.type} on {action.target}"
    ))
    history.redo_stack.clear()  # Redo 스택 초기화
    history.version += 1
```

---

## 13.2 Undo 실행

```python
def undo(history: HistoryContext) -> Optional[EditorAction]:
    if not history.undo_stack:
        return None

    item = history.undo_stack.pop()
    history.redo_stack.append(item)

    # 역 액션 생성 (간단한 예시)
    reverse_action = create_reverse_action(item.action)
    return reverse_action
```

---

# 14. 성능 최적화

## 14.1 캐싱

자주 사용되는 semantic layer 매핑을 캐싱:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_semantic_layers(canvas_json: str) -> Dict[str, str]:
    # canvas JSON → semantic layer 매핑
    pass
```

---

## 14.2 배치 액션 처리

여러 액션을 한 번에 적용:

```python
def apply_batch(actions: List[EditorAction], canvas: CanvasContext):
    for action in actions:
        # ... apply each action
    # 한 번에 렌더링
```

---

# 15. 테스트 케이스

## 15.1 Command Parser 테스트

```python
import pytest
from app.agents.editor import CommandParser

def test_parse_font_size_increase():
    parser = CommandParser()
    result = parser.parse("제목 글자를 크게 해줘")

    assert result.action_type == "change_font_size"
    assert result.target_hint == "title"
    assert result.value["delta"] == 8
```

---

## 15.2 EditorAgent 통합 테스트

```python
@pytest.mark.asyncio
async def test_editor_agent():
    agent = EditorAgent(mock_llm_client)

    canvas = CanvasContext(
        objects=[
            CanvasObject(
                id="text_001",
                type="textbox",
                text="Hello",
                fontSize=36,
                left=100,
                top=100,
                zIndex=1,
                meta={"layerType": "title"}
            )
        ],
        background=CanvasBackground(type="color", value="#FFFFFF"),
        size=CanvasSize(width=1080, height=1920)
    )

    command = CommandContext(
        raw="제목 글자를 크게 해줘",
        action_type="change_font_size",
        target_hint="title",
        value={"delta": 8}
    )

    rules = EditorRules(
        brand=BrandRules(allowed_colors=["#000000", "#FFFFFF"], primary_font="Arial"),
        system=SystemRules(safe_mode=True),
        template=TemplateRules(min_margin=20)
    )

    history = HistoryContext()

    input_data = EditorInput(
        canvas=canvas,
        command=command,
        rules=rules,
        history=history
    )

    output = await agent.process(input_data)

    assert len(output.actions) == 1
    assert output.actions[0].type == "set_property"
    assert output.actions[0].property == "fontSize"
    assert output.actions[0].value == {"delta": 8}
```

---

# 16. 다음 단계

Editor Engine 구현 후:

1. **Frontend 통합**: Fabric.js Canvas와 연동
2. **실시간 미리보기**: WebSocket으로 실시간 업데이트
3. **협업 기능**: 여러 사용자 동시 편집 (Y.js 등)

---

**작성 완료일**: 2025-11-15
**관련 문서**:
- [007.EDITOR_CONTEXT_MODEL.md](K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\Agent정의\007.EDITOR_CONTEXT_MODEL.md)
- [AGENT_IO_SCHEMA_CATALOG.md](AGENT_IO_SCHEMA_CATALOG.md)
