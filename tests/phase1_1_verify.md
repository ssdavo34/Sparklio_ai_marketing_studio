---
doc_id: TEST-001
title: Phase 1-1 검증 시나리오 (디렉토리 구조 생성)
created: 2025-11-16
updated: 2025-11-16 16:50
status: active
priority: P0
authors: A팀 (QA & Testing)
phase: Phase 1-1
target_date: 2025-11-16 18:00
related:
  - PLAN-B001: B팀 작업 지시 회신
  - SPEC-001: LLM Gateway Spec
  - ARCH-002: Gateway Pattern
---

# Phase 1-1 검증 시나리오

**검증 대상**: B팀 Phase 1-1 완료 결과물
**검증 시점**: 2025-11-16 18:30 (B팀 체크인 후)
**소요 시간**: 10분
**검증자**: A팀 (QA & Testing)

---

## 📋 TL;DR (30초 요약)

**목표**: 디렉토리 구조와 기초 파일이 올바르게 생성되었는지 확인
**방법**: 파일 존재 확인 + 코드 내용 검증
**성공 기준**: 모든 체크리스트 ✅

---

## ✅ 검증 체크리스트

### 1. 디렉토리 구조 확인

```bash
cd K:\sparklio_ai_marketing_studio\backend
```

#### 1.1 API 엔드포인트 디렉토리
- [ ] `app/api/v1/endpoints/` 존재
- [ ] `app/api/v1/endpoints/__init__.py` 존재 (Python 패키지)

#### 1.2 LLM 서비스 디렉토리
- [ ] `app/services/llm/` 존재
- [ ] `app/services/llm/__init__.py` 존재
- [ ] `app/services/llm/providers/` 존재
- [ ] `app/services/llm/providers/__init__.py` 존재

#### 1.3 Media 서비스 디렉토리
- [ ] `app/services/media/` 존재
- [ ] `app/services/media/__init__.py` 존재
- [ ] `app/services/media/providers/` 존재
- [ ] `app/services/media/providers/__init__.py` 존재

#### 1.4 클라이언트 디렉토리
- [ ] `app/services/clients/` 존재
- [ ] `app/services/clients/__init__.py` 존재

**검증 명령어**:
```bash
# 디렉토리 구조 확인
tree backend/app -L 3
# 또는
find backend/app -type d | grep -E "(endpoints|llm|media|clients)"
```

---

### 2. Provider 인터페이스 파일 확인

#### 2.1 LLM Provider Base 클래스
- [ ] `app/services/llm/providers/base.py` 파일 존재
- [ ] 파일 크기 > 0 (빈 파일 아님)

**검증 명령어**:
```bash
ls -lh backend/app/services/llm/providers/base.py
cat backend/app/services/llm/providers/base.py | head -30
```

#### 2.2 Media Provider Base 클래스 (선택)
- [ ] `app/services/media/providers/base.py` 파일 존재 (Phase 1-4에서 필수)

---

### 3. 코드 내용 검증

#### 3.1 LLM Provider 인터페이스 확인

**파일**: `app/services/llm/providers/base.py`

**필수 포함 내용**:
- [ ] `from abc import ABC, abstractmethod` import
- [ ] `from pydantic import BaseModel` import
- [ ] `LLMProviderResponse` Pydantic 모델 정의
  - [ ] `provider: str` 필드
  - [ ] `model: str` 필드
  - [ ] `usage: Dict[str, int]` 필드
  - [ ] `output: Dict[str, Any]` 필드
  - [ ] `meta: Dict[str, Any]` 필드
- [ ] `LLMProvider` ABC 클래스 정의
  - [ ] `vendor` 추상 프로퍼티 (`@property @abstractmethod`)
  - [ ] `supports_json` 추상 프로퍼티
  - [ ] `generate(...)` 추상 메서드 (`@abstractmethod`)

**검증 스크립트**:
```bash
# base.py 내용 확인
grep -q "class LLMProviderResponse" backend/app/services/llm/providers/base.py && echo "✅ LLMProviderResponse 정의됨" || echo "❌ LLMProviderResponse 없음"
grep -q "class LLMProvider.*ABC" backend/app/services/llm/providers/base.py && echo "✅ LLMProvider ABC 정의됨" || echo "❌ LLMProvider ABC 없음"
grep -q "@abstractmethod" backend/app/services/llm/providers/base.py && echo "✅ abstractmethod 사용됨" || echo "❌ abstractmethod 없음"
```

**예상 코드 구조**:
```python
from abc import ABC, abstractmethod
from typing import Dict, Any
from pydantic import BaseModel

class LLMProviderResponse(BaseModel):
    provider: str
    model: str
    usage: Dict[str, int]
    output: Dict[str, Any]
    meta: Dict[str, Any]

class LLMProvider(ABC):
    @property
    @abstractmethod
    def vendor(self) -> str:
        """Provider 벤더명"""
        pass

    @property
    @abstractmethod
    def supports_json(self) -> bool:
        """JSON 모드 지원 여부"""
        pass

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str,
        options: Dict[str, Any]
    ) -> LLMProviderResponse:
        """실제 LLM 호출"""
        pass
```

