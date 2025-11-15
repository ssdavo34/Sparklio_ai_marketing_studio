# Concept Board - C팀 (Frontend) 작업 지시서

## 📋 Phase 1: 기본 UI 구현

### 목표
Concept Board 기능의 사용자 인터페이스를 구현하여 사용자가 프롬프트를 입력하고, 3x3 그리드로 생성된 이미지를 확인하며, 마음에 드는 타일을 선택할 수 있도록 합니다.

---

## 1. 라우팅 설정

### 1.1 라우트 추가

**파일**: `src/routes/AppRoutes.tsx`

```tsx
import { Routes, Route } from 'react-router-dom';
import ConceptBoardPage from '../pages/ConceptBoardPage';
import ConceptBoardListPage from '../pages/ConceptBoardListPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 기존 라우트들 */}
      <Route path="/brands/:brandId" element={<BrandDashboard />} />

      {/* Concept Board 라우트 */}
      <Route
        path="/brands/:brandId/concept-boards"
        element={<ConceptBoardListPage />}
      />
      <Route
        path="/brands/:brandId/concept-board/:boardId?"
        element={<ConceptBoardPage />}
      />
    </Routes>
  );
}
```

### 1.2 검증 체크리스트
- [ ] React Router 라우트 추가 완료
- [ ] URL 파라미터 (:brandId, :boardId?) 동작 확인
- [ ] 브라우저에서 라우트 접근 테스트

---

## 2. 타입 정의

### 2.1 TypeScript 인터페이스

**파일**: `src/types/concept-board.types.ts`

```typescript
export interface ConceptTile {
  id: string;
  conceptBoardId: string;
  position: number;                // 0-8
  imageUrl: string;
  thumbnailUrl: string;
  isSelected: boolean;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ConceptBoard {
  id: string;
  brandId: string;
  prompt: string;
  tiles: ConceptTile[];
  createdAt: string;
  updatedAt: string;
}

export interface ColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
}

export interface ToneAndManner {
  mood: string[];
  style: string[];
  atmosphere: string;
}

export interface BrandVisualStyle {
  id: string;
  brandId: string;
  conceptBoardId: string;
  colorPalette: ColorPalette;
  toneAndManner: ToneAndManner;
  visualKeywords: string[];
  selectedTileIds: string[];
  createdAt: string;
}

// API 요청/응답 타입
export interface CreateConceptBoardRequest {
  prompt: string;
}

export interface CreateConceptBoardResponse extends ConceptBoard {}

export interface UpdateTileSelectionRequest {
  isSelected: boolean;
}

export interface CreateVisualStyleRequest {
  conceptBoardId: string;
  selectedTileIds: string[];
}

export interface CreateVisualStyleResponse extends BrandVisualStyle {}
```

---

## 3. API Client 확장

### 3.1 Concept Board API 메서드 추가

**파일**: `src/services/api-client.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import {
  ConceptBoard,
  CreateConceptBoardRequest,
  CreateConceptBoardResponse,
  UpdateTileSelectionRequest,
  CreateVisualStyleRequest,
  CreateVisualStyleResponse,
  ConceptTile
} from '../types/concept-board.types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // JWT 토큰 자동 첨부
    this.client.interceptors.request.use(config => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ===== Concept Board API =====

  /**
   * 컨셉 보드 생성
   */
  async createConceptBoard(
    brandId: string,
    data: CreateConceptBoardRequest
  ): Promise<CreateConceptBoardResponse> {
    const response = await this.client.post<CreateConceptBoardResponse>(
      `/brands/${brandId}/concept-boards`,
      data
    );
    return response.data;
  }

  /**
   * 컨셉 보드 조회
   */
  async getConceptBoard(brandId: string, boardId: string): Promise<ConceptBoard> {
    const response = await this.client.get<ConceptBoard>(
      `/brands/${brandId}/concept-boards/${boardId}`
    );
    return response.data;
  }

  /**
   * 타일 선택 상태 업데이트
   */
  async updateTileSelection(
    boardId: string,
    tileId: string,
    data: UpdateTileSelectionRequest
  ): Promise<ConceptTile> {
    const response = await this.client.patch<ConceptTile>(
      `/concept-boards/${boardId}/tiles/${tileId}`,
      data
    );
    return response.data;
  }

  /**
   * Brand Visual Style 생성
   */
  async createVisualStyle(
    brandId: string,
    data: CreateVisualStyleRequest
  ): Promise<CreateVisualStyleResponse> {
    const response = await this.client.post<CreateVisualStyleResponse>(
      `/brands/${brandId}/visual-styles`,
      data
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### 3.2 React Query Hooks

**파일**: `src/hooks/useConceptBoard.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import {
  CreateConceptBoardRequest,
  UpdateTileSelectionRequest,
  CreateVisualStyleRequest
} from '../types/concept-board.types';

