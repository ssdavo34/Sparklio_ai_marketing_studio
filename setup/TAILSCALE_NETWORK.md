# Tailscale 3-Node VPN 네트워크 설정

Sparklio AI Marketing Studio의 3개 노드 간 Tailscale VPN 연결 구성

## 네트워크 구성

```
┌────────────────────────────────────────────────────────────┐
│              Tailscale VPN Network                         │
│                  (ssdavo34@)                               │
└────────────────────────────────────────────────────────────┘
         │                    │                    │
    ┌────▼────┐          ┌───▼────┐          ┌───▼────┐
    │ Desktop │          │ Laptop │          │Mac mini│
    │ GPU     │          │Frontend│          │Backend │
    │ Worker  │          │  Dev   │          │ Server │
    └─────────┘          └────────┘          └────────┘
```

## 노드 정보

### 1. Desktop - GPU Worker
- **Tailscale IP**: `100.120.180.42`
- **Hostname**: `sweetlife`
- **OS**: Windows
- **역할**: AI 추론 및 이미지/비디오 생성
- **서비스**:
  - Ollama: `http://100.120.180.42:11434`
  - ComfyUI: `http://100.120.180.42:8188`
  - Whisper: Available via Ollama

### 2. Laptop - Frontend Development
- **Tailscale IP**: `100.101.68.23`
- **Hostname**: `desktop-ecmkau8`
- **OS**: Windows
- **역할**: 프론트엔드 개발 환경
- **서비스**:
  - Next.js Dev Server: `http://localhost:3000` (로컬 접속)
  - Next.js via Tailscale: `http://100.101.68.23:3000` (외부 접속)

### 3. Mac mini - Backend Server
- **Tailscale IP**: `100.123.51.5`
- **Hostname**: `woosuns-mac-mini`
- **OS**: macOS (Darwin 25.0.0, ARM64 M2)
- **역할**: 백엔드 API 서버 및 데이터베이스
- **서비스**:
  - FastAPI: `http://100.123.51.5:8000`
  - PostgreSQL: `100.123.51.5:5432`
  - Redis: `100.123.51.5:6379`
  - MinIO: `http://100.123.51.5:9000` (API), `http://100.123.51.5:9001` (Console)

## 연결 테스트

### Desktop에서 테스트

```powershell
# Tailscale 상태 확인
tailscale status

# Laptop 연결 테스트
ping 100.101.68.23

# Mac mini 연결 테스트
ping 100.123.51.5
curl http://100.123.51.5:8000/health
```

### Laptop에서 테스트

```powershell
# Tailscale 상태 확인
tailscale status

# Desktop GPU Worker 테스트
ping 100.120.180.42
curl http://100.120.180.42:11434/api/tags

# Mac mini Backend 테스트
ping 100.123.51.5
curl http://100.123.51.5:8000/health
```

### Mac mini에서 테스트

```bash
# Tailscale 상태 확인
tailscale status

# Desktop GPU Worker 테스트
ping 100.120.180.42
curl http://100.120.180.42:11434/api/tags

# Laptop 테스트 (개발 서버 실행 중일 때)
ping 100.101.68.23
curl http://100.101.68.23:3000
```

## 포트 정리

### Desktop (100.120.180.42)
| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| Ollama | 11434 | HTTP | Tailscale |
| ComfyUI | 8188 | HTTP/WebSocket | Tailscale |

### Laptop (100.101.68.23)
| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| Next.js | 3000 | HTTP | Localhost + Tailscale |

### Mac mini (100.123.51.5)
| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| FastAPI | 8000 | HTTP | Tailscale |
| PostgreSQL | 5432 | TCP | Tailscale |
| Redis | 6379 | TCP | Tailscale |
| MinIO API | 9000 | HTTP | Tailscale |
| MinIO Console | 9001 | HTTP | Tailscale |

## 보안 설정

### Tailscale ACL (Access Control List)
현재는 같은 계정 (ssdavo34@)의 모든 노드가 서로 접근 가능합니다.

필요시 Tailscale Admin Console에서 ACL 설정 가능:
https://login.tailscale.com/admin/acls

### 방화벽 규칙
각 노드는 Tailscale 네트워크 내에서만 서비스 포트를 노출합니다.
외부 인터넷에서는 접근 불가능합니다.

## 트러블슈팅

### Q1: 노드가 Offline 상태
```powershell
# Windows
tailscale up

# macOS/Linux
sudo tailscale up
```

### Q2: Ping은 되지만 서비스 연결 안 됨
- 해당 노드에서 서비스가 실행 중인지 확인
- 방화벽이 Tailscale 네트워크를 허용하는지 확인
- 포트 번호가 올바른지 확인

### Q3: 느린 연결 속도
```powershell
tailscale status
```
- `direct` 연결 확인 (DERP relay가 아닌)
- Mac mini는 `direct 192.168.219.100:64094`로 직접 연결됨 (지연시간 1ms)

## 네트워크 다이어그램

```
                 Internet
                     │
          ┌──────────┴──────────┐
          │   Tailscale Cloud   │
          │   (Coordination)    │
          └──────────┬──────────┘
                     │
       ┌─────────────┼─────────────┐
       │             │             │
┌──────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
│  Desktop    │ │ Laptop │ │  Mac mini   │
│  GPU Worker │ │Frontend│ │   Backend   │
│             │ │  Dev   │ │   Server    │
└─────────────┘ └────────┘ └─────────────┘
│             │ │        │ │             │
│ Ollama      │ │Next.js │ │ FastAPI     │
│ ComfyUI     │ │        │ │ PostgreSQL  │
│ Whisper     │ │        │ │ Redis       │
│             │ │        │ │ MinIO       │
└─────────────┘ └────────┘ └─────────────┘

모든 노드는 Tailscale VPN을 통해 직접 통신
```

## 성능 지표

- **Mac mini ↔ Desktop**: ~1ms (같은 로컬 네트워크)
- **연결 방식**: Direct (최적)
- **대역폭**: 로컬 네트워크 속도 (1Gbps)

## 참고 자료

- Tailscale Docs: https://tailscale.com/kb/
- Admin Console: https://login.tailscale.com/admin/machines
