import { test, expect } from '@playwright/test';

/**
 * Canvas Studio v3 - Phase 1 Layout 테스트
 *
 * 테스트 대상:
 * - VSCode 스타일 레이아웃 렌더링
 * - Activity Bar (56px)
 * - Left Panel (280px, 리사이즈 가능)
 * - Canvas Viewport
 * - Right Dock (360px, 5개 탭)
 * - Top Toolbar
 *
 * 참고 문서:
 * - docs/A_TEAM_QA_WORK_ORDER.md (섹션 5.1)
 * - docs/C_TEAM_WORK_ORDER_CANVAS_STUDIO_v3.md (섹션 4)
 */

test.describe('Canvas Studio v3 - Phase 1: Layout', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'qa@sparklio.ai');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    // Studio 페이지로 이동
    await page.goto('/studio');
    await expect(page).toHaveURL(/\/studio/);
  });

  test('Activity Bar 렌더링 (56px width)', async ({ page }) => {
    // Activity Bar 존재 확인
    const activityBar = page.locator('[data-testid="activity-bar"]');
    await expect(activityBar).toBeVisible();

    // 너비 확인
    const box = await activityBar.boundingBox();
    expect(box?.width).toBe(56);

    // 필수 버튼 존재 확인
    await expect(page.locator('[data-testid="activity-bar-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-bar-new-doc"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-bar-templates"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-bar-recent"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-bar-settings"]')).toBeVisible();
  });

  test('Left Panel 렌더링 (280px width, 리사이즈 가능)', async ({ page }) => {
    // Left Panel 존재 확인
    const leftPanel = page.locator('[data-testid="left-panel"]');
    await expect(leftPanel).toBeVisible();

    // 초기 너비 확인 (280px)
    const initialBox = await leftPanel.boundingBox();
    expect(initialBox?.width).toBe(280);

    // 리사이즈 핸들 존재 확인
    const resizeHandle = page.locator('[data-testid="left-panel-resize-handle"]');
    await expect(resizeHandle).toBeVisible();

    // 리사이즈 동작 테스트 (280px → 400px)
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + 120, handleBox.y + handleBox.height / 2);
      await page.mouse.up();

      // 리사이즈 후 너비 확인
      const resizedBox = await leftPanel.boundingBox();
      expect(resizedBox?.width).toBeGreaterThan(280);
      expect(resizedBox?.width).toBeLessThanOrEqual(600); // 최대 너비 제한
    }
  });

  test('Canvas Viewport 렌더링', async ({ page }) => {
    // Canvas Viewport 존재 확인
    const canvasViewport = page.locator('[data-testid="canvas-viewport"]');
    await expect(canvasViewport).toBeVisible();

    // Canvas 엘리먼트 존재 확인
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Canvas 크기 확인 (뷰포트에서 Activity Bar + Left Panel + Right Dock 제외)
    const viewportBox = await canvasViewport.boundingBox();
    expect(viewportBox?.width).toBeGreaterThan(600); // 최소 크기 확인

    // Zoom controls 존재 확인
    await expect(page.locator('[data-testid="canvas-zoom-in"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-zoom-out"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-zoom-reset"]')).toBeVisible();
  });

  test('Right Dock 렌더링 (360px width, 5개 탭)', async ({ page }) => {
    // Right Dock 존재 확인
    const rightDock = page.locator('[data-testid="right-dock"]');
    await expect(rightDock).toBeVisible();

    // 너비 확인 (360px)
    const box = await rightDock.boundingBox();
    expect(box?.width).toBe(360);

    // 5개 탭 존재 확인
    await expect(page.locator('[data-testid="right-dock-tab-chat"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-dock-tab-inspector"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-dock-tab-layers"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-dock-tab-data"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-dock-tab-brand"]')).toBeVisible();

    // 기본 활성 탭 확인 (Chat)
    const chatTab = page.locator('[data-testid="right-dock-tab-chat"]');
    await expect(chatTab).toHaveClass(/active/);
  });

  test('Right Dock 탭 전환 동작', async ({ page }) => {
    // Chat 탭에서 Inspector 탭으로 전환
    await page.click('[data-testid="right-dock-tab-inspector"]');
    await expect(page.locator('[data-testid="right-dock-tab-inspector"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="inspector-panel"]')).toBeVisible();

    // Layers 탭으로 전환
    await page.click('[data-testid="right-dock-tab-layers"]');
    await expect(page.locator('[data-testid="right-dock-tab-layers"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="layers-panel"]')).toBeVisible();

    // Data 탭으로 전환
    await page.click('[data-testid="right-dock-tab-data"]');
    await expect(page.locator('[data-testid="right-dock-tab-data"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="data-panel"]')).toBeVisible();

    // Brand 탭으로 전환
    await page.click('[data-testid="right-dock-tab-brand"]');
    await expect(page.locator('[data-testid="right-dock-tab-brand"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="brand-panel"]')).toBeVisible();

    // Chat 탭으로 다시 전환
    await page.click('[data-testid="right-dock-tab-chat"]');
    await expect(page.locator('[data-testid="right-dock-tab-chat"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
  });

  test('Top Toolbar 렌더링', async ({ page }) => {
    // Top Toolbar 존재 확인
    const topToolbar = page.locator('[data-testid="top-toolbar"]');
    await expect(topToolbar).toBeVisible();

    // 필수 버튼 존재 확인
    await expect(page.locator('[data-testid="toolbar-save"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-undo"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-redo"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-export"]')).toBeVisible();

    // 문서 제목 표시 영역 확인
    await expect(page.locator('[data-testid="toolbar-document-title"]')).toBeVisible();

    // 버전 히스토리 버튼 확인
    await expect(page.locator('[data-testid="toolbar-version-history"]')).toBeVisible();
  });

  test('반응형 레이아웃 - 1920x1080 (기본)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 모든 주요 레이아웃 요소 표시 확인
    await expect(page.locator('[data-testid="activity-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="left-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-viewport"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-dock"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-toolbar"]')).toBeVisible();

    // Canvas 여유 공간 확인
    const canvasBox = await page.locator('[data-testid="canvas-viewport"]').boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(1200); // 충분한 너비
  });

  test('반응형 레이아웃 - 1024x768 (작은 데스크톱)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    // 주요 요소 여전히 표시
    await expect(page.locator('[data-testid="activity-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-viewport"]')).toBeVisible();

    // Left Panel이 축소되거나 숨겨질 수 있음 (디자인에 따라)
    const leftPanel = page.locator('[data-testid="left-panel"]');
    const leftPanelBox = await leftPanel.boundingBox();
    if (leftPanelBox) {
      expect(leftPanelBox.width).toBeLessThanOrEqual(280);
    }

    // Canvas 여전히 작동 가능한 크기
    const canvasBox = await page.locator('[data-testid="canvas-viewport"]').boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(400);
  });

  test('반응형 레이아웃 - 2560x1440 (대형 모니터)', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });

    // 모든 요소 정상 표시
    await expect(page.locator('[data-testid="activity-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="left-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-viewport"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-dock"]')).toBeVisible();

    // Canvas가 큰 공간 활용
    const canvasBox = await page.locator('[data-testid="canvas-viewport"]').boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(1800);
  });

  test('Activity Bar 버튼 클릭 동작 - Templates', async ({ page }) => {
    // Templates 버튼 클릭
    await page.click('[data-testid="activity-bar-templates"]');

    // Left Panel이 Templates 목록으로 변경
    await expect(page.locator('[data-testid="left-panel-title"]')).toContainText(/Templates/i);
    await expect(page.locator('[data-testid="template-list"]')).toBeVisible();
  });

  test('Activity Bar 버튼 클릭 동작 - Recent', async ({ page }) => {
    // Recent 버튼 클릭
    await page.click('[data-testid="activity-bar-recent"]');

    // Left Panel이 Recent 문서 목록으로 변경
    await expect(page.locator('[data-testid="left-panel-title"]')).toContainText(/Recent/i);
    await expect(page.locator('[data-testid="recent-documents-list"]')).toBeVisible();
  });

  test('Canvas 줌 컨트롤 동작', async ({ page }) => {
    // 초기 줌 레벨 확인
    const initialZoom = await page.locator('[data-testid="canvas-zoom-level"]').textContent();
    expect(initialZoom).toContain('100%');

    // Zoom In 클릭
    await page.click('[data-testid="canvas-zoom-in"]');
    const zoomedIn = await page.locator('[data-testid="canvas-zoom-level"]').textContent();
    expect(zoomedIn).not.toBe('100%');
    expect(parseInt(zoomedIn || '100')).toBeGreaterThan(100);

    // Zoom Out 클릭
    await page.click('[data-testid="canvas-zoom-out"]');

    // Zoom Reset 클릭
    await page.click('[data-testid="canvas-zoom-reset"]');
    const resetZoom = await page.locator('[data-testid="canvas-zoom-level"]').textContent();
    expect(resetZoom).toContain('100%');
  });

  test('키보드 단축키 - Ctrl+S (저장)', async ({ page }) => {
    // 새 문서 생성
    await page.click('[data-testid="activity-bar-new-doc"]');
    await page.click('[data-testid="mode-concept-board"]');
    await page.fill('[data-testid="doc-name-input"]', 'Keyboard Shortcut Test');
    await page.click('[data-testid="create-button"]');

    await expect(page.locator('canvas')).toBeVisible();

    // Ctrl+S 단축키 입력
    await page.keyboard.press('Control+S');

    // 저장 완료 토스트 메시지 확인
    await expect(page.locator('.toast-success')).toContainText(/saved/i, { timeout: 3000 });
  });

  test('레이아웃 전체 스냅샷 테스트', async ({ page }) => {
    // 전체 페이지 스크린샷 (시각적 회귀 테스트용)
    await expect(page).toHaveScreenshot('canvas-studio-layout-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
