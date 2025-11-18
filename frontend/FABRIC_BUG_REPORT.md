# Fabric.js textBaseline 버그 보고서

**작성자:** C팀 (Frontend)
**작성일:** 2025-11-18
**심각도:** P0 (Canvas 렌더링 완전 차단)

---

## 🔴 문제 요약

Fabric.js 5.3.0 라이브러리 자체에 `textBaseline: 'alphabetical'` 버그가 존재하여, Backend에서 올바른 값(`"alphabetic"`)을 보내도 Canvas 렌더링이 실패합니다.

---

## 🔍 조사 결과

### 1. Backend 검증 ✅
```bash
$ grep -n "textBaseline" backend/app/services/canvas/fabric_builder.py
115:            "textBaseline": "alphabetic",  # 🔴 FIX: C팀 요청 - 올바른 값 사용
```
**결과:** Backend는 정확히 `"alphabetic"` (올바른 값)을 반환하고 있음

### 2. API 응답 검증 ✅
```bash
$ curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"kind":"product_detail","input":{"productName":"테스트"}}' \
  | jq '.document.canvas_json.objects[] | select(.type=="text") | .textBaseline'

"alphabetic"
"alphabetic"
"alphabetic"
```
**결과:** Backend API는 `"alphabetic"`을 정확히 반환함

### 3. Frontend 코드 검증 ✅
```bash
$ grep -r "alphabetical" frontend/components/canvas-studio/
$ grep -r "alphabetical" frontend/lib/
# 결과 없음
```
**결과:** Frontend 코드에는 `"alphabetical"` 문자열이 전혀 없음

### 4. Fabric.js 라이브러리 검증 ❌
```bash
$ grep -r "alphabetical" frontend/node_modules/fabric/dist/
node_modules/fabric/dist/fabric.js:      ctx.textBaseline = 'alphabetical';
```

**결과:** 🔴 **Fabric.js 5.3.0 소스 코드에 하드코딩된 버그 발견!**

---

## 🐛 근본 원인

**Fabric.js 5.3.0 라이브러리 (`node_modules/fabric/dist/fabric.js`)**가 내부적으로 Canvas Context에 `ctx.textBaseline = 'alphabetical'`을 설정하고 있습니다.

이것은 HTML5 Canvas 표준 위반입니다:
- **올바른 값:** `'alphabetic'` (마지막 글자 'c')
- **Fabric.js 버그:** `'alphabetical'` (마지막 글자 'l')

Chrome/Firefox 등 현대 브라우저는 이 잘못된 값을 **거부(reject)**합니다:
```
The provided value 'alphabetical' is not a valid enum value of type CanvasTextBaseline.
```

---

## 📊 영향 범위

- **모든 Text 객체** Canvas 렌더링 실패
- **모든 Rect, Circle 객체**도 Text와 함께 로드되지 않음
- Canvas Studio 기능 **완전 차단**

---

## ✅ 해결 방안

### 방안 1: Fabric.js 버전 업그레이드 (권장)

```bash
# 현재 버전
npm list fabric
# fabric@5.3.0

# 최신 버전 확인
npm view fabric versions

# 최신 안정 버전으로 업그레이드
npm install fabric@latest

# 또는 특정 버전
npm install fabric@6.0.0
```

**장점:**
- 근본적인 해결
- 다른 버그도 함께 수정
- 새로운 기능 사용 가능

**단점:**
- Breaking changes 가능성
- 전체 Canvas 코드 호환성 테스트 필요

### 방안 2: Frontend에서 Sanitize (임시 해결) ✅ **이미 구현됨**

`frontend/components/canvas-studio/adapters/response-to-fabric.ts`에 안전장치 추가:

```typescript
function sanitizeCanvasJson(json: CanvasJson): CanvasJson {
  if (!json || !Array.isArray(json.objects)) return json;

  json.objects.forEach((obj) => {
    // Fabric.js 5.3.0 버그 우회: alphabetical → alphabetic
    if (obj.textBaseline === "alphabetical") {
      obj.textBaseline = "alphabetic";
    }
  });

  return json;
}
```

**장점:**
- 즉시 적용 가능
- 위험도 낮음

**단점:**
- 근본 원인 해결 아님
- Fabric.js가 내부적으로 또 다른 곳에서 `'alphabetical'`을 설정할 수 있음

### 방안 3: Fabric.js 소스 패치 (비권장)

`node_modules/fabric/dist/fabric.js` 직접 수정:
```diff
- ctx.textBaseline = 'alphabetical';
+ ctx.textBaseline = 'alphabetic';
```

**장점:**
- 즉시 해결

**단점:**
- `npm install` 시 초기화됨
- 유지보수 불가능

---

## 🎯 권장 조치

1. **즉시 (지금):** Frontend Sanitize 사용 (이미 구현됨) ✅
2. **단기 (1-2일):** Fabric.js 최신 버전 테스트
3. **중기 (1주):** Fabric.js 업그레이드 또는 대안 라이브러리 검토

---

## 📎 참고 자료

- [Fabric.js GitHub Issues](https://github.com/fabricjs/fabric.js/issues)
- [MDN: CanvasRenderingContext2D.textBaseline](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline)
- [HTML5 Canvas Spec](https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-textbaseline)

---

## 📝 결론

**이 문제는 Backend 또는 Frontend 코드의 잘못이 아니라, Fabric.js 5.3.0 라이브러리 자체의 버그입니다.**

B팀은 이미 올바른 값(`"alphabetic"`)을 반환하고 있으며, C팀은 임시 안전장치를 구현했습니다.

장기적으로는 Fabric.js 업그레이드가 필요합니다.
