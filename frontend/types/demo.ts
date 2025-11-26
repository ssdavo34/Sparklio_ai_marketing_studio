// Demo Day 전용 타입 정의
// Based on B팀 Mock 데이터 구조

// ============================================
// Concept Board 관련 타입
// ============================================

export interface ConceptBoardData {
  campaign_id: string;
  campaign_name: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  meeting_summary: MeetingSummaryData;
  concepts: ConceptData[];
}

export interface MeetingSummaryData {
  title: string;
  duration_minutes: number;
  participants: string[];
  key_points: string[];
  core_message: string;
}

export interface ConceptData {
  concept_id: string;
  concept_name: string;
  concept_description: string;
  target_audience: string;
  key_message: string;
  tone_and_manner: string;
  visual_style: string;
  thumbnail_url?: string;
  assets: ConceptAssets;
}

export interface ConceptAssets {
  presentation: AssetReference;
  product_detail: AssetReference;
  instagram_ads: InstagramAdsReference;
  shorts_script: ShortsReference;
}

export interface AssetReference {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  preview_url?: string;
}

export interface InstagramAdsReference extends AssetReference {
  count: number;
  preview_urls?: string[];
}

export interface ShortsReference extends AssetReference {
  duration_seconds: number;
}

// ============================================
// Presentation 관련 타입
// ============================================

export interface PresentationData {
  id: string;
  concept_id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  slides: SlideData[];
  style: PresentationStyle;
  export_formats: string[];
  download_url: string;
}

export interface SlideData {
  slide_number: number;
  slide_type: 'cover' | 'problem' | 'solution' | 'features' | 'benefits' | 'cta';
  title: string;
  subtitle?: string;
  content?: string | string[] | FeatureItem[] | BenefitItem[];
  background_image_url?: string;
  elements?: SlideElement[];
  cta_button?: CTAButton;
}

export interface FeatureItem {
  feature: string;
  description: string;
}

export interface BenefitItem {
  metric: string;
  value: string;
  description: string;
}

export interface SlideElement {
  type: 'logo' | 'icon' | 'image';
  name?: string;
  url?: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface CTAButton {
  text: string;
  url: string;
}

export interface PresentationStyle {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  theme: string;
}

// ============================================
// Product Detail 관련 타입
// ============================================

export interface ProductDetailData {
  id: string;
  concept_id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  sections: ProductSection[];
  style: ProductDetailStyle;
  export_formats: string[];
  download_url: string;
}

export interface ProductSection {
  section_number: number;
  section_type: 'hero' | 'problem' | 'solution' | 'features' | 'benefits' | 'testimonial' | 'pricing' | 'cta';
  title: string;
  subtitle?: string;
  content?: string | string[] | FeatureItem[] | BenefitItem[];
  image_url?: string;
  cta_button?: CTAButton;
}

export interface ProductDetailStyle {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  theme: string;
}

// ============================================
// Instagram Ads 관련 타입
// ============================================

export interface InstagramAdsData {
  id: string;
  concept_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  ads: InstagramAdItem[];
  style: InstagramStyle;
  export_formats: string[];
}

export interface InstagramAdItem {
  ad_id: string;
  ad_type: 'feed' | 'story' | 'carousel';
  title: string;
  headline: string;
  body_text: string;
  cta_text: string;
  hashtags: string[];
  image_specs: ImageSpecs;
  preview_url?: string;
  download_url: string;
}

export interface ImageSpecs {
  width: number;
  height: number;
  aspect_ratio: string;
}

export interface InstagramStyle {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  filter?: string;
}

// ============================================
// Shorts Script 관련 타입
// ============================================

export interface ShortsScriptData {
  id: string;
  concept_id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  video_specs: VideoSpecs;
  hook: HookData;
  scenes: SceneData[];
  cta: CTAData;
  audio: AudioSettings;
  style: ShortsStyle;
  export_formats: string[];
  preview_url: string;
  download_url: string;
}

export interface VideoSpecs {
  duration_seconds: number;
  aspect_ratio: string;
  resolution: string;
  fps: number;
  format: string;
}

export interface HookData {
  text: string;
  duration_seconds: number;
  visual_description: string;
}

export interface SceneData {
  scene_number: number;
  start_time: number;
  end_time: number;
  duration_seconds: number;
  narration: string;
  visual_description: string;
  text_overlay: string | null;
  transition: 'cut' | 'fade' | 'slide_left' | 'slide_up' | 'zoom_in' | 'quick_cuts';
  bgm_mood: 'tense' | 'uplifting' | 'exciting' | 'calm';
}

export interface CTAData {
  text: string;
  visual_description: string;
  duration_seconds: number;
}

export interface AudioSettings {
  tts_voice: string;
  tts_provider: string;
  bgm_track: string;
  bgm_volume: number;
}

export interface ShortsStyle {
  color_scheme: ColorScheme;
  font: string;
  visual_theme: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

// ============================================
// Center View 타입
// ============================================

export type CenterViewType =
  | 'canvas'           // 기존 Polotno 에디터
  | 'meeting_summary'  // Meeting 요약 뷰
  | 'concept_board'    // Concept Board 뷰
  | 'slides_preview'   // Presentation 미리보기
  | 'detail_preview'   // Product Detail 미리보기
  | 'instagram_preview' // Instagram Ads 미리보기
  | 'shorts_preview';  // Shorts Script 미리보기

// ============================================
// Chat NextAction 타입
// ============================================

export interface NextAction {
  id: string;
  label: string;
  action: NextActionType;
  payload?: NextActionPayload;
  variant?: 'primary' | 'secondary' | 'outline';
}

export type NextActionType =
  | 'create_campaign'
  | 'open_concept_board'
  | 'open_slides'
  | 'open_detail'
  | 'open_instagram'
  | 'open_shorts'
  | 'generate_video'
  | 'back_to_concept_board';

export interface NextActionPayload {
  meeting_id?: string;
  campaign_id?: string;
  concept_id?: string;
  asset_id?: string;
}

// ============================================
// SSE Event 타입
// ============================================

export interface SSEEvent {
  type: 'progress' | 'completed' | 'error';
  step: string;
  message: string;
  progress: number;
  campaign_id?: string;
  error?: string;
}

// ============================================
// API Response 타입
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface CreateCampaignResponse {
  task_id: string;
  campaign_id: string;
  status: 'processing';
  estimated_seconds: number;
}
