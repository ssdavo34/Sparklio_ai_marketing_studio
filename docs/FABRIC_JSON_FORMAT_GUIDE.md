# Fabric.js Canvas JSON 형식 가이드

**작성자:** C팀 Frontend Team
**작성일:** 2025년 11월 17일 월요일 19:15
**대상:** B팀 Backend Team
**목적:** Backend에서 생성하는 `canvas_json` 형식을 Fabric.js v5.3.0과 호환되도록 수정

---

## 🚨 발견된 문제

### 현재 상황
- **Frontend Mock 데이터:** ✅ Canvas 렌더링 성공 (파란 rect, 녹색 circle, 주황 rect)
- **Backend 데이터:** ❌ Fabric.js 로딩 실패

### 에러 메시지
```
[Fabric Adapter] Failed to load canvas_json:
{type: 'rect', version: '5.3.0', originX: 'left', originY: 'top', left: 150, ...}
```

---

## ✅ 올바른 Fabric.js JSON 형식

### 전체 구조

```json
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "rect",
      "version": "5.3.0",
      "originX": "left",
      "originY": "top",
      "left": 100,
      "top": 100,
      "width": 200,
      "height": 150,
      "fill": "#3b82f6",
      "stroke": "#1e40af",
      "strokeWidth": 2,
      "strokeDashArray": null,
      "strokeLineCap": "butt",
      "strokeDashOffset": 0,
      "strokeLineJoin": "miter",
      "strokeUniform": false,
      "strokeMiterLimit": 4,
      "scaleX": 1,
      "scaleY": 1,
      "angle": 0,
      "flipX": false,
      "flipY": false,
      "opacity": 1,
      "shadow": null,
      "visible": true,
      "backgroundColor": "",
      "fillRule": "nonzero",
      "paintFirst": "fill",
      "globalCompositeOperation": "source-over",
      "skewX": 0,
      "skewY": 0,
      "rx": 0,
      "ry": 0
    }
  ],
  "background": "#ffffff"
}
```

---

## 📋 필수 필드 (MUST HAVE)

### Rect (사각형)

```python
{
    "type": "rect",
    "version": "5.3.0",

    # 위치 (필수)
    "left": 100,      # X 좌표
    "top": 100,       # Y 좌표
    "originX": "left",
    "originY": "top",

    # 크기 (필수!!!)
    "width": 200,     # 너비 (필수!)
    "height": 150,    # 높이 (필수!)

    # 스타일
    "fill": "#3b82f6",
    "stroke": "#1e40af",
    "strokeWidth": 2,

    # 변형
    "scaleX": 1,
    "scaleY": 1,
    "angle": 0,

    # 표시
    "opacity": 1,
    "visible": True,

    # 둥근 모서리 (선택)
    "rx": 10,  # 가로 반경
    "ry": 10,  # 세로 반경

    # 기타 기본값
    "flipX": False,
    "flipY": False,
    "skewX": 0,
    "skewY": 0,
    "strokeDashArray": None,
    "strokeLineCap": "butt",
    "strokeLineJoin": "miter",
    "strokeMiterLimit": 4,
    "strokeUniform": False,
    "strokeDashOffset": 0,
    "shadow": None,
    "backgroundColor": "",
    "fillRule": "nonzero",
    "paintFirst": "fill",
    "globalCompositeOperation": "source-over"
}
```

### Circle (원)

```python
{
    "type": "circle",
    "version": "5.3.0",

    # 위치 (필수)
    "left": 200,
    "top": 200,
    "originX": "left",
    "originY": "top",

    # 크기 (필수!!!)
    "radius": 50,     # 반지름 (필수!)

    # 스타일
    "fill": "#10b981",
    "stroke": "#059669",
    "strokeWidth": 2,

    # 변형
    "scaleX": 1,
    "scaleY": 1,
    "angle": 0,

    # 표시
    "opacity": 1,
    "visible": True,

    # 기타 기본값
    "flipX": False,
    "flipY": False,
    "skewX": 0,
    "skewY": 0,
    "strokeDashArray": None,
    "strokeLineCap": "butt",
    "strokeLineJoin": "miter",
    "strokeMiterLimit": 4,
    "strokeUniform": False,
    "strokeDashOffset": 0,
    "shadow": None,
    "backgroundColor": "",
    "fillRule": "nonzero",
    "paintFirst": "fill",
    "globalCompositeOperation": "source-over"
}
```

### Text (텍스트)

