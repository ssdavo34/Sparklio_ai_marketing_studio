import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';

// 👉 실제로 어떤 값이 들어오는지 확인
console.log("[api-client.ts] API_BASE =", API_BASE);
console.log("[api-client.ts] NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('❌ API 에러:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
        requestData: error.config?.data
      });
    }
    return Promise.reject(error);
  }
);

// SmartRouter 호출
export async function routeRequest(requestText: string, brandId?: string, projectId?: string) {
  const response = await api.post('/api/v1/router/route', {
    user_id: 'temp_user', // TODO: 실제 사용자 ID
    request_text: requestText,
    brand_id: brandId,
    project_id: projectId,
  });
  return response.data;
}

// EditorAgent 호출
export async function processEditorCommand(canvas: any, command: string, rules?: any) {
  const response = await api.post('/api/v1/editor/process', {
    canvas,
    command: { raw: command },
    rules: rules || {},
  });
  return response.data;
}

// 자산 업로드
export async function uploadAsset(formData: FormData) {
  const response = await axios.post(`${API_BASE}/api/v1/assets`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// 자산 목록 조회
export async function listAssets(params: {
  brandId?: string;
  page?: number;
  pageSize?: number;
}) {
  const response = await api.get('/api/v1/assets', { params });
  return response.data;
}

// 자산 상세 조회
export async function getAsset(assetId: string) {
  const response = await api.get(`/api/v1/assets/${assetId}`);
  return response.data;
}

// 자산 삭제
export async function deleteAsset(assetId: string, hardDelete = false) {
  await api.delete(`/api/v1/assets/${assetId}`, {
    params: { hard_delete: hardDelete },
  });
}

// ============ Authentication APIs ============

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// 회원가입
export async function register(data: RegisterData): Promise<UserResponse> {
  const response = await api.post('/api/v1/users/register', data);
  return response.data;
}

// 로그인 (JWT 토큰 발급)
export async function login(data: LoginData): Promise<TokenResponse> {
  const response = await api.post('/api/v1/users/login', data);
  const tokenData = response.data;

  // Save token to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', tokenData.access_token);
    localStorage.setItem('user', JSON.stringify(tokenData.user));
  }

  return tokenData;
}

// 로그아웃
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
}

// 현재 사용자 정보 조회
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await api.get('/api/v1/users/me');
  return response.data;
}

// 현재 사용자 정보 수정
export async function updateCurrentUser(data: Partial<RegisterData>): Promise<UserResponse> {
  const response = await api.patch('/api/v1/users/me', data);
  return response.data;
}

// ============ Brand APIs ============

export interface BrandCreate {
  name: string;
  slug: string;
  description?: string;
  brand_kit?: any;
  logo_url?: string;
  website_url?: string;
  industry?: string;
  tags?: string[];
}

export interface BrandResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand_kit?: any;
  logo_url?: string;
  website_url?: string;
  industry?: string;
  tags?: string[];
  owner_id: string;
  brand_metadata?: any;
  created_at: string;
  updated_at: string;
}

// 브랜드 생성
export async function createBrand(data: BrandCreate): Promise<BrandResponse> {
  const response = await api.post('/api/v1/brands', data);
  return response.data;
}

// 브랜드 목록 조회
export async function listBrands(skip = 0, limit = 100): Promise<BrandResponse[]> {
  const response = await api.get('/api/v1/brands', {
    params: { skip, limit },
  });
  return response.data;
}

// 브랜드 상세 조회
export async function getBrand(brandId: string): Promise<BrandResponse> {
  const response = await api.get(`/api/v1/brands/${brandId}`);
  return response.data;
}

// 브랜드 수정
export async function updateBrand(brandId: string, data: Partial<BrandCreate>): Promise<BrandResponse> {
  const response = await api.patch(`/api/v1/brands/${brandId}`, data);
  return response.data;
}

// 브랜드 삭제
export async function deleteBrand(brandId: string, hardDelete = false): Promise<void> {
  await api.delete(`/api/v1/brands/${brandId}`, {
    params: { hard_delete: hardDelete },
  });
}

// ============ Project APIs ============

export interface ProjectCreate {
  name: string;
  slug: string;
  brand_id: string;
  project_type: string;
  description?: string;
  brief?: any;
  status?: string;
  tags?: string[];
}

export interface ProjectResponse {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  project_type: string;
  description?: string;
  brief?: any;
  status: string;
  tags?: string[];
  owner_id: string;
  project_metadata?: any;
  created_at: string;
  updated_at: string;
}

// 프로젝트 생성
export async function createProject(data: ProjectCreate): Promise<ProjectResponse> {
  const response = await api.post('/api/v1/projects', data);
  return response.data;
}

// 프로젝트 목록 조회
export async function listProjects(brandId?: string, skip = 0, limit = 100): Promise<ProjectResponse[]> {
  const response = await api.get('/api/v1/projects', {
    params: { brand_id: brandId, skip, limit },
  });
  return response.data;
}

// 프로젝트 상세 조회
export async function getProject(projectId: string): Promise<ProjectResponse> {
  const response = await api.get(`/api/v1/projects/${projectId}`);
  return response.data;
}

// 프로젝트 수정
export async function updateProject(projectId: string, data: Partial<ProjectCreate>): Promise<ProjectResponse> {
  const response = await api.patch(`/api/v1/projects/${projectId}`, data);
  return response.data;
}

// 프로젝트 삭제
export async function deleteProject(projectId: string, hardDelete = false): Promise<void> {
  await api.delete(`/api/v1/projects/${projectId}`, {
    params: { hard_delete: hardDelete },
  });
}

// ============ Generator APIs ============

export interface GeneratorInput {
  kind: 'brand_kit' | 'product_detail' | 'sns' | 'presentation';
  brandId?: string;
  locale?: string;
  channel?: string;
  input: any; // 각 Generator마다 다른 input 구조
  context?: {
    brand_kit_id?: string;
    meeting_summary_id?: string;
    trend_context_id?: string;
  };
}

export interface GeneratorOutput {
  taskId: string;
  kind: string;
  textBlocks: Record<string, any>;
  editorDocument: {
    documentId: string;
    type: 'product_detail' | 'sns' | 'brand_kit' | 'presentation';
    brandId?: string;
    pages: Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      background: string;
      objects: Array<{
        id: string;
        type: 'text' | 'image' | 'shape' | 'group';
        role?: string;
        bounds: { x: number; y: number; width: number; height: number };
        props: Record<string, any>;
        bindings?: { field: string };
      }>;
    }>;
  };
  meta?: {
    templates_used?: string[];
    agents_trace?: any[];
    llm_cost?: { prompt_tokens: number; completion_tokens: number };
  };
}

// Generator 호출 (통합)
export async function generateDocument(input: GeneratorInput): Promise<GeneratorOutput> {
  const response = await api.post('/api/v1/generate', input);
  return response.data;
}

// Document 저장
export async function saveDocument(documentId: string, data: { documentJson: any; metadata?: any }) {
  const response = await api.post(`/api/v1/documents/${documentId}/save`, data);
  return response.data;
}

// Document 로드
export async function loadDocument(documentId: string) {
  const response = await api.get(`/api/v1/documents/${documentId}`);
  return response.data;
}

// Editor Action 실행
export async function executeEditorAction(documentId: string, actions: any[]) {
  const response = await api.post('/api/v1/editor/action', {
    documentId,
    actions,
  });
  return response.data;
}
