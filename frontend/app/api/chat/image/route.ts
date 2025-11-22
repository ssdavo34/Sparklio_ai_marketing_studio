/**
 * Image Generation API Route
 *
 * Multi-provider image generation for Canvas Studio AI Assistant
 * Supports: DALL-E, Stable Diffusion, ComfyUI
 *
 * @author C팀 (Frontend Team)
 * @version 3.2
 * @date 2025-11-22
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ============================================================================
// Image Generation Clients 초기화
// ============================================================================

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// ============================================================================
// Helper Functions
// ============================================================================

async function generateWithDALLE(prompt: string, config: any) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await openai.images.generate({
    model: config.model || 'dall-e-3',
    prompt,
    size: config.size || '1024x1024',
    quality: config.quality || 'standard',
    n: 1,
  });

  return response.data[0]?.url || '';
}

async function generateWithStability(prompt: string, config: any) {
  if (!process.env.STABILITY_API_KEY) {
    throw new Error('Stability AI API key not configured');
  }

  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Stability AI error: ${response.statusText}`);
  }

  const data = await response.json();

  // Return base64 image as data URL
  return `data:image/png;base64,${data.artifacts[0].base64}`;
}

async function generateWithComfyUI(prompt: string, config: any) {
  const comfyUIEndpoint = process.env.COMFYUI_ENDPOINT || 'http://localhost:8188';

  // ComfyUI workflow - 간단한 text-to-image 워크플로우
  const workflow = {
    prompt: {
      '3': {
        inputs: {
          seed: Math.floor(Math.random() * 1000000),
          steps: 20,
          cfg: 8,
          sampler_name: 'euler',
          scheduler: 'normal',
          denoise: 1,
          model: ['4', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0],
        },
        class_type: 'KSampler',
      },
      '4': {
        inputs: {
          ckpt_name: 'sd_xl_base_1.0.safetensors',
        },
        class_type: 'CheckpointLoaderSimple',
      },
      '5': {
        inputs: {
          width: 1024,
          height: 1024,
          batch_size: 1,
        },
        class_type: 'EmptyLatentImage',
      },
      '6': {
        inputs: {
          text: prompt,
          clip: ['4', 1],
        },
        class_type: 'CLIPTextEncode',
      },
      '7': {
        inputs: {
          text: 'text, watermark',
          clip: ['4', 1],
        },
        class_type: 'CLIPTextEncode',
      },
      '8': {
        inputs: {
          samples: ['3', 0],
          vae: ['4', 2],
        },
        class_type: 'VAEDecode',
      },
      '9': {
        inputs: {
          filename_prefix: 'ComfyUI',
          images: ['8', 0],
        },
        class_type: 'SaveImage',
      },
    },
  };

  const response = await fetch(`${comfyUIEndpoint}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workflow),
  });

  if (!response.ok) {
    throw new Error(`ComfyUI error: ${response.statusText}`);
  }

  const data = await response.json();

  // ComfyUI returns a prompt_id, you'll need to poll for the result
  // For now, returning a placeholder
  return `${comfyUIEndpoint}/view?filename=${data.prompt_id}.png`;
}

function getMockImageUrl() {
  // Return a placeholder image
  return 'https://via.placeholder.com/1024x1024.png?text=Mock+Image+Generation';
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, provider = 'mock', config = {} } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let imageUrl: string;

    switch (provider) {
      case 'dalle':
        imageUrl = await generateWithDALLE(prompt, config);
        break;

      case 'stability':
        imageUrl = await generateWithStability(prompt, config);
        break;

      case 'comfyui':
        imageUrl = await generateWithComfyUI(prompt, config);
        break;

      case 'mock':
      default:
        imageUrl = getMockImageUrl();
        break;
    }

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    return NextResponse.json({
      imageUrl,
      message: `Image generated successfully using ${provider}`,
    });
  } catch (error: any) {
    console.error('Image Generation API Error:', error);

    // API 에러 처리
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