```python
{
    "type": "text",
    "version": "5.3.0",

    # 위치 (필수)
    "left": 100,
    "top": 50,
    "originX": "left",
    "originY": "top",

    # 텍스트 내용 (필수!!!)
    "text": "Hello World",  # 텍스트 (필수!)

    # 폰트
    "fontSize": 24,
    "fontFamily": "Arial",
    "fontWeight": "normal",
    "fontStyle": "normal",
    "lineHeight": 1.16,
    "textAlign": "left",
    "underline": False,
    "overline": False,
    "linethrough": False,

    # 스타일
    "fill": "#000000",
    "stroke": None,
    "strokeWidth": 1,

    # 변형
    "scaleX": 1,
    "scaleY": 1,
    "angle": 0,

    # 표시
    "opacity": 1,
    "visible": True,

    # 기타 기본값
    "flipX": False,
    "flipY": False,
    "skewX": 0,
    "skewY": 0,
    "strokeDashArray": None,
    "strokeLineCap": "butt",
    "strokeLineJoin": "miter",
    "strokeMiterLimit": 4,
    "strokeUniform": False,
    "strokeDashOffset": 0,
    "shadow": None,
    "backgroundColor": "",
    "fillRule": "nonzero",
    "paintFirst": "fill",
    "globalCompositeOperation": "source-over",
    "charSpacing": 0,
    "textBackgroundColor": ""
}
```

### Image (이미지)

```python
{
    "type": "image",
    "version": "5.3.0",

    # 위치 (필수)
    "left": 100,
    "top": 100,
    "originX": "left",
    "originY": "top",

    # 이미지 소스 (필수!!!)
    "src": "https://example.com/image.jpg",  # URL 또는 data URI

    # 크기 (필수!!!)
    "width": 300,
    "height": 200,

    # 크롭 (선택)
    "cropX": 0,
    "cropY": 0,

    # 필터 (선택)
    "filters": [],

    # 변형
    "scaleX": 1,
    "scaleY": 1,
    "angle": 0,

    # 표시
    "opacity": 1,
    "visible": True,

    # 기타 기본값
    "flipX": False,
    "flipY": False,
    "skewX": 0,
    "skewY": 0,
    "strokeDashArray": None,
    "shadow": None,
    "paintFirst": "fill",
    "globalCompositeOperation": "source-over"
}
```

---

## 🔧 Backend 수정 필요 사항

### 1. `FabricCanvasBuilder` 클래스 수정

**현재 문제:**
- 필수 필드 누락 (특히 `width`, `height`, `radius`, `text`)
- Fabric.js v5.3.0 필수 기본값 누락

**수정 예시 (Python):**

```python
class FabricCanvasBuilder:
    """Fabric.js v5.3.0 호환 Canvas JSON 생성"""

    def add_rect(
        self,
        left: int,
        top: int,
        width: int,      # 필수!
        height: int,     # 필수!
        fill: str = "#000000",
        stroke: str = None,
        stroke_width: int = 1,
        rx: int = 0,
        ry: int = 0,
        **kwargs
    ):
        """사각형 추가"""
        rect = {
            "type": "rect",
            "version": "5.3.0",
            "originX": "left",
            "originY": "top",
            "left": left,
            "top": top,
            "width": width,   # 필수!
            "height": height, # 필수!
            "fill": fill,
            "stroke": stroke,
            "strokeWidth": stroke_width,
            "rx": rx,
            "ry": ry,

            # Fabric.js v5.3.0 기본값 (필수!)
            "scaleX": 1,
            "scaleY": 1,
            "angle": 0,
            "flipX": False,
            "flipY": False,
            "opacity": 1,
            "visible": True,
            "skewX": 0,
            "skewY": 0,
            "strokeDashArray": None,
            "strokeLineCap": "butt",
            "strokeLineJoin": "miter",
            "strokeMiterLimit": 4,
            "strokeUniform": False,
            "strokeDashOffset": 0,
            "shadow": None,
            "backgroundColor": "",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "globalCompositeOperation": "source-over"
        }

        self.objects.append(rect)
        return self

    def add_circle(
        self,
        left: int,
        top: int,
        radius: int,     # 필수!
        fill: str = "#000000",
        stroke: str = None,
        stroke_width: int = 1,
        **kwargs
    ):
        """원 추가"""
        circle = {
            "type": "circle",
            "version": "5.3.0",
            "originX": "left",
            "originY": "top",
            "left": left,
            "top": top,
            "radius": radius,  # 필수!
            "fill": fill,
            "stroke": stroke,
            "strokeWidth": stroke_width,

            # Fabric.js v5.3.0 기본값
            "scaleX": 1,
            "scaleY": 1,
            "angle": 0,
            "flipX": False,
            "flipY": False,
            "opacity": 1,
            "visible": True,
            "skewX": 0,
            "skewY": 0,
            "strokeDashArray": None,
            "strokeLineCap": "butt",
            "strokeLineJoin": "miter",
            "strokeMiterLimit": 4,
            "strokeUniform": False,
            "strokeDashOffset": 0,
            "shadow": None,
            "backgroundColor": "",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "globalCompositeOperation": "source-over"
        }

        self.objects.append(circle)
        return self

    def add_text(
        self,
        text: str,       # 필수!
        left: int,
        top: int,
        font_size: int = 24,
        font_family: str = "Arial",
        fill: str = "#000000",
        **kwargs
    ):
        """텍스트 추가"""
        if not text:  # 빈 텍스트 방지
            return self

        text_obj = {
            "type": "text",
            "version": "5.3.0",
            "originX": "left",
            "originY": "top",
            "left": left,
            "top": top,
            "text": text,           # 필수!
            "fontSize": font_size,
            "fontFamily": font_family,
            "fontWeight": "normal",
            "fontStyle": "normal",
            "lineHeight": 1.16,
            "textAlign": "left",
            "underline": False,
            "overline": False,
            "linethrough": False,
            "fill": fill,
            "stroke": None,
            "strokeWidth": 1,

            # Fabric.js v5.3.0 기본값
            "scaleX": 1,
            "scaleY": 1,
            "angle": 0,
            "flipX": False,
            "flipY": False,
            "opacity": 1,
            "visible": True,
            "skewX": 0,
            "skewY": 0,
            "strokeDashArray": None,
            "strokeLineCap": "butt",
            "strokeLineJoin": "miter",
            "strokeMiterLimit": 4,
            "strokeUniform": False,
            "strokeDashOffset": 0,
            "shadow": None,
            "backgroundColor": "",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "globalCompositeOperation": "source-over",
            "charSpacing": 0,
            "textBackgroundColor": ""
        }

        self.objects.append(text_obj)
        return self

    def build(self) -> dict:
        """최종 Canvas JSON 생성"""
        return {
            "version": "5.3.0",
            "objects": self.objects,
            "background": self.background or "#ffffff"
        }
```

