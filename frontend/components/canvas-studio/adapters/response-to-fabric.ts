/**
 * Response to Fabric Adapter
 *
 * Backend Generate 응답을 Fabric.js Canvas에 반영하는 어댑터
 *
 * 사용 방법:
 * ```typescript
 * import { applyGenerateResponseToCanvas } from "./adapters/response-to-fabric";
 *
 * const response = await generate(...);
 * applyGenerateResponseToCanvas(fabricCanvas, response);
 * ```
 */

import type { GenerateResponse } from "@/lib/api/types";

/**
 * Canvas JSON 타입
 */
type CanvasJson = {
  version?: string;
  objects?: any[];
  [key: string]: any;
};

/**
 * textBaseline 정규화 (alphabetical → alphabetic)
 *
 * Fabric.js v5.3.0은 "alphabetic"만 허용하지만,
 * 이전 버전이나 잘못된 데이터에 "alphabetical"이 있을 수 있음
 *
 * @param obj - Fabric 객체
 */
function normalizeTextBaseline(obj: any): void {
  if (obj && typeof obj === "object" && "textBaseline" in obj) {
    if (obj.textBaseline === "alphabetical") {
      console.warn(
        `[Fabric Adapter] 🔧 Fixing textBaseline: "alphabetical" → "alphabetic" for object:`,
        obj.type
      );
      obj.textBaseline = "alphabetic";
    }
  }
}

/**
 * Canvas JSON 정규화 (안전장치)
 *
 * Backend 또는 DB에서 잘못된 값이 올 경우를 대비하여
 * Fabric.js에 전달하기 전에 정규화
 *
 * @param json - Canvas JSON
 * @returns 정규화된 Canvas JSON
 */
function sanitizeCanvasJson(json: CanvasJson): CanvasJson {
  if (!json || !Array.isArray(json.objects)) return json;

  // 최상위 객체들 정규화
  json.objects.forEach((obj) => {
    normalizeTextBaseline(obj);

    // 그룹/복합 객체 내부도 재귀적으로 정리
    if (Array.isArray(obj.objects)) {
      obj.objects.forEach((child: any) => normalizeTextBaseline(child));
    }
  });

  return json;
}

/**
 * Fabric.js JSON 유효성 검증
 *
 * @param json - 검증할 JSON 객체
 * @returns 유효하면 true, 아니면 false
 */
function isValidFabricJSON(json: any): boolean {
  // null/undefined 체크
  if (!json || typeof json !== 'object') {
    console.error("[Fabric Adapter] Invalid JSON: not an object", json);
    return false;
  }

  // objects 배열 필수
  if (!Array.isArray(json.objects)) {
    console.error("[Fabric Adapter] Invalid JSON: objects is not an array", json);
    return false;
  }

  // version 필드 확인 (선택)
  if (json.version && typeof json.version !== 'string') {
    console.warn("[Fabric Adapter] Invalid version field", json.version);
  }

  // objects 배열 내 각 객체 기본 검증
  for (let i = 0; i < json.objects.length; i++) {
    const obj = json.objects[i];
    if (!obj || typeof obj !== 'object') {
      console.error(`[Fabric Adapter] Invalid object at index ${i}:`, obj);
      return false;
    }

    // 필수 필드: type
    if (!obj.type || typeof obj.type !== 'string') {
      console.error(`[Fabric Adapter] Object at index ${i} missing type:`, obj);
      return false;
    }

    // Fabric.js v5.3.0 필수 필드: originX, originY (origin은 구버전)
    if (!obj.originX || !obj.originY) {
      console.error(
        `[Fabric Adapter] Object at index ${i} missing originX/originY (found origin: ${obj.origin}):`,
        obj
      );
      console.error(
        `[Fabric Adapter] ⚠️ Backend is using OLD Fabric.js format. Please update to v5.3.0 format with originX/originY.`
      );
      return false;
    }

    // 위치/크기 필수 필드
    if (typeof obj.left !== 'number' || typeof obj.top !== 'number') {
      console.error(`[Fabric Adapter] Object at index ${i} missing left/top:`, obj);
      return false;
    }

    // Text 객체 특수 검증
    if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
      // textBaseline 유효성 검증
      const validTextBaselines = ['alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom'];
      if (obj.textBaseline && !validTextBaselines.includes(obj.textBaseline)) {
        console.error(
          `[Fabric Adapter] Object at index ${i} has invalid textBaseline '${obj.textBaseline}'. Valid values: ${validTextBaselines.join(', ')}`
        );
        return false;
      }

      // text 필드 필수
      if (typeof obj.text !== 'string') {
        console.error(`[Fabric Adapter] Text object at index ${i} missing 'text' field:`, obj);
        return false;
      }
    }

    // Image 객체 특수 검증
    if (obj.type === 'image') {
      if (!obj.src || typeof obj.src !== 'string') {
        console.error(`[Fabric Adapter] Image object at index ${i} missing 'src' field:`, obj);
        return false;
      }
    }
  }

  return true;
}

