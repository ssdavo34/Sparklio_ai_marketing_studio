/**
 * Meeting AI Hook - Enhanced Version
 *
 * Handles meeting file upload, processing, and analysis
 * with progress tracking and error handling
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-21
 */

import { useState, useCallback, useRef } from 'react';
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
    keywords?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
}

export const useMeetingAI = () => {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MeetingAnalysisResult | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const uploadFile = useCallback(async (file: File) => {
        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Create abort controller for cancellation
            abortControllerRef.current = new AbortController();

            // Simulate progress (in production, use XMLHttpRequest for real progress)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch('/api/v1/meeting/upload', {
                method: 'POST',
                body: formData,
                signal: abortControllerRef.current.signal,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to upload file');
            }

            const data = await response.json();

            // Start analysis immediately after upload
            await analyzeMeeting(data.meetingId);
        } catch (error: any) {
            console.error('Upload error:', error);

            if (error.name === 'AbortError') {
                setError('업로드가 취소되었습니다.');
            } else {
                setError(error.message || '파일 업로드 중 오류가 발생했습니다.');
            }

            setIsUploading(false);
            setUploadProgress(0);
        }
    }, []);

    const analyzeMeeting = useCallback(async (meetingId: string) => {
        setIsAnalyzing(true);
        setIsUploading(false); // Upload done, now analyzing
        setError(null);

        try {
            const response = await fetch('/api/v1/meeting/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingId }),
                signal: abortControllerRef.current?.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to analyze meeting');
            }

            const data: MeetingAnalysisResult = await response.json();
            setResult(data);
            setError(null);
        } catch (error: any) {
            console.error('Analysis error:', error);

            if (error.name === 'AbortError') {
                setError('분석이 취소되었습니다.');
            } else {
                setError(error.message || '회의 분석 중 오류가 발생했습니다.');
            }
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

    // Cancel upload/analysis
    const cancelOperation = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsUploading(false);
        setIsAnalyzing(false);
        setUploadProgress(0);
        setError('작업이 취소되었습니다.');
    }, []);

    // Reset all states
    const reset = useCallback(() => {
        setIsUploading(false);
        setIsAnalyzing(false);
        setUploadProgress(0);
        setError(null);
        setResult(null);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    return {
        isUploading,
        isAnalyzing,
        uploadProgress,
        error,
        result,
        uploadFile,
        createDocument,
        cancelOperation,
        reset,
    };
};
