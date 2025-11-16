# Canvas Studio Phase 3 기능 테스트 계획서

**작성일**: 2025-11-16
**작성자**: C팀 (Frontend Team)
**테스트 대상**: Canvas Studio Phase 3 완료 기능
**테스트 URL**: http://localhost:3001/studio

---

## 📋 테스트 개요

Canvas Studio Phase 3에서 완료한 4가지 핵심 기능을 검증합니다.

### 테스트 대상 기능
1. ✅ 히스토리 콘솔 로그 개선
2. ✅ 레이어 더블클릭 이름 변경
3. ✅ Inspector 패널 속성 편집
4. ✅ 레이어 드래그 앤 드롭 순서 변경

---

## 🧪 Test 1: 히스토리 콘솔 로그 개선

### 목표
카테고리별 로깅 유틸리티가 정상 작동하는지 확인

### 테스트 파일
- `components/canvas-studio/hooks/useCanvasEngine.ts:55-64`

### 테스트 시나리오

#### 1-1. 로그 유틸리티 확인
**단계:**
1. http://localhost:3001/studio 접속
2. 브라우저 개발자 도구 열기 (F12)
3. Console 탭 선택

**예상 결과:**
```
🚀 [INIT] Canvas initialized
🚀 [INIT] Event listeners registered
```

#### 1-2. 도형 추가 시 로그 확인
**단계:**
1. 좌측 툴바에서 Rectangle 버튼 클릭
2. Console 로그 확인

**예상 결과:**
```
⚡ [ACTION] Adding shape: rectangle
📚 [HISTORY] History saved: index=1, total=2
```

#### 1-3. Undo/Redo 시 로그 확인
**단계:**
1. Ctrl+Z (Undo) 실행
2. Ctrl+Y (Redo) 실행
3. Console 로그 확인

**예상 결과:**
```
⚡ [ACTION] Undo executed: index=0
📚 [HISTORY] History restored from index 0
⚡ [ACTION] Redo executed: index=1
📚 [HISTORY] History restored from index 1
```

#### 1-4. 로그 비활성화 확인
**단계:**
1. `useCanvasEngine.ts` 파일 열기
2. `LOG_ENABLED = false` 로 변경
3. 페이지 새로고침
4. 도형 추가 및 Undo/Redo 테스트

**예상 결과:**
- Console에 아무 로그도 출력되지 않음

### 성공 기준
- ✅ 모든 로그가 카테고리별 이모지 프리픽스와 함께 출력됨
- ✅ LOG_ENABLED=false 시 모든 로그 비활성화됨
- ✅ 로그 메시지가 명확하고 이해하기 쉬움

---

## 🧪 Test 2: 레이어 더블클릭 이름 변경

### 목표
레이어 이름을 더블클릭하여 편집할 수 있는지 확인

### 테스트 파일
- `components/canvas-studio/components/LayersPanel.tsx:94-129`
- `components/canvas-studio/components/LayersPanel.tsx:170-194`

### 테스트 시나리오

#### 2-1. 기본 이름 표시 확인
**단계:**
1. Canvas에 Rectangle 추가
2. 우측 Layers 패널 확인

**예상 결과:**
- "Rectangle 1" 표시됨

#### 2-2. 더블클릭으로 편집 모드 진입
**단계:**
1. Layers 패널에서 "Rectangle 1" 더블클릭
2. 편집 모드 진입 확인

**예상 결과:**
- 텍스트가 input 필드로 변경됨
- 자동으로 포커스됨
- 파란색 테두리 표시됨
- 컨트롤 버튼(위/아래/삭제) 숨김

#### 2-3. Enter 키로 저장
**단계:**
1. "My Rectangle"로 텍스트 변경
2. Enter 키 입력

**예상 결과:**
- 편집 모드 종료
- 레이어 이름이 "My Rectangle"로 변경됨
- 컨트롤 버튼 다시 표시

#### 2-4. Escape 키로 취소
**단계:**
1. "Rectangle 1" 더블클릭
2. "Test Name"으로 변경
3. Escape 키 입력

**예상 결과:**
- 편집 모드 종료
- 이름이 원래대로 "Rectangle 1" 유지됨

#### 2-5. Blur로 자동 저장
**단계:**
1. "Rectangle 1" 더블클릭
2. "Auto Save Test"로 변경
3. 다른 곳 클릭

**예상 결과:**
- 편집 모드 종료
- 이름이 "Auto Save Test"로 저장됨

#### 2-6. 커스텀 이름 유지 확인
**단계:**
1. 페이지 새로고침 (또는 다른 객체 추가/삭제)
2. 레이어 패널 확인

**예상 결과:**
- 커스텀 이름이 계속 표시됨

