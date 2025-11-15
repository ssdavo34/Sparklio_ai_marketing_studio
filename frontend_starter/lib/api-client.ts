import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
