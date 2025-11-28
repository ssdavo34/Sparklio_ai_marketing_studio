/**
 * Shorts Script Canvas Template
 *
 * 쇼츠 스크립트 데이터를 Polotno Canvas로 변환
 * - Hook, Scenes, CTA 구조
 * - 세로 9:16 포맷 (Shorts/Reels 형식)
 * - 각 씬을 별도 페이지로 생성
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

// ============================================================================
// Types
// ============================================================================

export interface ShortsScene {
  scene_number: number;
  duration: string;
  visual: string;
  narration: string;
  text_overlay?: string;
  transition?: string;
}

export interface ShortsScript {
  id: string;
  title: string;
  hook: string;
  scenes: ShortsScene[];
  cta: string;
  music_suggestion?: string;
  total_duration?: string;
}

interface CanvasElement {
  type: 'text' | 'rect' | 'svg';
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  text?: string;
  align?: 'left' | 'center' | 'right';
  [key: string]: any;
}

// ============================================================================
// Template Configuration
// ============================================================================

const TEMPLATE_CONFIG = {
  pageWidth: 1080,
  pageHeight: 1920, // 9:16 세로 형식
  margin: 60,
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    text: '#1F2937',
    textLight: '#6B7280',
    background: '#FFFFFF',
    gradient: ['#A855F7', '#EC4899'],
    hook: ['#EF4444', '#F59E0B'],
    scene: ['#3B82F6', '#8B5CF6'],
    cta: ['#10B981', '#059669'],
  },
  fonts: {
    title: 'Pretendard',
    body: 'Pretendard',
  },
};

// ============================================================================
// Scene Generators
// ============================================================================

/**
 * Hook 씬 생성
 */
function createHookScene(hook: string, width: number, height: number): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const margin = TEMPLATE_CONFIG.margin;

  // 배경 그라디언트
  elements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width: width,
    height: height,
    fill: `linear-gradient(135deg, ${TEMPLATE_CONFIG.colors.hook[0]}, ${TEMPLATE_CONFIG.colors.hook[1]})`,
  });

  // "HOOK" 라벨
  elements.push({
    type: 'text',
    x: width / 2,
    y: 200,
    fontSize: 32,
    fontWeight: 'bold',
    fill: 'rgba(255, 255, 255, 0.8)',
    text: '🎣 HOOK',
    align: 'center',
  });

  // Hook 텍스트
  elements.push({
    type: 'text',
    x: width / 2,
    y: height / 2,
    width: width - margin * 2,
    fontSize: 56,
    fontWeight: 'bold',
    fill: '#FFFFFF',
    text: hook,
    align: 'center',
    fontFamily: TEMPLATE_CONFIG.fonts.title,
  });

  return elements;
}

/**
 * 일반 씬 생성
 */
function createScene(scene: ShortsScene, width: number, height: number): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const margin = TEMPLATE_CONFIG.margin;

  // 배경 그라디언트
  elements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width: width,
    height: height,
    fill: `linear-gradient(135deg, ${TEMPLATE_CONFIG.colors.scene[0]}, ${TEMPLATE_CONFIG.colors.scene[1]})`,
  });

  // 씬 번호 배지
  elements.push({
    type: 'rect',
    x: margin,
    y: margin,
    width: 120,
    height: 60,
    fill: 'rgba(255, 255, 255, 0.2)',
    cornerRadius: 12,
  });

  elements.push({
    type: 'text',
    x: margin + 60,
    y: margin + 30,
    fontSize: 24,
    fontWeight: 'bold',
    fill: '#FFFFFF',
    text: `Scene ${scene.scene_number}`,
    align: 'center',
  });

  // Duration 배지
  elements.push({
    type: 'rect',
    x: width - margin - 120,
    y: margin,
    width: 120,
    height: 60,
    fill: 'rgba(255, 255, 255, 0.2)',
    cornerRadius: 12,
  });

  elements.push({
    type: 'text',
    x: width - margin - 60,
    y: margin + 30,
    fontSize: 20,
    fill: '#FFFFFF',
    text: scene.duration,
    align: 'center',
    fontWeight: 'bold',
  });

  // Visual Description (상단 1/3)
  elements.push({
    type: 'rect',
    x: margin,
    y: 250,
    width: width - margin * 2,
    height: 400,
    fill: 'rgba(255, 255, 255, 0.15)',
    cornerRadius: 16,
  });

  elements.push({
    type: 'text',
    x: margin + 20,
    y: 270,
    fontSize: 20,
    fontWeight: 'bold',
    fill: 'rgba(255, 255, 255, 0.8)',
    text: '🎬 Visual',
  });

  elements.push({
    type: 'text',
    x: margin + 20,
    y: 320,
    width: width - margin * 2 - 40,
    fontSize: 28,
    fill: '#FFFFFF',
    text: scene.visual,
    fontFamily: TEMPLATE_CONFIG.fonts.body,
  });

  // Narration (중앙)
  elements.push({
    type: 'rect',
    x: margin,
    y: 700,
    width: width - margin * 2,
    height: 400,
    fill: 'rgba(255, 255, 255, 0.15)',
    cornerRadius: 16,
  });

  elements.push({
    type: 'text',
    x: margin + 20,
    y: 720,
    fontSize: 20,
    fontWeight: 'bold',
    fill: 'rgba(255, 255, 255, 0.8)',
    text: '🎙️ Narration',
  });

  elements.push({
    type: 'text',
    x: margin + 20,
    y: 770,
    width: width - margin * 2 - 40,
    fontSize: 32,
    fontWeight: 'bold',
    fill: '#FFFFFF',
    text: scene.narration,
    fontFamily: TEMPLATE_CONFIG.fonts.body,
  });

  // Text Overlay (하단)
  if (scene.text_overlay) {
    elements.push({
      type: 'rect',
      x: margin,
      y: 1150,
      width: width - margin * 2,
      height: 200,
      fill: 'rgba(255, 255, 255, 0.2)',
      cornerRadius: 16,
    });

    elements.push({
      type: 'text',
      x: margin + 20,
      y: 1170,
      fontSize: 20,
      fontWeight: 'bold',
      fill: 'rgba(255, 255, 255, 0.8)',
      text: '📝 Text Overlay',
    });

    elements.push({
      type: 'text',
      x: width / 2,
      y: 1240,
      width: width - margin * 2 - 40,
      fontSize: 36,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      text: scene.text_overlay,
      align: 'center',
    });
  }

  // Transition (최하단)
  if (scene.transition) {
    elements.push({
      type: 'text',
      x: width / 2,
      y: height - 100,
      fontSize: 18,
      fill: 'rgba(255, 255, 255, 0.6)',
      text: `Transition: ${scene.transition}`,
      align: 'center',
    });
  }

  return elements;
}

