import { test, expect } from '@playwright/test';
import { getTestToken } from '../utils/auth';

/**
 * B팀 Backend API 통합 테스트
 *
 * 테스트 대상: B팀이 완료한 22개 API 엔드포인트
 * - Generator API: 1개
 * - Documents API: 5개
 * - Editor API: 2개
 * - Templates API: 7개
 * - Admin API: 5개
 * - Monitoring: 2개
 *
 * 참고: B팀 Phase 4 완료 보고
 * 인증: tests/utils/auth.ts의 getTestToken() 사용 (동적 JWT 토큰 발급)
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('B팀 Backend API - Generator API (1개)', () => {
  test('POST /api/v1/generate - Brand Kit Generator', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.post(`${API_BASE_URL}/api/v1/generate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        generator_type: 'brand_kit',
        prompt: '스킨케어 브랜드 키트를 만들어주세요',
        brand_id: 'brand-test-001',
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('job_id');
    expect(body).toHaveProperty('document_id');
    expect(body).toHaveProperty('editor_json');
    expect(body.generator_type).toBe('brand_kit');

    // Editor JSON 구조 확인
    expect(body.editor_json).toHaveProperty('version');
    expect(body.editor_json).toHaveProperty('objects');
    expect(Array.isArray(body.editor_json.objects)).toBe(true);
  });

  test('POST /api/v1/generate - Product Detail Generator', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.post(`${API_BASE_URL}/api/v1/generate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        generator_type: 'product_detail',
        prompt: '스킨케어 제품 상세페이지',
        brand_id: 'brand-test-001',
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.generator_type).toBe('product_detail');
  });

  test('POST /api/v1/generate - SNS Generator', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.post(`${API_BASE_URL}/api/v1/generate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        generator_type: 'sns',
        prompt: 'Instagram 포스트를 만들어주세요',
        brand_id: 'brand-test-001',
        sns_platform: 'instagram',
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.generator_type).toBe('sns');
  });
});

test.describe('B팀 Backend API - Documents API (5개)', () => {
  let createdDocId: string;

  test('POST /api/v1/documents/{docId}/save - 문서 저장', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.post(`${API_BASE_URL}/api/v1/documents/new/save`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Document',
        document_type: 'brand_kit',
        brand_id: 'brand-test-001',
        editor_json: {
          version: '1.0',
          objects: [
            { type: 'text', text: 'Hello', props: { fontSize: 32 } },
          ],
        },
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('document_id');
    createdDocId = body.document_id;
  });

  test('GET /api/v1/documents/{docId} - 문서 조회', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.get(`${API_BASE_URL}/api/v1/documents/${createdDocId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBe(createdDocId);
    expect(body.name).toBe('Test Document');
    expect(body.document_type).toBe('brand_kit');
  });

  test('PATCH /api/v1/documents/{docId} - 문서 수정', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.patch(`${API_BASE_URL}/api/v1/documents/${createdDocId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Updated Document',
        editor_json: {
          version: '1.0',
          objects: [
            { type: 'text', text: 'Updated', props: { fontSize: 48 } },
          ],
        },
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.name).toBe('Updated Document');
  });

  test('GET /api/v1/documents - 문서 목록 조회', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.get(`${API_BASE_URL}/api/v1/documents?brand_id=brand-test-001`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.documents)).toBe(true);
    expect(body.documents.length).toBeGreaterThan(0);
  });

  test('DELETE /api/v1/documents/{docId} - 문서 삭제', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.delete(`${API_BASE_URL}/api/v1/documents/${createdDocId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(204);
  });
});

test.describe('B팀 Backend API - Editor API (2개)', () => {
  test('POST /api/v1/editor/action - Editor Action 실행', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.post(`${API_BASE_URL}/api/v1/editor/action`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        document_id: 'doc-pitch-fixture-001',
        action: {
          type: 'update_font',
          target: { selector: 'type:text AND name:Main Title' },
          payload: { fontFamily: 'Roboto', fontSize: 48 },
        },
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('updated_json');
  });

  test('GET /api/v1/editor/actions/supported - 지원 Action 목록', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.get(`${API_BASE_URL}/api/v1/editor/actions/supported`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.actions)).toBe(true);
    expect(body.actions).toContain('update_font');
    expect(body.actions).toContain('update_color');
    expect(body.actions).toContain('update_size');
    expect(body.actions).toContain('move_object');
    expect(body.actions).toContain('delete_object');
  });
});

test.describe('B팀 Backend API - Templates API (7개)', () => {
  let createdTemplateId: string;

  test('GET /api/v1/templates - 공개 템플릿 목록', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/templates`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.templates)).toBe(true);
  });

  test('GET /api/v1/templates/{templateId} - 템플릿 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/templates/template-pitch-001`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBe('template-pitch-001');
  });

  test('POST /api/v1/templates - 템플릿 생성 (Admin)', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.post(`${API_BASE_URL}/api/v1/templates`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'New Template',
        template_type: 'brand_kit',
        mode: 'brand_kit',
        canvas_json: {
          version: '1.0',
          objects: [],
        },
        is_public: false,
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('template_id');
    createdTemplateId = body.template_id;
  });

  test('PATCH /api/v1/templates/{templateId} - 템플릿 수정 (Admin)', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.patch(`${API_BASE_URL}/api/v1/templates/${createdTemplateId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Updated Template',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.name).toBe('Updated Template');
  });

  test('POST /api/v1/templates/{templateId}/approve - 템플릿 승인 (Admin)', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.post(`${API_BASE_URL}/api/v1/templates/${createdTemplateId}/approve`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.is_approved).toBe(true);
  });

  test('POST /api/v1/templates/{templateId}/reject - 템플릿 거부 (Admin)', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.post(`${API_BASE_URL}/api/v1/templates/${createdTemplateId}/reject`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        reason: 'Quality issue',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.is_approved).toBe(false);
  });

  test('DELETE /api/v1/templates/{templateId} - 템플릿 삭제 (Admin)', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.delete(`${API_BASE_URL}/api/v1/templates/${createdTemplateId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(204);
  });
});

test.describe('B팀 Backend API - Admin API (5개)', () => {
  test('GET /api/v1/admin/users - 사용자 목록', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.get(`${API_BASE_URL}/api/v1/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.users)).toBe(true);
  });

  test('GET /api/v1/admin/jobs - Generation Jobs 목록', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.get(`${API_BASE_URL}/api/v1/admin/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.jobs)).toBe(true);
  });

  test('GET /api/v1/admin/agents - Agent Status', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.get(`${API_BASE_URL}/api/v1/admin/agents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('agents');
    expect(Array.isArray(body.agents)).toBe(true);

    // 7개 Agent 확인
    const agentNames = body.agents.map((a: any) => a.name);
    expect(agentNames).toContain('StrategistAgent');
    expect(agentNames).toContain('DataFetcherAgent');
    expect(agentNames).toContain('TemplateSelectorAgent');
    expect(agentNames).toContain('CopywriterAgent');
    expect(agentNames).toContain('LayoutDesignerAgent');
    expect(agentNames).toContain('ReviewerAgent');
    expect(agentNames).toContain('BrandAnalyzerAgent');
  });

  test('GET /api/v1/admin/health - Health Check', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.get(`${API_BASE_URL}/api/v1/admin/health`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'healthy');
    expect(body).toHaveProperty('database');
    expect(body).toHaveProperty('redis');
    expect(body).toHaveProperty('storage');
  });

  test('GET /api/v1/admin/dashboard - Dashboard 통계', async ({ request }) => {
    const token = await getTestToken();

    const response = await request.get(`${API_BASE_URL}/api/v1/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('total_users');
    expect(body).toHaveProperty('total_documents');
    expect(body).toHaveProperty('total_generations');
    expect(body).toHaveProperty('active_jobs');
  });
});

test.describe('B팀 Backend API - Monitoring (2개)', () => {
  test('GET /metrics - Prometheus 메트릭', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/metrics`);

    expect(response.status()).toBe(200);

    const body = await response.text();

    // Prometheus 메트릭 포맷 확인
    expect(body).toContain('http_requests_total');
    expect(body).toContain('http_request_duration_seconds');
    expect(body).toContain('agent_executions_total');
    expect(body).toContain('llm_api_calls_total');
    expect(body).toContain('generator_duration_seconds');
  });

  test('GET /health - Public Health Check', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
  });
});

test.describe('B팀 Backend API - 성능 테스트', () => {
  test('Generator API 응답 시간 < 10초', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.post(`${API_BASE_URL}/api/v1/generate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        generator_type: 'brand_kit',
        prompt: '성능 테스트용 브랜드 키트',
        brand_id: 'brand-test-001',
      },
      timeout: 15000,
    });

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    console.log(`Generator API 응답 시간: ${responseTime.toFixed(2)}초`);

    expect(response.status()).toBe(201);
    expect(responseTime).toBeLessThan(10);
  });

  test('Documents API 응답 시간 < 1초', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${API_BASE_URL}/api/v1/documents?limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    console.log(`Documents API 응답 시간: ${responseTime.toFixed(3)}초`);

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(1);
  });

  test('Templates API (캐시) 응답 시간 < 200ms', async ({ request }) => {
    // 첫 번째 호출 (캐시 미스)
    await request.get(`${API_BASE_URL}/api/v1/templates`);

    // 두 번째 호출 (캐시 히트)
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/api/v1/templates`);
    const endTime = Date.now();

    const responseTime = endTime - startTime;

    console.log(`Templates API (캐시) 응답 시간: ${responseTime}ms`);

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(200);
  });
});
