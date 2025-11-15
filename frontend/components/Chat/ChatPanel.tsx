'use client';

import { useChatStore } from '@/store/chat-store';
import { useEditorStore } from '@/store/editor-store';
import { generateDocument } from '@/lib/api-client';

/**
 * ChatPanel 컴포넌트
 *
 * 좌측 패널의 Chat UI를 담당합니다.
 * - 메시지 리스트
 * - 입력창
 * - Generator 호출
 */
export default function ChatPanel() {
  const { messages, inputText, isGenerating, addMessage, setInputText, setIsGenerating } =
    useChatStore();
  const { setCurrentDocument } = useEditorStore();

  const handleSubmit = async () => {
    if (!inputText.trim() || isGenerating) {
      return;
    }

    // 사용자 메시지 추가
    addMessage({
      role: 'user',
      content: inputText,
    });

    const userInput = inputText;
    setInputText('');
    setIsGenerating(true);

    try {
      // 키워드 기반 Generator 종류 감지
      const lowerInput = userInput.toLowerCase();
      let kind: 'product_detail' | 'sns' | 'brand_kit' = 'product_detail';
      let generatorInput: any;
      let successMessage = '';

      if (lowerInput.includes('sns') || lowerInput.includes('인스타') || lowerInput.includes('소셜')) {
        kind = 'sns';
        generatorInput = {
          campaign: {
            name: userInput.replace(/(sns|인스타|소셜)/gi, '').trim(),
            theme: 'modern',
            target_platform: 'instagram',
          },
        };
        successMessage = `"${userInput}" SNS 포스트가 생성되었습니다!`;
      } else if (lowerInput.includes('브랜드') || lowerInput.includes('brand kit')) {
        kind = 'brand_kit';
        generatorInput = {
          brand: {
            name: userInput.replace(/(브랜드|brand kit)/gi, '').trim(),
            description: '브랜드 스타일 가이드',
          },
        };
        successMessage = `"${userInput}" 브랜드 킷이 생성되었습니다!`;
      } else {
        kind = 'product_detail';
        generatorInput = {
          product: {
            name: userInput,
            features: ['고품질', '혁신적인 디자인'],
            target_audience: '20-40대',
          },
        };
        successMessage = `"${userInput}" 상세페이지 초안이 생성되었습니다!`;
      }

      // Generator API 호출
      const result = await generateDocument({
        kind,
        brandId: 'brand_001',
        locale: 'ko-KR',
        input: generatorInput,
      });

      // Editor Store에 문서 로딩
      setCurrentDocument(result.editorDocument);

      // 성공 메시지
      addMessage({
        role: 'assistant',
        content: `${successMessage}\n\n우측 캔버스에서 확인하고 수정할 수 있습니다.`,
      });
      setIsGenerating(false);
    } catch (error) {
      // 에러 메시지
      console.error('Generator API 에러:', error);
      addMessage({
        role: 'assistant',
        content: `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\nBackend API가 실행 중인지 확인해주세요.`,
      });
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Chat</h2>
        <p className="text-xs text-gray-500">AI와 대화로 콘텐츠 생성</p>
      </div>

      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.role === 'user'
                ? 'bg-blue-50 border-blue-100'
                : 'bg-gray-50 border-gray-100'
            } border rounded-lg p-3`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">
                {message.role === 'user' ? '👤' : '🤖'}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {message.content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div className="flex-1">
                <p className="text-sm text-gray-900">생성 중...</p>
                <div className="flex gap-1 mt-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 입력창 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="무엇을 만들까요?"
            disabled={isGenerating}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
