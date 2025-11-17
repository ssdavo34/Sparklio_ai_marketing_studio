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

  return new Promise((resolve, reject) => {
    canvas.loadFromJSON(document.canvas_json, () => {
      console.log("[Fabric Adapter] Canvas loaded successfully");
      canvas.renderAll();
      resolve();
    }, (error: any) => {
      console.error("[Fabric Adapter] Failed to load canvas_json:", error);
      reject(error);
    });
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