### 성공 기준
- ✅ 더블클릭 시 편집 모드 진입
- ✅ Enter/Blur로 저장, Escape로 취소
- ✅ 커스텀 이름이 객체의 `data.customName`에 저장됨
- ✅ 편집 중 UI 피드백이 명확함

---

## 🧪 Test 3: Inspector 패널 속성 편집

### 목표
Inspector 패널에서 객체 속성을 실시간으로 편집할 수 있는지 확인

### 테스트 파일
- `components/canvas-studio/components/InspectorPanel.tsx` (전체)

### 테스트 시나리오

#### 3-1. 선택 없을 때 상태
**단계:**
1. Canvas에서 모든 선택 해제 (Esc 키)
2. 우측 Inspector 패널 확인

**예상 결과:**
- "Select an object to edit its properties" 메시지 표시

#### 3-2. 객체 선택 시 속성 표시
**단계:**
1. Rectangle 객체 선택
2. Inspector 패널 확인

**예상 결과:**
- Position (X, Y) 값 표시
- Size (Width, Height) 값 표시
- Rotation 슬라이더 표시
- Fill Color 선택기 표시
- Stroke Color 선택기 표시
- Opacity 슬라이더 표시

#### 3-3. Position 변경
**단계:**
1. X 값을 500으로 변경
2. Y 값을 300으로 변경

**예상 결과:**
- 객체가 (500, 300) 위치로 즉시 이동
- Canvas 렌더링 업데이트

#### 3-4. Size 변경
**단계:**
1. Width를 300으로 변경
2. Height를 200으로 변경

**예상 결과:**
- 객체 크기가 즉시 변경됨
- scaleX, scaleY 값이 자동 계산됨

#### 3-5. Rotation 슬라이더
**단계:**
1. Rotation 슬라이더를 45도로 이동
2. 슬라이더 값 확인

**예상 결과:**
- 객체가 45도 회전
- 슬라이더 옆 숫자가 "45°"로 표시됨

