import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Playwright 설정 파일
 * Canvas Studio v3 및 Concept Board E2E 테스트용
 *
 * 문서: docs/A_TEAM_QA_WORK_ORDER.md
 */

// .env.test 파일 로드
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests',

  // 타임아웃 설정
  timeout: 60000, // 60초 (Generator API는 최대 10초 소요)
  expect: {
    timeout: 10000, // expect 타임아웃 10초
  },

  // 실패 시 재시도
  retries: process.env.CI ? 2 : 1,

  // 병렬 실행 워커 수
  workers: process.env.CI ? 1 : 4,

  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  use: {
    // 베이스 URL
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // 트레이스 설정 (디버깅용)
    trace: 'retain-on-failure',

    // 스크린샷 설정
    screenshot: 'only-on-failure',

    // 비디오 녹화 설정
    video: 'retain-on-failure',

    // 타임아웃
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // 브라우저별 프로젝트
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // 모바일 테스트 (반응형)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    // 태블릿 테스트
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
      },
    },

    // 소형 데스크톱
    {
      name: 'small-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
    },

    // 대형 모니터
    {
      name: 'large-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 },
      },
    },
  ],

  // 로컬 개발 서버 자동 시작 (필요 시)
  webServer: process.env.CI ? undefined : {
    command: 'cd frontend && npm run dev',
    port: 3000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
