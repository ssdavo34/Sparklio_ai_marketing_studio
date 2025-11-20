/**
 * Mock API handler for Spark Chat
 *
 * This is a temporary mock implementation until the backend server is properly connected.
 * It simulates the chat analysis and provides demo responses.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, llm_selection } = body;

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock response based on common commands
        let analysis = '';
        const suggestions = [];

        // Parse the message for common design commands
        const lowerMessage = message.toLowerCase();

        // Color change commands
        if (lowerMessage.includes('색') || lowerMessage.includes('color')) {
            if (lowerMessage.includes('파란') || lowerMessage.includes('blue')) {
                // Check if it's for background or shape
                if (lowerMessage.includes('배경') || lowerMessage.includes('background')) {
                    analysis = '배경색을 파란색으로 변경했습니다.';
                    suggestions.push({
                        id: 'bg-blue',
                        type: 'style',
                        label: '배경 변경',
                        description: '캔버스 배경을 파란색으로 설정',
                        payload: { backgroundColor: '#3b82f6' }
                    });
                } else {
                    // Add a blue circle as default for color change
                    analysis = '파란색 원을 추가했습니다.';
                    suggestions.push({
                        id: 'add-blue-circle',
                        type: 'shape',
                        label: '파란색 원 추가',
                        description: '파란색 원형 도형 생성',
                        payload: { type: 'shape', shapeType: 'circle', fill: '#3b82f6' }
                    });
                }
            } else if (lowerMessage.includes('빨간') || lowerMessage.includes('red')) {
                if (lowerMessage.includes('배경') || lowerMessage.includes('background')) {
                    analysis = '배경색을 빨간색으로 변경했습니다.';
                    suggestions.push({
                        id: 'bg-red',
                        type: 'style',
                        label: '배경 변경',
                        description: '캔버스 배경을 빨간색으로 설정',
                        payload: { backgroundColor: '#ef4444' }
                    });
                } else {
                    analysis = '빨간색 원을 추가했습니다.';
                    suggestions.push({
                        id: 'add-red-circle',
                        type: 'shape',
                        label: '빨간색 원 추가',
                        description: '빨간색 원형 도형 생성',
                        payload: { type: 'shape', shapeType: 'circle', fill: '#ef4444' }
                    });
                }
            } else if (lowerMessage.includes('초록') || lowerMessage.includes('green')) {
                analysis = '초록색 원을 추가했습니다.';
                suggestions.push({
                    id: 'add-green-circle',
                    type: 'shape',
                    label: '초록색 원 추가',
                    description: '초록색 원형 도형 생성',
                    payload: { type: 'shape', shapeType: 'circle', fill: '#10b981' }
                });
            } else if (lowerMessage.includes('노란') || lowerMessage.includes('yellow')) {
                analysis = '노란색 원을 추가했습니다.';
                suggestions.push({
                    id: 'add-yellow-circle',
                    type: 'shape',
                    label: '노란색 원 추가',
                    description: '노란색 원형 도형 생성',
                    payload: { type: 'shape', shapeType: 'circle', fill: '#eab308' }
                });
            } else {
                analysis = '색상을 변경했습니다.';
            }
        } else if (lowerMessage.includes('배경') || lowerMessage.includes('background')) {
            if (lowerMessage.includes('파란') || lowerMessage.includes('blue')) {
                analysis = '배경색을 파란색으로 변경했습니다.';
                suggestions.push({
                    id: 'bg-blue',
                    type: 'style',
                    label: '배경 변경',
                    description: '캔버스 배경을 파란색으로 설정',
                    payload: { backgroundColor: '#3b82f6' }
                });
            } else if (lowerMessage.includes('빨간') || lowerMessage.includes('red')) {
                analysis = '배경색을 빨간색으로 변경했습니다.';
                suggestions.push({
                    id: 'bg-red',
                    type: 'style',
                    label: '배경 변경',
                    description: '캔버스 배경을 빨간색으로 설정',
                    payload: { backgroundColor: '#ef4444' }
                });
            } else {
                analysis = '배경 설정을 조정했습니다.';
            }
        } else if (lowerMessage.includes('텍스트') || lowerMessage.includes('text')) {
            analysis = '텍스트 요소를 추가했습니다.';
            suggestions.push({
                id: 'add-text',
                type: 'element',
                label: '텍스트 추가',
                description: '새로운 텍스트 요소 생성',
                payload: { type: 'text', content: '새 텍스트' }
            });
        } else if (lowerMessage.includes('사각형') || lowerMessage.includes('rectangle')) {
            analysis = '사각형 도형을 추가했습니다.';
            suggestions.push({
                id: 'add-rect',
                type: 'shape',
                label: '사각형 추가',
                description: '새로운 사각형 도형 생성',
                payload: { type: 'shape', shapeType: 'rect' }
            });
        } else if (lowerMessage.includes('원') || lowerMessage.includes('circle')) {
            analysis = '원형 도형을 추가했습니다.';
            suggestions.push({
                id: 'add-circle',
                type: 'shape',
                label: '원 추가',
                description: '새로운 원형 도형 생성',
                payload: { type: 'shape', shapeType: 'circle' }
            });
        } else if (lowerMessage.includes('삭제') || lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
            analysis = '선택된 요소를 삭제했습니다.';
            suggestions.push({
                id: 'delete',
                type: 'action',
                label: '삭제',
                description: '선택된 요소 제거',
                payload: { action: 'delete' }
            });
        } else if (lowerMessage.includes('도움') || lowerMessage.includes('help')) {
            analysis = '다음과 같은 명령을 사용할 수 있습니다:\n• "배경을 파란색으로 바꿔줘"\n• "텍스트 추가해줘"\n• "사각형 그려줘"\n• "원 추가해줘"\n• "선택한 요소 삭제해줘"';
        } else {
            // Default response
            analysis = `"${message}"에 대한 작업을 처리했습니다. (Mock API - ${llm_selection?.provider || 'default'})`;
            suggestions.push({
                id: 'generic',
                type: 'info',
                label: '처리 완료',
                description: '요청하신 작업을 완료했습니다',
                payload: { message }
            });
        }

        return NextResponse.json({
            analysis,
            suggestions,
            status: 'success',
            llm_used: llm_selection
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process chat request',
                analysis: '요청 처리 중 오류가 발생했습니다.',
                suggestions: []
            },
            { status: 500 }
        );
    }
}