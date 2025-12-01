/**
 * Image Generation API Client
 *
 * 이미지 생성:
 * - ComfyUI (GPU 서버 100.120.180.42)
 * - NanoBanana (백엔드 Mac mini)
 *
 * 프롬프트 생성:
 * - Claude 3.5 Sonnet (고품질 프롬프트)
 * - Ollama llama3.2 (폴백)
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-01
 */

// ============================================================================
// Configuration
// ============================================================================

// 프록시 URL
const COMFYUI_PROXY_URL = '/api/comfyui';
const OLLAMA_PROXY_URL = '/api/ollama';
const CLAUDE_PROXY_URL = '/api/claude';

// 백엔드 API (Mac mini)
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';

// 이미지 생성 모델 타입
export type ImageGenerationModel = 'comfyui' | 'nanobanana';

// 프롬프트 생성 LLM 타입
export type PromptLLMModel = 'claude' | 'ollama';

// ============================================================================
// Types
// ============================================================================

export interface ComfyUIGenerateRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
}

export interface ComfyUIGenerateResponse {
  image_url: string;
  seed: number;
  prompt_id: string;
}

// ============================================================================
// Simple Text-to-Image Workflow
// ============================================================================

/**
 * 기본 텍스트-투-이미지 워크플로우 생성
 */
function createSimpleWorkflow(request: ComfyUIGenerateRequest): object {
  const {
    prompt,
    negative_prompt = 'blurry, low quality, distorted, ugly, bad anatomy',
    width = 1024,
    height = 576, // 16:9 비율
    steps = 8, // Lightning 모델은 4-8 스텝으로 충분
    cfg_scale = 2, // Lightning 모델은 낮은 CFG 권장
    seed = Math.floor(Math.random() * 1000000000),
  } = request;

  return {
    "3": {
      "class_type": "KSampler",
      "inputs": {
        "cfg": cfg_scale,
        "denoise": 1,
        "latent_image": ["5", 0],
        "model": ["4", 0],
        "negative": ["7", 0],
        "positive": ["6", 0],
        "sampler_name": "euler",
        "scheduler": "normal",
        "seed": seed,
        "steps": steps
      }
    },
    "4": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        // GPU 서버에 설치된 모델 사용 (realvisxlV50 - Lightning 모델로 빠른 생성)
        "ckpt_name": "realvisxlV50_v50LightningBakedvae.safetensors"
      }
    },
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "batch_size": 1,
        "height": height,
        "width": width
      }
    },
    "6": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["4", 1],
        "text": prompt
      }
    },
    "7": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["4", 1],
        "text": negative_prompt
      }
    },
    "8": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      }
    },
    "9": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": "video6",
        "images": ["8", 0]
      }
    }
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * ComfyUI에 이미지 생성 요청 (프록시 사용)
 */
export async function generateImageWithComfyUI(
  request: ComfyUIGenerateRequest
): Promise<ComfyUIGenerateResponse> {
  console.log('[ComfyUI] Generating image:', request.prompt.substring(0, 50) + '...');

  const workflow = createSimpleWorkflow(request);

  // 1. Queue prompt (프록시 사용)
  const queueResponse = await fetch(COMFYUI_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: workflow,
    }),
  });

  if (!queueResponse.ok) {
    const errorData = await queueResponse.json().catch(() => ({}));
    throw new Error(`ComfyUI queue failed: ${errorData.error || queueResponse.statusText}`);
  }

  const queueData = await queueResponse.json();
  const promptId = queueData.prompt_id;

  console.log('[ComfyUI] Queued prompt:', promptId);

  // 2. Poll for completion (프록시 사용)
  const imageUrl = await pollForCompletion(promptId);

  return {
    image_url: imageUrl,
    seed: request.seed || 0,
    prompt_id: promptId,
  };
}

/**
 * 생성 완료까지 폴링 (프록시 사용)
 */
