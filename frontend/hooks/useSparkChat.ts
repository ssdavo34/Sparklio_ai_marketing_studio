import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface SuggestedSection {
    role: string;
    suggestion: string;
}

export interface ChatAnalysisResult {
    chatSessionId: string;
    contentType: string;
    suggestedStructure: SuggestedSection[];
}

export const useSparkChat = () => {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '안녕하세요! 어떤 마케팅 콘텐츠를 만들고 싶으신가요? (예: 나이키 에어맥스 인스타그램 광고 만들어줘)',
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ChatAnalysisResult | null>(null);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Mock API call for analysis
            const response = await fetch('/api/v1/chat/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze chat');
            }

            const data: ChatAnalysisResult = await response.json();
            setAnalysisResult(data);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `네, 알겠습니다. "${data.contentType}" 형식으로 초안을 만들어드릴까요?\n\n제안된 구조:\n${data.suggestedStructure
                    .map((s) => `- ${s.role}: ${s.suggestion}`)
                    .join('\n')}`,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createDraft = useCallback(async () => {
        if (!analysisResult) return;

        setIsLoading(true);
        try {
            // Mock API call for document generation
            const response = await fetch('/api/v1/chat/generate-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatSessionId: analysisResult.chatSessionId }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate document');
            }

            const data = await response.json();

            // Redirect to editor
            router.push(`/studio?docId=${data.documentId}`);
        } catch (error) {
            console.error('Generation error:', error);
            alert('문서 생성 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [analysisResult, router]);

    return {
        messages,
        isLoading,
        analysisResult,
        sendMessage,
        createDraft,
    };
};
