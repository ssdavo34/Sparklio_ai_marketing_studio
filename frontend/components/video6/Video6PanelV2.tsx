/**
 * Video6 Panel V2 - 4단계 확인 플로우 통합 컴포넌트
 *
 * B팀 요청서(B_TEAM_REQUEST_VIDEO_PIPELINE_V2_2025-12-01.md) 기반
 *
 * 4단계 플로우:
 * 1. MODE_SELECT - 모드 선택 (REUSE/HYBRID/CREATIVE)
 * 2. ASSET_SELECT - 에셋 선택 (REUSE/HYBRID)
 * 3. TOPIC_INPUT - 주제 입력
 * 4. SCRIPT_REVIEW - Step 1: 스크립트 확인/수정
 * 5. IMAGE_REVIEW - Step 2: 이미지 확인/재생성
 * 6. MOTION_REVIEW - Step 3: 모션 프롬프트 확인/수정
 * 7. RENDER_COST - Step 4: 비용 확인 및 렌더 시작
 * 8. RENDERING - 렌더링 진행
 * 9. COMPLETE - 완료 (비디오 플레이어)
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-01
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Video, Sparkles, AlertCircle, Loader2, Eye, Image, Cpu, Zap, Music, Volume2, Save, Download, Check } from 'lucide-react';
import { useVideo6V2 } from '@/hooks/useVideo6V2';
import { ModeSelector } from './ModeSelector';
import { AssetPoolGrid } from './AssetPoolGrid';
import { RenderProgress } from './RenderProgress';
import { StepProgressIndicator, StepStatusMessage } from './StepProgressIndicator';
import { ScriptReviewStep, ImageReviewStep, MotionReviewStep, RenderCostStep } from './steps';
import type { VideoGenerationMode } from '@/types/video-pipeline';
import type {
  VideoProjectStatusV2,
  RenderMode,
  SceneDraftV2,
  VideoPlanDraftV2,
  VideoRenderResponse,
} from '@/types/video-pipeline-v2';
import { getFlowStepFromStatus, isStepGenerating } from '@/types/video-pipeline-v2';
// V1 API for project creation, plan execution, and render
import {
  createVideoProject,
  executePlanMode,
  executeRenderMode,
  pollUntilComplete,
} from '@/lib/api/video-pipeline-api';
// Image Generation API + Claude/Ollama for prompt enhancement
import {
  generateImage,
  generateImageWithComfyUI,
  checkComfyUIStatus,
  checkNanoBananaStatus,
  enhanceScriptsWithClaude,
  enhanceScriptsWithImagePrompts,
  type ImageGenerationModel,
  type PromptLLMModel,
} from '@/lib/api/comfyui-api';

// ============================================================================
// URL 변환 유틸리티 (임시 - 백엔드 수정 전까지)
// ============================================================================

function convertMinioUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let converted = url.replace('minio:9000', '100.123.51.5:9000');
  const urlObj = new URL(converted);
  urlObj.search = '';
  return urlObj.toString();
}

// ============================================================================
// Types
// ============================================================================

type FlowStep =
  | 'MODE_SELECT'
  | 'ASSET_SELECT'
  | 'TOPIC_INPUT'
  | 'SCRIPT_REVIEW'   // Step 1a: 캡션/스크립트 확인
  | 'PROMPT_REVIEW'   // Step 1b: image_prompt 확인/수정 (Ollama 생성 후)
  | 'IMAGE_REVIEW'    // Step 2: 이미지 확인/재생성
  | 'MOTION_REVIEW'   // Step 3
  | 'RENDER_COST'     // Step 4
  | 'RENDERING'
  | 'COMPLETE';

interface Video6PanelV2Props {
  onClose?: () => void;
  className?: string;
  /** 기존 프로젝트 ID (선택사항) */
  projectId?: string;
}

// ============================================================================
// Component
// ============================================================================