async function pollForCompletion(promptId: string, timeout = 120000): Promise<string> {
  const startTime = Date.now();
  const pollInterval = 1000;

  while (Date.now() - startTime < timeout) {
    // 프록시를 통해 history 조회
    const historyResponse = await fetch(`${COMFYUI_PROXY_URL}?prompt_id=${promptId}`);

    if (historyResponse.ok) {
      const history = await historyResponse.json();

      if (history[promptId]) {
        const outputs = history[promptId].outputs;

        // SaveImage 노드 출력 찾기
        for (const nodeId of Object.keys(outputs)) {
          const nodeOutput = outputs[nodeId];
          if (nodeOutput.images && nodeOutput.images.length > 0) {
            const image = nodeOutput.images[0];
            // 프록시를 통해 이미지 URL 생성
            const imageUrl = `${COMFYUI_PROXY_URL}?endpoint=view&filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder || '')}&type=${image.type || 'output'}`;
            console.log('[ComfyUI] Image ready (proxy):', imageUrl);
            return imageUrl;
          }
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('ComfyUI generation timeout');
}

/**
 * 여러 이미지 일괄 생성
 */
export async function generateImagesForScenes(
  scenes: Array<{ prompt: string; index: number }>,
  onProgress?: (completed: number, total: number) => void
): Promise<Array<{ index: number; image_url: string }>> {
  const results: Array<{ index: number; image_url: string }> = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    try {
      const response = await generateImageWithComfyUI({
        prompt: scene.prompt,
        width: 1024,
        height: 576,
        steps: 20,
      });

      results.push({
        index: scene.index,
        image_url: response.image_url,
      });

      if (onProgress) {
        onProgress(i + 1, scenes.length);
      }
    } catch (error) {
      console.error(`[ComfyUI] Failed to generate image for scene ${scene.index}:`, error);
      // 실패 시 placeholder 반환
      results.push({
        index: scene.index,
        image_url: `https://placehold.co/1024x576/red/white?text=Error+Scene+${scene.index + 1}`,
      });
    }
  }

  return results;
}

/**
 * ComfyUI 서버 상태 확인 (프록시 사용)
 */
export async function checkComfyUIStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${COMFYUI_PROXY_URL}?endpoint=system_stats`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Ollama API for Script Enhancement (프록시 사용)
// ============================================================================

export interface SceneScript {
  scene_index: number;
  caption: string;
  script?: string;
  duration_sec?: number;
}

export interface EnhancedScene extends SceneScript {
  image_prompt: string;  // ComfyUI용 상세 이미지 프롬프트
}

/**
 * Ollama를 사용해서 씬별 image_prompt 생성
 *
 * @param topic - 비디오 주제 (예: "건성 피부용 전정토너 런칭 이벤트")
 * @param scenes - 기존 씬 스크립트 배열
 * @returns 각 씬에 image_prompt가 추가된 배열
 */
export async function enhanceScriptsWithImagePrompts(
  topic: string,
  scenes: SceneScript[]
): Promise<EnhancedScene[]> {
  console.log('[Ollama] Enhancing scripts with image prompts for topic:', topic);

  const systemPrompt = `You create Stable Diffusion image prompts. Output ONLY a JSON array.

Rules:
1. Korean: 립스틱=lipstick, 토너=toner, 신발=shoes, 화장품=cosmetics
2. Convert abstract slogans to concrete visual descriptions
3. Include: subject, product, setting, lighting, style
4. NEVER include text, words, letters, logos, or brand names in prompts
5. Be specific: "young woman applying red lipstick, close-up beauty shot" not "person with makeup"
6. Add "no text, no words, no letters" at end of each prompt

OUTPUT ONLY:
[{"scene_index":0,"image_prompt":"..."},{"scene_index":1,"image_prompt":"..."}]`;

  const userPrompt = `Topic: "${topic}"
Scenes:
${scenes.map((s, i) => `${i}: "${s.caption || s.script || 'marketing scene'}"`).join('\n')}

Create ${scenes.length} image prompts. Output JSON array ONLY:`;

  try {
    // 프록시를 통해 Ollama 호출
    const response = await fetch(OLLAMA_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Ollama API failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.response || '';

    console.log('[Ollama] Raw response:', responseText);

    // JSON 파싱 시도 (여러 방법으로)
    let parsedPrompts: Array<{ scene_index: number; image_prompt: string }> = [];

    // 방법 1: 직접 JSON 파싱 시도
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedPrompts = JSON.parse(jsonMatch[0]);
        console.log('[Ollama] Method 1 - Direct JSON parse:', parsedPrompts.length, 'items');
      }
    } catch (e) {
      console.log('[Ollama] Method 1 failed, trying method 2...');
    }

    // 방법 2: scene_index와 image_prompt 쌍 추출 (따옴표 내 특수문자 허용)
    if (parsedPrompts.length === 0) {
      // "scene_index": N, "image_prompt": "..." 패턴 찾기
      const regex = /"scene_index"\s*:\s*(\d+)\s*,\s*"image_prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      let match;
      while ((match = regex.exec(responseText)) !== null) {
        parsedPrompts.push({
          scene_index: parseInt(match[1], 10),
          image_prompt: match[2].replace(/\\"/g, '"').replace(/\\n/g, ' '),
        });
      }
      if (parsedPrompts.length > 0) {
        console.log('[Ollama] Method 2 - Regex extraction:', parsedPrompts.length, 'items');
      }
    }

    // 방법 3: image_prompt만 추출 (순서대로)
    if (parsedPrompts.length === 0) {
      const promptRegex = /"image_prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      let match;
      let idx = 0;
      while ((match = promptRegex.exec(responseText)) !== null) {
        parsedPrompts.push({
          scene_index: idx++,
          image_prompt: match[1].replace(/\\"/g, '"').replace(/\\n/g, ' '),
        });
      }
      if (parsedPrompts.length > 0) {
        console.log('[Ollama] Method 3 - Prompt only extraction:', parsedPrompts.length, 'items');
      }
    }

    // 방법 4: 한국어 포함 패턴 (}no text 앞까지 추출)
    if (parsedPrompts.length === 0) {
      const koRegex = /"scene_index"\s*:\s*(\d+)[^}]*"image_prompt"\s*:\s*"([^"]*(?:no text[^"]*)?)/g;
      let match;
      while ((match = koRegex.exec(responseText)) !== null) {
        let prompt = match[2];
        // 불완전한 끝 제거
        if (!prompt.endsWith('"')) {
          prompt = prompt.replace(/[^a-z]*$/, '');
        }
        parsedPrompts.push({
          scene_index: parseInt(match[1], 10),
          image_prompt: prompt,
        });
      }
      if (parsedPrompts.length > 0) {
        console.log('[Ollama] Method 4 - Korean pattern extraction:', parsedPrompts.length, 'items');
      }
    }

    // 방법 5: 번호 매긴 텍스트 형식 (1. "prompt text" 또는 1: "prompt text")
    // Ollama가 JSON 대신 자연어로 응답할 때 사용
    if (parsedPrompts.length === 0) {
      // 패턴: 숫자. "텍스트" 또는 숫자: "텍스트"
      const numberedRegex = /(\d+)[.:]\s*["""]([^"""]+)["""]/g;
      let match;
      while ((match = numberedRegex.exec(responseText)) !== null) {
        const idx = parseInt(match[1], 10) - 1; // 1-based to 0-based
        const prompt = match[2].trim();
        if (prompt.length > 20) { // 의미있는 프롬프트만
          parsedPrompts.push({
            scene_index: idx >= 0 ? idx : parsedPrompts.length,
            image_prompt: prompt + ', no text, no words, no letters',
          });
        }
      }
      if (parsedPrompts.length > 0) {
        console.log('[Ollama] Method 5 - Numbered text extraction:', parsedPrompts.length, 'items');
      }
    }

    // 방법 6: 문장 단위 추출 (Scene/장면 키워드로 분리)
    if (parsedPrompts.length === 0) {
      // "Scene 1:" 또는 번호만 있는 경우도 처리
      const paragraphs = responseText.split(/\n\n+|\n(?=\d+[.:])/);
      let idx = 0;
      for (const para of paragraphs) {
        // 실질적인 프롬프트 내용 추출 (최소 30자 이상)
        const cleanPara = para.replace(/^[\d.:\s]+/, '').trim();
        if (cleanPara.length >= 30 && !cleanPara.startsWith('Here') && !cleanPara.startsWith('Output')) {
          parsedPrompts.push({
            scene_index: idx++,
            image_prompt: cleanPara.replace(/["""]/g, '') + ', no text, no words',
          });
        }
      }
      if (parsedPrompts.length > 0) {
        console.log('[Ollama] Method 6 - Paragraph extraction:', parsedPrompts.length, 'items');
      }
    }

    // 모든 방법 실패 시 fallback
    if (parsedPrompts.length === 0) {
      console.error('[Ollama] All parsing methods failed');
      console.error('[Ollama] Response was:', responseText.substring(0, 800));
      parsedPrompts = scenes.map((s, i) => ({
        scene_index: i,
        image_prompt: `${topic}, ${s.caption || s.script || 'marketing scene'}, professional product photography, high quality, cinematic lighting`,
      }));
    }

    console.log('[Ollama] Final parsed prompts:', parsedPrompts.map(p => ({ idx: p.scene_index, prompt: p.image_prompt.substring(0, 40) + '...' })));

    // 원본 씬과 병합
    return scenes.map((scene, index) => {
      const enhancedData = parsedPrompts.find(p => p.scene_index === index);
      return {
        ...scene,
        image_prompt: enhancedData?.image_prompt ||
          `${topic}, ${scene.caption || scene.script || 'marketing scene'}, professional product photography, high quality`,
      };
    });
  } catch (error) {
    console.error('[Ollama] Enhancement failed:', error);
    // 에러 시 기본 프롬프트 사용
    return scenes.map(scene => ({
      ...scene,
      image_prompt: `${topic}, ${scene.caption || scene.script || 'marketing scene'}, professional product photography, high quality, cinematic lighting`,
    }));
  }
}

/**
 * Ollama 서버 상태 확인 (프록시 사용)
 */
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_PROXY_URL}?endpoint=tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Claude 3.5 Sonnet API for High-Quality Prompt Generation
// ============================================================================

/**
 * Claude 3.5 Sonnet을 사용해서 고품질 image_prompt 생성
 *
 * @param topic - 비디오 주제
 * @param scenes - 씬 스크립트 배열
 * @returns 각 씬에 image_prompt가 추가된 배열
 */
export async function enhanceScriptsWithClaude(
  topic: string,
  scenes: SceneScript[]
): Promise<EnhancedScene[]> {
  console.log('[Claude] Enhancing scripts with image prompts for topic:', topic);
  console.log('[Claude] Total scenes to process:', scenes.length);

  const systemPrompt = `You are an expert visual director and scriptwriter for marketing videos. Your task is to:
1. Convert abstract Korean marketing slogans into detailed image prompts for Stable Diffusion XL
2. Write compelling Korean narration scripts for each scene (2-3 sentences each)

CRITICAL RULES FOR IMAGE PROMPTS:
1. NEVER include ANY text, words, letters, numbers, logos, watermarks, or typography
2. Always add "no text, no words, no letters, no watermark" at the end of EVERY prompt
3. Be extremely specific and visual - describe exact poses, lighting, camera angles, colors
4. Include the actual product in every scene

RULES FOR NARRATION (script_ko):
1. Write in natural, conversational Korean
2. Each narration should be 2-3 sentences (15-30 Korean characters per sentence)
3. Create a compelling story arc across all scenes
4. Include product benefits and emotional appeal
5. Make it suitable for voice-over (TTS)

Korean Product Types:
- 립스틱 = lipstick, 화장품 = cosmetics, 스마트폰 = smartphone, 카메라 = camera, 신발 = shoes

Output Format: Return ONLY a valid JSON array:
[{"scene_index": 0, "image_prompt": "...", "script_ko": "한국어 나레이션..."}, ...]`;

  const userPrompt = `Topic: "${topic}"

Convert these ${scenes.length} marketing slogans into image prompts AND Korean narration scripts:
${scenes.map((s, i) => `Scene ${i}: "${s.caption || s.script || 'marketing scene'}"`).join('\n')}

YOU MUST CREATE EXACTLY ${scenes.length} ITEMS (scene_index 0 through ${scenes.length - 1}).

For each scene provide:
1. image_prompt (40-60 English words): detailed visual description ending with "no text, no words, no letters, no watermark"
2. script_ko (2-3 Korean sentences): compelling narration for voice-over that tells a story

Example format:
{"scene_index": 0, "image_prompt": "Professional product shot..., no text, no words, no letters, no watermark", "script_ko": "완벽한 디자인이 일상을 특별하게 만듭니다. 손끝에서 느껴지는 프리미엄의 가치를 경험해보세요."}

Output a JSON array with exactly ${scenes.length} objects:`;

  try {
    const response = await fetch(CLAUDE_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 8192, // 더 많은 토큰으로 모든 씬 처리
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Claude] API error:', errorData);
      // Claude 실패 시 Ollama로 폴백
      console.log('[Claude] Falling back to Ollama...');
      return enhanceScriptsWithImagePrompts(topic, scenes);
    }

    const data = await response.json();
    const responseText = data.response || '';

    console.log('[Claude] Raw response length:', responseText.length);
    console.log('[Claude] Raw response preview:', responseText.substring(0, 800));

    // JSON 파싱
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsedPrompts = JSON.parse(jsonMatch[0]) as Array<{
        scene_index: number;
        image_prompt: string;
        script_ko?: string;
      }>;
      console.log('[Claude] Parsed', parsedPrompts.length, 'prompts out of', scenes.length, 'scenes');

      // 디버깅: 각 파싱된 scene_index 출력
      console.log('[Claude] Parsed scene indices:', parsedPrompts.map(p => p.scene_index));

      return scenes.map((scene, index) => {
        // 방법 1: scene_index로 찾기
        let enhanced = parsedPrompts.find(p => p.scene_index === index);

        // 방법 2: scene_index가 1부터 시작하는 경우
        if (!enhanced) {
          enhanced = parsedPrompts.find(p => p.scene_index === index + 1);
        }

        // 방법 3: 배열 인덱스로 폴백 (scene_index 무시)
        if (!enhanced && parsedPrompts[index]) {
          enhanced = parsedPrompts[index];
          console.log(`[Claude] Scene ${index}: Using array index fallback`);
        }

        if (enhanced?.image_prompt) {
          console.log(`[Claude] Scene ${index}: Got prompt (${enhanced.image_prompt.substring(0, 50)}...)`);
          console.log(`[Claude] Scene ${index}: Got script_ko: ${enhanced.script_ko?.substring(0, 30) || 'none'}`);
          return {
            ...scene,
            image_prompt: enhanced.image_prompt,
            script: enhanced.script_ko || scene.script || scene.caption, // 나레이션 스크립트 저장
          };
        } else {
          console.warn(`[Claude] Scene ${index}: No prompt found, using fallback`);
          return {
            ...scene,
            image_prompt: `${topic} marketing photo, professional product photography, high quality, cinematic lighting, no text, no words, no watermark`,
          };
        }
      });
    }

    throw new Error('No valid JSON in Claude response');
  } catch (error) {
    console.error('[Claude] Enhancement failed:', error);
    // 에러 시 Ollama로 폴백
    console.log('[Claude] Falling back to Ollama...');
    return enhanceScriptsWithImagePrompts(topic, scenes);
  }
}

// ============================================================================
// NanoBanana Image Generation (Backend API)
// ============================================================================

export interface NanoBananaRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
}

export interface NanoBananaResponse {
  image_url: string;
  seed?: number;
}

/**
 * NanoBanana를 사용한 이미지 생성 (Media Gateway 경유)
 *
 * 2025-12-01 변경: /api/v1/nano-banana → /api/v1/media/generate
 * Media Gateway에서 provider: 'nano-banana' 지정
 */
export async function generateImageWithNanoBanana(
  request: NanoBananaRequest
): Promise<NanoBananaResponse> {
  console.log('[NanoBanana] Generating image via Media Gateway:', request.prompt.substring(0, 50) + '...');

  // Media Gateway를 통해 NanoBanana 호출
  const response = await fetch(`${BACKEND_API_URL}/api/v1/media/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: request.prompt,
      task: 'product_image',
      media_type: 'image',
      options: {
        provider: 'nano-banana',
        negative_prompt: request.negative_prompt || 'blurry, low quality, distorted, ugly, text, watermark, words, letters',
        width: request.width || 1024,
        height: request.height || 576,
        steps: request.num_inference_steps || 20,
        guidance_scale: request.guidance_scale || 7.5,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`NanoBanana failed: ${errorData.detail || response.statusText}`);
  }

  const data = await response.json();

  // Media Gateway 응답에서 이미지 URL 추출
  let imageUrl = '';
  if (data.outputs && data.outputs.length > 0) {
    const output = data.outputs[0];
    // URL이 있으면 사용, 없으면 base64 data URL 생성
    if (output.url) {
      imageUrl = output.url;
    } else if (output.data) {
      imageUrl = `data:image/${output.format || 'png'};base64,${output.data}`;
    }
  }

  // MinIO URL 변환
  if (imageUrl && imageUrl.includes('minio:9000')) {
    imageUrl = imageUrl.replace('minio:9000', '100.123.51.5:9000');
  }

  console.log('[NanoBanana] Image ready:', imageUrl.substring(0, 80));

  return {
    image_url: imageUrl,
    seed: data.meta?.seed,
  };
}

/**
 * NanoBanana 서버 상태 확인 (Media Gateway health 경유)
 *
 * 2025-12-01 변경: /api/v1/nano-banana/health → /api/v1/media/health
 */
export async function checkNanoBananaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/v1/media/health`, {
      method: 'GET',
    });
    if (!response.ok) return false;

    // Media Gateway 응답에서 nano-banana provider 상태 확인
    const data = await response.json();
    // providers 객체에서 nano-banana 키가 있으면 상태 확인
    if (data.providers && data.providers['nano-banana']) {
      return data.providers['nano-banana'].healthy === true;
    }
    // providers가 없으면 전체 healthy 체크
    return data.healthy === true;
  } catch {
    return false;
  }
}

// ============================================================================
// Unified Image Generation API
// ============================================================================

export interface UnifiedImageRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  model: ImageGenerationModel;
}

/**
 * 통합 이미지 생성 함수 - 모델에 따라 ComfyUI 또는 NanoBanana 사용
 */
export async function generateImage(
  request: UnifiedImageRequest
): Promise<{ image_url: string; model: ImageGenerationModel }> {
  if (request.model === 'nanobanana') {
    const result = await generateImageWithNanoBanana({
      prompt: request.prompt,
      negative_prompt: request.negative_prompt,
      width: request.width,
      height: request.height,
    });
    return { image_url: result.image_url, model: 'nanobanana' };
  } else {
    const result = await generateImageWithComfyUI({
      prompt: request.prompt,
      negative_prompt: request.negative_prompt,
      width: request.width,
      height: request.height,
    });
    return { image_url: result.image_url, model: 'comfyui' };
  }
}