/**
 * 컨셉 보드 조회
 */
export function useConceptBoard(brandId: string, boardId?: string) {
  return useQuery({
    queryKey: ['conceptBoard', brandId, boardId],
    queryFn: () => apiClient.getConceptBoard(brandId, boardId!),
    enabled: !!boardId // boardId가 있을 때만 실행
  });
}

/**
 * 컨셉 보드 생성
 */
export function useCreateConceptBoard(brandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConceptBoardRequest) =>
      apiClient.createConceptBoard(brandId, data),
    onSuccess: (newBoard) => {
      // 캐시 갱신
      queryClient.setQueryData(
        ['conceptBoard', brandId, newBoard.id],
        newBoard
      );
    }
  });
}

/**
 * 타일 선택 업데이트
 */
export function useUpdateTileSelection(brandId: string, boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tileId, isSelected }: { tileId: string; isSelected: boolean }) =>
      apiClient.updateTileSelection(boardId, tileId, { isSelected }),
    onSuccess: (updatedTile) => {
      // 기존 보드 데이터 업데이트
      queryClient.setQueryData(
        ['conceptBoard', brandId, boardId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            tiles: oldData.tiles.map((tile: any) =>
              tile.id === updatedTile.id ? updatedTile : tile
            )
          };
        }
      );
    }
  });
}

/**
 * Visual Style 생성
 */
export function useCreateVisualStyle(brandId: string) {
  return useMutation({
    mutationFn: (data: CreateVisualStyleRequest) =>
      apiClient.createVisualStyle(brandId, data)
  });
}
```

---

## 4. 컴포넌트 구현

### 4.1 ConceptBoardPage (메인 페이지)

**파일**: `src/pages/ConceptBoardPage.tsx`

```tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConceptBoard, useCreateConceptBoard } from '../hooks/useConceptBoard';
import ConceptBoardGrid from '../components/ConceptBoard/ConceptBoardGrid';
import PromptInput from '../components/ConceptBoard/PromptInput';
import GenerateButton from '../components/ConceptBoard/GenerateButton';
import CreateStyleButton from '../components/ConceptBoard/CreateStyleButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function ConceptBoardPage() {
  const { brandId, boardId } = useParams<{ brandId: string; boardId?: string }>();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');

  // 기존 보드 조회 (boardId가 있으면)
  const { data: conceptBoard, isLoading, error } = useConceptBoard(brandId!, boardId);

  // 새 보드 생성
  const createMutation = useCreateConceptBoard(brandId!);

  const handleGenerate = async () => {
    if (prompt.length < 10) {
      alert('프롬프트는 최소 10자 이상 입력해주세요.');
      return;
    }

    try {
      const newBoard = await createMutation.mutateAsync({ prompt });
      // 새로 생성된 보드 페이지로 이동
      navigate(`/brands/${brandId}/concept-board/${newBoard.id}`);
    } catch (error) {
      console.error('Failed to create concept board:', error);
      alert('컨셉 보드 생성에 실패했습니다.');
    }
  };

  const selectedTiles = conceptBoard?.tiles.filter(tile => tile.isSelected) || [];
  const hasSelections = selectedTiles.length > 0;

  return (
    <div className="concept-board-page max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Concept Board</h1>
        <p className="text-gray-600 mt-2">
          브랜드의 시각적 아이덴티티를 탐색하고 정의하세요
        </p>
      </header>

      {/* Prompt Input Section */}
      <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          placeholder="예: 모던하고 미니멀한 럭셔리 화장품 브랜드, 차분한 베이지 톤, 자연스러운 질감"
          maxLength={500}
        />
        <GenerateButton
          onClick={handleGenerate}
          isLoading={createMutation.isPending}
          disabled={prompt.length < 10}
        />
      </section>

      {/* Concept Board Grid */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
          <p className="ml-4 text-gray-600">컨셉 보드를 불러오는 중...</p>
        </div>
      )}

      {error && (
        <ErrorMessage
          message="컨셉 보드를 불러오는데 실패했습니다."
          onRetry={() => window.location.reload()}
        />
      )}

      {conceptBoard && (
        <>
          <ConceptBoardGrid
            board={conceptBoard}
            brandId={brandId!}
          />

          {/* Create Visual Style Button */}
          <div className="mt-8 flex justify-center">
            <CreateStyleButton
              brandId={brandId!}
              conceptBoardId={conceptBoard.id}
              selectedTileIds={selectedTiles.map(t => t.id)}
              disabled={!hasSelections}
            />
          </div>
        </>
      )}
    </div>
  );
}
```

### 4.2 ConceptBoardGrid (3x3 그리드)

**파일**: `src/components/ConceptBoard/ConceptBoardGrid.tsx`

```tsx
import React from 'react';
import { ConceptBoard } from '../../types/concept-board.types';
import ConceptTileCard from './ConceptTileCard';

