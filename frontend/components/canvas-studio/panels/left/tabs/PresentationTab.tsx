/**
 * Presentation Tab
 *
 * 프리젠테이션 생성 및 관리 탭
 * - AI 기반 슬라이드 생성
 * - 템플릿 선택
 * - 기존 프리젠테이션 목록 관리
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-30
 */

'use client';

import { useState } from 'react';
import { Presentation, Sparkles, Loader2, FileText, ChevronRight, Plus, LayoutGrid } from 'lucide-react';
import { useCenterViewStore } from '../../../stores/useCenterViewStore';
import { useGeneratedAssetsStore } from '../../../stores/useGeneratedAssetsStore';

// 프리젠테이션 타입
type PresentationType = 'pitch' | 'sales' | 'internal' | 'investor' | 'vision';

const PRESENTATION_TYPES: { id: PresentationType; name: string; description: string; icon: string }[] = [
  { id: 'pitch', name: '피치 덱', description: '스타트업/제품 소개용', icon: '🚀' },
  { id: 'sales', name: '세일즈 덱', description: '고객 영업/제안용', icon: '💼' },
  { id: 'investor', name: '투자자 덱', description: 'IR/투자 유치용', icon: '📈' },
  { id: 'vision', name: '비전 덱', description: '회사 비전/미래 전략', icon: '🔮' },
  { id: 'internal', name: '내부 발표', description: '팀/조직 발표용', icon: '👥' },
];

// 슬라이드 수 옵션
const SLIDE_COUNT_OPTIONS = [6, 8, 10, 12, 15];

export function PresentationTab() {
  const [topic, setTopic] = useState('');
  const [presentationType, setPresentationType] = useState<PresentationType>('pitch');
  const [slideCount, setSlideCount] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { openSlidesPreview } = useCenterViewStore();
  const conceptBoardData = useGeneratedAssetsStore((state) => state.conceptBoardData);

  const handleGeneratePresentation = async () => {
    if (!topic.trim()) {
      setError('주제를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Backend PresentationAgent 호출
      const response = await fetch('/api/v1/generate/presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          presentation_type: presentationType,
          slide_count: slideCount,
          language: 'ko',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[PresentationTab] Generated presentation:', data);

      // SlidesPreviewView 열기
      if (data.slides && data.slides.length > 0) {
        // CenterViewStore에 슬라이드 데이터 설정
        useCenterViewStore.getState().setPresentationData({
          id: data.id || `pres-${Date.now()}`,
          concept_id: 'generated',
          title: data.title || topic,
          status: 'completed',
          created_at: new Date().toISOString(),
          slides: data.slides,
          style: {
            primary_color: '#6366F1',
            secondary_color: '#8B5CF6',
            font_family: 'Pretendard',
            theme: presentationType,
          },
          export_formats: ['pdf', 'pptx'],
          download_url: '',
        });

        openSlidesPreview('generated', data.id || `pres-${Date.now()}`);
      }

      // 입력 초기화
      setTopic('');
    } catch (err: any) {
      console.error('[PresentationTab] Generation failed:', err);
      setError(err.message || '프리젠테이션 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 기존 컨셉에서 프리젠테이션 생성
  const handleCreateFromConcept = (conceptId: string) => {
    // 컨셉 기반 프리젠테이션 생성 로직
    console.log('[PresentationTab] Creating from concept:', conceptId);
    openSlidesPreview(conceptId, `pres-${conceptId}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Presentation className="w-4 h-4 text-purple-600" />
          프리젠테이션
        </h2>
        <p className="text-xs text-gray-500 mt-1">AI로 슬라이드를 생성합니다</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 새 프리젠테이션 생성 */}
        <div className="space-y-4">
          {/* 주제 입력 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              프리젠테이션 주제
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: Sparklio AI 마케팅 스튜디오 소개"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isGenerating}
            />
          </div>

          {/* 프리젠테이션 타입 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              프리젠테이션 유형
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRESENTATION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPresentationType(type.id)}
                  disabled={isGenerating}
                  className={`flex items-center gap-3 p-2 rounded-lg border transition-colors text-left ${
                    presentationType === type.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{type.name}</p>
                    <p className="text-[10px] text-gray-500">{type.description}</p>
                  </div>
                  {presentationType === type.id && (
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 슬라이드 수 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              슬라이드 수
            </label>
            <div className="flex gap-2">
              {SLIDE_COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setSlideCount(count)}
                  disabled={isGenerating}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    slideCount === count
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {count}장
                </button>
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            onClick={handleGeneratePresentation}
            disabled={isGenerating || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                프리젠테이션 생성
              </>
            )}
          </button>
        </div>

        {/* 구분선 */}
        <div className="my-6 flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* 기존 컨셉에서 생성 */}
        {conceptBoardData && conceptBoardData.concepts && conceptBoardData.concepts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <LayoutGrid className="w-3 h-3" />
              기존 컨셉에서 생성
            </h3>
            <div className="space-y-2">
              {conceptBoardData.concepts.map((concept) => (
                <button
                  key={concept.concept_id}
                  onClick={() => handleCreateFromConcept(concept.concept_id)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {concept.concept_name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {concept.description || concept.headline || '컨셉 기반 프리젠테이션'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {(!conceptBoardData || !conceptBoardData.concepts || conceptBoardData.concepts.length === 0) && (
          <div className="text-center py-4 text-gray-400">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">컨셉을 먼저 생성하면</p>
            <p className="text-xs">여기서 바로 프리젠테이션을 만들 수 있어요</p>
          </div>
        )}

        {/* 템플릿 섹션 (향후 확장) */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">
            빠른 템플릿
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setTopic('스타트업 피치 덱');
                setPresentationType('pitch');
                setSlideCount(10);
              }}
              className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg text-left hover:border-blue-300 transition-colors"
            >
              <span className="text-lg">🚀</span>
              <p className="text-xs font-medium text-gray-800 mt-1">스타트업 피치</p>
              <p className="text-[10px] text-gray-500">10장</p>
            </button>
            <button
              onClick={() => {
                setTopic('제품 소개 프리젠테이션');
                setPresentationType('sales');
                setSlideCount(8);
              }}
              className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-lg text-left hover:border-green-300 transition-colors"
            >
              <span className="text-lg">📦</span>
              <p className="text-xs font-medium text-gray-800 mt-1">제품 소개</p>
              <p className="text-[10px] text-gray-500">8장</p>
            </button>
            <button
              onClick={() => {
                setTopic('투자 유치 IR 덱');
                setPresentationType('investor');
                setSlideCount(15);
              }}
              className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-lg text-left hover:border-purple-300 transition-colors"
            >
              <span className="text-lg">📈</span>
              <p className="text-xs font-medium text-gray-800 mt-1">IR 덱</p>
              <p className="text-[10px] text-gray-500">15장</p>
            </button>
            <button
              onClick={() => {
                setTopic('팀 주간 보고');
                setPresentationType('internal');
                setSlideCount(6);
              }}
              className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-lg text-left hover:border-orange-300 transition-colors"
            >
              <span className="text-lg">📊</span>
              <p className="text-xs font-medium text-gray-800 mt-1">주간 보고</p>
              <p className="text-[10px] text-gray-500">6장</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
