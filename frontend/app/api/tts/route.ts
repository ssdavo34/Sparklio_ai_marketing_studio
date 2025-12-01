/**
 * TTS API Proxy Route (Edge TTS)
 *
 * Backend EdgeTTS Provider를 호출하여 음성 생성
 * POST /api/tts
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://100.123.51.5:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = 'ko-KR-SunHiNeural', rate = '+0%' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log('[TTS Proxy] Generating speech:', { textLength: text.length, voice });

    // Backend의 Media Gateway를 통해 EdgeTTS 호출
    const response = await fetch(`${BACKEND_URL}/api/v1/media/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: text,
        task: 'tts',
        media_type: 'audio',
        options: {
          provider: 'edge-tts',
          voice,
          rate,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS Proxy] Backend error:', errorText);
      return NextResponse.json(
        { error: `TTS generation failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Base64 오디오 데이터 반환
    if (data.outputs && data.outputs[0]) {
      return NextResponse.json({
        audio_base64: data.outputs[0].data,
        format: data.outputs[0].format || 'mp3',
        voice,
      });
    }

    return NextResponse.json(
      { error: 'No audio output received' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[TTS Proxy] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
