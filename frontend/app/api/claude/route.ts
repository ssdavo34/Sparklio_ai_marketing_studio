/**
 * Claude API Proxy Route
 *
 * 프론트엔드에서 Claude 3.5 Sonnet을 사용하기 위한 프록시
 * - 이미지 프롬프트 생성
 * - 모션 프롬프트 생성
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Anthropic API 키 (환경변수에서 로드)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { system, messages, max_tokens = 2048 } = body;

    const client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // 모델 목록 (우선순위순)
    const models = [
      'claude-sonnet-4-20250514',      // Claude Sonnet 4 (최신)
      'claude-3-5-sonnet-20241022',    // Claude 3.5 Sonnet (구버전)
      'claude-3-haiku-20240307',       // Claude 3 Haiku (폴백)
    ];

    let response;
    let lastError;

    for (const model of models) {
      try {
        console.log(`[Claude Proxy] Trying model: ${model}`);
        response = await client.messages.create({
          model,
          max_tokens,
          system: system || '',
          messages: messages || [],
        });
        console.log(`[Claude Proxy] Success with model: ${model}`);
        break;
      } catch (err) {
        console.warn(`[Claude Proxy] Model ${model} failed:`, err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error('All models failed');
    }

    // 텍스트 응답 추출
    const textContent = response.content.find(c => c.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    return NextResponse.json({
      response: responseText,
      usage: response.usage,
    });
  } catch (error) {
    console.error('[Claude Proxy] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
