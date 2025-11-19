'use client';

import { useMeetingAI } from '../../hooks/useMeetingAI';
import { UploadInterface } from '../../components/meeting/UploadInterface';
import { MeetingResult } from '../../components/meeting/MeetingResult';

export default function MeetingPage() {
    const { isUploading, isAnalyzing, result, uploadFile, createDocument } = useMeetingAI();

    return (
        <div className="h-screen w-full bg-slate-50 p-6">
            {!result ? (
                <div className="max-w-4xl mx-auto h-full flex flex-col">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">Meeting AI</h1>
                        <p className="text-slate-500 mt-2">
                            회의 녹음 파일을 업로드하면 AI가 자동으로 분석하여 마케팅 문서를 제안합니다.
                        </p>
                    </div>
                    <div className="flex-1 mb-8">
                        <UploadInterface
                            onUpload={uploadFile}
                            isUploading={isUploading}
                            isAnalyzing={isAnalyzing}
                        />
                    </div>
                </div>
            ) : (
                <MeetingResult result={result} onCreateDocument={createDocument} />
            )}
        </div>
    );
}
