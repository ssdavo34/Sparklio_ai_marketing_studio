import React, { useCallback } from 'react';
import { Upload, FileAudio, Loader2 } from 'lucide-react';

interface UploadInterfaceProps {
    onUpload: (file: File) => void;
    isUploading: boolean;
    isAnalyzing: boolean;
}

export const UploadInterface: React.FC<UploadInterfaceProps> = ({ onUpload, isUploading, isAnalyzing }) => {
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (isUploading || isAnalyzing) return;

            const file = e.dataTransfer.files[0];
            if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
                onUpload(file);
            } else {
                alert('오디오 또는 비디오 파일만 업로드 가능합니다.');
            }
        },
        [isUploading, isAnalyzing, onUpload]
    );

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
        }
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center h-full p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
        >
            <input
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                id="file-upload"
                onChange={handleFileInput}
                disabled={isUploading || isAnalyzing}
            />

            {isUploading || isAnalyzing ? (
                <div className="text-center space-y-4">
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
                    <div className="text-xl font-semibold text-slate-700">
                        {isUploading ? '파일 업로드 중...' : 'AI가 회의 내용을 분석 중입니다...'}
                    </div>
                    <p className="text-slate-500">잠시만 기다려주세요.</p>
                </div>
            ) : (
                <label htmlFor="file-upload" className="text-center space-y-4 cursor-pointer">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">회의 녹음 파일 업로드</h3>
                        <p className="text-slate-500 mt-2">
                            MP3, M4A, WAV, MP4 파일을 여기에 드래그하거나 클릭하여 선택하세요.
                        </p>
                    </div>
                    <div className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                        파일 선택하기
                    </div>
                </label>
            )}
        </div>
    );
};
