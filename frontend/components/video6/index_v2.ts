/**
 * Video Pipeline V2 Components
 *
 * 폴더 구조:
 * components/video6/
 * ├── index.ts              # 기존 export
 * ├── index_v2.ts           # V2 export (이 파일)
 * ├── Video6Modal.tsx       # 전체 화면 오버레이 모달
 * ├── Video6Panel.tsx       # 메인 통합 패널 (기존 플로우)
 * ├── Video6PanelV2.tsx     # 4단계 확인 플로우 패널 (2025-12-01)
 * ├── StepProgressIndicator.tsx  # 4단계 진행 상황 표시
 * ├── ModeSelector.tsx      # 모드 선택 UI (REUSE/HYBRID/CREATIVE)
 * ├── RenderProgress.tsx    # 렌더링 진행률 표시
 * ├── AssetPoolGrid.tsx     # Asset Pool 이미지 선택 그리드
 * ├── SceneEditor.tsx       # 개별 씬 편집
 * ├── PlanReview.tsx        # 플랜 검토 및 승인
 * └── steps/                # 4단계 플로우 개별 Step 컴포넌트
 *     ├── ScriptReviewStep.tsx
 *     ├── ImageReviewStep.tsx
 *     ├── MotionReviewStep.tsx
 *     └── RenderCostStep.tsx
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-01
 */

// 메인 컴포넌트
export { Video6Modal } from './Video6Modal';
export { Video6Panel } from './Video6Panel';
export { Video6PanelV2 } from './Video6PanelV2';

// 4단계 플로우 컴포넌트 (2025-12-01)
export { StepProgressIndicator, StepProgressIndicatorCompact, StepStatusMessage } from './StepProgressIndicator';
export * from './steps';

// 개별 컴포넌트
export { ModeSelector } from './ModeSelector';
export { RenderProgress } from './RenderProgress';
export { AssetPoolGrid } from './AssetPoolGrid';
export { SceneEditor } from './SceneEditor';
export { PlanReview } from './PlanReview';
