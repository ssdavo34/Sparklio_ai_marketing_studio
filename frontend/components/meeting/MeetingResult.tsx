import React from 'react';
import { MeetingAnalysisResult } from '../../hooks/useMeetingAI';
import { FileText, CheckSquare, MessageSquare, ArrowRight } from 'lucide-react';

interface MeetingResultProps {
    result: MeetingAnalysisResult;
    onCreateDocument: () => void;
}

export const MeetingResult: React.FC<MeetingResultProps> = ({ result, onCreateDocument }) => {
    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto p-6 gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">회의 분석 결과</h1>
                <button
                    onClick={onCreateDocument}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <FileText className="w-5 h-5" />
                    마케팅 문서 생성하기
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
                {/* Left Column: Summary & Action Items */}
                <div className="space-y-6 overflow-y-auto pr-2">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-slate-800">요약</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {result.summary}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckSquare className="w-5 h-5 text-green-600" />
                            <h2 className="text-lg font-bold text-slate-800">Action Items</h2>
                        </div>
                        <ul className="space-y-3">
                            {result.actionItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                    <span className="text-slate-700">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Column: Transcript */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-800">전체 스크립트</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {result.transcript.map((utterance, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="w-24 flex-shrink-0">
                                    <div className="font-bold text-slate-700 text-sm">{utterance.speaker}</div>
                                    <div className="text-xs text-slate-400">{utterance.timestamp}</div>
                                </div>
                                <div className="flex-1 text-slate-600">
                                    {utterance.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