#### 3-6. Fill Color 변경
**단계:**
1. Fill Color 선택기 클릭
2. 빨간색 (#ff0000) 선택

**예상 결과:**
- 객체 배경색이 빨간색으로 변경
- Color input 값이 "#ff0000"으로 표시

#### 3-7. Stroke Color 변경
**단계:**
1. Stroke Color 선택기 클릭
2. 초록색 (#00ff00) 선택

**예상 결과:**
- 객체 테두리색이 초록색으로 변경

#### 3-8. Opacity 슬라이더
**단계:**
1. Opacity 슬라이더를 50%로 이동

**예상 결과:**
- 객체가 반투명해짐
- 슬라이더 옆 숫자가 "50%"로 표시

#### 3-9. Text 객체에서 Fill/Stroke 숨김
**단계:**
1. Text 객체 추가
2. Text 선택
3. Inspector 패널 확인

**예상 결과:**
- Fill Color 및 Stroke Color 섹션이 숨겨짐
- Position, Size, Rotation, Opacity만 표시

#### 3-10. 실시간 반영 확인
**단계:**
1. Rectangle 선택
2. Canvas에서 마우스로 이동
3. Inspector 패널 확인

**예상 결과:**
- Position 값이 실시간으로 업데이트됨

### 성공 기준
- ✅ 모든 속성이 정확히 표시됨
- ✅ 속성 변경 시 즉시 Canvas에 반영됨
- ✅ Text 객체에서 Fill/Stroke 숨김
- ✅ 객체 이동/수정 시 Inspector 값이 자동 업데이트됨

---

## 🧪 Test 4: 레이어 드래그 앤 드롭 순서 변경

### 목표
레이어 패널에서 드래그 앤 드롭으로 객체 순서(z-index)를 변경할 수 있는지 확인

### 테스트 파일
- `components/canvas-studio/components/LayersPanel.tsx:172-227`
- `components/canvas-studio/components/LayersPanel.tsx:256-276`

### 테스트 시나리오

#### 4-1. 초기 상태 확인
**단계:**
1. Rectangle 추가 (Rectangle 1)
2. Circle 추가 (Circle 1)
3. Triangle 추가 (Triangle 1)
4. Layers 패널 확인

**예상 결과:**
- 위에서 아래 순서: Triangle 1, Circle 1, Rectangle 1
- Canvas 상에서도 Triangle이 가장 위에 표시됨

#### 4-2. 드래그 시작 시각적 피드백
**단계:**
1. "Triangle 1" 레이어를 마우스로 드래그 시작

**예상 결과:**
- 드래그 중인 레이어가 50% 투명도로 변경됨
- 커서가 드래그 모드로 변경됨

#### 4-3. 드래그 오버 시각적 피드백
**단계:**
1. "Triangle 1"을 "Rectangle 1" 위로 드래그

**예상 결과:**
- "Rectangle 1" 상단에 파란색 테두리 표시 (`border-t-2 border-t-blue-500`)

#### 4-4. 드롭으로 순서 변경
**단계:**
1. "Triangle 1"을 "Rectangle 1" 위에 드롭

**예상 결과:**
- Layers 패널 순서 변경: Circle 1, Rectangle 1, Triangle 1
- Canvas에서 Triangle이 가장 아래로 이동

#### 4-5. Fabric.js insertAt() 호출 확인
**단계:**
1. 브라우저 Console 확인
2. 드래그 앤 드롭 실행

**예상 결과:**
```
Layers updated: 3
```
- `fabricCanvas.insertAt()` 메서드가 호출됨

#### 4-6. 편집 모드 중 드래그 비활성화
**단계:**
1. "Rectangle 1" 더블클릭 (편집 모드)
2. 레이어 드래그 시도

**예상 결과:**
- 드래그가 작동하지 않음
- `draggable={!isEditing}` 속성으로 비활성화됨

#### 4-7. 여러 번 순서 변경
**단계:**
1. Rectangle을 맨 위로 이동
2. Circle을 중간으로 이동
3. Triangle을 맨 아래로 이동

**예상 결과:**
- 모든 순서 변경이 정상 작동
- Canvas 렌더링도 정확히 반영됨

#### 4-8. Firefox 호환성 확인
**단계:**
1. Firefox 브라우저 사용
2. 드래그 앤 드롭 테스트

**예상 결과:**
- Firefox에서도 정상 작동
- `e.dataTransfer.setData('text/html', '')` 호환성 코드 작동

### 성공 기준
- ✅ 드래그 시 시각적 피드백이 명확함
- ✅ 드롭 시 순서가 정확히 변경됨
- ✅ Fabric.js z-index가 올바르게 업데이트됨
- ✅ 편집 모드 중 드래그 비활성화됨
- ✅ Firefox 호환성 확인

---

## 📊 전체 테스트 체크리스트

### Test 1: 히스토리 콘솔 로그 개선
- [ ] 1-1. 로그 유틸리티 확인
- [ ] 1-2. 도형 추가 시 로그 확인
- [ ] 1-3. Undo/Redo 시 로그 확인
- [ ] 1-4. 로그 비활성화 확인

### Test 2: 레이어 더블클릭 이름 변경
- [ ] 2-1. 기본 이름 표시 확인
- [ ] 2-2. 더블클릭으로 편집 모드 진입
- [ ] 2-3. Enter 키로 저장
- [ ] 2-4. Escape 키로 취소
- [ ] 2-5. Blur로 자동 저장
- [ ] 2-6. 커스텀 이름 유지 확인

### Test 3: Inspector 패널 속성 편집
- [ ] 3-1. 선택 없을 때 상태
- [ ] 3-2. 객체 선택 시 속성 표시
- [ ] 3-3. Position 변경
- [ ] 3-4. Size 변경
- [ ] 3-5. Rotation 슬라이더
- [ ] 3-6. Fill Color 변경
- [ ] 3-7. Stroke Color 변경
- [ ] 3-8. Opacity 슬라이더
- [ ] 3-9. Text 객체에서 Fill/Stroke 숨김
- [ ] 3-10. 실시간 반영 확인

### Test 4: 레이어 드래그 앤 드롭 순서 변경
- [ ] 4-1. 초기 상태 확인
- [ ] 4-2. 드래그 시작 시각적 피드백
- [ ] 4-3. 드래그 오버 시각적 피드백
- [ ] 4-4. 드롭으로 순서 변경
- [ ] 4-5. Fabric.js insertAt() 호출 확인
- [ ] 4-6. 편집 모드 중 드래그 비활성화
- [ ] 4-7. 여러 번 순서 변경
- [ ] 4-8. Firefox 호환성 확인

---

## 🐛 발견된 버그 기록

### 버그 #1
**제목**:
**재현 방법**:
**예상 동작**:
**실제 동작**:
**심각도**:
**상태**:

---

## ✅ 테스트 완료 보고서

**테스트 실행일**: 2025-11-16
**테스트 담당**: C팀 (Frontend Team)

### 통과율
- Test 1: __ / 4 (__ %)
- Test 2: __ / 6 (__ %)
- Test 3: __ / 10 (__ %)
- Test 4: __ / 8 (__ %)
- **전체**: __ / 28 (__ %)

### 최종 결과
- [ ] ✅ 모든 테스트 통과 (100%)
- [ ] ⚠️ 일부 테스트 실패 (통과율 < 100%)
- [ ] ❌ 주요 기능 실패 (통과율 < 80%)

### 다음 단계
1.
2.
3.

---

**작성 완료**: 2025-11-16
**다음 테스트**: Phase 4 기능 완료 후
