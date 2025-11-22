/**
 * Chat API Route
 *
 * Multi-LLM integration for Canvas Studio AI Assistant
 * Supports: OpenAI GPT, Anthropic Claude, Google Gemini
 *
 * @author C팀 (Frontend Team)
 * @version 3.2
 * @date 2025-11-22
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// LLM Clients 초기화
// ============================================================================

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null;

const googleAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are a helpful AI assistant for Canvas Studio, a design and marketing content creation platform powered by Polotno.

Your role is to:
- Help users with canvas design tasks
- Provide creative suggestions for marketing materials
- Assist with layout and composition advice
- Answer questions about design principles
- Help with text, colors, and visual elements

Be concise, helpful, and creative. Focus on practical advice that can be immediately applied to their design work.`;

// ============================================================================
// Helper Functions
// ============================================================================

async function callOpenAI(messages: any[], config: any) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const completion = await openai.chat.completions.create({
    model: config.model || 'gpt-4',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: config.temperature || 0.7,
    max_tokens: config.maxTokens || 500,
  });

  return completion.choices[0]?.message?.content || '';
}

async function callAnthropic(messages: any[], config: any) {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await anthropic.messages.create({
    model: config.model || 'claude-3-sonnet-20240229',
    max_tokens: config.maxTokens || 500,
    system: SYSTEM_PROMPT,
    messages: messages.map((m: any) => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    })),
  });

  return response.content[0]?.type === 'text' ? response.content[0].text : '';
}

async function callGemini(messages: any[], config: any) {
  if (!googleAI) {
    throw new Error('Google AI API key not configured');
  }

  const model = googleAI.getGenerativeModel({
    model: config.model || 'gemini-pro',
  });

  // Convert messages to Gemini format
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood. I\'m ready to assist with Canvas Studio design tasks.' }] },
      ...messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    ],
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

function getMockResponse() {
  return `This is a mock response. To use a real AI assistant, please configure an API key in .env.local:

Available providers:
- OpenAI (GPT-4): OPENAI_API_KEY
- Anthropic (Claude): ANTHROPIC_API_KEY
- Google (Gemini): GOOGLE_AI_API_KEY

For testing purposes, I can help you with:
- Design suggestions
- Layout advice
- Color recommendations
- Typography tips`;
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider = 'mock', config = {} } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    let responseMessage: string;

    switch (provider) {
      case 'openai':
        responseMessage = await callOpenAI(messages, config);
        break;

      case 'anthropic':
        responseMessage = await callAnthropic(messages, config);
        break;

      case 'gemini':
        responseMessage = await callGemini(messages, config);
        break;

      case 'mock':
      default:
        responseMessage = getMockResponse();
        break;
    }

    if (!responseMessage) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({
      message: responseMessage,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);

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