---

### 4. 설정 파일 업데이트 확인

#### 4.1 `app/core/config.py` 확인
- [ ] 파일 존재
- [ ] `GENERATOR_MODE` 설정 추가
- [ ] `OLLAMA_BASE_URL` 설정 추가
- [ ] `OLLAMA_TIMEOUT` 설정 추가
- [ ] `COMFYUI_BASE_URL` 설정 추가 (선택)
- [ ] `COMFYUI_TIMEOUT` 설정 추가 (선택)

**검증 명령어**:
```bash
grep -q "GENERATOR_MODE" backend/app/core/config.py && echo "✅ GENERATOR_MODE 추가됨" || echo "❌ GENERATOR_MODE 없음"
grep -q "OLLAMA_BASE_URL" backend/app/core/config.py && echo "✅ OLLAMA_BASE_URL 추가됨" || echo "❌ OLLAMA_BASE_URL 없음"
grep -q "OLLAMA_TIMEOUT" backend/app/core/config.py && echo "✅ OLLAMA_TIMEOUT 추가됨" || echo "❌ OLLAMA_TIMEOUT 없음"
```

**예상 코드**:
```python
class Settings(BaseSettings):
    # 기존 설정...

    # Generator Mode
    GENERATOR_MODE: str = "mock"  # mock | live

    # LLM (Ollama)
    OLLAMA_BASE_URL: str = "http://100.120.180.42:11434"
    OLLAMA_TIMEOUT: int = 120

    # Media (ComfyUI)
    COMFYUI_BASE_URL: str = "http://100.120.180.42:8188"
    COMFYUI_TIMEOUT: int = 300
```

#### 4.2 `.env` 파일 확인
- [ ] `.env` 파일 존재
- [ ] `GENERATOR_MODE=mock` 설정
- [ ] `OLLAMA_BASE_URL=http://100.120.180.42:11434` 설정
- [ ] `OLLAMA_TIMEOUT=120` 설정

**검증 명령어**:
```bash
grep -q "GENERATOR_MODE" backend/.env && echo "✅ GENERATOR_MODE 설정됨" || echo "❌ GENERATOR_MODE 없음"
grep -q "OLLAMA_BASE_URL" backend/.env && echo "✅ OLLAMA_BASE_URL 설정됨" || echo "❌ OLLAMA_BASE_URL 없음"
cat backend/.env | grep -E "(GENERATOR_MODE|OLLAMA_|COMFYUI_)"
```

---

### 5. Git 커밋 확인

#### 5.1 브랜치 확인
- [ ] `feature/llm-gateway-phase1` 브랜치 생성됨
- [ ] 해당 브랜치로 체크아웃되어 있음

**검증 명령어**:
```bash
cd K:\sparklio_ai_marketing_studio
git branch | grep "feature/llm-gateway-phase1"
git branch --show-current
```

#### 5.2 커밋 확인
- [ ] 최소 1개 이상 커밋 존재
- [ ] 커밋 메시지 명확 (예: `feat: Add LLM Gateway directory structure`)
- [ ] 변경된 파일 목록 확인

**검증 명령어**:
```bash
git log -1 --oneline
git log -1 --stat
git diff master...feature/llm-gateway-phase1 --name-only
```

**예상 변경 파일 목록**:
```
backend/app/api/v1/endpoints/__init__.py
backend/app/services/llm/providers/base.py
backend/app/services/llm/providers/__init__.py
backend/app/services/media/providers/__init__.py
backend/app/services/clients/__init__.py
backend/app/core/config.py
backend/.env
```

#### 5.3 원격 푸시 확인 (선택)
- [ ] 원격 저장소에 푸시됨 (선택 사항)

**검증 명령어**:
```bash
git log origin/feature/llm-gateway-phase1 -1 2>/dev/null && echo "✅ 원격 푸시됨" || echo "⚠️ 아직 푸시 안 됨 (로컬만)"
```

---

## 🔍 상세 검증 절차

### 자동 검증 스크립트

**파일**: `tests/phase1_1_auto_verify.sh`