export function Video6PanelV2({ onClose, className = '', projectId: initialProjectId }: Video6PanelV2Props) {
  // V2 Hook 사용
  const [state, actions] = useVideo6V2({
    projectId: initialProjectId,
    onStatusChange: (status) => {
      console.log('[Video6PanelV2] Status changed:', status);
    },
    onComplete: (videoUrl) => {
      console.log('[Video6PanelV2] Completed:', videoUrl);
      setStep('COMPLETE');
    },
    onError: (error) => {
      console.error('[Video6PanelV2] Error:', error);
      setRenderError(error.message);
    },
  });

  const [step, setStep] = useState<FlowStep>('MODE_SELECT');
  const [topicInput, setTopicInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<VideoGenerationMode>('creative');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isPlanGenerating, setIsPlanGenerating] = useState(false);
  const [localPlanDraft, setLocalPlanDraft] = useState<VideoPlanDraftV2 | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);

  // BGM 설정
  const [selectedBgm, setSelectedBgm] = useState<string>('upbeat_corporate');
  const [bgmVolume, setBgmVolume] = useState<number>(0.3); // 0 ~ 1
  const [enableBgm, setEnableBgm] = useState<boolean>(true);

  // BGM 목록 (무료 BGM URL 사용)
  const bgmOptions = [
    { id: 'upbeat_corporate', name: '업비트 기업', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
    { id: 'inspiring', name: '영감을 주는', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { id: 'electronic', name: '일렉트로닉', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749d484.mp3' },
    { id: 'acoustic', name: '어쿠스틱', url: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_a48f178b49.mp3' },
    { id: 'none', name: 'BGM 없음', url: '' },
  ];

  // 영상 저장 상태
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null);

  // V2 상태 직접 사용 (localPlanDraft fallback 포함)
  const projectStatus = state.status;
  const planDraft = state.planDraft || localPlanDraft;
  const costEstimate = state.costEstimate;

  // 상태 변화에 따른 단계 자동 전환
  useEffect(() => {
    if (state.status === 'completed' && state.videoUrl) {
      setStep('COMPLETE');
    } else if (state.status === 'rendering' || state.status === 'render_queued') {
      setStep('RENDERING');
    }
  }, [state.status, state.videoUrl]);

  // 백엔드 상태에 따른 Step 자동 전환
  useEffect(() => {
    if (!projectStatus) return;

    switch (projectStatus) {
      case 'script_ready':
        setStep('SCRIPT_REVIEW');
        break;
      case 'images_ready':
        setStep('IMAGE_REVIEW');
        break;
      case 'motion_ready':
        setStep('MOTION_REVIEW');
        break;
      case 'motion_approved':
        setStep('RENDER_COST');
        break;
      case 'rendering':
      case 'render_queued':
        setStep('RENDERING');
        break;
      case 'completed':
        setStep('COMPLETE');
        break;
    }
  }, [projectStatus]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleModeSelect = (mode: VideoGenerationMode) => {
    setSelectedMode(mode);
    if (mode === 'creative') {
      setStep('TOPIC_INPUT');
    } else {
      setStep('ASSET_SELECT');
    }
  };

  const handleAssetSelect = (assetId: string, selected: boolean) => {
    if (selected) {
      setSelectedAssets((prev) => [...prev, assetId]);
    } else {
      setSelectedAssets((prev) => prev.filter((id) => id !== assetId));
    }
  };

  const handleAssetSelectNext = () => {
    if (selectedAssets.length === 0 && selectedMode === 'reuse') {
      return;
    }

    // reuse 모드 && 이미지가 선택된 경우: 바로 IMAGE_REVIEW로 이동
    if (selectedMode === 'reuse' && selectedAssets.length > 0) {
      console.log('[Video6PanelV2] Reuse mode - creating plan from selected assets');

      // 선택된 이미지들로 planDraft 생성
      const reuseScenes: SceneDraftV2[] = selectedAssets.map((assetUrl, idx) => ({
        scene_index: idx + 1,
        caption: `씬 ${idx + 1}`,
        script: '',
        image_prompt: '',
        duration_sec: 2.5,
        image_url: assetUrl,
        image_approval_status: 'approved' as const,
        motion_prompt: '',
        motion_prompt_ko: '',
        use_ai_video: true,
      }));

      const reusePlan: VideoPlanDraftV2 = {
        scenes: reuseScenes,
      };

      setLocalPlanDraft(reusePlan);
      setStep('IMAGE_REVIEW');
      return;
    }

    setStep('TOPIC_INPUT');
  };

  const handleTopicSubmit = async () => {
    if (!topicInput.trim()) return;

    console.log('[Video6PanelV2] Topic submitted:', topicInput);
    setIsPlanGenerating(true);
    setRenderError(null);

    try {
      // Step 1: 프로젝트 생성
      console.log('[Video6PanelV2] Creating project...');
      const projectResponse = await createVideoProject({
        topic: topicInput.trim(),
        mode: selectedMode.toLowerCase() as 'creative' | 'hybrid' | 'reuse',
        selected_asset_ids: selectedAssets.length > 0 ? selectedAssets : undefined,
        name: topicInput.trim(),
      });

      const projectId = projectResponse.project_id;
      console.log('[Video6PanelV2] Project created:', projectId);

      // V2 hook에 projectId 설정
      actions.setProjectId(projectId);

      // Step 2: PLAN 모드 실행 (LLM이 스크립트 생성)
      console.log('[Video6PanelV2] Executing plan mode...');
      const planResponse = await executePlanMode(projectId, {
        mode: selectedMode.toLowerCase() as 'creative' | 'hybrid' | 'reuse',
        available_assets: selectedAssets.length > 0 ? selectedAssets : undefined,
      });

      console.log('[Video6PanelV2] Plan generated:', planResponse);

      // V1 응답을 V2 형식으로 변환하여 로컬 상태에 저장
      // V1 plan은 scenes를 포함하므로 V2와 호환됨
      const planAsV2: VideoPlanDraftV2 = {
        ...(planResponse.plan as any),
        scenes: planResponse.plan.scenes.map((scene, idx) => ({
          ...scene,
          index: idx,
          image_url: (scene as any).image_url || null,
          motion_prompt: (scene as any).motion_prompt || '',
          motion_prompt_ko: (scene as any).motion_prompt_ko || '',
          use_ai_video: (scene as any).use_ai_video ?? true,
          image_approval_status: 'pending' as const,
        })),
      };

      setLocalPlanDraft(planAsV2);
      setStep('SCRIPT_REVIEW');
    } catch (error) {
      console.error('[Video6PanelV2] Plan generation failed:', error);
      setRenderError(
        error instanceof Error ? error.message : '플랜 생성에 실패했습니다.'
      );
    } finally {
      setIsPlanGenerating(false);
    }
  };

  // Step 1a: 스크립트 승인 → Claude로 image_prompt 생성 → PROMPT_REVIEW로 이동
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [promptGenProgress, setPromptGenProgress] = useState(0);

  // Step 1b: 프롬프트 확인 → 이미지 생성 → IMAGE_REVIEW로 이동
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState(0);
  const [imageGenStatus, setImageGenStatus] = useState<string>('');

  // 이미지 생성 모델 선택 (ComfyUI 또는 NanoBanana)
  const [selectedImageModel, setSelectedImageModel] = useState<ImageGenerationModel>('comfyui');

  // 프롬프트 생성 LLM 선택 (Claude 또는 Ollama)
  const [selectedPromptLLM, setSelectedPromptLLM] = useState<PromptLLMModel>('claude');

  // Step 1a: 스크립트 승인 → 선택된 LLM으로 프롬프트 생성
  const handleGeneratePrompts = useCallback(async () => {
    if (!planDraft?.scenes) return;

    const llmName = selectedPromptLLM === 'claude' ? 'Claude' : 'Ollama';
    console.log(`[Video6PanelV2] Generating prompts with ${llmName}...`);
    setRenderError(null);
    setIsGeneratingPrompts(true);
    setPromptGenProgress(0);

    try {
      const scenesToEnhance = planDraft.scenes.map((scene, idx) => ({
        scene_index: idx,
        caption: scene.caption || '',
        script: scene.script,
        duration_sec: scene.duration_sec,
      }));

      setPromptGenProgress(20);

      // 선택된 LLM으로 프롬프트 생성
      const enhancedScenes = selectedPromptLLM === 'claude'
        ? await enhanceScriptsWithClaude(topicInput || '마케팅 비디오', scenesToEnhance)
        : await enhanceScriptsWithImagePrompts(topicInput || '마케팅 비디오', scenesToEnhance);

      console.log('[Video6PanelV2] Enhanced scenes:', enhancedScenes);
      setPromptGenProgress(100);

      // 프롬프트만 업데이트 (이미지는 아직 생성하지 않음)
      const updatedScenes: SceneDraftV2[] = planDraft.scenes.map((scene, idx) => ({
        ...scene,
        image_prompt: enhancedScenes[idx]?.image_prompt || scene.image_prompt,
      }));

      const updatedPlan: VideoPlanDraftV2 = {
        ...planDraft,
        scenes: updatedScenes,
      };

      setLocalPlanDraft(updatedPlan);
      setStep('PROMPT_REVIEW'); // 프롬프트 확인 단계로 이동
    } catch (error) {
      console.error('[Video6PanelV2] Prompt generation failed:', error);
      setRenderError(error instanceof Error ? error.message : '프롬프트 생성에 실패했습니다.');
    } finally {
      setIsGeneratingPrompts(false);
      setPromptGenProgress(0);
    }
  }, [planDraft, topicInput, selectedPromptLLM]);

  // Step 1b: 프롬프트 확인 후 이미지 생성 (선택된 모델 사용)
  const handlePromptApprove = useCallback(async () => {
    if (!localPlanDraft?.scenes) return;

    const modelName = selectedImageModel === 'comfyui' ? 'ComfyUI' : 'NanoBanana';
    console.log(`[Video6PanelV2] Prompts approved, generating images with ${modelName}...`);
    setRenderError(null);
    setIsGeneratingImages(true);
    setImageGenProgress(0);
    setImageGenStatus(`${modelName}로 이미지 생성 시작...`);

    try {
      // 선택된 모델 사용 가능 여부 확인
      const modelAvailable = selectedImageModel === 'comfyui'
        ? await checkComfyUIStatus()
        : await checkNanoBananaStatus();

      if (!modelAvailable) {
        throw new Error(`${modelName} 서버에 연결할 수 없습니다.`);
      }

      // 씬을 순차적으로 처리
      const updatedScenes: SceneDraftV2[] = [];
      for (let idx = 0; idx < localPlanDraft.scenes.length; idx++) {
        const scene = localPlanDraft.scenes[idx];

        if (scene.image_url) {
          // 이미 이미지가 있으면 스킵
          updatedScenes.push(scene);
          continue;
        }

        const imagePrompt = scene.image_prompt || scene.caption || `Scene ${idx + 1}`;
        setImageGenStatus(`씬 ${idx + 1}/${localPlanDraft.scenes.length} - ${modelName}로 생성 중...`);

        let imageUrl: string;

        try {
          console.log(`[Video6PanelV2] Generating image for scene ${idx + 1} with ${modelName}:`, imagePrompt.substring(0, 50));
          const result = await generateImage({
            prompt: imagePrompt,
            negative_prompt: 'blurry, low quality, distorted, ugly, text, watermark, words, letters, logo',
            width: 1024,
            height: 576,
            model: selectedImageModel,
          });
          imageUrl = result.image_url;
        } catch (error) {
          console.error(`[Video6PanelV2] ${modelName} failed for scene ${idx + 1}:`, error);
          imageUrl = `https://placehold.co/1024x576/red/white?text=Error+Scene+${idx + 1}`;
        }

        updatedScenes.push({
          ...scene,
          image_url: imageUrl,
          image_approval_status: 'pending' as const,
        });

        const progress = ((idx + 1) / localPlanDraft.scenes.length) * 100;
        setImageGenProgress(Math.floor(progress));
      }

      const updatedPlan: VideoPlanDraftV2 = {
        ...localPlanDraft,
        scenes: updatedScenes,
      };

      setLocalPlanDraft(updatedPlan);
      setImageGenStatus('완료!');
      setStep('IMAGE_REVIEW');
    } catch (error) {
      console.error('[Video6PanelV2] Image generation failed:', error);
      setRenderError(error instanceof Error ? error.message : '이미지 생성에 실패했습니다.');
    } finally {
      setIsGeneratingImages(false);
      setImageGenProgress(0);
      setImageGenStatus('');
    }
  }, [localPlanDraft, selectedImageModel]);

  // 기존 handleScriptApprove는 handleGeneratePrompts로 대체
  const handleScriptApprove = handleGeneratePrompts;

  // Step 2: 이미지 재생성 (ComfyUI 사용)
  const handleImageRegenerate = useCallback(
    async (sceneIndices: number[], reasons: Record<number, string>) => {
      if (!localPlanDraft?.scenes) return;

      console.log('[Video6PanelV2] Regenerating images for scenes:', sceneIndices);
      setIsGeneratingImages(true);

      try {
        const comfyUIAvailable = await checkComfyUIStatus();
        const updatedScenes = [...localPlanDraft.scenes];

        for (let i = 0; i < sceneIndices.length; i++) {
          const sceneIdx = sceneIndices[i];
          const scene = updatedScenes[sceneIdx];
          const reason = reasons[sceneIdx] || '';

          // 프롬프트에 reason 추가
          const basePrompt = scene.image_prompt ||
            scene.script ||
            scene.caption ||
            `Scene ${sceneIdx + 1}`;
          const enhancedPrompt = reason
            ? `${basePrompt}, ${reason}`
            : basePrompt;

          let imageUrl: string;

          if (comfyUIAvailable) {
            try {
              const result = await generateImageWithComfyUI({
                prompt: `${enhancedPrompt}, high quality, professional marketing photo, cinematic lighting`,
                negative_prompt: 'blurry, low quality, distorted, ugly, text, watermark',
                width: 1024,
                height: 576,
                // Lightning 모델 - 기본값 사용 (steps: 8, cfg: 2)
                seed: Math.floor(Math.random() * 1000000000), // 새 시드로 다른 이미지 생성
              });
              imageUrl = result.image_url;
            } catch (error) {
              console.error(`[Video6PanelV2] Regenerate failed for scene ${sceneIdx + 1}:`, error);
              imageUrl = `https://placehold.co/1024x576/red/white?text=Error+Scene+${sceneIdx + 1}`;
            }
          } else {
            imageUrl = `https://placehold.co/1024x576/orange/white?text=Regen+Scene+${sceneIdx + 1}`;
          }

          updatedScenes[sceneIdx] = {
            ...scene,
            image_url: imageUrl,
            image_approval_status: 'pending' as const,
          };

          setImageGenProgress(Math.floor(((i + 1) / sceneIndices.length) * 100));
        }

        setLocalPlanDraft({
          ...localPlanDraft,
          scenes: updatedScenes,
        });
      } catch (error) {
        console.error('[Video6PanelV2] Image regenerate failed:', error);
        setRenderError(error instanceof Error ? error.message : '이미지 재생성에 실패했습니다.');
      } finally {
        setIsGeneratingImages(false);
        setImageGenProgress(0);
      }
    },
    [localPlanDraft]
  );

  // Step 2: 이미지 승인 → Step 3 (모션 프롬프트 확인)으로 이동
  const handleImageApprove = useCallback(async () => {
    if (!localPlanDraft?.scenes) return;

    console.log('[Video6PanelV2] Images approved, moving to MOTION_REVIEW...');

    // 각 씬에 모션 프롬프트 추가 (테스트용 기본값)
    const updatedPlan: VideoPlanDraftV2 = {
      ...localPlanDraft,
      scenes: localPlanDraft.scenes.map((scene, idx) => ({
        ...scene,
        motion_prompt: scene.motion_prompt || `Slow zoom in on scene ${idx + 1}, gentle camera movement`,
        motion_prompt_ko: scene.motion_prompt_ko || `씬 ${idx + 1} 천천히 줌인, 부드러운 카메라 움직임`,
        use_ai_video: scene.use_ai_video ?? true,
      })),
    };

    setLocalPlanDraft(updatedPlan);
    setStep('MOTION_REVIEW');
  }, [localPlanDraft]);

  // Step 3: 모션 승인 → FFMPEG 렌더링 시작
  const handleMotionApprove = useCallback(async () => {
    if (!localPlanDraft?.scenes) return;

    console.log('[Video6PanelV2] Motion approved, starting FFMPEG render...');
    setRenderError(null);
    setStep('RENDERING');
    setRenderProgress(0);

    try {
      // FFMPEG.wasm으로 프론트엔드에서 비디오 합성
      const videoUrl = await renderVideoWithFFmpeg(localPlanDraft.scenes);

      setLocalVideoUrl(videoUrl);
      setStep('COMPLETE');
    } catch (error) {
      console.error('[Video6PanelV2] FFMPEG render failed:', error);
      setRenderError(error instanceof Error ? error.message : String(error));
      setStep('MOTION_REVIEW');
    }
  }, [localPlanDraft]);

  // 이미지 URL을 로드하여 HTMLImageElement로 반환
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img') as HTMLImageElement;
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  };

  // TTS 음성 생성 (Backend EdgeTTS 사용)
  const generateTTSAudioFromBackend = async (text: string, voice: string = 'ko-KR-SunHiNeural'): Promise<ArrayBuffer | null> => {
    if (!text || text.trim().length === 0) {
      console.log('[Video6PanelV2] Skipping TTS - empty text');
      return null;
    }

    try {
      console.log('[Video6PanelV2] Generating TTS for:', text.substring(0, 50));
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, rate: '+0%' }),
      });

      if (!response.ok) {
        console.error('[Video6PanelV2] TTS API error:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.audio_base64) {
        // Base64 → ArrayBuffer
        const binaryString = atob(data.audio_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        console.log('[Video6PanelV2] TTS generated, size:', bytes.length);
        return bytes.buffer;
      }

      return null;
    } catch (error) {
      console.error('[Video6PanelV2] TTS generation error:', error);
      return null;
    }
  };

  // TTS AudioBuffer 배열을 하나의 오디오로 합치기
  const concatenateAudioBuffers = async (
    audioContext: AudioContext,
    buffers: (AudioBuffer | null)[],
    durations: number[]
  ): Promise<AudioBuffer | null> => {
    // 유효한 버퍼만 필터링
    const validBuffers = buffers.filter(b => b !== null) as AudioBuffer[];
    if (validBuffers.length === 0) return null;

    // 총 길이 계산 (씬 길이 기반)
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const sampleRate = audioContext.sampleRate;
    const totalLength = Math.ceil(totalDuration * sampleRate);

    // 결과 버퍼 생성 (모노)
    const result = audioContext.createBuffer(1, totalLength, sampleRate);
    const channel = result.getChannelData(0);

    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      const sceneDuration = durations[i];

      if (buffer) {
        // 오디오 버퍼의 데이터를 복사
        const sourceChannel = buffer.getChannelData(0);
        const copyLength = Math.min(sourceChannel.length, Math.ceil(sceneDuration * sampleRate));
        for (let j = 0; j < copyLength && offset + j < totalLength; j++) {
          channel[offset + j] = sourceChannel[j];
        }
      }
      // 다음 씬 시작 위치로 이동
      offset += Math.ceil(sceneDuration * sampleRate);
    }

    return result;
  };

  // FFMPEG.wasm으로 비디오 렌더링 (브라우저에서 실행)
  const renderVideoWithFFmpeg = async (scenes: SceneDraftV2[]): Promise<string> => {
    console.log('[Video6PanelV2] Starting FFMPEG render with', scenes.length, 'scenes');
    console.log('[Video6PanelV2] Scene data:', scenes.map(s => ({
      idx: s.scene_index,
      hasImage: !!s.image_url,
      imageUrl: s.image_url?.substring(0, 80),
      caption: s.caption?.substring(0, 30),
      script: s.script?.substring(0, 30),
    })));

    setRenderProgress(2);

    // 0. TTS 음성 생성 (각 씬별로 병렬 생성)
    console.log('[Video6PanelV2] Generating TTS audio for all scenes...');
    const ttsPromises = scenes.map(async (scene) => {
      const narration = scene.script || scene.caption || '';
      if (!narration) return null;
      return generateTTSAudioFromBackend(narration);
    });

    const ttsArrayBuffers = await Promise.all(ttsPromises);
    console.log('[Video6PanelV2] TTS generation complete:', ttsArrayBuffers.filter(b => b).length, 'audio files');

    // 0.5. BGM 로드
    let bgmArrayBuffer: ArrayBuffer | null = null;
    const selectedBgmOption = bgmOptions.find(b => b.id === selectedBgm);
    if (enableBgm && selectedBgmOption?.url) {
      try {
        console.log('[Video6PanelV2] Loading BGM:', selectedBgmOption.name);
        const bgmResponse = await fetch(selectedBgmOption.url);
        if (bgmResponse.ok) {
          bgmArrayBuffer = await bgmResponse.arrayBuffer();
          console.log('[Video6PanelV2] BGM loaded, size:', bgmArrayBuffer.byteLength);
        }
      } catch (bgmError) {
        console.error('[Video6PanelV2] Failed to load BGM:', bgmError);
      }
    }

    setRenderProgress(5);

    // 1. 이미지 프리로드 (배열 인덱스로 저장)
    const imageMap = new Map<number, HTMLImageElement>();
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const imageUrl = scene.image_url || scene.preview_url || scene.thumb_url;

      console.log(`[Video6PanelV2] Scene ${i}: image_url=${imageUrl?.substring(0, 100)}`);

      if (imageUrl) {
        try {
          console.log(`[Video6PanelV2] Loading image for scene index ${i}:`, imageUrl.substring(0, 100));
          const img = await loadImage(imageUrl);
          imageMap.set(i, img); // 배열 인덱스로 저장
          console.log(`[Video6PanelV2] Image loaded successfully for scene ${i}, size: ${img.width}x${img.height}`);
        } catch (error) {
          console.error(`[Video6PanelV2] Failed to load image for scene ${i}:`, error);
        }
      } else {
        console.warn(`[Video6PanelV2] No image URL for scene ${i}`);
      }
      setRenderProgress(5 + Math.floor(((i + 1) / scenes.length) * 15));
    }

    console.log(`[Video6PanelV2] Loaded ${imageMap.size} images out of ${scenes.length} scenes`);

    setRenderProgress(20);

    // 2. Canvas 설정
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    // 3. AudioContext 및 TTS AudioBuffer 준비
    let audioContext: AudioContext | null = null;
    const ttsAudioBuffers: (AudioBuffer | null)[] = [];
    let bgmAudioBuffer: AudioBuffer | null = null;

    // TTS 또는 BGM이 있으면 AudioContext 생성
    const hasAudio = ttsArrayBuffers.some(b => b !== null) || bgmArrayBuffer;
    if (hasAudio) {
      try {
        audioContext = new AudioContext();
        console.log('[Video6PanelV2] AudioContext created, sample rate:', audioContext.sampleRate);

        // TTS ArrayBuffer를 AudioBuffer로 변환
        for (let i = 0; i < ttsArrayBuffers.length; i++) {
          const arrayBuffer = ttsArrayBuffers[i];
          if (arrayBuffer) {
            try {
              // MP3 ArrayBuffer를 AudioBuffer로 디코딩
              const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
              ttsAudioBuffers.push(audioBuffer);
              console.log(`[Video6PanelV2] TTS AudioBuffer decoded for scene ${i}, duration: ${audioBuffer.duration}s`);
            } catch (decodeError) {
              console.error(`[Video6PanelV2] Failed to decode audio for scene ${i}:`, decodeError);
              ttsAudioBuffers.push(null);
            }
          } else {
            ttsAudioBuffers.push(null);
          }
        }

        // BGM ArrayBuffer를 AudioBuffer로 변환
        if (bgmArrayBuffer) {
          try {
            bgmAudioBuffer = await audioContext.decodeAudioData(bgmArrayBuffer.slice(0));
            console.log(`[Video6PanelV2] BGM AudioBuffer decoded, duration: ${bgmAudioBuffer.duration}s`);
          } catch (bgmDecodeError) {
            console.error('[Video6PanelV2] Failed to decode BGM:', bgmDecodeError);
          }
        }
      } catch (audioError) {
        console.error('[Video6PanelV2] AudioContext creation failed:', audioError);
      }
    }

    // 4. MediaRecorder 설정 (비디오 + 오디오)
    const videoStream = canvas.captureStream(30);

    // 오디오 스트림 추가 (AudioContext가 있을 경우)
    let audioDestination: MediaStreamAudioDestinationNode | null = null;
    let bgmGainNode: GainNode | null = null;
    let ttsGainNode: GainNode | null = null;
    let bgmSource: AudioBufferSourceNode | null = null;

    if (audioContext) {
      audioDestination = audioContext.createMediaStreamDestination();

      // Gain nodes for volume control
      bgmGainNode = audioContext.createGain();
      bgmGainNode.gain.value = bgmVolume; // BGM 볼륨 (0.3 기본값)
      bgmGainNode.connect(audioDestination);

      ttsGainNode = audioContext.createGain();
      ttsGainNode.gain.value = 1.0; // TTS 볼륨 (풀 볼륨)
      ttsGainNode.connect(audioDestination);

      // BGM 재생 시작 (전체 영상에 걸쳐 루프)
      if (bgmAudioBuffer) {
        bgmSource = audioContext.createBufferSource();
        bgmSource.buffer = bgmAudioBuffer;
        bgmSource.loop = true; // BGM 반복
        bgmSource.connect(bgmGainNode);
        bgmSource.start();
        console.log('[Video6PanelV2] BGM playback started with volume:', bgmVolume);
      }

      // 오디오 트랙을 비디오 스트림에 추가
      audioDestination.stream.getAudioTracks().forEach(track => {
        videoStream.addTrack(track);
      });
      console.log('[Video6PanelV2] Audio track added to video stream');
    }

    // 지원되는 mimeType 찾기 (오디오 포함)
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    let selectedMimeType = 'video/webm';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        console.log(`[Video6PanelV2] Using mimeType: ${mimeType}`);
        break;
      }
    }

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(videoStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 5000000,
        audioBitsPerSecond: 128000,
      });
    } catch (e) {
      console.warn('[Video6PanelV2] MediaRecorder with options failed, using default');
      mediaRecorder = new MediaRecorder(videoStream);
    }

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMimeType });
        const url = URL.createObjectURL(blob);
        console.log('[Video6PanelV2] Render complete, blob size:', blob.size, 'bytes');
        resolve(url);
      };

      mediaRecorder.onerror = (e: Event) => {
        console.error('[Video6PanelV2] MediaRecorder error:', e);
        reject(new Error('MediaRecorder error'));
      };

      console.log('[Video6PanelV2] Starting MediaRecorder...');
      mediaRecorder.start(100); // 100ms 간격으로 데이터 수집

      // Ken Burns 효과 적용하여 이미지 그리기
      const drawImageWithKenBurns = (
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        progress: number, // 0~1
        effect: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' = 'zoom_in'
      ) => {
        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;

        // 이미지 aspect ratio 계산
        const imgRatio = img.width / img.height;
        const canvasRatio = canvasW / canvasH;

        let drawW: number, drawH: number, drawX: number, drawY: number;

        // Cover 방식으로 이미지 크기 계산
        if (imgRatio > canvasRatio) {
          drawH = canvasH;
          drawW = canvasH * imgRatio;
        } else {
          drawW = canvasW;
          drawH = canvasW / imgRatio;
        }

        // Ken Burns 효과
        const maxZoom = 1.15; // 최대 15% 줌
        const maxPan = 50; // 최대 50px 이동

        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;

        switch (effect) {
          case 'zoom_in':
            scale = 1 + (maxZoom - 1) * progress;
            break;
          case 'zoom_out':
            scale = maxZoom - (maxZoom - 1) * progress;
            break;
          case 'pan_left':
            offsetX = -maxPan * progress;
            scale = 1.05;
            break;
          case 'pan_right':
            offsetX = maxPan * progress;
            scale = 1.05;
            break;
        }

        drawW *= scale;
        drawH *= scale;
        drawX = (canvasW - drawW) / 2 + offsetX;
        drawY = (canvasH - drawH) / 2 + offsetY;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      };

      // 자막 그리기
      const drawCaption = (ctx: CanvasRenderingContext2D, text: string) => {
        if (!text) return;

        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;

        // 반투명 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, canvasH - 150, canvasW, 150);

        // 텍스트
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px "Noto Sans KR", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 긴 텍스트 줄바꿈
        const maxWidth = canvasW - 100;
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];

        for (const word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            lines.push(line.trim());
            line = word + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());

        // 최대 2줄만 표시
        const displayLines = lines.slice(0, 2);
        const lineHeight = 45;
        const startY = canvasH - 75 - ((displayLines.length - 1) * lineHeight / 2);

        displayLines.forEach((line, i) => {
          ctx.fillText(line, canvasW / 2, startY + i * lineHeight);
        });
      };

      // 각 씬을 순차적으로 렌더링
      let currentSceneIdx = 0;
      let currentAudioSource: AudioBufferSourceNode | null = null;

      const renderScene = async () => {
        if (currentSceneIdx >= scenes.length) {
          // 렌더링 완료 - 오디오 정리
          if (currentAudioSource) {
            try { currentAudioSource.stop(); } catch { /* ignore */ }
          }
          if (bgmSource) {
            try { bgmSource.stop(); } catch { /* ignore */ }
          }
          if (audioContext) {
            setTimeout(() => {
              audioContext?.close();
            }, 1000);
          }
          setRenderProgress(95);
          setTimeout(() => {
            mediaRecorder.stop();
          }, 500); // 마지막 프레임 안정화
          return;
        }

        const scene = scenes[currentSceneIdx];
        const duration = (scene.duration_sec || 2.5) * 1000; // ms
        const frameCount = Math.ceil((duration / 1000) * 30); // 30fps
        const img = imageMap.get(currentSceneIdx); // 배열 인덱스로 가져옴
        const kenBurnsEffects: Array<'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right'> =
          ['zoom_in', 'zoom_out', 'pan_left', 'pan_right'];
        const effect = kenBurnsEffects[currentSceneIdx % kenBurnsEffects.length];

        console.log(`[Video6PanelV2] Rendering scene ${currentSceneIdx}, duration: ${duration}ms, hasImage: ${!!img}, imageUrl: ${scene.image_url?.substring(0, 50)}`);

        setRenderProgress(20 + Math.floor(((currentSceneIdx + 1) / scenes.length) * 70));

        // 자막 텍스트 (script가 더 상세하므로 우선 사용)
        const caption = scene.script || scene.caption || scene.image_prompt || '';

        // TTS 오디오 재생 (Backend EdgeTTS) - ttsGainNode를 통해 연결
        const ttsBuffer = ttsAudioBuffers[currentSceneIdx];
        if (ttsBuffer && audioContext && ttsGainNode) {
          try {
            // 이전 오디오 소스 정리
            if (currentAudioSource) {
              try { currentAudioSource.stop(); } catch { /* ignore */ }
            }

            // 새 오디오 소스 생성 및 ttsGainNode를 통해 재생
            currentAudioSource = audioContext.createBufferSource();
            currentAudioSource.buffer = ttsBuffer;
            currentAudioSource.connect(ttsGainNode); // ttsGainNode를 통해 연결 (BGM과 별도 볼륨 제어)
            currentAudioSource.start();
            console.log(`[Video6PanelV2] Playing TTS audio for scene ${currentSceneIdx}, duration: ${ttsBuffer.duration}s`);
          } catch (playError) {
            console.error(`[Video6PanelV2] Failed to play TTS audio for scene ${currentSceneIdx}:`, playError);
          }
        }

        // 프레임 렌더링 (Ken Burns 효과)
        let frame = 0;
        const renderFrame = () => {
          if (frame >= frameCount) {
            currentSceneIdx++;
            renderScene();
            return;
          }

          const progress = frame / frameCount;

          // 배경 클리어
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (img) {
            // 이미지가 있으면 Ken Burns 효과로 그리기
            drawImageWithKenBurns(ctx, img, progress, effect);
          } else {
            // 이미지가 없으면 그라데이션 배경
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, `hsl(${(currentSceneIdx * 45) % 360}, 60%, 30%)`);
            gradient.addColorStop(1, `hsl(${(currentSceneIdx * 45 + 60) % 360}, 60%, 20%)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // 자막 표시
          drawCaption(ctx, caption);

          frame++;
          requestAnimationFrame(renderFrame);
        };

        renderFrame();
      };

      renderScene();
    });
  };

  // Step 4: 비용 조회 (FFMPEG 모드에서는 사용 안 함)
  const handleFetchCostEstimate = useCallback(
    async (renderMode: RenderMode) => {
      console.log('[Video6PanelV2] Cost estimate skipped in FFMPEG mode');
    },
    []
  );

  // Step 4: 렌더 시작 (FFMPEG 모드에서는 handleMotionApprove에서 처리)
  const handleStartRender = useCallback(
    async (renderMode: RenderMode) => {
      console.log('[Video6PanelV2] Start render (FFMPEG mode):', renderMode);
      // FFMPEG 렌더링은 handleMotionApprove에서 처리
      await handleMotionApprove();
    },
    [handleMotionApprove]
  );

  // Scene 업데이트: 스크립트/캡션
  // sceneIndex는 scene.scene_index 값 (1부터 시작할 수 있음)
  const handleUpdateScene = useCallback(
    (sceneIndex: number, updates: Partial<SceneDraftV2>) => {
      if (!localPlanDraft) return;

      const updatedScenes = [...localPlanDraft.scenes];
      // scene_index로 씬 찾기 (배열 인덱스가 아닌 scene_index 속성으로 매칭)
      const targetIdx = updatedScenes.findIndex((s) => s.scene_index === sceneIndex);

      if (targetIdx !== -1) {
        updatedScenes[targetIdx] = {
          ...updatedScenes[targetIdx],
          ...updates,
        };

        setLocalPlanDraft({
          ...localPlanDraft,
          scenes: updatedScenes,
        });
      } else {
        console.warn(`[handleUpdateScene] Scene with scene_index=${sceneIndex} not found`);
      }
    },
    [localPlanDraft]
  );

  // 영상 저장 (MinIO 업로드)
  const handleSaveVideo = useCallback(async () => {
    const videoUrl = localVideoUrl || state.videoUrl;
    if (!videoUrl) return;

    setIsSavingVideo(true);
    setRenderError(null);

    try {
      console.log('[Video6PanelV2] Saving video to MinIO...');

      // Blob URL에서 Blob 가져오기
      const response = await fetch(videoUrl);
      const blob = await response.blob();

      // FormData 생성
      const formData = new FormData();
      const fileName = `video_${Date.now()}.webm`;
      const file = new File([blob], fileName, { type: blob.type });

      formData.append('file', file);
      // 기본 값 사용 (실제로는 workspace/brand 정보가 필요)
      formData.append('brand_id', '550e8400-e29b-41d4-a716-446655440000'); // 기본 brand_id
      formData.append('user_id', '550e8400-e29b-41d4-a716-446655440001'); // 기본 user_id
      formData.append('asset_type', 'video');
      formData.append('source', 'video6_generator');
      formData.append('tags', topicInput || 'generated_video');

      const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://100.123.51.5:8000';

      const uploadResponse = await fetch(`${BACKEND_URL}/api/v1/assets/`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('[Video6PanelV2] Video saved:', uploadResult);

      // 저장된 URL 업데이트
      const savedUrl = uploadResult.presigned_url || uploadResult.original_url;
      setSavedVideoUrl(savedUrl);

      // 성공 메시지
      alert('영상이 프로젝트에 저장되었습니다!');
    } catch (error) {
      console.error('[Video6PanelV2] Failed to save video:', error);
      setRenderError(error instanceof Error ? error.message : '영상 저장에 실패했습니다.');
    } finally {
      setIsSavingVideo(false);
    }
  }, [localVideoUrl, state.videoUrl, topicInput]);

  // 영상 다운로드
  const handleDownloadVideo = useCallback(() => {
    const videoUrl = localVideoUrl || state.videoUrl;
    if (!videoUrl) return;

    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video_${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [localVideoUrl, state.videoUrl]);

  const handleBack = () => {
    switch (step) {
      case 'ASSET_SELECT':
        setStep('MODE_SELECT');
        break;
      case 'TOPIC_INPUT':
        if (selectedMode === 'creative') {
          setStep('MODE_SELECT');
        } else {
          setStep('ASSET_SELECT');
        }
        break;
      case 'SCRIPT_REVIEW':
        setStep('TOPIC_INPUT');
        break;
      case 'PROMPT_REVIEW':
        setStep('SCRIPT_REVIEW');
        break;
      case 'IMAGE_REVIEW':
        setStep('PROMPT_REVIEW');
        break;
      case 'MOTION_REVIEW':
        setStep('IMAGE_REVIEW');
        break;
      case 'RENDER_COST':
        setStep('MOTION_REVIEW');
        break;
      case 'COMPLETE':
        setStep('MOTION_REVIEW');
        break;
      default:
        break;
    }
  };

  const handleReset = () => {
    actions.reset();
    setTopicInput('');
    setSelectedMode('creative');
    setSelectedAssets([]);
    setRenderError(null);
    setIsPlanGenerating(false);
    setLocalPlanDraft(null);
    setLocalVideoUrl(null);
    setRenderProgress(0);
    setSavedVideoUrl(null);
    setIsSavingVideo(false);
    setStep('MODE_SELECT');
  };

  // ============================================================================
  // Step Title
  // ============================================================================

  const getStepTitle = (): string => {
    switch (step) {
      case 'MODE_SELECT':
        return '비디오 생성 모드 선택';
      case 'ASSET_SELECT':
        return '사용할 이미지 선택';
      case 'TOPIC_INPUT':
        return '비디오 주제 입력';
      case 'SCRIPT_REVIEW':
        return 'Step 1a: 스크립트 확인';
      case 'PROMPT_REVIEW':
        return 'Step 1b: 이미지 프롬프트 확인';
      case 'IMAGE_REVIEW':
        return 'Step 2: 이미지 확인';
      case 'MOTION_REVIEW':
        return 'Step 3: 모션 확인';
      case 'RENDER_COST':
        return 'Step 4: 렌더 비용 확인';
      case 'RENDERING':
        return '영상 생성 중...';
      case 'COMPLETE':
        return '영상 완성!';
      default:
        return '';
    }
  };

  const showStepIndicator =
    ['SCRIPT_REVIEW', 'PROMPT_REVIEW', 'IMAGE_REVIEW', 'MOTION_REVIEW', 'RENDER_COST'].includes(step);

  const canGoBack =
    !['MODE_SELECT', 'RENDERING', 'COMPLETE'].includes(step) && !state.isLoading;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">{getStepTitle()}</h2>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Step Progress Indicator (4단계 플로우 시) */}
      {showStepIndicator && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <StepProgressIndicator status={projectStatus} />
        </div>
      )}

      {/* Error display */}
      {(state.error || renderError) && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">
              {state.error?.message || renderError || '오류가 발생했습니다.'}
            </p>
            <button
              onClick={() => {
                actions.clearError();
                setRenderError(null);
              }}
              className="text-xs text-red-600 underline mt-1 mr-2"
            >
              에러 닫기
            </button>
            <button
              onClick={handleReset}
              className="text-xs text-red-600 underline mt-1"
            >
              처음부터 다시 시작
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Mode Select */}
        {step === 'MODE_SELECT' && (
          <ModeSelector
            selectedMode={selectedMode}
            onSelectMode={handleModeSelect}
            disabled={state.isLoading}
          />
        )}

        {/* Asset Select */}
        {step === 'ASSET_SELECT' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {selectedMode === 'reuse'
                ? '비디오에 사용할 이미지를 선택하세요. 최소 1개 이상 선택해야 합니다.'
                : '비디오에 사용할 이미지를 선택하세요. 선택하지 않으면 AI가 모든 이미지를 생성합니다.'}
            </p>

            <AssetPoolGrid
              assets={[]} // TODO: Asset pool에서 가져오기
              selectedIds={selectedAssets}
              onSelect={(id) => handleAssetSelect(id, true)}
              onDeselect={(id) => handleAssetSelect(id, false)}
              disabled={state.isLoading}
            />

            <button
              onClick={handleAssetSelectNext}
              disabled={selectedMode === 'reuse' && selectedAssets.length === 0}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음 단계로
            </button>
          </div>
        )}

        {/* Topic Input */}
        {step === 'TOPIC_INPUT' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                어떤 영상을 만들까요?
              </label>
              <textarea
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="예: 핸드크림 제품 홍보 영상, 겨울 시즌 할인 안내 등"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                disabled={isPlanGenerating}
              />
            </div>

            {selectedMode !== 'creative' && selectedAssets.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  선택된 이미지 {selectedAssets.length}개가 영상에 포함됩니다.
                </p>
              </div>
            )}

            <button
              onClick={handleTopicSubmit}
              disabled={!topicInput.trim() || isPlanGenerating}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isPlanGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI가 스크립트를 생성하고 있습니다...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 플랜 생성
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 1a: Script Review - 캡션 확인 + LLM 선택 */}
        {step === 'SCRIPT_REVIEW' && (
          isGeneratingPrompts ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-gray-600 font-medium">
                {selectedPromptLLM === 'claude' ? 'Claude' : 'Ollama'}로 이미지 프롬프트 생성 중...
              </p>
              <p className="text-sm text-gray-400">{promptGenProgress}% 완료</p>
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${promptGenProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-4">
                {selectedPromptLLM === 'claude'
                  ? 'Claude가 캡션을 분석하여 고품질 이미지 프롬프트를 생성하고 있습니다'
                  : 'Ollama가 캡션을 분석하여 이미지 프롬프트를 생성하고 있습니다'}
              </p>
            </div>
          ) : planDraft ? (
            <div className="space-y-6">
              {/* 프롬프트 생성 LLM 선택 */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  프롬프트 생성 LLM 선택
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedPromptLLM('claude')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedPromptLLM === 'claude'
                        ? 'border-indigo-500 bg-indigo-100 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className={`w-5 h-5 ${selectedPromptLLM === 'claude' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className={`font-semibold ${selectedPromptLLM === 'claude' ? 'text-indigo-900' : 'text-gray-700'}`}>
                        Claude
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-left">
                      고품질 프롬프트
                      <br />
                      Claude 3.5 Sonnet
                    </p>
                  </button>
                  <button
                    onClick={() => setSelectedPromptLLM('ollama')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedPromptLLM === 'ollama'
                        ? 'border-indigo-500 bg-indigo-100 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className={`w-5 h-5 ${selectedPromptLLM === 'ollama' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className={`font-semibold ${selectedPromptLLM === 'ollama' ? 'text-indigo-900' : 'text-gray-700'}`}>
                        Ollama
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-left">
                      로컬 GPU 서버
                      <br />
                      Llama 3.2 모델
                    </p>
                  </button>
                </div>
              </div>

              {/* ScriptReviewStep 컴포넌트 */}
              <ScriptReviewStep
                plan={planDraft}
                onUpdateScene={handleUpdateScene}
                onApprove={handleScriptApprove}
                isLoading={state.isLoading || isGeneratingPrompts}
                disabled={state.isLoading || isGeneratingPrompts}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-gray-600 font-medium">스크립트를 불러오는 중...</p>
              <p className="text-sm text-gray-400">잠시만 기다려주세요</p>
            </div>
          )
        )}

        {/* Step 1b: Prompt Review - 이미지 프롬프트 확인/수정 */}
        {step === 'PROMPT_REVIEW' && localPlanDraft && (
          isGeneratingImages ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
              <p className="text-gray-600 font-medium">
                {imageGenStatus || '이미지 생성 중...'}
              </p>
              <p className="text-sm text-gray-400">{imageGenProgress}% 완료</p>
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${imageGenProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-4">
                {selectedImageModel === 'comfyui' ? 'ComfyUI' : 'NanoBanana'}로 이미지를 생성하고 있습니다
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 안내 메시지 */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">이미지 프롬프트 확인</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Claude가 생성한 이미지 프롬프트를 확인하고 필요시 수정하세요.
                  </p>
                </div>
              </div>

              {/* 이미지 생성 모델 선택 */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  이미지 생성 모델 선택
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedImageModel('comfyui')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedImageModel === 'comfyui'
                        ? 'border-purple-500 bg-purple-100 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className={`w-5 h-5 ${selectedImageModel === 'comfyui' ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className={`font-semibold ${selectedImageModel === 'comfyui' ? 'text-purple-900' : 'text-gray-700'}`}>
                        ComfyUI
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-left">
                      GPU 서버 (빠른 생성)
                      <br />
                      SDXL Lightning 모델
                    </p>
                  </button>
                  <button
                    onClick={() => setSelectedImageModel('nanobanana')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedImageModel === 'nanobanana'
                        ? 'border-purple-500 bg-purple-100 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className={`w-5 h-5 ${selectedImageModel === 'nanobanana' ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className={`font-semibold ${selectedImageModel === 'nanobanana' ? 'text-purple-900' : 'text-gray-700'}`}>
                        NanoBanana
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-left">
                      백엔드 서버
                      <br />
                      FLUX 기반 고품질
                    </p>
                  </button>
                </div>
              </div>

              {/* 씬별 프롬프트 목록 */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {localPlanDraft.scenes.map((scene, idx) => (
                  <div key={idx} className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50/30">
                    <div className="px-4 py-3 bg-blue-50 flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {scene.scene_index}
                      </span>
                      <div>
                        <span className="font-medium text-gray-900">씬 {scene.scene_index}</span>
                        <span className="text-sm text-gray-500 ml-2">"{scene.caption}"</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Image className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700 uppercase">이미지 프롬프트</span>
                      </div>
                      <textarea
                        value={scene.image_prompt || ''}
                        onChange={(e) => handleUpdateScene(scene.scene_index, { image_prompt: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm font-mono bg-white"
                        placeholder="이미지 프롬프트를 입력하세요..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setStep('SCRIPT_REVIEW')}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  캡션으로 돌아가기
                </button>
                <button
                  onClick={handlePromptApprove}
                  disabled={state.isLoading || isGeneratingImages}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {selectedImageModel === 'comfyui' ? <Zap className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  {selectedImageModel === 'comfyui' ? 'ComfyUI' : 'NanoBanana'}로 이미지 생성
                </button>
              </div>
            </div>
          )
        )}

        {/* Step 2: Image Review */}
        {step === 'IMAGE_REVIEW' && planDraft && (
          <ImageReviewStep
            plan={planDraft}
            onUpdateScene={handleUpdateScene}
            onRegenerate={handleImageRegenerate}
            onApprove={handleImageApprove}
            isLoading={state.isLoading}
            disabled={state.isLoading}
          />
        )}

        {/* Step 3: Motion Review */}
        {step === 'MOTION_REVIEW' && planDraft && (
          <div className="space-y-6">
            {/* BGM 선택 UI */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                <Music className="w-4 h-4" />
                배경음악 (BGM) 설정
              </h4>

              {/* BGM 활성화 토글 */}
              <div className="flex items-center gap-3 mb-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableBgm}
                    onChange={(e) => setEnableBgm(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">
                    {enableBgm ? 'BGM 사용' : 'BGM 미사용'}
                  </span>
                </label>
              </div>

              {enableBgm && (
                <>
                  {/* BGM 선택 */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {bgmOptions.filter(b => b.id !== 'none').map((bgm) => (
                      <button
                        key={bgm.id}
                        onClick={() => setSelectedBgm(bgm.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedBgm === bgm.id
                            ? 'border-orange-500 bg-orange-100 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-orange-300'
                        }`}
                      >
                        <span className={`text-sm font-medium ${selectedBgm === bgm.id ? 'text-orange-900' : 'text-gray-700'}`}>
                          {bgm.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* 볼륨 슬라이더 */}
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-orange-600" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bgmVolume * 100}
                      onChange={(e) => setBgmVolume(parseInt(e.target.value) / 100)}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-sm text-gray-600 w-12">{Math.round(bgmVolume * 100)}%</span>
                  </div>
                </>
              )}
            </div>

            {/* MotionReviewStep 컴포넌트 */}
            <MotionReviewStep
              plan={planDraft}
              onUpdateScene={handleUpdateScene}
              onApprove={handleMotionApprove}
              isLoading={state.isLoading}
              disabled={state.isLoading}
            />
          </div>
        )}

        {/* Step 4: Render Cost */}
        {step === 'RENDER_COST' && planDraft && (
          <RenderCostStep
            plan={planDraft}
            costEstimate={costEstimate || undefined}
            onFetchCostEstimate={handleFetchCostEstimate}
            onStartRender={handleStartRender}
            isLoading={state.isLoading}
            error={renderError || undefined}
            disabled={state.isLoading}
          />
        )}

        {/* Rendering */}
        {step === 'RENDERING' && (
          <RenderProgress
            status="rendering"
            progress={renderProgress}
            currentStep="V1 렌더링 중..."
            errorMessage={renderError || undefined}
          />
        )}

        {/* Complete */}
        {step === 'COMPLETE' && (localVideoUrl || state.videoUrl) && (
          <div className="space-y-4">
            {/* 성공 메시지 */}
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">영상이 성공적으로 생성되었습니다!</span>
            </div>

            {/* 비디오 플레이어 */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={convertMinioUrl(localVideoUrl || state.videoUrl) || ''}
                controls
                className="w-full h-full"
              />
            </div>

            {/* 저장 상태 표시 */}
            {savedVideoUrl && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Check className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 text-sm">프로젝트에 저장됨</span>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 프로젝트에 저장 */}
              <button
                onClick={handleSaveVideo}
                disabled={isSavingVideo || !!savedVideoUrl}
                className={`py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  savedVideoUrl
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {isSavingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    저장 중...
                  </>
                ) : savedVideoUrl ? (
                  <>
                    <Check className="w-4 h-4" />
                    저장 완료
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    프로젝트에 저장
                  </>
                )}
              </button>

              {/* 다운로드 */}
              <button
                onClick={handleDownloadVideo}
                className="py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                다운로드
              </button>
            </div>

            {/* 하단 버튼들 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                편집하기
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                새 영상 만들기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Video6PanelV2;
