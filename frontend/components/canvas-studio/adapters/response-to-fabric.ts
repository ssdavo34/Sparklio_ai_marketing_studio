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
 * Backend의 editorDocument.canvas_json 또는 editorDocument.pages를 파싱하여
 * Fabric.js Canvas에 객체로 로드합니다.
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

  const { editorDocument } = response;

  if (!editorDocument) {
    console.error("[Fabric Adapter] No editorDocument in response");
    return;
  }

  // 방법 1: editorDocument.canvas_json이 있는 경우 (Fabric.js 직렬화 형식)
  if (editorDocument.canvas_json) {
    console.log(
      "[Fabric Adapter] Loading from canvas_json:",
      editorDocument.canvas_json
    );

    return new Promise((resolve, reject) => {
      canvas.loadFromJSON(editorDocument.canvas_json, () => {
        console.log("[Fabric Adapter] Canvas loaded successfully");
        canvas.renderAll();
        resolve();
      }, (error: any) => {
        console.error("[Fabric Adapter] Failed to load canvas_json:", error);
        reject(error);
      });
    });
  }

  // 방법 2: editorDocument.pages가 있는 경우 (Multi-page format)
  if (editorDocument.pages && Array.isArray(editorDocument.pages)) {
    console.log(
      `[Fabric Adapter] Loading from pages (${editorDocument.pages.length} pages)`
    );

    // P0: 첫 번째 페이지만 로드 (Single Page Editor)
    const firstPage = editorDocument.pages[0];

    if (!firstPage) {
      console.warn("[Fabric Adapter] No pages found in editorDocument");
      return;
    }

    // pages[0]에 Fabric JSON이 있다고 가정
    return new Promise((resolve, reject) => {
      canvas.loadFromJSON(firstPage, () => {
        console.log("[Fabric Adapter] First page loaded successfully");
        canvas.renderAll();
        resolve();
      }, (error: any) => {
        console.error("[Fabric Adapter] Failed to load first page:", error);
        reject(error);
      });
    });
  }

  // 방법 3: editorDocument 자체가 Fabric JSON인 경우
  console.log("[Fabric Adapter] Trying to load editorDocument as Fabric JSON");

  return new Promise((resolve, reject) => {
    canvas.loadFromJSON(editorDocument, () => {
      console.log("[Fabric Adapter] editorDocument loaded successfully");
      canvas.renderAll();
      resolve();
    }, (error: any) => {
      console.error("[Fabric Adapter] Failed to load editorDocument:", error);
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