interface Props {
  board: ConceptBoard;
  brandId: string;
}

export default function ConceptBoardGrid({ board, brandId }: Props) {
  return (
    <div className="concept-board-grid">
      <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
        {board.tiles
          .sort((a, b) => a.position - b.position)
          .map(tile => (
            <ConceptTileCard
              key={tile.id}
              tile={tile}
              boardId={board.id}
              brandId={brandId}
            />
          ))}
      </div>
    </div>
  );
}
```

### 4.3 ConceptTileCard (개별 타일)

**파일**: `src/components/ConceptBoard/ConceptTileCard.tsx`

```tsx
import React, { useState } from 'react';
import { ConceptTile } from '../../types/concept-board.types';
import { useUpdateTileSelection } from '../../hooks/useConceptBoard';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import ImageModal from './ImageModal';

interface Props {
  tile: ConceptTile;
  boardId: string;
  brandId: string;
}

export default function ConceptTileCard({ tile, boardId, brandId }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const updateMutation = useUpdateTileSelection(brandId, boardId);

  const handleClick = () => {
    updateMutation.mutate({
      tileId: tile.id,
      isSelected: !tile.isSelected
    });
  };

  const handleDoubleClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className={`
          concept-tile-card
          relative aspect-square rounded-lg overflow-hidden
          cursor-pointer transition-all duration-200
          hover:scale-105 hover:shadow-xl
          ${tile.isSelected ? 'ring-4 ring-blue-500' : 'ring-1 ring-gray-200'}
        `}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Thumbnail (Progressive Loading) */}
        <img
          src={tile.thumbnailUrl}
          alt={`Tile ${tile.position + 1}`}
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />

        {/* Original Image */}
        <img
          src={tile.imageUrl}
          alt={`Tile ${tile.position + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />

        {/* Selection Indicator */}
        {tile.isSelected && (
          <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
            <CheckCircleIcon className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity" />
      </div>

      {/* Full Screen Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={tile.imageUrl}
        tileNumber={tile.position + 1}
      />
    </>
  );
}
```

### 4.4 PromptInput (프롬프트 입력창)

**파일**: `src/components/ConceptBoard/PromptInput.tsx`

```tsx
import React from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function PromptInput({
  value,
  onChange,
  placeholder,
  maxLength = 500
}: Props) {
  const remaining = maxLength - value.length;

  return (
    <div className="prompt-input-wrapper">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        프롬프트 입력
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className="
          w-full px-4 py-3 border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          resize-none text-gray-900 placeholder-gray-400
        "
      />
      <div className="flex justify-between items-center mt-2">
        <p className="text-sm text-gray-500">
          최소 10자 이상 입력해주세요
        </p>
        <p className={`text-sm ${remaining < 50 ? 'text-red-500' : 'text-gray-500'}`}>
          {remaining}자 남음
        </p>
      </div>
    </div>
  );
}
```

### 4.5 GenerateButton (생성 버튼)

**파일**: `src/components/ConceptBoard/GenerateButton.tsx`

```tsx
import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

interface Props {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function GenerateButton({ onClick, isLoading, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        mt-4 w-full sm:w-auto px-8 py-3 rounded-lg font-semibold
        flex items-center justify-center gap-2
        transition-all duration-200
        ${
          disabled || isLoading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
        }
      `}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="small" />
          <span>생성 중...</span>
        </>
      ) : (
        <>
          <SparklesIcon className="w-5 h-5" />
          <span>컨셉 보드 생성하기</span>
        </>
      )}
    </button>
  );
}
```

### 4.6 CreateStyleButton (스타일 생성 버튼)

**파일**: `src/components/ConceptBoard/CreateStyleButton.tsx`

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateVisualStyle } from '../../hooks/useConceptBoard';
import { PaintBrushIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

interface Props {
  brandId: string;
  conceptBoardId: string;
  selectedTileIds: string[];
  disabled: boolean;
}

export default function CreateStyleButton({
  brandId,
  conceptBoardId,
  selectedTileIds,
  disabled
}: Props) {
  const navigate = useNavigate();
  const createMutation = useCreateVisualStyle(brandId);

  const handleCreate = async () => {
    if (selectedTileIds.length === 0) {
      alert('최소 1개 이상의 타일을 선택해주세요.');
      return;
    }

    try {
      const visualStyle = await createMutation.mutateAsync({
        conceptBoardId,
        selectedTileIds
      });

      // Visual Style 페이지로 이동
      navigate(`/brands/${brandId}/visual-style/${visualStyle.id}`);
    } catch (error) {
      console.error('Failed to create visual style:', error);
      alert('Visual Style 생성에 실패했습니다.');
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={disabled || createMutation.isPending}
      className={`
        px-8 py-3 rounded-lg font-semibold
        flex items-center gap-2
        transition-all duration-200
        ${
          disabled || createMutation.isPending
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
        }
      `}
    >
      {createMutation.isPending ? (
        <>
          <LoadingSpinner size="small" />
          <span>생성 중...</span>
        </>
      ) : (
        <>
          <PaintBrushIcon className="w-5 h-5" />
          <span>
            선택한 타일로 스타일 생성하기 ({selectedTileIds.length}개)
          </span>
        </>
      )}
    </button>
  );
}
```

