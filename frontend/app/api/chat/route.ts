/**
 * Chat API Route
 *
 * OpenAI GPT-4 integration for Canvas Studio AI Assistant
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 * @date 2025-11-22
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // OpenAI API 키가 없으면 목업 응답 반환 (개발/테스트용)
    if (!openai) {
      return NextResponse.json({
        message: 'This is a mock response. Please add your OPENAI_API_KEY to .env.local to use the real AI assistant.\n\nFor testing purposes, I can help you with:\n- Design suggestions\n- Layout advice\n- Color recommendations\n- Typography tips',
      });
    }

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for Canvas Studio, a design and marketing content creation platform powered by Polotno.

Your role is to:
- Help users with canvas design tasks
- Provide creative suggestions for marketing materials
- Assist with layout and composition advice
- Answer questions about design principles
- Help with text, colors, and visual elements

Be concise, helpful, and creative. Focus on practical advice that can be immediately applied to their design work.`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseMessage = completion.choices[0]?.message?.content;

    if (!responseMessage) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({
      message: responseMessage,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);

    // OpenAI API 에러 처리
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
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