/**
 * CTA 씬 생성
 */
function createCTAScene(cta: string, width: number, height: number): CanvasElement[] {
  const elements: CanvasElement[] = [];
  const margin = TEMPLATE_CONFIG.margin;

  // 배경 그라디언트
  elements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width: width,
    height: height,
    fill: `linear-gradient(135deg, ${TEMPLATE_CONFIG.colors.cta[0]}, ${TEMPLATE_CONFIG.colors.cta[1]})`,
  });

  // "CTA" 라벨
  elements.push({
    type: 'text',
    x: width / 2,
    y: 300,
    fontSize: 32,
    fontWeight: 'bold',
    fill: 'rgba(255, 255, 255, 0.8)',
    text: '📢 CALL TO ACTION',
    align: 'center',
  });

  // CTA 텍스트
  elements.push({
    type: 'text',
    x: width / 2,
    y: height / 2,
    width: width - margin * 2,
    fontSize: 56,
    fontWeight: 'bold',
    fill: '#FFFFFF',
    text: cta,
    align: 'center',
    fontFamily: TEMPLATE_CONFIG.fonts.title,
  });

  // CTA 버튼 (시각적 표현)
  const btnWidth = 400;
  const btnHeight = 100;
  elements.push({
    type: 'rect',
    x: (width - btnWidth) / 2,
    y: height - 400,
    width: btnWidth,
    height: btnHeight,
    fill: '#FFFFFF',
    cornerRadius: 16,
  });

  elements.push({
    type: 'text',
    x: width / 2,
    y: height - 350,
    fontSize: 32,
    fontWeight: 'bold',
    fill: TEMPLATE_CONFIG.colors.cta[0],
    text: '지금 확인하기',
    align: 'center',
  });

  return elements;
}

// ============================================================================
// Main Canvas Generator
// ============================================================================

/**
 * Shorts Script 전체를 Canvas 요소로 변환
 */
export function createShortsScriptCanvas(script: ShortsScript): CanvasElement[][] {
  const allScenes: CanvasElement[][] = [];

  // 1. Hook 씬
  allScenes.push(createHookScene(script.hook, TEMPLATE_CONFIG.pageWidth, TEMPLATE_CONFIG.pageHeight));

  // 2. 모든 씬들
  script.scenes.forEach((scene) => {
    allScenes.push(createScene(scene, TEMPLATE_CONFIG.pageWidth, TEMPLATE_CONFIG.pageHeight));
  });

  // 3. CTA 씬
  allScenes.push(createCTAScene(script.cta, TEMPLATE_CONFIG.pageWidth, TEMPLATE_CONFIG.pageHeight));

  return allScenes;
}

/**
 * Shorts Script를 Polotno Store에 추가
 */
export function addShortsScriptToCanvas(polotnoStore: any, script: ShortsScript): void {
  if (!polotnoStore) {
    throw new Error('Polotno store is not initialized');
  }

  const allSceneElements = createShortsScriptCanvas(script);

  allSceneElements.forEach((elements, index) => {
    // 새 페이지 추가
    polotnoStore.addPage({
      width: TEMPLATE_CONFIG.pageWidth,
      height: TEMPLATE_CONFIG.pageHeight,
    });

    const page = polotnoStore.pages[polotnoStore.pages.length - 1];

    if (!page) {
      throw new Error(`Failed to create page for scene ${index}`);
    }

    // 요소 추가
    elements.forEach((element) => {
      page.addElement(element);
    });
  });

  console.log(`[ShortsTemplate] Added ${allSceneElements.length} scenes to canvas (1 Hook + ${script.scenes.length} Scenes + 1 CTA)`);
}
