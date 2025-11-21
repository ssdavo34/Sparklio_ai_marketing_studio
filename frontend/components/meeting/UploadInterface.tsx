/**
 * Meeting AI Upload Interface
 *
 * Enhanced file upload component with progress tracking and error handling
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-21
 */

import React, { useCallback, useState } from 'react';
import { Upload, FileAudio, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface UploadInterfaceProps {
    onUpload: (file: File) => void;
    isUploading: boolean;
    isAnalyzing: boolean;
    uploadProgress?: number;
    error?: string | null;
}

export const UploadInterface: React.FC<UploadInterfaceProps> = ({
    onUpload,
    isUploading,
    isAnalyzing,
    uploadProgress = 0,
    error = null
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const validateFile = (file: File): { valid: boolean; error?: string } => {
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/x-m4a', 'video/mp4', 'video/mpeg'];
        const maxSize = 500 * 1024 * 1024; // 500MB

        if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
            return { valid: false, error: '오디오 또는 비디오 파일만 업로드 가능합니다.' };
        }

        if (file.size > maxSize) {
            return { valid: false, error: '파일 크기는 500MB를 초과할 수 없습니다.' };
        }

        return { valid: true };
    };

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);

            if (isUploading || isAnalyzing) return;

            const file = e.dataTransfer.files[0];
            if (file) {
                const validation = validateFile(file);
                if (validation.valid) {
                    setFileInfo({
                        name: file.name,
                        size: formatFileSize(file.size)
                    });
                    onUpload(file);
                } else {
                    alert(validation.error);
                }
            }
        },
        [isUploading, isAnalyzing, onUpload]
    );

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validation = validateFile(file);
            if (validation.valid) {
                setFileInfo({
                    name: file.name,
                    size: formatFileSize(file.size)
                });
                onUpload(file);
            } else {
                alert(validation.error);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                    w-full max-w-2xl flex flex-col items-center justify-center p-12
                    border-2 border-dashed rounded-2xl transition-all duration-200
                    ${isDragging
                        ? 'border-indigo-500 bg-indigo-50 scale-105'
                        : error
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }
                    ${!isUploading && !isAnalyzing ? 'cursor-pointer' : ''}
                `}
            >
                <input
                    type="file"
                    accept="audio/*,video/*"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileInput}
                    disabled={isUploading || isAnalyzing}
                />

                {error ? (
                    <div className="text-center space-y-4">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <div className="text-xl font-semibold text-red-700">업로드 실패</div>
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            다시 시도
                        </button>
                    </div>
                ) : isUploading || isAnalyzing ? (
                    <div className="text-center space-y-6 w-full">
                        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
                        <div className="space-y-2">
                            <div className="text-xl font-semibold text-slate-700">
                                {isUploading ? '파일 업로드 중...' : 'AI가 회의 내용을 분석 중입니다...'}
                            </div>
                            {fileInfo && (
                                <div className="text-sm text-slate-500">
                                    {fileInfo.name} ({fileInfo.size})
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {isUploading && uploadProgress > 0 && (
                            <div className="w-full max-w-md mx-auto space-y-2">
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <div className="text-sm text-slate-600 text-center">
                                    {uploadProgress}%
                                </div>
                            </div>
                        )}

                        <p className="text-slate-500">
                            {isUploading
                                ? '업로드가 완료되면 자동으로 분석이 시작됩니다.'
                                : '분석 완료까지 1-2분 정도 소요됩니다.'
                            }
                        </p>
                    </div>
                ) : (
                    <label htmlFor="file-upload" className="text-center space-y-6 cursor-pointer w-full">
                        <div className={`
                            w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all
                            ${isDragging ? 'bg-indigo-200 scale-110' : 'bg-indigo-100'}
                        `}>
                            <Upload className="w-12 h-12 text-indigo-600" />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                회의 녹음 파일 업로드
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                MP3, M4A, WAV, MP4 파일을 여기에 드래그하거나 클릭하여 선택하세요.
                            </p>
                            <p className="text-sm text-slate-400 mt-2">
                                최대 파일 크기: 500MB
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <div className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl">
                                <FileAudio className="w-5 h-5" />
                                파일 선택하기
                            </div>
                        </div>

                        {/* Supported formats */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 justify-center">
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                MP3
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                M4A
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                WAV
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                MP4
                            </div>
                        </div>
                    </label>
                )}
            </div>

            {/* Help text */}
            {!isUploading && !isAnalyzing && !error && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">AI가 자동으로 다음을 처리합니다:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-700">
                                <li>음성을 텍스트로 변환 (STT)</li>
                                <li>화자 구분 및 대화 내용 정리</li>
                                <li>회의 요약 및 핵심 내용 추출</li>
                                <li>액션 아이템 자동 생성</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