/**
 * Generate 응답을 Fabric.js Canvas에 적용
 *
 * Backend의 document.canvas_json을 파싱하여 Fabric.js Canvas에 객체로 로드합니다.
 *
 * @param canvas - Fabric.js Canvas 인스턴스
 * @param response - Generate API 응답
 * @returns Promise<void>
 */
export async function applyGenerateResponseToCanvas(
  canvas: any, // fabric.Canvas
  response: GenerateResponse
): Promise<void> {
  if (!canvas) {
    console.error("[Fabric Adapter] Canvas is not initialized");
    return;
  }

  const { document } = response;

  if (!document || !document.canvas_json) {
    console.error("[Fabric Adapter] No document.canvas_json in response");
    return;
  }

  // Backend 스키마: document.canvas_json (Fabric.js 직렬화 형식)
  console.log(
    "[Fabric Adapter] Loading from document.canvas_json:",
    document.canvas_json
  );

  // 🔧 안전장치: textBaseline 등 정규화 (alphabetical → alphabetic)
  // Deep copy를 위해 JSON.parse(JSON.stringify()) 사용
  const sanitizedJson = sanitizeCanvasJson(
    JSON.parse(JSON.stringify(document.canvas_json))
  );

  // 🔒 JSON 유효성 검증 (TypeError 방지)
  if (!isValidFabricJSON(sanitizedJson)) {
    console.error(
      "[Fabric Adapter] ❌ Invalid Fabric.js JSON format from Backend. Aborting load."
    );
    console.error("[Fabric Adapter] Received JSON:", JSON.stringify(sanitizedJson, null, 2));
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      // Fabric.js 6.x: loadFromJSON 콜백이 각 객체마다 호출되므로
      // 완료 플래그를 사용하여 한 번만 resolve
      let isResolved = false;

      canvas.loadFromJSON(sanitizedJson, () => {
        if (!isResolved) {
          isResolved = true;
          console.log("[Fabric Adapter] ✅ Canvas loaded successfully");

          // 🔥 Fabric.js 6.x: 렌더링 강제 실행
          canvas.requestRenderAll();
          canvas.renderAll();

          // 추가: 모든 객체의 coords 재계산
          canvas.getObjects().forEach((obj: any) => {
            obj.setCoords();
          });

          resolve();
        }
      });
    } catch (error) {
      console.error("[Fabric Adapter] ❌ Exception during loadFromJSON:", error);
      reject(error);
    }
  });
}

/**
 * Canvas를 비우기 (새 문서 시작 시)
 *
 * @param canvas - Fabric.js Canvas 인스턴스
 */
export function clearCanvas(canvas: any): void {
  if (!canvas) return;

  canvas.clear();
  canvas.renderAll();
  console.log("[Fabric Adapter] Canvas cleared");
}
