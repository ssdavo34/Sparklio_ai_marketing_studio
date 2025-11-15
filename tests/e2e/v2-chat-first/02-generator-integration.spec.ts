import { test, expect } from '@playwright/test';

/**
 * V2 Chat-First SPA - Generator 통합 테스트
 *
 * 테스트 대상:
 * - Chat → Generator 호출
 * - 3개 Generator (Brand Kit, Product Detail, SNS)
 * - Editor JSON 수신 및 Canvas 로딩
 *
 * 참고 문서:
 * - docs/C_TEAM_WORK_ORDER.md (Phase 3)
 * - docs/A_TEAM_QA_WORK_ORDER.md
 */

test.describe('V2 - Generator 통합', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'qa@sparklio.ai');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    // /app 페이지로 이동
    await page.goto('/app');
    await expect(page).toHaveURL('/app');

    // Home (Chat) 표시
    await page.click('[data-testid="nav-home"]');
  });

  test('Brand Kit Generator 호출 (Chat → Editor)', async ({ page }) => {
    // Chat 입력창에 프롬프트 입력
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('스킨케어 브랜드 키트를 만들어줘');

    // Send 버튼 클릭
    await page.click('[data-testid="chat-send-button"]');

    // 사용자 메시지 표시 확인
    await expect(page.locator('[data-testid="chat-message-user"]').last())
      .toContainText('스킨케어 브랜드 키트를 만들어줘');

    // Generator 로딩 인디케이터 표시
    await expect(page.locator('[data-testid="chat-loading"]')).toBeVisible();

    // AI 응답 대기 (최대 15초)
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 15000 });

    // Editor에 Draft 로딩 확인
    const editorPanel = page.locator('[data-testid="editor-panel"]');
    await expect(editorPanel).toBeVisible();

    // Canvas에 객체가 렌더링되었는지 확인
    const hasObjects = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas && canvas.getObjects().length > 0;
    });
    expect(hasObjects).toBe(true);

    // Chat에 "Brand Kit이 생성되었습니다" 메시지
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toContainText(/브랜드 키트|Brand Kit|생성되었습니다|완료/i);
  });

  test('Product Detail Generator 호출', async ({ page }) => {
    // Chat 프롬프트
    await page.fill('[data-testid="chat-input"]', '스킨케어 제품 상세페이지 만들어줘');
    await page.click('[data-testid="chat-send-button"]');

    // 사용자 메시지 표시
    await expect(page.locator('[data-testid="chat-message-user"]').last())
      .toContainText('스킨케어 제품 상세페이지');

    // 로딩
    await expect(page.locator('[data-testid="chat-loading"]')).toBeVisible();

    // AI 응답
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 15000 });

    // Editor에 Draft 로딩
    const hasObjects = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas && canvas.getObjects().length > 0;
    });
    expect(hasObjects).toBe(true);

    // Canvas에 제목 텍스트 존재 확인
    const hasTitle = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas.getObjects().some((obj: any) => obj.type === 'text' || obj.type === 'textbox');
    });
    expect(hasTitle).toBe(true);
  });

  test('SNS Generator 호출', async ({ page }) => {
    // Chat 프롬프트
    await page.fill('[data-testid="chat-input"]', 'Instagram 포스트 만들어줘');
    await page.click('[data-testid="chat-send-button"]');

    // 사용자 메시지
    await expect(page.locator('[data-testid="chat-message-user"]').last())
      .toContainText('Instagram 포스트');

    // 로딩
    await expect(page.locator('[data-testid="chat-loading"]')).toBeVisible();

    // AI 응답
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 15000 });

    // Editor에 Draft 로딩
    const hasObjects = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas && canvas.getObjects().length > 0;
    });
    expect(hasObjects).toBe(true);

    // Canvas 크기가 1080x1080 (Instagram 정사각형 비율)인지 확인
    const canvasSize = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return { width: canvas.getWidth(), height: canvas.getHeight() };
    });
    expect(canvasSize.width).toBe(1080);
    expect(canvasSize.height).toBe(1080);
  });

  test('Generator 응답 시간 측정 (< 10초)', async ({ page }) => {
    const startTime = Date.now();

    // Chat 프롬프트
    await page.fill('[data-testid="chat-input"]', '테스트 브랜드 키트');
    await page.click('[data-testid="chat-send-button"]');

    // AI 응답 대기
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 15000 });

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000; // 초 단위

    console.log(`Generator 응답 시간: ${responseTime.toFixed(2)}초`);

    // 기준: 10초 이내
    expect(responseTime).toBeLessThan(10);
  });

  test('Generator 에러 처리 (타임아웃)', async ({ page }) => {
    // Generator API를 30초 지연으로 Mock (타임아웃 유발)
    await page.route('**/api/v1/chat/send', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 31000)); // 31초
      await route.fulfill({
        status: 504,
        body: JSON.stringify({ error: 'Gateway Timeout' }),
      });
    });

    // Chat 프롬프트
    await page.fill('[data-testid="chat-input"]', '브랜드 키트');
    await page.click('[data-testid="chat-send-button"]');

    // 에러 메시지 확인 (30초 후)
    await expect(page.locator('[data-testid="chat-message-error"]').last())
      .toContainText(/timeout|시간 초과|실패/i, { timeout: 32000 });
  });

  test('Generator 에러 처리 (500 Internal Server Error)', async ({ page }) => {
    // Generator API Mock (에러 응답)
    await page.route('**/api/v1/chat/send', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Chat 프롬프트
    await page.fill('[data-testid="chat-input"]', '브랜드 키트');
    await page.click('[data-testid="chat-send-button"]');

    // 에러 메시지 확인
    await expect(page.locator('[data-testid="chat-message-error"]').last())
      .toContainText(/에러|오류|실패|Error/i, { timeout: 5000 });
  });

  test('연속 Generator 호출 (2회)', async ({ page }) => {
    // 첫 번째 Generator 호출
    await page.fill('[data-testid="chat-input"]', '첫 번째 브랜드 키트');
    await page.click('[data-testid="chat-send-button"]');

    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 15000 });

    // 첫 번째 Canvas 객체 수 저장
    const firstObjectCount = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas.getObjects().length;
    });

    // 두 번째 Generator 호출
    await page.fill('[data-testid="chat-input"]', '두 번째 제품 상세페이지');
    await page.click('[data-testid="chat-send-button"]');

    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 15000 });

    // 두 번째 Canvas 객체 수 확인 (교체되었는지 확인)
    const secondObjectCount = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas.getObjects().length;
    });

    expect(secondObjectCount).toBeGreaterThan(0);
    // 첫 번째와 다른 객체 수 (새로운 Draft)
    expect(secondObjectCount).not.toBe(firstObjectCount);
  });

  test('Chat 대화 히스토리 유지', async ({ page }) => {
    // 첫 번째 메시지
    await page.fill('[data-testid="chat-input"]', '안녕하세요');
    await page.click('[data-testid="chat-send-button"]');

    await expect(page.locator('[data-testid="chat-message-user"]').last())
      .toContainText('안녕하세요');

    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 5000 });

    // 두 번째 메시지
    await page.fill('[data-testid="chat-input"]', '브랜드 키트 만들어줘');
    await page.click('[data-testid="chat-send-button"]');

    await expect(page.locator('[data-testid="chat-message-user"]').last())
      .toContainText('브랜드 키트 만들어줘');

    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 15000 });

    // 대화 히스토리 확인 (최소 4개 메시지: user1, ai1, user2, ai2)
    const messageCount = await page.locator('[data-testid^="chat-message-"]').count();
    expect(messageCount).toBeGreaterThanOrEqual(4);
  });
});
