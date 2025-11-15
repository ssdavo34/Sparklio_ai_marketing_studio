import { test, expect } from '@playwright/test';

/**
 * V2 Chat-First SPA - App Layout 테스트
 *
 * 테스트 대상:
 * - /app 단일 페이지 구조
 * - 좌측 Navigation
 * - 중앙 Chat + Editor
 * - 우측 Inspector/Properties
 *
 * 참고 문서:
 * - docs/C_TEAM_WORK_ORDER.md (섹션 1.1, 1.2)
 * - docs/A_TEAM_QA_WORK_ORDER.md
 */

test.describe('V2 Chat-First SPA - App Layout', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'qa@sparklio.ai');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    // /app 단일 페이지로 이동
    await page.goto('/app');
    await expect(page).toHaveURL('/app');
  });

  test('/app 단일 페이지 구조 확인', async ({ page }) => {
    // URL이 /app에서 변경되지 않았는지 확인
    await expect(page).toHaveURL('/app');

    // 3-column 레이아웃 존재 확인
    await expect(page.locator('[data-testid="left-navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="center-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible();
  });

  test('좌측 Navigation 패널 렌더링', async ({ page }) => {
    const leftNav = page.locator('[data-testid="left-navigation"]');
    await expect(leftNav).toBeVisible();

    // 필수 메뉴 항목 확인
    await expect(page.locator('[data-testid="nav-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-brands"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-templates"]')).toBeVisible();

    // 메뉴 항목이 링크가 아닌 버튼인지 확인 (페이지 전환 방지)
    const homeButton = page.locator('[data-testid="nav-home"]');
    const tagName = await homeButton.evaluate((el) => el.tagName.toLowerCase());
    expect(['button', 'div']).toContain(tagName); // <a> 태그가 아니어야 함
  });

  test('좌측 메뉴 클릭 시 URL 변경 없이 중앙 패널만 변경', async ({ page }) => {
    // 초기 URL
    const initialUrl = page.url();

    // Projects 메뉴 클릭
    await page.click('[data-testid="nav-projects"]');

    // URL이 변경되지 않았는지 확인
    expect(page.url()).toBe(initialUrl);

    // 중앙 패널이 Projects 목록으로 변경되었는지 확인
    await expect(page.locator('[data-testid="center-panel"]')).toContainText(/Projects/i);

    // Brands 메뉴 클릭
    await page.click('[data-testid="nav-brands"]');

    // URL 여전히 /app
    expect(page.url()).toBe(initialUrl);

    // 중앙 패널이 Brands 목록으로 변경
    await expect(page.locator('[data-testid="center-panel"]')).toContainText(/Brands/i);
  });

  test('중앙 Chat 패널 렌더링', async ({ page }) => {
    // Home 메뉴 클릭 (Chat 표시)
    await page.click('[data-testid="nav-home"]');

    // Chat 패널 존재 확인
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

    // Chat 입력창 존재 확인
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

    // Send 버튼 존재 확인
    await expect(page.locator('[data-testid="chat-send-button"]')).toBeVisible();
  });

  test('중앙 Editor 패널 렌더링 (초기 상태)', async ({ page }) => {
    // Editor 영역 존재 확인 (Chat 하단 또는 옆)
    const editorPanel = page.locator('[data-testid="editor-panel"]');
    await expect(editorPanel).toBeVisible();

    // Canvas 엘리먼트 존재 확인
    const canvas = page.locator('[data-testid="editor-panel"] canvas');
    await expect(canvas).toBeVisible();

    // 초기 상태 메시지 (빈 캔버스)
    await expect(editorPanel).toContainText(/No document|Empty|시작하기|생성하기/i);
  });

  test('우측 Inspector 패널 렌더링', async ({ page }) => {
    const rightPanel = page.locator('[data-testid="right-panel"]');
    await expect(rightPanel).toBeVisible();

    // Inspector 탭 존재 확인
    await expect(page.locator('[data-testid="inspector-tab"]')).toBeVisible();

    // Properties 탭 존재 확인
    await expect(page.locator('[data-testid="properties-tab"]')).toBeVisible();

    // 초기 상태 메시지
    await expect(rightPanel).toContainText(/No selection|선택된 객체 없음/i);
  });

  test('반응형 레이아웃 - 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 모든 패널 표시
    await expect(page.locator('[data-testid="left-navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="center-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible();

    // 중앙 패널이 충분한 공간 확보
    const centerPanel = page.locator('[data-testid="center-panel"]');
    const box = await centerPanel.boundingBox();
    expect(box?.width).toBeGreaterThan(800);
  });

  test('반응형 레이아웃 - 1024x768 (작은 화면)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    // 좌측 Navigation이 축소되거나 햄버거 메뉴로 변경될 수 있음
    const leftNav = page.locator('[data-testid="left-navigation"]');
    const leftNavBox = await leftNav.boundingBox();

    if (leftNavBox) {
      // Navigation이 표시되면 좁은 너비
      expect(leftNavBox.width).toBeLessThan(200);
    } else {
      // Navigation이 숨겨지고 햄버거 메뉴 표시
      await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
    }

    // 중앙 패널과 Editor는 여전히 표시
    await expect(page.locator('[data-testid="center-panel"]')).toBeVisible();
  });

  test('❌ 금지된 다중 페이지 라우트 존재 확인', async ({ page }) => {
    // /app/projects 라우트가 없는지 확인
    const response = await page.goto('/app/projects');
    expect(response?.status()).toBe(404); // 404 Not Found 또는 /app으로 리다이렉트

    // /app/brands 라우트가 없는지 확인
    const response2 = await page.goto('/app/brands');
    expect(response2?.status()).toBe(404);

    // /app/editor/[id] 라우트가 없는지 확인
    const response3 = await page.goto('/app/editor/test-id');
    expect(response3?.status()).toBe(404);
  });

  test('Projects 모달/패널로 관리 (페이지 전환 없음)', async ({ page }) => {
    // Home으로 시작
    await page.click('[data-testid="nav-home"]');
    const initialUrl = page.url();

    // Projects 메뉴 클릭
    await page.click('[data-testid="nav-projects"]');

    // URL 변경 없음
    expect(page.url()).toBe(initialUrl);

    // 중앙 패널에 Projects 목록 표시 (또는 모달)
    const projectsList = page.locator('[data-testid="projects-list"]');
    await expect(projectsList).toBeVisible();

    // "New Project" 버튼 클릭
    await page.click('[data-testid="new-project-button"]');

    // 모달이 열림 (페이지 전환 없음)
    const projectModal = page.locator('[data-testid="project-modal"]');
    await expect(projectModal).toBeVisible();

    // URL 여전히 /app
    expect(page.url()).toBe(initialUrl);
  });

  test('Brands 모달/패널로 관리 (페이지 전환 없음)', async ({ page }) => {
    const initialUrl = page.url();

    // Brands 메뉴 클릭
    await page.click('[data-testid="nav-brands"]');

    // URL 변경 없음
    expect(page.url()).toBe(initialUrl);

    // 중앙 패널에 Brands 목록 표시
    const brandsList = page.locator('[data-testid="brands-list"]');
    await expect(brandsList).toBeVisible();

    // Brand 선택
    const brandItem = page.locator('[data-testid="brand-item"]').first();
    await brandItem.click();

    // Brand 상세 정보가 우측 패널 또는 모달에 표시
    const brandDetail = page.locator('[data-testid="brand-detail"]');
    await expect(brandDetail).toBeVisible();

    // URL 여전히 /app
    expect(page.url()).toBe(initialUrl);
  });

  test('전체 레이아웃 스냅샷 (V2)', async ({ page }) => {
    // 시각적 회귀 테스트
    await expect(page).toHaveScreenshot('v2-app-layout-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
