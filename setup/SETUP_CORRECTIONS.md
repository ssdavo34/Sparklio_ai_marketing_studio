# 환경 설정 보고서 수정 사항

**작성일**: 2025-11-15

## 중요 수정 사항

### 1. Mistral Small 모델
- ❌ **수정 전**: Mistral Small 모델 설치 권장
- ✅ **수정 후**: Mistral Small은 테스트 대상 아님 (제외)
- **이유**: 사용자 요청

### 2. ComfyUI 실행 방식
- ❌ **수정 전**: ComfyUI가 Docker에서 실행되는 것으로 기재
- ✅ **수정 후**: ComfyUI는 **단독 실행** (Docker 아님)
- **실행 방법**:
  ```bash
  cd D:/AI/ComfyUI/ComfyUI
  ./python_embeded/python.exe main.py
  ```
- **포트**: 8188 (Windows 직접 실행)
- **Python**: 내장 Python 3.9.6 사용

### 3. 최종 LLM 모델 구성

#### Desktop GPU Worker
- ✅ **현재 설치됨**:
  - `qwen2.5:14b` (8.99GB) - Q4_K_M
  - `llama3.2:latest` (2.02GB) - Q4_K_M

- ⏳ **추가 설치 권장**:
  - `qwen2.5:7b` - 빠른 추론용

- ❌ **설치 안 함**:
  - `mistral-small:latest` - 제외

## 남은 작업 업데이트

### Desktop
- [ ] ComfyUI 서비스 시작 (단독 실행, Python 내장)
- [ ] Qwen 2.5 7B 모델 설치

### Mac mini
- [ ] FastAPI 서버 자동 시작 설정
- [ ] pgvector 확장 활성화
- [ ] MinIO 버킷 생성
- [ ] 데이터베이스 스키마 초기화

### Laptop
- [ ] K: SSD 연결 후 설정 실행
- [ ] Node.js 환경 설정
- [ ] Frontend 프로젝트 초기화

---

**참고**: `ENVIRONMENT_SETUP_REPORT.md`의 내용은 이 수정 사항을 반영하여 이해해 주세요.
