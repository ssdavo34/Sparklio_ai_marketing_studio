# 맥미니 서버 동기화 체크리스트

**작성일**: 2025-11-20
**작성자**: A팀 QA
**목적**: B팀 Gemini 모델 수정사항을 맥미니 서버에 동기화

## 🎯 동기화 대상

### 변경된 파일 목록
1. `backend/.env`
2. `backend/.env.local`
3. `backend/app/core/config.py`
4. `backend/app/services/llm/providers/gemini_provider.py`
5. `backend/app/services/llm/router.py`

### 주요 변경 내용
- **이전**: `gemini-2.5-flash-preview`
- **변경**: `gemini-2.5-flash`

---

## ✅ 동기화 전 체크리스트

### 1. 현재 상태 확인
- [ ] 현재 브랜치 확인: `feature/editor-v2-konva`
- [ ] 변경사항 커밋 여부 확인
- [ ] 충돌 가능성 확인

### 2. 백업
- [ ] 맥미니 현재 설정 백업
  ```bash
  # 맥미니에서 실행
  cp backend/.env backend/.env.backup.20251120
  cp backend/app/core/config.py backend/app/core/config.py.backup
  ```

---

## 📝 동기화 절차

### 방법 1: Git을 통한 동기화 (권장)

#### 로컬 (Windows)에서:
```bash
# 1. 변경사항 확인
git status

# 2. 변경사항 추가
git add backend/.env backend/.env.local backend/app/core/config.py backend/app/services/llm/

# 3. 커밋
git commit -m "fix: Gemini 모델명 수정 (gemini-2.5-flash-preview → gemini-2.5-flash)

- .env 파일 업데이트
- config.py 기본값 변경
- gemini_provider.py 모델 리스트 수정
- A팀 QA 검증 완료"

# 4. 푸시
git push origin feature/editor-v2-konva
```

#### 맥미니에서:
```bash
# 1. 브랜치 확인
git branch

# 2. 최신 변경사항 가져오기
git fetch origin

# 3. 변경사항 병합
git pull origin feature/editor-v2-konva

# 4. 변경 확인
grep "GEMINI_TEXT_MODEL" backend/.env
# 예상 출력: GEMINI_TEXT_MODEL=gemini-2.5-flash
```

### 방법 2: 수동 파일 수정

#### 맥미니에서 직접 수정:
```bash
# 1. .env 파일 수정
cd ~/sparklio_ai_marketing_studio/backend
nano .env
# GEMINI_TEXT_MODEL=gemini-2.5-flash 로 변경

# 2. .env.local 파일 수정 (있는 경우)
nano .env.local
# GEMINI_TEXT_MODEL=gemini-2.5-flash 로 변경

# 3. config.py 수정
nano app/core/config.py
# Line 64: "gemini-2.5-flash" 로 변경

# 4. gemini_provider.py 수정
nano app/services/llm/providers/gemini_provider.py
# Line 24: self.model = settings.gemini_text_model or "gemini-2.5-flash"
```

---

## 🔄 동기화 후 검증

### 1. 설정 확인
```bash
# 맥미니에서 실행

# 환경 변수 확인
grep "GEMINI_TEXT_MODEL" backend/.env
# 예상: GEMINI_TEXT_MODEL=gemini-2.5-flash

# Python 설정 확인
cd backend
python -c "from app.core.config import settings; print(f'Gemini Model: {settings.GEMINI_TEXT_MODEL}')"
# 예상: Gemini Model: gemini-2.5-flash
```

### 2. 서비스 재시작
```bash
# Backend 서버 재시작
# 기존 프로세스 종료
pkill -f "uvicorn main:app"

# 서버 재시작
cd ~/sparklio_ai_marketing_studio/backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# 로그 확인
tail -f backend.log
```

### 3. API 테스트
```bash
# 헬스체크
curl http://localhost:8000/api/v1/llm/health | jq .

# Gemini 테스트
cd ~/sparklio_ai_marketing_studio/backend
python test_gemini_direct.py
```

### 4. 로그 모니터링
```bash
# 에러 로그 확인 (30분)
tail -f backend.log | grep -i "gemini\|error"
```

---

## ⚠️ 문제 발생 시

### 1. 롤백 절차
```bash
# 백업 파일로 복원
cp backend/.env.backup.20251120 backend/.env
cp backend/app/core/config.py.backup backend/app/core/config.py

# 서버 재시작
pkill -f "uvicorn main:app"
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

### 2. 트러블슈팅

#### 문제: "gemini-2.5-flash not found"
**해결**:
- API 키 확인
- Google AI Studio에서 모델 활성화 상태 확인

#### 문제: 서버가 시작되지 않음
**해결**:
1. 포트 충돌 확인: `lsof -i :8000`
2. 의존성 확인: `pip install -r requirements.txt`
3. 로그 확인: `cat backend.log`

---

## 📋 최종 체크리스트

### 동기화 완료 확인
- [ ] Git 동기화 완료
- [ ] .env 파일 업데이트
- [ ] config.py 파일 업데이트
- [ ] Provider 파일 업데이트
- [ ] 서버 재시작 완료
- [ ] API 헬스체크 통과
- [ ] Gemini 테스트 통과
- [ ] 30분 모니터링 완료

### 문서 업데이트
- [ ] 변경 이력 기록
- [ ] 팀 공유 채널에 완료 보고
- [ ] 이슈 트래커 업데이트

---

## 📞 연락처

문제 발생 시:
- **A팀 QA**: 테스트 및 검증
- **B팀 Backend**: 기술 지원
- **긴급**: Slack #backend-urgent

---

## 📝 동기화 이력

| 날짜 | 작업자 | 변경 내용 | 상태 |
|------|--------|-----------|------|
| 2025-11-20 | A팀 | 체크리스트 작성 | ✅ |
| 2025-11-20 | 대기중 | 맥미니 동기화 | ⏳ |

---

**다음 업데이트**: 동기화 완료 후 결과 추가