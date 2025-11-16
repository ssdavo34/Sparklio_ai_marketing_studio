/**
 * 테스트용 인증 유틸리티
 *
 * Backend API 통합 테스트에서 JWT 토큰을 동적으로 발급받아 사용합니다.
 *
 * 사용법:
 *   import { getTestToken } from '../utils/auth';
 *
 *   test('보호된 API 테스트', async ({ request }) => {
 *     const token = await getTestToken();
 *
 *     const response = await request.get('/api/v1/protected', {
 *       headers: { Authorization: `Bearer ${token}` }
 *     });
 *   });
 *
 * @module tests/utils/auth
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'testuser@sparklio.ai';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpass123';

// 토큰 캐시 (테스트 세션 동안 재사용)
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * 테스트용 JWT 토큰을 가져옵니다.
 *
 * - 캐시된 토큰이 유효하면 재사용
 * - 만료되었거나 없으면 로그인 API 호출하여 새로 발급
 *
 * @returns {Promise<string>} JWT access token
 * @throws {Error} 로그인 실패 시
 *
 * @example
 * const token = await getTestToken();
 * // Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
export async function getTestToken(): Promise<string> {
  // 캐시된 토큰이 있고 유효하면 재사용
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('🔄 Using cached test token');
    return cachedToken;
  }

  try {
    console.log(`🔑 Acquiring new test token for ${TEST_USER_EMAIL}...`);

    // 로그인 API 호출
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    const { access_token, expires_in } = response.data;

    if (!access_token) {
      throw new Error('No access_token in login response');
    }

    // 토큰 캐시 및 만료 시간 설정
    cachedToken = access_token;

    // expires_in이 있으면 사용, 없으면 1시간으로 가정
    const expirySeconds = expires_in || 3600;
    tokenExpiry = Date.now() + (expirySeconds * 1000) - 60000; // 1분 여유

    console.log(`✅ Test token acquired (expires in ${expirySeconds}s)`);
    return cachedToken;

  } catch (error: any) {
    console.error('❌ Failed to get test token:', error.message);

    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }

    // 에러 메시지 개선
    let errorMessage = 'Test authentication failed';

    if (error.response?.status === 401) {
      errorMessage = `Authentication failed: Invalid credentials for ${TEST_USER_EMAIL}`;
    } else if (error.response?.status === 404) {
      errorMessage = `Authentication endpoint not found: POST ${API_BASE_URL}/api/v1/auth/login`;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Cannot connect to backend server: ${API_BASE_URL}`;
    }

    throw new Error(`${errorMessage}: ${error.message}`);
  }
}

/**
 * 캐시된 토큰을 초기화합니다.
 *
 * 테스트 간 토큰을 강제로 재발급해야 할 때 사용합니다.
 *
 * @example
 * clearTestToken();
 * const newToken = await getTestToken(); // 새로운 토큰 발급
 */
export function clearTestToken(): void {
  cachedToken = null;
  tokenExpiry = null;
  console.log('🗑️  Test token cache cleared');
}

/**
 * 테스트용 사용자 정보를 가져옵니다.
 *
 * @returns {Object} 테스트 사용자 이메일과 비밀번호
 *
 * @example
 * const { email, password } = getTestUserInfo();
 * // { email: 'testuser@sparklio.ai', password: 'testpass123' }
 */
export function getTestUserInfo() {
  return {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  };
}

/**
 * 현재 캐시된 토큰이 있는지 확인합니다.
 *
 * @returns {boolean} 캐시된 토큰이 있으면 true
 */
export function hasTestToken(): boolean {
  return cachedToken !== null && tokenExpiry !== null && Date.now() < tokenExpiry;
}
