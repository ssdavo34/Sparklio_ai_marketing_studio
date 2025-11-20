import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLLMStore } from '@/store/llmStore';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface Suggestion {
    id: string;
    type: string;
    label: string;
    description: string;
    preview_image?: string;
    payload?: any;
}

export interface ChatAnalysisResult {
    analysis: string;
    suggestions: Suggestion[];
}

export const useSparkChat = () => {
    const router = useRouter();
    const llmSelection = useLLMStore((state) => state.selection);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '안녕하세요! Spark Editor입니다. 무엇을 도와드릴까요? (예: 배경을 파란색으로 바꿔줘)',
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
            // API call with LLM selection
            const response = await fetch('/api/v1/chat/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    llm_selection: llmSelection
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze chat');
            }

            const data: ChatAnalysisResult = await response.json();
            setAnalysisResult(data);

            // Backend returns 'analysis' (text) and 'suggestions' (commands)
            // We display the 'analysis' text or the description from the first suggestion
            const responseText = data.analysis ||
                (data.suggestions.length > 0 ? data.suggestions[0].description : "처리를 완료했습니다.");

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
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
    }, [llmSelection]);

    // createDraft is likely not needed for Editor Chat, but keeping it as placeholder or for future use
    const createDraft = useCallback(async () => {
        console.log("Create Draft clicked - Not implemented for Editor Chat yet");
        // Logic to apply commands or create a new doc could go here
    }, []);

    return {
        messages,
        isLoading,
        analysisResult,
        sendMessage,
        createDraft,
    };
};
