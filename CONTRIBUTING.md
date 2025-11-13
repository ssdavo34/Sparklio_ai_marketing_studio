# 🤝 기여 가이드 (Contributing Guide)

Sparklio AI 마케팅 스튜디오 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 효과적으로 기여하는 방법을 안내합니다.

## 목차

1. [시작하기 전에](#시작하기-전에)
2. [개발 환경 설정](#개발-환경-설정)
3. [기여 방법](#기여-방법)
4. [코드 작성 가이드라인](#코드-작성-가이드라인)
5. [Pull Request 프로세스](#pull-request-프로세스)
6. [이슈 리포팅](#이슈-리포팅)
7. [코드 리뷰 가이드](#코드-리뷰-가이드)
8. [커뮤니티 가이드라인](#커뮤니티-가이드라인)

---

## 시작하기 전에

### 행동 강령 (Code of Conduct)

모든 기여자는 다음 원칙을 준수해야 합니다:

- **존중**: 모든 참여자를 존중하고 배려합니다
- **협력**: 건설적인 피드백과 협력적인 태도를 유지합니다
- **포용**: 다양한 배경과 경험을 가진 사람들을 환영합니다
- **전문성**: 전문적이고 예의 바른 의사소통을 합니다

부적절한 행동을 목격하거나 경험한 경우, conduct@sparklio.ai로 신고해주세요.

### 기여할 수 있는 방법

다음과 같은 방법으로 프로젝트에 기여할 수 있습니다:

- 🐛 **버그 리포트**: 발견한 버그를 이슈로 등록
- 💡 **기능 제안**: 새로운 기능 아이디어 제안
- 📝 **문서 개선**: 오타 수정, 설명 추가, 번역 등
- 💻 **코드 기여**: 버그 수정, 새 기능 구현, 성능 개선
- 🧪 **테스트 작성**: 단위 테스트, 통합 테스트 추가
- 🎨 **디자인 개선**: UI/UX 개선 제안 및 구현
- 🌐 **번역**: 다국어 지원 (현재 한글과 영어 지원)

---

## 개발 환경 설정

자세한 개발 환경 설정은 [개발 가이드](docs/guides/개발_가이드.md)를 참고하세요.

### 빠른 시작

```bash
# 1. 저장소 포크 및 클론
git clone https://github.com/YOUR_USERNAME/Sparklio_ai_marketing_studio.git
cd Sparklio_ai_marketing_studio

# 2. upstream 리모트 추가
git remote add upstream https://github.com/ssdavo34/Sparklio_ai_marketing_studio.git

# 3. 개발 브랜치 생성
git checkout -b feature/your-feature-name

# 4. 백엔드 설정
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt  # 개발 도구

# 5. 프론트엔드 설정
cd ../frontend
npm install

# 6. 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값 입력

# 7. 데이터베이스 초기화
cd ../backend
alembic upgrade head

# 8. 개발 서버 실행
# 터미널 1: 백엔드
uvicorn backend.api.main:app --reload

# 터미널 2: 프론트엔드
cd frontend
npm run dev
```

---

## 기여 방법

### 1. 이슈 확인

기여를 시작하기 전에:

1. **기존 이슈 확인**: 중복된 이슈가 있는지 [Issues 페이지](https://github.com/ssdavo34/Sparklio_ai_marketing_studio/issues) 확인
2. **레이블 확인**:
   - `good first issue`: 처음 기여하기 좋은 이슈
   - `help wanted`: 도움이 필요한 이슈
   - `bug`: 버그 수정
   - `enhancement`: 새로운 기능
   - `documentation`: 문서 관련

3. **이슈 할당**: 작업하고 싶은 이슈에 댓글을 남겨 할당 요청

### 2. 브랜치 생성

브랜치 네이밍 컨벤션:

```bash
# 기능 개발
git checkout -b feature/기능명-간단설명
# 예: feature/brand-analyzer-color-extraction

# 버그 수정
git checkout -b fix/버그명-간단설명
# 예: fix/login-token-expiration

# 문서 수정
git checkout -b docs/문서명-간단설명
# 예: docs/api-authentication-guide

# 리팩토링
git checkout -b refactor/대상-간단설명
# 예: refactor/agent-communication-protocol
```

### 3. 개발 진행

#### 코드 작성

- **작은 단위로 커밋**: 논리적으로 분리된 작은 단위로 자주 커밋
- **의미 있는 커밋 메시지**: 변경 이유와 내용을 명확히 작성
- **테스트 작성**: 새로운 기능이나 버그 수정 시 반드시 테스트 추가
- **한글 주석 필수**: 모든 함수와 클래스에 한글 주석 작성

#### 커밋 전 체크리스트

```bash
# 1. 코드 포맷팅 (백엔드)
black backend/
isort backend/

# 2. 린팅
flake8 backend/
mypy backend/

# 3. 프론트엔드 린팅
cd frontend
npm run lint
npm run type-check

# 4. 테스트 실행
cd ../backend
pytest

cd ../frontend
npm run test

# 5. 전체 빌드 확인
npm run build
```

---

## 코드 작성 가이드라인

### Python (백엔드)

#### 1. 함수 및 클래스 작성

```python
from typing import List, Dict, Optional
from datetime import datetime

class BrandAnalyzer:
    """
    브랜드 분석을 수행하는 클래스입니다.

    로고, 웹사이트, PDF 등의 브랜드 자료를 분석하여
    컬러, 폰트, 톤앤매너 등을 자동으로 추출합니다.

    Attributes:
        vision_model (str): 사용할 비전 모델 이름
        max_colors (int): 추출할 최대 컬러 개수

    Example:
        >>> analyzer = BrandAnalyzer(vision_model="gpt-4-vision")
        >>> colors = analyzer.extract_colors("https://example.com/logo.png")
        >>> print(colors)
        ['#FF5733', '#C70039', '#900C3F']
    """

    def __init__(self, vision_model: str = "gpt-4-vision", max_colors: int = 5):
        """
        BrandAnalyzer 인스턴스를 초기화합니다.

        Args:
            vision_model (str): 사용할 비전 모델 이름 (기본값: "gpt-4-vision")
            max_colors (int): 추출할 최대 컬러 개수 (기본값: 5)
        """
        self.vision_model = vision_model
        self.max_colors = max_colors

    def extract_colors(
        self,
        image_url: str,
        include_shades: bool = False
    ) -> List[str]:
        """
        이미지에서 주요 컬러를 추출합니다.

        AI 비전 모델을 사용하여 이미지의 주요 컬러를 분석하고
        HEX 코드 형식으로 반환합니다.

        Args:
            image_url (str): 분석할 이미지의 URL
            include_shades (bool): 음영 포함 여부 (기본값: False)

        Returns:
            List[str]: HEX 코드 형식의 컬러 리스트
                예: ['#FF5733', '#C70039', '#900C3F']

        Raises:
            ValueError: URL이 유효하지 않은 경우
            APIError: 비전 API 호출 실패 시
            ImageProcessingError: 이미지 처리 중 오류 발생 시

        Example:
            >>> analyzer = BrandAnalyzer()
            >>> colors = analyzer.extract_colors(
            ...     "https://example.com/logo.png",
            ...     include_shades=True
            ... )
            >>> print(f"추출된 컬러 개수: {len(colors)}")
            추출된 컬러 개수: 5
        """
        # URL 유효성 검증
        if not self._is_valid_url(image_url):
            raise ValueError(f"유효하지 않은 URL입니다: {image_url}")

        try:
            # 이미지 다운로드
            image_data = self._download_image(image_url)

            # 비전 모델로 컬러 분석
            colors = self._analyze_colors_with_ai(image_data)

            # 음영 포함 옵션 처리
            if include_shades:
                colors = self._add_color_shades(colors)

            # 최대 개수로 제한
            return colors[:self.max_colors]

        except Exception as e:
            # 로깅
            logger.error(f"컬러 추출 실패: {str(e)}", exc_info=True)
            raise

    def _is_valid_url(self, url: str) -> bool:
        """
        URL 유효성을 검증합니다.

        Args:
            url (str): 검증할 URL

        Returns:
            bool: 유효한 URL이면 True, 아니면 False
        """
        # 구현...
        pass
```

#### 2. 에러 처리

```python
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class BrandAnalysisError(Exception):
    """브랜드 분석 관련 기본 예외 클래스"""
    pass

class ImageDownloadError(BrandAnalysisError):
    """이미지 다운로드 실패 예외"""
    pass

class ColorExtractionError(BrandAnalysisError):
    """컬러 추출 실패 예외"""
    pass

def safe_extract_colors(
    image_url: str,
    fallback_colors: Optional[List[str]] = None
) -> List[str]:
    """
    안전하게 컬러를 추출합니다. 실패 시 fallback 컬러를 반환합니다.

    Args:
        image_url (str): 이미지 URL
        fallback_colors (Optional[List[str]]): 실패 시 반환할 기본 컬러

    Returns:
        List[str]: 추출된 컬러 또는 fallback 컬러
    """
    try:
        analyzer = BrandAnalyzer()
        return analyzer.extract_colors(image_url)

    except ImageDownloadError as e:
        logger.warning(f"이미지 다운로드 실패: {str(e)}")
        return fallback_colors or ["#000000", "#FFFFFF"]

    except ColorExtractionError as e:
        logger.error(f"컬러 추출 실패: {str(e)}")
        return fallback_colors or ["#000000", "#FFFFFF"]

    except Exception as e:
        logger.critical(f"예상치 못한 오류: {str(e)}", exc_info=True)
        return fallback_colors or ["#000000", "#FFFFFF"]
```

### TypeScript (프론트엔드)

#### 1. React 컴포넌트

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { BrandKit } from '@/types/brand';

/**
 * 브랜드 컬러 선택 컴포넌트의 Props
 */
interface ColorPickerProps {
  /** 초기 선택된 컬러 */
  initialColor?: string;
  /** 컬러 변경 시 호출되는 콜백 */
  onChange: (color: string) => void;
  /** 선택 가능한 컬러 목록 */
  availableColors?: string[];
  /** 비활성화 여부 */
  disabled?: boolean;
}

/**
 * 브랜드 컬러를 선택할 수 있는 컴포넌트입니다.
 *
 * 사용자가 브랜드 키트의 컬러를 선택하거나 커스텀 컬러를
 * 입력할 수 있는 인터페이스를 제공합니다.
 *
 * @example
 * ```tsx
 * <ColorPicker
 *   initialColor="#FF5733"
 *   onChange={(color) => console.log('선택된 컬러:', color)}
 *   availableColors={brandKit.colors}
 * />
 * ```
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  initialColor = '#000000',
  onChange,
  availableColors = [],
  disabled = false
}) => {
  // 현재 선택된 컬러 상태
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);

  // 커스텀 컬러 입력 모드 상태
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  /**
   * 컬러 선택 핸들러
   * 선택된 컬러를 상태에 저장하고 부모 컴포넌트에 전달합니다.
   */
  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    onChange(color);
  }, [onChange]);

  /**
   * HEX 코드 유효성을 검증합니다.
   *
   * @param hex - 검증할 HEX 코드
   * @returns 유효한 HEX 코드이면 true
   */
  const isValidHex = (hex: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(hex);
  };

  /**
   * 커스텀 컬러 입력 핸들러
   */
  const handleCustomColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // HEX 코드가 유효한 경우에만 업데이트
    if (isValidHex(value)) {
      handleColorSelect(value);
    }
  };

  // 초기 컬러가 변경되면 상태 업데이트
  useEffect(() => {
    setSelectedColor(initialColor);
  }, [initialColor]);

  return (
    <div className="color-picker">
      {/* 프리셋 컬러 목록 */}
      <div className="preset-colors">
        {availableColors.map((color) => (
          <button
            key={color}
            className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
            disabled={disabled}
            aria-label={`컬러 선택: ${color}`}
          >
            {selectedColor === color && <CheckIcon />}
          </button>
        ))}
      </div>

      {/* 커스텀 컬러 입력 */}
      <div className="custom-color">
        <button
          onClick={() => setIsCustomMode(!isCustomMode)}
          disabled={disabled}
        >
          {isCustomMode ? '프리셋으로 돌아가기' : '커스텀 컬러 입력'}
        </button>

        {isCustomMode && (
          <input
            type="text"
            value={selectedColor}
            onChange={handleCustomColorInput}
            placeholder="#000000"
            pattern="^#[0-9A-Fa-f]{6}$"
            disabled={disabled}
            aria-label="커스텀 컬러 HEX 코드 입력"
          />
        )}
      </div>
    </div>
  );
};
```

#### 2. API 호출 및 에러 처리

```typescript
import axios, { AxiosError } from 'axios';

/**
 * API 응답 타입
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * 브랜드 키트 타입
 */
interface BrandKit {
  brand_kit_id: string;
  colors: {
    primary: string;
    secondary: string;
    palette: string[];
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  // ... 기타 필드
}

/**
 * 브랜드 분석 API를 호출합니다.
 *
 * @param logoUrl - 브랜드 로고 이미지 URL
 * @param websiteUrl - 브랜드 웹사이트 주소
 * @returns 생성된 브랜드 키트
 * @throws {ApiError} API 호출 실패 시
 */
export async function analyzeBrand(
  logoUrl: string,
  websiteUrl: string
): Promise<BrandKit> {
  try {
    // API 요청
    const response = await axios.post<ApiResponse<BrandKit>>(
      '/api/brand/analyze',
      {
        logo_url: logoUrl,
        website_url: websiteUrl
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        timeout: 30000 // 30초 타임아웃
      }
    );

    // 응답 검증
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || '브랜드 분석에 실패했습니다.'
      );
    }

    return response.data.data;

  } catch (error) {
    // 에러 타입별 처리
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<never>>;

      if (axiosError.response) {
        // 서버가 응답을 반환한 경우
        const { status, data } = axiosError.response;

        switch (status) {
          case 400:
            throw new Error(
              data.error?.message || '입력 데이터가 유효하지 않습니다.'
            );
          case 401:
            throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
          case 429:
            throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          default:
            throw new Error(
              data.error?.message || '알 수 없는 오류가 발생했습니다.'
            );
        }
      } else if (axiosError.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        throw new Error(
          '서버와 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
        );
      }
    }

    // 기타 예상치 못한 오류
    throw new Error('브랜드 분석 중 오류가 발생했습니다.');
  }
}

/**
 * 로컬 스토리지에서 액세스 토큰을 가져옵니다.
 */
function getAccessToken(): string {
  return localStorage.getItem('access_token') || '';
}
```

---

## Pull Request 프로세스

### 1. PR 생성 전 체크리스트

- [ ] 모든 테스트가 통과했는가?
- [ ] 린팅/포맷팅 규칙을 준수했는가?
- [ ] 한글 주석이 모든 함수/클래스에 추가되었는가?
- [ ] 문서가 업데이트되었는가? (필요한 경우)
- [ ] CHANGELOG.md에 변경사항을 추가했는가?
- [ ] 커밋 메시지가 컨벤션을 따르는가?

### 2. PR 템플릿

```markdown
## 📝 변경 사항 요약

이 PR의 주요 변경 사항을 간단히 설명해주세요.

## 🎯 관련 이슈

Closes #이슈번호

## 🔧 변경 내용

상세한 변경 내용을 작성해주세요:

- 변경사항 1
- 변경사항 2
- 변경사항 3

## 🧪 테스트

어떻게 테스트했는지 설명해주세요:

1. 테스트 방법 1
2. 테스트 방법 2

## 📸 스크린샷 (UI 변경인 경우)

변경 전후 스크린샷을 첨부해주세요.

## ✅ 체크리스트

- [ ] 모든 테스트 통과
- [ ] 린팅/포맷팅 규칙 준수
- [ ] 한글 주석 추가 완료
- [ ] 문서 업데이트 완료 (해당하는 경우)
- [ ] CHANGELOG.md 업데이트
- [ ] Breaking changes가 있는 경우 명시
```

### 3. PR 리뷰 프로세스

1. **PR 생성**: 위 템플릿에 따라 PR 생성
2. **자동 검사**: CI/CD 파이프라인이 자동으로 테스트 및 린팅 실행
3. **코드 리뷰**: 최소 1명의 리뷰어 승인 필요
4. **수정 반영**: 리뷰 피드백에 따라 코드 수정
5. **병합**: 모든 검사 통과 및 승인 후 병합

---

## 이슈 리포팅

### 버그 리포트

```markdown
## 🐛 버그 설명

버그에 대한 명확하고 간결한 설명을 작성해주세요.

## 재현 방법

버그를 재현하는 단계:

1. '...'로 이동
2. '...'를 클릭
3. '...'까지 스크롤
4. 오류 발생 확인

## 예상 동작

어떤 동작을 예상했는지 설명해주세요.

## 실제 동작

실제로 어떤 동작이 발생했는지 설명해주세요.

## 스크린샷

가능하다면 스크린샷을 첨부해주세요.

## 환경

- OS: [예: Windows 11, macOS 14.0, Ubuntu 22.04]
- 브라우저: [예: Chrome 120, Safari 17]
- 버전: [예: v1.0.0]

## 추가 정보

기타 관련 정보를 추가해주세요.
```

### 기능 제안

```markdown
## 💡 기능 설명

제안하는 기능에 대한 명확하고 간결한 설명을 작성해주세요.

## 문제 및 필요성

이 기능이 왜 필요한지, 어떤 문제를 해결하는지 설명해주세요.

## 제안하는 솔루션

원하는 기능의 동작 방식을 설명해주세요.

## 대안

고려한 다른 대안들이 있다면 설명해주세요.

## 추가 정보

기타 관련 정보나 스크린샷을 추가해주세요.
```

---

## 코드 리뷰 가이드

### 리뷰어를 위한 가이드

코드 리뷰 시 다음 사항을 확인해주세요:

#### 기능성
- [ ] 코드가 의도한 대로 동작하는가?
- [ ] 엣지 케이스가 처리되었는가?
- [ ] 에러 처리가 적절한가?

#### 코드 품질
- [ ] 코드가 읽기 쉽고 이해하기 쉬운가?
- [ ] 함수와 변수명이 명확한가?
- [ ] 중복 코드가 없는가?
- [ ] 적절한 추상화가 되어 있는가?

#### 문서화
- [ ] 모든 함수에 한글 주석이 있는가?
- [ ] 복잡한 로직에 설명이 있는가?
- [ ] API 변경 시 문서가 업데이트되었는가?

#### 테스트
- [ ] 적절한 테스트가 작성되었는가?
- [ ] 테스트 커버리지가 충분한가?
- [ ] 모든 테스트가 통과하는가?

#### 보안
- [ ] SQL 인젝션, XSS 등의 취약점이 없는가?
- [ ] 민감한 정보가 노출되지 않는가?
- [ ] 인증/권한 검사가 적절한가?

#### 성능
- [ ] 불필요한 연산이 없는가?
- [ ] 데이터베이스 쿼리가 최적화되었는가?
- [ ] 메모리 누수 가능성은 없는가?

### 리뷰 댓글 작성 가이드

**건설적인 피드백 예시:**

✅ 좋은 리뷰:
```
이 함수의 로직이 명확하네요! 다만 에러 처리 부분에서
빈 문자열이 입력된 경우도 고려하면 더 안전할 것 같습니다.

다음과 같이 수정하면 어떨까요?

if not input_text or not input_text.strip():
    raise ValueError("입력 텍스트가 비어있습니다.")
```

❌ 피해야 할 리뷰:
```
이 코드는 좋지 않습니다. 다시 작성하세요.
```

---

## 커뮤니티 가이드라인

### 의사소통

- **명확하게**: 간결하고 명확하게 의사를 전달합니다
- **친절하게**: 항상 예의 바르고 친절한 태도를 유지합니다
- **건설적으로**: 비판보다는 개선 방안을 제시합니다
- **인내심**: 초보자에게 인내심을 가지고 도움을 제공합니다

### 질문하기

좋은 질문을 하려면:

1. **검색 먼저**: 같은 질문이 이미 있는지 검색
2. **명확한 제목**: 문제를 요약하는 제목 작성
3. **상세한 설명**: 시도한 방법과 결과 포함
4. **재현 가능**: 다른 사람이 재현할 수 있도록 정보 제공
5. **코드 예시**: 관련 코드 스니펫 첨부 (너무 길지 않게)

### 도움 주기

다른 기여자를 도울 때:

- **친절하게 안내**: 단순히 답을 주기보다 해결 방법을 안내
- **문서 링크**: 관련 문서나 리소스 링크 제공
- **예시 제공**: 가능하면 코드 예시 포함
- **피드백 요청**: 해결되었는지 확인

---

## 라이선스

이 프로젝트에 기여함으로써, 귀하의 기여가 프로젝트와 동일한 [MIT 라이선스](LICENSE) 하에 배포되는 것에 동의하는 것으로 간주됩니다.

---

## 문의

질문이나 제안사항이 있으시면:

- **이슈**: [GitHub Issues](https://github.com/ssdavo34/Sparklio_ai_marketing_studio/issues)
- **이메일**: dev@sparklio.ai
- **디스코드**: [Sparklio 개발자 커뮤니티](https://discord.gg/sparklio)

---

**다시 한번 기여해주셔서 감사합니다! 🎉**

함께 만들어가는 Sparklio AI 마케팅 스튜디오가 많은 분들께 도움이 되길 바랍니다.