```bash
#!/bin/bash
# Phase 1-1 자동 검증 스크립트

echo "=== Phase 1-1 검증 시작 ==="
echo ""

cd "K:\sparklio_ai_marketing_studio\backend" || exit 1

PASS=0
FAIL=0

# 디렉토리 존재 확인
check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1"
        ((PASS++))
    else
        echo "❌ $1 없음"
        ((FAIL++))
    fi
}

echo "1. 디렉토리 구조 확인"
check_dir "app/api/v1/endpoints"
check_dir "app/services/llm/providers"
check_dir "app/services/media/providers"
check_dir "app/services/clients"
echo ""

# 파일 존재 확인
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
        ((PASS++))
    else
        echo "❌ $1 없음"
        ((FAIL++))
    fi
}

echo "2. 파일 존재 확인"
check_file "app/services/llm/providers/base.py"
check_file "app/core/config.py"
check_file ".env"
echo ""

# 코드 내용 확인
check_code() {
    if grep -q "$2" "$1"; then
        echo "✅ $1: $3"
        ((PASS++))
    else
        echo "❌ $1: $3 없음"
        ((FAIL++))
    fi
}

echo "3. 코드 내용 확인"
check_code "app/services/llm/providers/base.py" "class LLMProviderResponse" "LLMProviderResponse 클래스"
check_code "app/services/llm/providers/base.py" "class LLMProvider.*ABC" "LLMProvider ABC 클래스"
check_code "app/core/config.py" "GENERATOR_MODE" "GENERATOR_MODE 설정"
check_code "app/core/config.py" "OLLAMA_BASE_URL" "OLLAMA_BASE_URL 설정"
check_code ".env" "GENERATOR_MODE" ".env GENERATOR_MODE"
echo ""

# Git 확인
echo "4. Git 확인"
cd .. || exit 1
if git branch | grep -q "feature/llm-gateway-phase1"; then
    echo "✅ feature/llm-gateway-phase1 브랜치 존재"
    ((PASS++))
else
    echo "❌ 브랜치 없음"
    ((FAIL++))
fi
echo ""

# 결과 요약
echo "=== 검증 결과 ==="
echo "통과: $PASS"
echo "실패: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 Phase 1-1 검증 완료! 모든 항목 통과"
    exit 0
else
    echo "⚠️ $FAIL개 항목 실패 - B팀에게 수정 요청"
    exit 1
fi
```

---

## 📊 검증 결과 보고

### 검증 결과 템플릿

**검증일시**: 2025-11-16 18:30
**검증자**: A팀 (QA & Testing)

#### 검증 결과 요약
- ✅ 통과: __개
- ❌ 실패: __개
- ⚠️ 경고: __개

#### 상세 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| 디렉토리 구조 | ✅/❌ | |
| Provider 인터페이스 | ✅/❌ | |
| 설정 파일 | ✅/❌ | |
| Git 커밋 | ✅/❌ | |

#### B팀 피드백

**통과 시**:
```
✅ Phase 1-1 검증 완료!

모든 항목 통과했습니다. 훌륭합니다! 👍

다음 단계:
- Phase 1-2: LLM Gateway API 엔드포인트 구현
- 예상 완료: 2025-11-17 18:00

계속 진행해주세요!
```

**실패 시**:
```
⚠️ Phase 1-1 검증 결과

실패 항목:
- [ ] 항목명 (상세 설명)
- [ ] ...

수정 후 다시 체크인 부탁드립니다.
질문 있으면 언제든 슬랙으로 문의하세요!
```

---

## 🚨 일반적인 문제 및 해결책

### 문제 1: 디렉토리가 생성되지 않음
**증상**: `app/services/llm/` 폴더 없음
**원인**: `mkdir -p` 명령어 미실행
**해결**:
```bash
mkdir -p backend/app/services/llm/providers
mkdir -p backend/app/services/media/providers
```

### 문제 2: `__init__.py` 파일 누락
**증상**: Python 패키지로 인식 안 됨
**원인**: `__init__.py` 파일 생성 누락
**해결**:
```bash
touch backend/app/services/llm/__init__.py
touch backend/app/services/llm/providers/__init__.py
```

### 문제 3: `base.py`가 비어 있음
**증상**: 파일 크기 0 bytes
**원인**: 코드 작성 누락
**해결**: [B팀 작업 지시 회신](../docs/requests/2025-11-16_B팀_작업지시_회신.md) 예시 코드 복사

### 문제 4: Git 브랜치 없음
**증상**: `feature/llm-gateway-phase1` 브랜치 없음
**원인**: 브랜치 생성 누락
**해결**:
```bash
git checkout -b feature/llm-gateway-phase1
git add .
git commit -m "feat: Add LLM Gateway directory structure (Phase 1-1)"
```

---

## 📋 최종 체크리스트

**A팀 검증자 확인 사항**:
- [ ] 모든 디렉토리 존재 확인
- [ ] `base.py` 코드 내용 확인
- [ ] `config.py` 설정 추가 확인
- [ ] `.env` 환경 변수 확인
- [ ] Git 커밋 확인
- [ ] B팀에게 검증 결과 피드백

**B팀 완료 기준**:
- [ ] 위 모든 체크리스트 ✅
- [ ] A팀 검증 통과
- [ ] 슬랙 완료 보고 (18:00)

---

**작성**: A팀 (QA & Testing)
**작성일**: 2025-11-16 16:50
**검증 예정**: 2025-11-16 18:30

**다음 단계**: [Phase 1-2 검증 시나리오](./phase1_2_verify.md) (내일 작성 예정)
