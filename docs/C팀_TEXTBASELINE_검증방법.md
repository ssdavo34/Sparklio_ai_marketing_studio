# C팀 textBaseline 검증 방법

**작성일:** 2025년 11월 17일
**작성자:** B팀 Backend

---

## 🔍 현재 상황

### Backend 확인 결과 ✅
- **코드 수정 완료:** `fabric_builder.py`에 `textBaseline: "alphabetic"` 명시
- **테스트 통과:** 모든 텍스트 객체가 올바른 값 생성
- **서버 재시작:** 완료

### C팀 보고 ❌
- 여전히 `textBaseline: 'alphabetical'` 오류 발생
- Frontend에서 Canvas 로드 실패

---

## 🧪 검증 방법

### 방법 1: Backend 직접 테스트 (Backend 담당)

```bash
cd backend
python test_textbaseline_fix.py
```

**기대 결과:**
```
✅ 모든 텍스트 객체가 올바른 textBaseline 값을 가지고 있습니다!
```

---

### 방법 2: API 직접 호출 (C팀 확인)

#### Windows PowerShell:
```powershell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    kind = "product_detail"
    brandId = "brand_demo"
    input = @{
        prompt = "테스트용 제품"
    }
    options = @{
        tone = "professional"
        length = "medium"
    }
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:8000/api/v1/generate" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    | ConvertTo-Json -Depth 10 `
    | Out-File -FilePath "api_response_test.json" -Encoding UTF8

Write-Host "응답이 api_response_test.json에 저장되었습니다"
```

#### macOS/Linux (curl):
```bash
curl -X POST "http://localhost:8000/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "brand_demo",
    "input": {
      "prompt": "테스트용 제품"
    },
    "options": {
      "tone": "professional",
      "length": "medium"
    }
  }' \
  | jq '.' > api_response_test.json

echo "응답이 api_response_test.json에 저장되었습니다"
```

---

### 방법 3: 응답 검증 (C팀)

생성된 `api_response_test.json` 파일에서 다음을 확인:

```json
{
  "document": {
    "canvas_json": {
      "objects": [
        {
          "type": "text",
          "textBaseline": "alphabetic"  // ✅ 이 값이어야 함
        }
      ]
    }
  }
}
```

**검증 스크립트 (Python):**

```python
import json

with open("api_response_test.json", "r", encoding="utf-8") as f:
    response = json.load(f)

canvas_json = response["document"]["canvas_json"]
text_objects = [obj for obj in canvas_json["objects"] if obj["type"] == "text"]

print(f"텍스트 객체 수: {len(text_objects)}")

for idx, obj in enumerate(text_objects):
    baseline = obj.get("textBaseline")
    if baseline == "alphabetic":
        print(f"  ✅ 텍스트 #{idx}: textBaseline = '{baseline}'")
    elif baseline == "alphabetical":
        print(f"  ❌ 텍스트 #{idx}: textBaseline = '{baseline}' (잘못됨!)")
    elif baseline is None:
        print(f"  ⚠️  텍스트 #{idx}: textBaseline 필드 없음")
    else:
        print(f"  ⚠️  텍스트 #{idx}: textBaseline = '{baseline}' (예상치 못한 값)")
```

---

## 🔍 문제 원인 후보

### 1. 브라우저 캐시
**증상:** Frontend가 이전 응답을 캐시하고 있음
**해결:**
- 브라우저 개발자 도구에서 "Disable cache" 활성화
- 하드 리프레시 (Ctrl+Shift+R / Cmd+Shift+R)

### 2. Frontend Mock 데이터
**증상:** Frontend가 실제 Backend가 아닌 Mock 데이터 사용
**해결:**
- Frontend 코드에서 Mock/Live 모드 확인
- Network 탭에서 실제 API 호출 확인

### 3. 다른 Backend 인스턴스
**증상:** 여러 개의 Backend 서버가 실행 중
**해결:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /F /PID <PID>

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

### 4. Python 모듈 캐시
**증상:** Python이 이전 .pyc 파일 사용
**해결:**
```bash
# __pycache__ 폴더 삭제
cd backend
find . -type d -name "__pycache__" -exec rm -rf {} +

# 또는 Windows
cd backend
for /d /r . %d in (__pycache__) do @if exist "%d" rd /s /q "%d"
```

---

## ✅ 최종 확인 체크리스트

### Backend (B팀)
- [x] `fabric_builder.py` 수정 완료
- [x] 테스트 스크립트 실행 성공
- [x] 서버 재시작 완료

### Frontend (C팀)
- [ ] API 직접 호출하여 응답 확인
- [ ] `textBaseline: "alphabetic"` 값 확인
- [ ] 브라우저 캐시 비활성화
- [ ] Network 탭에서 실제 API 응답 확인
- [ ] Frontend가 Mock 모드가 아닌지 확인

---

## 📞 추가 확인 사항

### C팀이 확인해야 할 것:

1. **Frontend Console 로그:**
   ```javascript
   // Response를 받은 직후
   console.log("Canvas JSON:", response.document.canvas_json);
   console.log("Text objects:",
     response.document.canvas_json.objects.filter(o => o.type === 'text')
   );
   ```

2. **Network 탭:**
   - `/api/v1/generate` 요청 확인
   - Response Payload에서 `textBaseline` 값 직접 확인

3. **Frontend 환경 변수:**
   ```typescript
   // Frontend에서 사용 중인 API URL 확인
   console.log("API Base URL:", process.env.NEXT_PUBLIC_API_URL);
   ```

---

## 🚨 만약 여전히 문제가 발생한다면

### Backend에서 추가 디버깅:

`generator/service.py`에 로깅 추가:

```python
# Line 156 근처
canvas_data = self._create_canvas(kind, text_data)

# 추가 로깅
text_objs = [o for o in canvas_data.get("objects", []) if o.get("type") == "text"]
for idx, obj in enumerate(text_objs):
    logger.info(f"Canvas Text Object #{idx}: textBaseline={obj.get('textBaseline')}")
```

### 로그 확인:
```bash
# Backend 로그에서 textBaseline 확인
tail -f backend/logs/app.log | grep textBaseline

# 또는 Windows
Get-Content backend/logs/app.log -Wait | Select-String "textBaseline"
```

---

**결론:**
- Backend 코드는 올바르게 수정됨
- C팀은 위 방법으로 실제 API 응답을 직접 확인 필요
- 캐시나 환경 문제일 가능성 높음