---

## ✅ 검증 방법

### 1. Python에서 JSON 생성 후 검증

```python
# 테스트 코드
builder = FabricCanvasBuilder()
builder.add_rect(
    left=100,
    top=100,
    width=200,   # 필수!
    height=150,  # 필수!
    fill="#3b82f6",
    stroke="#1e40af",
    stroke_width=2,
    rx=10,
    ry=10
)

canvas_json = builder.build()

# 필수 필드 검증
assert "objects" in canvas_json
assert len(canvas_json["objects"]) > 0

rect = canvas_json["objects"][0]
assert rect["type"] == "rect"
assert "width" in rect    # 필수!
assert "height" in rect   # 필수!
assert rect["width"] > 0
assert rect["height"] > 0

print("✅ Fabric.js 형식 검증 통과")
```

### 2. Frontend에서 실제 렌더링 테스트

1. Backend 수정 후 서버 재시작
2. Frontend에서 Generate API 호출
3. Console 확인:
   ```
   [Fabric Adapter] Canvas loaded successfully  ✅
   ```
4. Canvas에 객체 렌더링 확인

---

## 📝 체크리스트

### Backend 수정 사항

- [ ] **Rect 객체 필수 필드 추가**
  - [ ] `width` (필수!)
  - [ ] `height` (필수!)
  - [ ] Fabric.js v5.3.0 기본값 (scaleX, scaleY, angle 등)

- [ ] **Circle 객체 필수 필드 추가**
  - [ ] `radius` (필수!)
  - [ ] Fabric.js v5.3.0 기본값

- [ ] **Text 객체 필수 필드 추가**
  - [ ] `text` (필수!)
  - [ ] `fontSize`, `fontFamily`
  - [ ] Fabric.js v5.3.0 기본값

- [ ] **Image 객체 필수 필드 추가**
  - [ ] `src` (필수!)
  - [ ] `width`, `height` (필수!)

- [ ] **전체 Canvas JSON 구조 검증**
  - [ ] `version: "5.3.0"`
  - [ ] `objects: [...]`
  - [ ] `background: "#ffffff"` (선택)

### 테스트

- [ ] Python 단위 테스트 통과
- [ ] JSON Schema 검증
- [ ] Frontend 렌더링 성공
- [ ] Console 에러 없음

---

## 🚀 우선순위

### P0 (Blocker - 오늘 중)

1. **Rect 객체 `width`, `height` 추가**
   - 현재: 누락
   - 필요: 필수 필드 추가

2. **Circle 객체 `radius` 추가**
   - 현재: 누락
   - 필요: 필수 필드 추가

3. **Fabric.js v5.3.0 기본값 추가**
   - `scaleX`, `scaleY`, `angle`, `opacity`, `visible` 등

### P1 (중요)

4. **Text 객체 구현**
   - Agent가 생성한 텍스트를 Canvas에 추가

5. **전체 JSON 검증 테스트**

---

## 📞 문의

**Frontend 검증 완료:**
- Mock 데이터로 Canvas 렌더링 100% 성공
- Fabric.js v5.3.0 호환성 확인 완료

**Backend 수정 필요:**
- 위 가이드대로 필수 필드 추가
- 수정 완료 후 C팀에 알림

---

**문서 버전:** v1.0
**최종 수정일:** 2025년 11월 17일 월요일 19:15
**작성자:** C팀 Frontend Lead
**리뷰어:** B팀 Backend Lead (확인 대기)
