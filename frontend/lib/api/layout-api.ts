/**
 * Layout API Client
 *
 * DocumentLayoutAgent를 통한 문서 레이아웃 자동 생성 API
 *
 * 지원 문서 유형:
 * - meeting_summary: 회의 요약
 * - presentation: 프레젠테이션
 * - brief: 캠페인 브리프
 * - product_detail: 상세페이지
 * - sns_ad: SNS 광고
 * - banner: 배너
 * - report: 보고서
 *
 * 작성일: 2025-12-04
 * 작성자: B팀
 */

// ============================================================================
// Types
// ============================================================================

/**
 * 레이아웃 요소
 */
export interface LayoutElement {
  type:
    | "text"
    | "heading"
    | "paragraph"
    | "list"
    | "image"
    | "card"
    | "divider"
    | "badge"
    | "table"
    | "quote"
    | "cta_button";
  x: number;
  y: number;
  width: number;
  height: number;
  properties: {
    // 공통
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    textAlign?: "left" | "center" | "right";

    // 리스트 전용
    listStyle?: "bullet" | "number" | "check";
    items?: string[];

    // 카드 전용
    borderColor?: string;
    shadowLevel?: number;

    // 이미지 전용
    objectFit?: "cover" | "contain" | "fill";
    placeholder?: string;

    // 뱃지 전용
    variant?: "primary" | "secondary" | "success" | "warning" | "error";

    // 테이블 전용
    columns?: string[];
    rows?: string[][];

    // 기타
    [key: string]: unknown;
  };
  content?: string;
  children?: LayoutElement[];
}

/**
 * 페이지 레이아웃
 */
export interface PageLayout {
  page_number: number;
  page_type:
    | "cover"
    | "content"
    | "summary"
    | "action_items"
    | "agenda"
    | "product_hero"
    | "product_details"
    | "sns_post"
    | "brief_overview"
    | "brief_strategy";
  layout_type:
    | "cover"
    | "full_header"
    | "two_column"
    | "card_grid"
    | "list"
    | "highlight_box"
    | "centered"
    | "split";
  elements: LayoutElement[];
}

/**
 * 문서 레이아웃 응답
 */
export interface DocumentLayout {
  document_type: string;
  total_pages: number;
  page_width: number;
  page_height: number;
  pages: PageLayout[];
  metadata?: {
    generated_at?: string;
    agent_version?: string;
    content_analysis?: {
      word_count?: number;
      section_count?: number;
      has_images?: boolean;
    };
  };
}

/**
 * 레이아웃 생성 요청
 */
export interface LayoutGenerateRequest {
  document_type:
    | "meeting_summary"
    | "presentation"
    | "brief"
    | "product_detail"
    | "sns_ad"
    | "banner"
    | "report";
  content: Record<string, unknown>;
  options?: {
    page_width?: number;
    page_height?: number;
    style?: "modern" | "classic" | "minimal";
    color_scheme?: string[];
    platform?: string; // sns_ad용: instagram_feed, instagram_story 등
  };
}

/**
 * Meeting Summary 전용 요청
 */
export interface MeetingLayoutRequest {
  title: string;
  summary: string;
  agenda?: string[];
  decisions?: string[];
  action_items?: Array<{
    task: string;
    assignee?: string;
    due_date?: string;
  }>;
  keywords?: string[];
  participants?: string[];
  duration?: string;
  options?: {
    page_width?: number;
    page_height?: number;
    style?: "modern" | "classic" | "minimal";
  };
}

/**
 * SNS 광고 전용 요청
 */
export interface SNSLayoutRequest {
  platform:
    | "instagram_feed"
    | "instagram_story"
    | "instagram_reel"
    | "facebook"
    | "twitter"
    | "linkedin"
    | "youtube_thumbnail"
    | "tiktok";
  headline: string;
  body_text?: string;
  cta_text?: string;
  brand_name?: string;
  product_name?: string;
  hashtags?: string[];
  image_url?: string;
  options?: {
    style?: "modern" | "classic" | "minimal";
    color_scheme?: string[];
  };
}

/**
 * 상세페이지 전용 요청
 */
export interface ProductLayoutRequest {
  product_name: string;
  tagline?: string;
  description: string;
  features?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  specifications?: Record<string, string>;
  price?: string;
  images?: string[];
  cta_text?: string;
  options?: {
    page_width?: number;
    page_height?: number;
    style?: "modern" | "classic" | "minimal";
  };
}

/**
 * 레이아웃 프리셋
 */
export interface LayoutPreset {
  name: string;
  description: string;
  default_width: number;
  default_height: number;
  supported_styles: string[];
}

/**
 * 프리셋 응답
 */
export interface LayoutPresetsResponse {
  presets: Record<string, LayoutPreset>;
}

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ============================================================================
// Helper Functions
// ============================================================================

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  console.log(`[Layout API] ${options?.method || "GET"} ${path}`);

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errorData = await res.json();
      errorDetail = errorData.detail || errorDetail;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }

    console.error(`[Layout API] Error:`, errorDetail);
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

// ============================================================================
// Layout API Client
// ============================================================================

