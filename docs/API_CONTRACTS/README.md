# API Contracts - Sparklio AI Marketing Studio

**최초 작성**: 2025-11-14 (금요일) 16:00
**최종 수정**: 2025-11-14 (금요일) 16:00
**관리자**: Team A (Docs & Architecture)

---

## 📌 개요

본 디렉토리는 **Team B (Backend)와 Team C (Frontend) 간의 API 계약서**를 관리합니다.

### 핵심 원칙

1. **API Contract First**: Team B가 API를 먼저 설계하고 JSON 파일로 작성
2. **Team C는 계약서 기반 Mock 개발**: 실제 구현 전에 UI 개발 가능
3. **매일 오전 동기화**: Team B가 API 변경 시 즉시 커밋, Team C가 매일 확인
4. **변경 이력 관리**: 모든 변경은 Git으로 추적

---

## 📁 파일 구조

```
API_CONTRACTS/
├─ README.md (본 문서)
├─ llm_router.json (Smart LLM Router API)
├─ agents.json (Agent A2A Protocol API)
├─ video_pipeline.json (Video Generation API)
├─ comfyui.json (ComfyUI Integration API)
├─ meeting_ai.json (Meeting AI API)
├─ ppc_ads.json (PPC Ads Publishing API)
└─ changelog.md (변경 이력)
```

---

## 🔄 작업 흐름

### Team B (API 설계 및 구현)

1. **API 설계**
   ```bash
   # 새 API 계약서 작성
   code docs/API_CONTRACTS/new_feature.json
   ```

2. **계약서 작성 (JSON 형식)**
   - OpenAPI 3.0 스펙 준수
   - Request/Response 스키마 명시
   - 에러 코드 정의

3. **커밋 및 공지**
   ```bash
   git add docs/API_CONTRACTS/new_feature.json
   git commit -m "[2025-11-14 10:30] api: New Feature API 계약서 추가"
   git push origin feature/backend-core
   ```

4. **변경 이력 업데이트**
   - `changelog.md`에 변경 사항 기록

### Team C (Mock 개발 및 UI 작업)

1. **매일 오전 계약서 확인**
   ```bash
   cd K:\sparklio_ai_marketing_studio
   git status
   # docs/API_CONTRACTS/ 변경사항 확인
   ```

2. **변경된 계약서 확인**
   ```bash
   code docs/API_CONTRACTS/changelog.md
   ```

3. **Mock 데이터 생성**
   ```typescript
   // src/mocks/new_feature.mock.ts
   import contract from '@/docs/API_CONTRACTS/new_feature.json';

   export const mockNewFeature = {
     // contract 기반 Mock 데이터
   };
   ```

4. **UI 개발 진행**
   - Mock 기반으로 UI 먼저 완성
   - Team B의 실제 구현 완료 후 연결

---

## 📝 계약서 작성 규칙

### 1. 파일명 규칙
- 형식: `[기능명].json`
- 예시: `llm_router.json`, `video_pipeline.json`
- 소문자 + 언더스코어 사용

