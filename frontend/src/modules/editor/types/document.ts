/**
 * Sparklio Editor Canonical Document Schema
 *
 * 이 타입은 전체 시스템에서 공통으로 사용하는 "단일 진실 소스(Single Source of Truth)"입니다.
 * - Backend Document API와 동기화
 * - Konva Canvas 렌더링 소스
 * - Generator 결과 포맷
 * - Agent 편집 대상
 */

// ========================================
// Document & Page
// ========================================

export type EditorDocument = {
  id: string;
  kind: DocumentKind;
  brandId?: string;
  projectId?: string;
  title: string;
  pages: EditorPage[];
  metadata: DocumentMetadata;
  createdAt: string;
  updatedAt: string;
};

export type DocumentKind =
  | 'product_detail'      // 제품 상세페이지
  | 'sns'                 // SNS 포스트 (1:1, 4:5, 9:16)
  | 'presentation'        // 프레젠테이션 슬라이드
  | 'ad_banner'           // 광고 배너
  | 'brand_kit';          // 브랜드 키트

export type DocumentMetadata = {
  version: string;           // 문서 버전 (e.g., "1.0.0")
  author?: string;           // 작성자
  tags: string[];            // 태그 (검색용)
  description?: string;      // 설명
};

export type EditorPage = {
  id: string;
  name: string;              // 페이지 이름 (e.g., "Main", "Detail", "Slide 1")
  width: number;             // Canvas 너비 (px)
  height: number;            // Canvas 높이 (px)
  background: PageBackground;
  objects: EditorObject[];   // 도형, 텍스트, 이미지 등
  order: number;             // 페이지 순서 (0부터 시작)
};

export type PageBackground =
  | { type: 'color'; value: string }           // 단색 (#FFFFFF)
  | { type: 'gradient'; value: GradientValue } // 그라데이션
  | { type: 'image'; url: string };            // 배경 이미지

export type GradientValue = {
  type: 'linear' | 'radial';
  stops: Array<{ offset: number; color: string }>;
  angle?: number;            // linear인 경우 각도 (deg)
};

// ========================================
// Editor Objects (도형, 텍스트, 이미지 등)
// ========================================

export type EditorObject =
  | TextObject
  | ImageObject
  | ShapeObject
  | FrameObject
  | GroupObject;

export type BaseObject = {
  id: string;
  name?: string;             // 레이어 이름 (Inspector에 표시)
  x: number;                 // 좌표 (Canvas 기준)
  y: number;
  width: number;
  height: number;
  rotation: number;          // 회전 각도 (deg)
  opacity: number;           // 투명도 (0~1)
  visible: boolean;          // 표시 여부
  locked: boolean;           // 편집 잠금
  zIndex: number;            // 레이어 순서 (높을수록 위)
};

// ---------- Text Object ----------
export type TextObject = BaseObject & {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textDecoration: 'none' | 'underline' | 'line-through';
  lineHeight: number;        // 줄 간격 (배수, e.g., 1.5)
  letterSpacing: number;     // 자간 (px)
  fill: string;              // 텍스트 색상
  stroke?: string;           // 테두리 색상
  strokeWidth?: number;      // 테두리 두께
  textBaseline: 'top' | 'middle' | 'bottom' | 'alphabetic';

  // Sparklio 전용 메타데이터
  role?: TextRole;           // 텍스트 역할 (AI가 인식)
};

export type FontWeight =
  | 'normal'
  | 'bold'
  | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

export type TextRole =
  | 'headline'               // 메인 제목
  | 'subheadline'            // 부제목
  | 'body'                   // 본문
  | 'caption'                // 캡션
  | 'cta';                   // CTA 버튼 텍스트

// ---------- Image Object ----------
export type ImageObject = BaseObject & {
  type: 'image';
  src: string;               // 이미지 URL (MinIO presigned URL)
  crop?: CropData;           // 크롭 정보
  filters?: ImageFilters;    // 필터 (밝기, 대비 등)

  // Sparklio 전용
  assetId?: string;          // Asset DB 참조
  altText?: string;          // 접근성 (스크린 리더용)
};

export type CropData = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageFilters = {
  brightness?: number;       // -100 ~ 100
  contrast?: number;         // -100 ~ 100
  saturation?: number;       // -100 ~ 100
  blur?: number;             // 0 ~ 100
};

// ---------- Shape Object ----------
export type ShapeObject = BaseObject & {
  type: 'shape';
  shapeType: ShapeType;
  fill: string;              // 채우기 색상
  stroke?: string;           // 테두리 색상
  strokeWidth?: number;      // 테두리 두께

  // shapeType별 추가 속성
  cornerRadius?: number;     // rect인 경우 모서리 둥글기
  sides?: number;            // polygon인 경우 변 개수
};

export type ShapeType =
  | 'rect'                   // 사각형
  | 'circle'                 // 원
  | 'ellipse'                // 타원
  | 'triangle'               // 삼각형
  | 'polygon'                // 다각형
  | 'line'                   // 선
  | 'arrow';                 // 화살표

// ---------- Frame Object ----------
export type FrameObject = BaseObject & {
  type: 'frame';
  children: EditorObject[];  // Frame 안에 포함된 객체들
  clipContent: boolean;      // 자식 객체 클리핑 여부
  background?: string;       // Frame 배경색
};

// ---------- Group Object ----------
export type GroupObject = BaseObject & {
  type: 'group';
  children: EditorObject[];  // 그룹에 포함된 객체들
};

// ========================================
// Utility Types
// ========================================

export type ObjectType = EditorObject['type'];

export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Bounds = Position & Size;

// ========================================
// Type Guards
// ========================================

export function isTextObject(obj: EditorObject): obj is TextObject {
  return obj.type === 'text';
}

export function isImageObject(obj: EditorObject): obj is ImageObject {
  return obj.type === 'image';
}

export function isShapeObject(obj: EditorObject): obj is ShapeObject {
  return obj.type === 'shape';
}

export function isFrameObject(obj: EditorObject): obj is FrameObject {
  return obj.type === 'frame';
}

export function isGroupObject(obj: EditorObject): obj is GroupObject {
  return obj.type === 'group';
}