### 4.7 ImageModal (전체화면 이미지 모달)

**파일**: `src/components/ConceptBoard/ImageModal.tsx`

```tsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  tileNumber: number;
}

export default function ImageModal({ isOpen, onClose, imageUrl, tileNumber }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>

      <div className="relative max-w-6xl max-h-screen p-4">
        <img
          src={imageUrl}
          alt={`Tile ${tileNumber}`}
          className="max-w-full max-h-screen object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <p className="text-white text-center mt-4 text-lg">
          Tile {tileNumber}
        </p>
      </div>
    </div>
  );
}
```

---

## 5. 로딩 및 에러 상태 처리

### 5.1 LoadingSpinner 컴포넌트

**파일**: `src/components/common/LoadingSpinner.tsx`

```tsx
import React from 'react';

interface Props {
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ size = 'medium' }: Props) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}
```

### 5.2 ErrorMessage 컴포넌트

**파일**: `src/components/common/ErrorMessage.tsx`

```tsx
import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p className="text-red-800 font-semibold mb-2">오류 발생</p>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
```

---

## 6. 반응형 디자인

### 6.1 TailwindCSS 설정 확장

**파일**: `tailwind.config.js`

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
```

### 6.2 반응형 그리드 조정

**파일**: `src/components/ConceptBoard/ConceptBoardGrid.tsx` (수정)

```tsx
export default function ConceptBoardGrid({ board, brandId }: Props) {
  return (
    <div className="concept-board-grid">
      {/* Desktop: 3x3, Tablet: 3x3 (smaller), Mobile: 2xN */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 max-w-4xl mx-auto">
        {board.tiles
          .sort((a, b) => a.position - b.position)
          .map(tile => (
            <ConceptTileCard
              key={tile.id}
              tile={tile}
              boardId={board.id}
              brandId={brandId}
            />
          ))}
      </div>
    </div>
  );
}
```

---

## 7. 애니메이션 및 UX 개선

### 7.1 타일 순차 페이드인

**파일**: `src/components/ConceptBoard/ConceptTileCard.tsx` (수정)

```tsx
export default function ConceptTileCard({ tile, boardId, brandId }: Props) {
  // ... 기존 코드 ...

  return (
    <div
      className={`
        concept-tile-card
        relative aspect-square rounded-lg overflow-hidden
        cursor-pointer transition-all duration-200
        hover:scale-105 hover:shadow-xl
        animate-fade-in
        ${tile.isSelected ? 'ring-4 ring-blue-500' : 'ring-1 ring-gray-200'}
      `}
      style={{ animationDelay: `${tile.position * 0.1}s` }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* ... 기존 이미지 렌더링 ... */}
    </div>
  );
}
```

### 7.2 Progressive Image Loading

**파일**: `src/hooks/useProgressiveImage.ts`

```typescript
import { useState, useEffect } from 'react';

export function useProgressiveImage(thumbnailSrc: string, fullSrc: string) {
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = fullSrc;

    img.onload = () => {
      setCurrentSrc(fullSrc);
      setIsLoading(false);
    };
  }, [fullSrc]);

  return { currentSrc, isLoading };
}
```

**파일**: `src/components/ConceptBoard/ConceptTileCard.tsx` (적용)

```tsx
import { useProgressiveImage } from '../../hooks/useProgressiveImage';

