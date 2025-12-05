/**
 * Meeting Analysis Edit Modal
 *
 * Meeting AI 분석 결과를 편집할 수 있는 팝업 모달
 * - 요약, 안건, 결정사항, 액션아이템, 캠페인아이디어 편집
 * - 저장 시 분석 결과 업데이트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Sparkles, Target, CheckCircle, Lightbulb, Hash, Send } from 'lucide-react';
import type { MeetingAnalysisResult } from '@/types/meeting';

interface MeetingAnalysisEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: MeetingAnalysisResult;
  onSave: (updatedResult: MeetingAnalysisResult) => void;
  onSendToConceptBoard: (analysisResult: MeetingAnalysisResult) => void;
  meetingTitle?: string;
}

export function MeetingAnalysisEditModal({
  isOpen,
  onClose,
  analysisResult,
  onSave,
  onSendToConceptBoard,
  meetingTitle,
}: MeetingAnalysisEditModalProps) {
  // 편집 상태
  const [summary, setSummary] = useState('');
  const [agenda, setAgenda] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [campaignIdeas, setCampaignIdeas] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);

  // 초기화
  useEffect(() => {
    if (isOpen && analysisResult) {
      setSummary(analysisResult.summary || '');
      setAgenda([...(analysisResult.agenda || [])]);
      setDecisions([...(analysisResult.decisions || [])]);
      setActionItems([...(analysisResult.action_items || [])]);
      setCampaignIdeas([...(analysisResult.campaign_ideas || [])]);
      setKeywords([...(analysisResult.keywords || [])]);
    }
  }, [isOpen, analysisResult]);

  if (!isOpen) return null;

  // 배열 항목 추가
  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, '']);
  };

  // 배열 항목 수정
  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // 배열 항목 삭제
  const removeItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  // 저장
  const handleSave = () => {
    const updatedResult: MeetingAnalysisResult = {
      ...analysisResult,
      summary,
      agenda: agenda.filter((item) => item.trim() !== ''),
      decisions: decisions.filter((item) => item.trim() !== ''),
      action_items: actionItems.filter((item) => item.trim() !== ''),
      campaign_ideas: campaignIdeas.filter((item) => item.trim() !== ''),
      keywords: keywords.filter((item) => item.trim() !== ''),
    };
    onSave(updatedResult);
    onClose();
  };

  // 섹션 렌더링 헬퍼
  const renderListSection = (
    title: string,
    icon: React.ReactNode,
    items: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string,
    color: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className={`text-sm font-medium ${color}`}>{title}</h4>
          <span className="text-xs text-gray-400">({items.length})</span>
        </div>
        <button
          onClick={() => addItem(setter)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          추가
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(setter, index, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
            />
            <button
              onClick={() => removeItem(setter, index)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2">항목이 없습니다. 추가 버튼을 클릭하세요.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 - 캔버스 영역 크기에 맞게 반응형 */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">분석 결과 편집</h3>
            {meetingTitle && (
              <p className="text-xs text-gray-500 mt-0.5">{meetingTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 - 2열 그리드 레이아웃 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* 요약 - 전체 너비 */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <h4 className="text-sm font-medium text-purple-700">요약</h4>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="회의 요약을 입력하세요..."
              rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
            />
          </div>

          {/* 2열 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 왼쪽 열 */}
            <div className="space-y-5">
              {/* 안건 */}
              {renderListSection(
                '안건',
                <Target className="w-4 h-4 text-blue-500" />,
                agenda,
                setAgenda,
                '안건을 입력하세요...',
                'text-blue-700'
              )}

              {/* 결정사항 */}
              {renderListSection(
                '결정사항',
                <CheckCircle className="w-4 h-4 text-green-500" />,
                decisions,
                setDecisions,
                '결정사항을 입력하세요...',
                'text-green-700'
              )}
            </div>

            {/* 오른쪽 열 */}
            <div className="space-y-5">
              {/* 액션 아이템 */}
              {renderListSection(
                '액션 아이템',
                <Target className="w-4 h-4 text-orange-500" />,
                actionItems,
                setActionItems,
                '액션 아이템을 입력하세요...',
                'text-orange-700'
              )}

              {/* 캠페인 아이디어 */}
              {renderListSection(
                '캠페인 아이디어',
                <Lightbulb className="w-4 h-4 text-yellow-500" />,
                campaignIdeas,
                setCampaignIdeas,
                '캠페인 아이디어를 입력하세요...',
                'text-yellow-700'
              )}
            </div>
          </div>

          {/* 키워드 - 전체 너비 */}
          <div className="space-y-2 mt-6">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-medium text-gray-700">키워드</h4>
              <span className="text-xs text-gray-400">({keywords.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full"
                >
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => updateItem(setKeywords, index, e.target.value)}
                    className="bg-transparent text-sm text-gray-700 w-24 focus:outline-none"
                    placeholder="키워드"
                  />
                  <button
                    onClick={() => removeItem(setKeywords, index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItem(setKeywords)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 border border-dashed border-gray-300 rounded-full hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                추가
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={() => {
              // 현재 편집 내용으로 컨셉보드 전송
              const currentResult: MeetingAnalysisResult = {
                ...analysisResult,
                summary,
                agenda: agenda.filter((item) => item.trim() !== ''),
                decisions: decisions.filter((item) => item.trim() !== ''),
                action_items: actionItems.filter((item) => item.trim() !== ''),
                campaign_ideas: campaignIdeas.filter((item) => item.trim() !== ''),
                keywords: keywords.filter((item) => item.trim() !== ''),
              };
              onSendToConceptBoard(currentResult);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            컨셉보드로 보내기
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
