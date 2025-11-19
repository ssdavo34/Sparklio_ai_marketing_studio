import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface MeetingAnalysisResult {
    meetingId: string;
    transcript: Array<{
        speaker: string;
        text: string;
        timestamp: string;
    }>;
    summary: string;
    actionItems: string[];
}

export const useMeetingAI = () => {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<MeetingAnalysisResult | null>(null);

    const uploadFile = useCallback(async (file: File) => {
        setIsUploading(true);
        try {
            // Mock API call for upload
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/v1/meeting/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const data = await response.json();

            // Start analysis immediately after upload
            analyzeMeeting(data.meetingId);
        } catch (error) {
            console.error('Upload error:', error);
            alert('파일 업로드 중 오류가 발생했습니다.');
            setIsUploading(false);
        }
    }, []);

    const analyzeMeeting = useCallback(async (meetingId: string) => {
        setIsAnalyzing(true);
        setIsUploading(false); // Upload done, now analyzing

        try {
            // Mock API call for analysis
            const response = await fetch('/api/v1/meeting/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingId }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze meeting');
            }

            const data: MeetingAnalysisResult = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Analysis error:', error);
            alert('회의 분석 중 오류가 발생했습니다.');
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const createDocument = useCallback(async () => {
        if (!result) return;

        // Reuse the chat generation API or a specific meeting-to-doc API
        // For now, let's assume we pass the meeting summary to the chat generation flow
        // or a dedicated endpoint. We'll use a mock endpoint for now.
        try {
            const response = await fetch('/api/v1/chat/generate-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatSessionId: result.meetingId, // Using meetingId as session ID for now
                    context: 'meeting',
                    summary: result.summary
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate document');
            }

            const data = await response.json();
            router.push(`/studio?docId=${data.documentId}`);
        } catch (error) {
            console.error('Generation error:', error);
            alert('문서 생성 중 오류가 발생했습니다.');
        }
    }, [result, router]);

    return {
        isUploading,
        isAnalyzing,
        result,
        uploadFile,
        createDocument,
    };
};