export default function ConceptTileCard({ tile, boardId, brandId }: Props) {
  const { currentSrc, isLoading } = useProgressiveImage(
    tile.thumbnailUrl,
    tile.imageUrl
  );

  // ... 기존 코드 ...

  return (
    <div className="...">
      <img
        src={currentSrc}
        alt={`Tile ${tile.position + 1}`}
        className={`
          absolute inset-0 w-full h-full object-cover
          transition-all duration-300
          ${isLoading ? 'blur-sm' : 'blur-0'}
        `}
        loading="lazy"
      />
      {/* ... */}
    </div>
  );
}
```

---

## 8. 환경 변수 설정

**파일**: `.env`

```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:3000/api

# Feature Flags
VITE_ENABLE_CONCEPT_BOARD=true
```

---

## 9. Phase 1 완료 체크리스트

### 라우팅
- [ ] React Router 라우트 추가 완료
- [ ] URL 파라미터 동작 확인
- [ ] 네비게이션 링크 추가 (사이드바/헤더)

### 타입 정의
- [ ] TypeScript 인터페이스 작성
- [ ] API 요청/응답 타입 정의
- [ ] 타입 에러 없이 컴파일 성공

### API 연동
- [ ] api-client.ts에 4개 메서드 추가
- [ ] React Query hooks 구현
- [ ] Axios interceptor (JWT 토큰) 설정
- [ ] 에러 핸들링 및 재시도 로직

### 컴포넌트
- [ ] ConceptBoardPage 구현
- [ ] ConceptBoardGrid (3x3 그리드) 구현
- [ ] ConceptTileCard (타일) 구현
- [ ] PromptInput 구현
- [ ] GenerateButton 구현
- [ ] CreateStyleButton 구현
- [ ] ImageModal 구현

### UX/UI
- [ ] LoadingSpinner 구현
- [ ] ErrorMessage 구현
- [ ] Progressive image loading
- [ ] 타일 호버/선택 애니메이션
- [ ] 타일 순차 페이드인 효과

### 반응형 디자인
- [ ] Desktop (1200px+) 레이아웃 확인
- [ ] Tablet (768-1199px) 레이아웃 확인
- [ ] Mobile (<768px) 레이아웃 확인
- [ ] 터치 인터랙션 테스트 (모바일)

### 테스트
- [ ] 컴포넌트 단위 테스트 (Vitest + React Testing Library)
- [ ] E2E 테스트 (Playwright/Cypress)
- [ ] 크로스 브라우저 테스트 (Chrome, Safari, Firefox)
- [ ] 접근성 테스트 (Lighthouse)

---

## 10. 다음 단계 (Phase 2)

- 웹소켓 연동으로 실시간 생성 진행률 표시
- 드래그 앤 드롭으로 타일 순서 변경
- 여러 Concept Board 비교 뷰
- 키보드 단축키 (숫자키로 타일 선택)
- 다크 모드 지원
- 애니메이션 성능 최적화 (will-change, transform)

---

## 11. 참고 자료

### TailwindCSS 유틸리티
- Grid: https://tailwindcss.com/docs/grid-template-columns
- Animations: https://tailwindcss.com/docs/animation
- Responsive Design: https://tailwindcss.com/docs/responsive-design

### React Query
- Mutations: https://tanstack.com/query/latest/docs/react/guides/mutations
- Optimistic Updates: https://tanstack.com/query/latest/docs/react/guides/optimistic-updates

### Heroicons
- Icon Library: https://heroicons.com/

---

**문의사항이나 블로커가 있으면 즉시 팀 리드에게 공유해주세요!**
