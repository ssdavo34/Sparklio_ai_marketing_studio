// Asset Types
export interface Asset {
  id: string;
  brand_id: string;
  project_id?: string;
  user_id: string;
  type: 'image' | 'video' | 'text';
  minio_path: string;
  original_name?: string;
  file_size: number;
  mime_type?: string;
  checksum?: string;
  source: 'comfyui' | 'ollama' | 'manual';
  status: 'active' | 'archived' | 'deleted';
  tags?: string[];
  created_at: string;
  updated_at: string;
  presigned_url?: string;
}

export interface AssetListResponse {
  total: number;
  page: number;
  page_size: number;
  assets: Asset[];
}

// Router Types
export interface RouterRequest {
  user_id: string;
  request_text: string;
  brand_id?: string;
  project_id?: string;
  context?: Record<string, any>;
}

export interface RouterResponse {
  target_agent: string;
  selected_model: string;
  risk_level: 'low' | 'medium' | 'high';
  minimized_context: Record<string, any>;
  routing_metadata: Record<string, any>;
}

// Editor Types
export interface EditorAction {
  type: string;
  target: string;
  property?: string;
  value: any;
  metadata?: Record<string, any>;
}

export interface EditorOutput {
  actions: EditorAction[];
  metadata: Record<string, any>;
  confidence: number;
  error?: string;
}

// Canvas Types
export interface CanvasObject {
  id: string;
  type: 'textbox' | 'image' | 'rect' | 'circle' | 'group';
  left: number;
  top: number;
  width?: number;
  height?: number;
  zIndex: number;
  meta?: Record<string, any>;
  text?: string;
  fontSize?: number;
  fill?: string;
  src?: string;
}

export interface CanvasContext {
  objects: CanvasObject[];
  background: {
    type: 'color' | 'image';
    value: string;
  };
  size: {
    width: number;
    height: number;
  };
  page_index?: number;
}

// Brand Types
export interface Brand {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary?: string;
  };
  fonts: {
    primary: string;
    secondary?: string;
  };
  tone: string;
  created_at: string;
  updated_at: string;
}

// Project Types
export interface Project {
  id: string;
  brand_id: string;
  name: string;
  type: 'brochure' | 'presentation' | 'sns' | 'video';
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}