export const layoutApi = {
  /**
   * 문서 레이아웃 생성 (범용)
   *
   * POST /api/v1/layout/generate
   */
  async generate(
    req: LayoutGenerateRequest
  ): Promise<{ layout: DocumentLayout }> {
    return request<{ layout: DocumentLayout }>("/api/v1/layout/generate", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  /**
   * Meeting Summary 레이아웃 생성
   *
   * POST /api/v1/layout/generate/meeting
   */
  async generateMeetingLayout(
    req: MeetingLayoutRequest
  ): Promise<{ layout: DocumentLayout }> {
    return request<{ layout: DocumentLayout }>(
      "/api/v1/layout/generate/meeting",
      {
        method: "POST",
        body: JSON.stringify(req),
      }
    );
  },

  /**
   * SNS 광고 레이아웃 생성
   *
   * POST /api/v1/layout/generate/sns
   */
  async generateSNSLayout(
    req: SNSLayoutRequest
  ): Promise<{ layout: DocumentLayout }> {
    return request<{ layout: DocumentLayout }>("/api/v1/layout/generate/sns", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  /**
   * 상세페이지 레이아웃 생성
   *
   * POST /api/v1/layout/generate/product
   */
  async generateProductLayout(
    req: ProductLayoutRequest
  ): Promise<{ layout: DocumentLayout }> {
    return request<{ layout: DocumentLayout }>(
      "/api/v1/layout/generate/product",
      {
        method: "POST",
        body: JSON.stringify(req),
      }
    );
  },

  /**
   * 레이아웃 프리셋 조회
   *
   * GET /api/v1/layout/presets
   */
  async getPresets(): Promise<LayoutPresetsResponse> {
    return request<LayoutPresetsResponse>("/api/v1/layout/presets");
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * LayoutElement를 Polotno-compatible JSON으로 변환
 *
 * Polotno canvas에서 사용할 수 있는 형식으로 변환합니다.
 */
export function layoutElementToPolotno(
  element: LayoutElement,
  pageIndex: number = 0
): Record<string, unknown> {
  const baseProps = {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };

  switch (element.type) {
    case "heading":
    case "text":
    case "paragraph":
      return {
        type: "text",
        ...baseProps,
        text: element.content || "",
        fontSize: element.properties.fontSize || 24,
        fontWeight: element.properties.fontWeight || "normal",
        fill: element.properties.color || "#000000",
        align: element.properties.textAlign || "left",
      };

    case "list":
      const items = element.properties.items || [];
      const listStyle = element.properties.listStyle || "bullet";
      const prefix =
        listStyle === "bullet" ? "• " : listStyle === "check" ? "✓ " : "";
      const listText = items
        .map((item, i) =>
          listStyle === "number" ? `${i + 1}. ${item}` : `${prefix}${item}`
        )
        .join("\n");

      return {
        type: "text",
        ...baseProps,
        text: listText,
        fontSize: element.properties.fontSize || 16,
        fill: element.properties.color || "#333333",
        align: "left",
        lineHeight: 1.6,
      };

    case "card":
      // 카드는 그룹으로 변환 (배경 + 내용)
      return {
        type: "group",
        ...baseProps,
        children: [
          {
            type: "rect",
            x: 0,
            y: 0,
            width: element.width,
            height: element.height,
            fill: element.properties.backgroundColor || "#ffffff",
            cornerRadius: element.properties.borderRadius || 8,
            stroke: element.properties.borderColor || "#e0e0e0",
            strokeWidth: 1,
          },
          {
            type: "text",
            x: element.properties.padding || 16,
            y: element.properties.padding || 16,
            width: element.width - (element.properties.padding || 16) * 2,
            text: element.content || "",
            fontSize: element.properties.fontSize || 14,
            fill: element.properties.color || "#333333",
          },
        ],
      };

    case "divider":
      return {
        type: "line",
        ...baseProps,
        height: 2,
        stroke: element.properties.color || "#e0e0e0",
        strokeWidth: 1,
      };

    case "badge":
      const variantColors: Record<string, string> = {
        primary: "#3b82f6",
        secondary: "#6b7280",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      };
      const badgeColor =
        variantColors[element.properties.variant || "primary"] || "#3b82f6";

      return {
        type: "group",
        ...baseProps,
        children: [
          {
            type: "rect",
            x: 0,
            y: 0,
            width: element.width,
            height: element.height,
            fill: badgeColor,
            cornerRadius: element.properties.borderRadius || 4,
          },
          {
            type: "text",
            x: 8,
            y: 4,
            text: element.content || "",
            fontSize: element.properties.fontSize || 12,
            fill: "#ffffff",
            fontWeight: "bold",
          },
        ],
      };

    case "image":
      return {
        type: "image",
        ...baseProps,
        src:
          element.content ||
          element.properties.placeholder ||
          "https://via.placeholder.com/400x300",
      };

    case "cta_button":
      return {
        type: "group",
        ...baseProps,
        children: [
          {
            type: "rect",
            x: 0,
            y: 0,
            width: element.width,
            height: element.height,
            fill: element.properties.backgroundColor || "#3b82f6",
            cornerRadius: element.properties.borderRadius || 8,
          },
          {
            type: "text",
            x: 0,
            y: (element.height - (element.properties.fontSize || 16)) / 2,
            width: element.width,
            text: element.content || "Click Here",
            fontSize: element.properties.fontSize || 16,
            fill: element.properties.color || "#ffffff",
            fontWeight: "bold",
            align: "center",
          },
        ],
      };

    default:
      return {
        type: "text",
        ...baseProps,
        text: element.content || "",
      };
  }
}

/**
 * DocumentLayout을 Polotno Store JSON으로 변환
 */
export function documentLayoutToPolotnoStore(layout: DocumentLayout): {
  width: number;
  height: number;
  pages: Array<{
    id: string;
    children: Record<string, unknown>[];
    background: string;
  }>;
} {
  return {
    width: layout.page_width,
    height: layout.page_height,
    pages: layout.pages.map((page, pageIndex) => ({
      id: `page_${pageIndex + 1}`,
      background: "#ffffff",
      children: page.elements.map((element) =>
        layoutElementToPolotno(element, pageIndex)
      ),
    })),
  };
}

export default layoutApi;
