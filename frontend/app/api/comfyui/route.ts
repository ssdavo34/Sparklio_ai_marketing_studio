/**
 * ComfyUI Proxy API Route
 *
 * 브라우저 CORS 제한을 우회하기 위한 프록시
 * 프론트엔드 → Next.js API Route → ComfyUI 서버
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

import { NextRequest, NextResponse } from 'next/server';

const COMFYUI_URL = process.env.COMFYUI_URL || 'http://100.120.180.42:8188';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'system_stats';
  const promptId = searchParams.get('prompt_id');

  try {
    let url = `${COMFYUI_URL}/${endpoint}`;
    if (promptId) {
      url = `${COMFYUI_URL}/history/${promptId}`;
    }

    // view 엔드포인트 (이미지 가져오기)
    if (endpoint === 'view') {
      const filename = searchParams.get('filename');
      const subfolder = searchParams.get('subfolder') || '';
      const type = searchParams.get('type') || 'output';
      url = `${COMFYUI_URL}/view?filename=${filename}&subfolder=${subfolder}&type=${type}`;

      const response = await fetch(url);
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
      }

      const imageBuffer = await response.arrayBuffer();
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `ComfyUI error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[ComfyUI Proxy] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${COMFYUI_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `ComfyUI error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[ComfyUI Proxy] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