### 2. JSON 구조 (OpenAPI 3.0 기반)
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Smart LLM Router API",
    "version": "1.0.0",
    "description": "사용자 요청을 최적 LLM 모델로 라우팅하는 API",
    "lastUpdated": "2025-11-14 (금요일) 16:00",
    "owner": "Team B"
  },
  "servers": [
    {
      "url": "http://localhost:3000/api",
      "description": "로컬 개발 서버"
    },
    {
      "url": "http://100.123.51.5:3000/api",
      "description": "Mac mini 서버"
    }
  ],
  "paths": {
    "/llm/route": {
      "post": {
        "summary": "최적 LLM 모델 선택",
        "description": "사용자 입력 및 모드에 따라 최적의 LLM 모델을 선택합니다.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["prompt", "mode"],
                "properties": {
                  "prompt": {
                    "type": "string",
                    "description": "사용자 입력 텍스트",
                    "example": "인스타그램 릴스용 영상 스크립트 작성해줘"
                  },
                  "mode": {
                    "type": "string",
                    "enum": ["draft_fast", "balanced", "high_fidelity", "privacy_first", "cost_optimized"],
                    "description": "라우팅 모드",
                    "example": "balanced"
                  },
                  "context": {
                    "type": "object",
                    "description": "추가 컨텍스트 (브랜드 정보, 이전 대화 등)",
                    "properties": {
                      "brandId": { "type": "string" },
                      "conversationId": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "성공",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "selectedModel": {
                      "type": "string",
                      "description": "선택된 모델명",
                      "example": "gpt-4o"
                    },
                    "estimatedCost": {
                      "type": "number",
                      "description": "예상 비용 (USD)",
                      "example": 0.015
                    },
                    "reasoning": {
                      "type": "string",
                      "description": "선택 이유",
                      "example": "긴 컨텍스트 처리 필요, 균형 모드 선택"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "잘못된 요청",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "string",
                      "example": "Invalid mode: unknown_mode"
                    },
                    "errorCode": {
                      "type": "string",
                      "example": "INVALID_MODE"
                    }
                  }
                }
              }
            }
          },
          "500": {
            "description": "서버 에러",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "string",
                      "example": "Internal server error"
                    },
                    "errorCode": {
                      "type": "string",
                      "example": "INTERNAL_ERROR"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "RouterMode": {
        "type": "string",
        "enum": ["draft_fast", "balanced", "high_fidelity", "privacy_first", "cost_optimized"],
        "description": "라우팅 모드"
      }
    }
  }
}
```

### 3. 필수 포함 항목
- `info.lastUpdated`: 최종 수정 날짜 (YYYY-MM-DD (요일) HH:MM 형식)
- `info.owner`: 담당 팀 (Team B)
- `servers`: 개발/프로덕션 서버 URL
- `paths`: 모든 엔드포인트 정의
- `requestBody.schema`: 요청 스키마 (required 필드 명시)
- `responses`: 성공/에러 응답 (200, 400, 500 필수)
- `example`: 모든 필드에 예시 값 포함

---

## 🔄 변경 이력 관리

### `changelog.md` 형식
```markdown
# API Contracts 변경 이력

## 2025-11-14 (금요일) 16:00
- **변경 파일**: `llm_router.json`
- **변경 내용**: 최초 작성
- **담당자**: Team B
- **영향 범위**: Team C - Mock 데이터 생성 필요

## 2025-11-15 (토요일) 10:30
- **변경 파일**: `video_pipeline.json`
- **변경 내용**: `/api/video/generate` 엔드포인트 추가
- **담당자**: Team B
- **영향 범위**: Team C - Video Studio UI 연동 필요
- **Breaking Change**: 없음
```

---

## ✅ 체크리스트

### Team B (API 설계 시)
- [ ] OpenAPI 3.0 스펙 준수
- [ ] 모든 필드에 `description` 포함
- [ ] 모든 필드에 `example` 포함
- [ ] 에러 코드 정의 (`errorCode` 필드)
- [ ] `changelog.md` 업데이트
- [ ] Git 커밋 메시지에 날짜 포함
- [ ] Team C에게 공지 (Slack/Discord)

### Team C (계약서 확인 시)
- [ ] 매일 오전 `changelog.md` 확인
- [ ] 변경된 계약서 읽기
- [ ] Mock 데이터 생성 또는 업데이트
- [ ] 기존 UI 영향 범위 확인
- [ ] Breaking Change 시 Team A에게 보고

---

## 🚨 에러 처리 규칙

### 공통 에러 코드
| HTTP 상태 | errorCode | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_REQUEST` | 잘못된 요청 파라미터 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 429 | `RATE_LIMIT_EXCEEDED` | API 호출 한도 초과 |
| 500 | `INTERNAL_ERROR` | 서버 내부 오류 |
| 503 | `SERVICE_UNAVAILABLE` | 서비스 일시 중단 |

### 비용 관련 에러 (Smart LLM Router 전용)
| HTTP 상태 | errorCode | 설명 |
|-----------|-----------|------|
| 402 | `BUDGET_WARNING` | 비용 경고 ($1 초과) |
| 402 | `BUDGET_APPROVAL_REQUIRED` | 승인 필요 ($5 초과) |
| 402 | `BUDGET_CRITICAL` | 긴급 중단 ($20 초과) |

---

## 📊 API 계약서 우선순위

### P0 (1주 이내)
- [x] `llm_router.json` (Smart LLM Router)
- [ ] `agents.json` (Agent A2A Protocol)

### P1 (2주 이내)
- [ ] `video_pipeline.json` (Video Generation)
- [ ] `comfyui.json` (ComfyUI Integration)
- [ ] `meeting_ai.json` (Meeting AI)

### P2 (4주 이내)
- [ ] `ppc_ads.json` (PPC Ads Publishing)

---

**본 디렉토리의 모든 파일은 Team A가 최종 검토합니다.**
**변경 시 반드시 규정집(`WORK_REGULATIONS.md`) 준수 필수.**
