/**
 * Brief Tab
 *
 * 캠페인 브리프 입력 및 관리 탭
 * - 캠페인 목표, 타겟, 인사이트 입력
 * - 핵심 메시지, 채널, KPI 관리
 * - Brief Store와 연동하여 ConceptBoard 생성 시 활용
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-02
 */

'use client';

import { useState, useCallback } from 'react';
import {
  FileText,
  Target,
  Users,
  Lightbulb,
  MessageSquare,
  Hash,
  BarChart3,
  Plus,
  X,
  Check,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Layout,
  Loader2,
} from 'lucide-react';
import { useBriefStore } from '../../../stores/useBriefStore';
import { useLeftPanelStore } from '../../../stores/useLeftPanelStore';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useConceptWorkflowStore } from '../../../stores/useConceptWorkflowStore';
import type { Brief, ChannelType } from '@/types/brief';
import type { BriefSourceData } from '@/types/conceptGeneration';
import { CHANNEL_TYPE_LABELS, CHANNEL_TYPE_ICONS } from '@/types/brief';
import { toast } from '@/components/ui/Toast';
import { layoutApi, type DocumentLayout, type LayoutElement, type PageLayout } from '@/lib/api/layout-api';

// 채널 목록 (UI에서 사용할 것만)
const AVAILABLE_CHANNELS: ChannelType[] = ['product_detail', 'sns', 'banner', 'deck', 'video'];

export function BriefTab() {
  // Brief Store
  const {
    brief,
    setBrief,
    updateBriefField,
    addKeyMessage,
    removeKeyMessage,
    toggleChannel,
    addKPI,
    removeKPI,
    validation,
    setIsEditing,
    reset,
  } = useBriefStore();

  // Canvas Store
  const polotnoStore = useCanvasStore((state) => state.canvases.get(state.activeCanvasType) || null);

  // 새 메시지/KPI 입력 상태
  const [newMessage, setNewMessage] = useState('');
  const [newKPI, setNewKPI] = useState('');
  const [isRenderingToCanvas, setIsRenderingToCanvas] = useState(false);

  // 브리프가 없으면 새로 생성
  const initializeBrief = useCallback(() => {
    const now = new Date().toISOString();
    const newBrief: Brief = {
      id: `brief-${Date.now()}`,
      projectId: 'default-project',
      goal: '',
      target: '',
      insight: '',
      keyMessages: [],
      channels: [],
      kpis: [],
      status: 'draft',
      sourceType: 'manual',
      createdAt: now,
      updatedAt: now,
    };
    setBrief(newBrief);
    setIsEditing(true);
    toast.success('새 브리프를 생성했습니다.');
  }, [setBrief, setIsEditing]);

  // 핵심 메시지 추가
  const handleAddMessage = useCallback(() => {
    if (newMessage.trim()) {
      addKeyMessage(newMessage.trim());
      setNewMessage('');
    }
  }, [newMessage, addKeyMessage]);

  // KPI 추가
  const handleAddKPI = useCallback(() => {
    if (newKPI.trim()) {
      addKPI(newKPI.trim());
      setNewKPI('');
    }
  }, [newKPI, addKPI]);

  // Brief를 캔버스에 렌더링
  const handleSendToCanvas = useCallback(async () => {
    if (!brief || !polotnoStore) {
      toast.error('브리프 또는 캔버스가 준비되지 않았습니다.');
      return;
    }

    const page = polotnoStore.activePage;
    if (!page) {
      toast.error('활성 페이지가 없습니다.');
      return;
    }

    setIsRenderingToCanvas(true);
    toast.info('브리프 레이아웃을 생성하고 있습니다...');

    try {
      // Layout API 호출
      const response = await layoutApi.generate({
        document_type: 'brief',
        content: {
          goal: brief.goal || '',
          target: brief.target || '',
          insight: brief.insight || '',
          key_messages: brief.keyMessages ?? [],
          channels: brief.channels ?? [],
          kpis: brief.kpis ?? [],
        },
        options: {
          page_width: page.width as number,
          page_height: page.height as number,
          style: 'modern',
        },
      });

      const layout = response.layout;

      // 캔버스에 레이아웃 적용
      await applyBriefLayoutToCanvas(layout, polotnoStore, page);

      toast.success(`브리프가 ${layout.total_pages}페이지로 캔버스에 추가되었습니다!`);
    } catch (error) {
      console.error('[BriefTab] Layout API failed, using fallback:', error);
      toast.warning('Layout API 실패, 기본 레이아웃을 사용합니다.');

      // 폴백: 기본 렌더링
      applyFallbackBriefLayout(polotnoStore, page, brief);
    } finally {
      setIsRenderingToCanvas(false);
    }
  }, [brief, polotnoStore]);

  // Layout API 응답을 캔버스에 적용
  const applyBriefLayoutToCanvas = async (
    layout: DocumentLayout,
    store: any,
    firstPage: any
  ) => {
    const pageWidth = layout.page_width;
    const pageHeight = layout.page_height;

    layout.pages.forEach((pageLayout: PageLayout, pageIndex: number) => {
      let targetPage: any;

      if (pageIndex === 0) {
        targetPage = firstPage;
        targetPage.children.forEach((child: any) => child.remove());
      } else {
        targetPage = store.addPage({
          width: pageWidth,
          height: pageHeight,
        });
      }

      pageLayout.elements.forEach((element: LayoutElement) => {
        addLayoutElementToPage(targetPage, element);
      });

      // Footer
      targetPage.addElement({
        type: 'text',
        x: 60,
        y: pageHeight - 45,
        width: pageWidth - 120,
        fontSize: 10,
        fill: '#9CA3AF',
        text: `Page ${pageIndex + 1} of ${layout.total_pages} • Campaign Brief • ${new Date().toLocaleDateString('ko-KR')}`,
        align: 'center',
      });
    });
  };

  // LayoutElement를 Polotno 요소로 변환
  const addLayoutElementToPage = (page: any, element: LayoutElement) => {
    const props = element.properties || {};

    switch (element.type) {
      case 'heading':
      case 'text':
      case 'paragraph':
        page.addElement({
          type: 'text',
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          text: element.content || '',
          fontSize: props.fontSize || 24,
          fontWeight: props.fontWeight || 'normal',
          fill: props.color || '#000000',
          align: props.textAlign || 'left',
        });
        break;

      case 'list':
        const items = props.items || [];
        const listStyle = props.listStyle || 'bullet';
        const prefix = listStyle === 'bullet' ? '• ' : listStyle === 'check' ? '✓ ' : '';
        const listText = items
          .map((item: string, i: number) =>
            listStyle === 'number' ? `${i + 1}. ${item}` : `${prefix}${item}`
          )
          .join('\n');

        page.addElement({
          type: 'text',
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          text: listText,
          fontSize: props.fontSize || 14,
          fill: props.color || '#333333',
          lineHeight: 1.6,
        });
        break;

      case 'card':
        page.addElement({
          type: 'figure',
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          fill: props.backgroundColor || '#ffffff',
          cornerRadius: props.borderRadius || 8,
          stroke: props.borderColor || '#e0e0e0',
          strokeWidth: 1,
        });

        if (element.content) {
          page.addElement({
            type: 'text',
            x: element.x + (props.padding || 16),
            y: element.y + (props.padding || 16),
            width: element.width - (props.padding || 16) * 2,
            text: element.content,
            fontSize: props.fontSize || 14,
            fill: props.color || '#333333',
          });
        }
        break;

      default:
        if (element.content) {
          page.addElement({
            type: 'text',
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            text: element.content,
            fontSize: props.fontSize || 14,
            fill: props.color || '#000000',
          });
        }
    }
  };

  // 폴백 레이아웃 (API 실패 시)
  const applyFallbackBriefLayout = (store: any, page: any, briefData: Brief) => {
    page.children.forEach((child: any) => child.remove());

    const pageWidth = page.width as number;
    const pageHeight = page.height as number;
    const margin = 60;
    const contentWidth = pageWidth - margin * 2;

    let currentY = margin;

    // 헤더 배경
    page.addElement({
      type: 'figure',
      x: 0,
      y: 0,
      width: pageWidth,
      height: 160,
      fill: '#3B82F6',
    });

    // 타이틀
    page.addElement({
      type: 'text',
      x: margin,
      y: 50,
      width: contentWidth,
      fontSize: 36,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      text: 'Campaign Brief',
    });

    // 날짜
    page.addElement({
      type: 'text',
      x: margin,
      y: 110,
      width: contentWidth,
      fontSize: 14,
      fill: 'rgba(255,255,255,0.8)',
      text: new Date().toLocaleDateString('ko-KR'),
    });

    currentY = 190;

    // 캠페인 목표
    if (briefData.goal) {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#3B82F6',
        text: '🎯 캠페인 목표',
      });
      currentY += 25;

      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 13,
        fill: '#374151',
        text: briefData.goal,
        lineHeight: 1.5,
      });
      currentY += Math.ceil(briefData.goal.length / 60) * 20 + 25;
    }

    // 타겟 오디언스
    if (briefData.target) {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#8B5CF6',
        text: '👥 타겟 오디언스',
      });
      currentY += 25;

      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 13,
        fill: '#374151',
        text: briefData.target,
        lineHeight: 1.5,
      });
      currentY += Math.ceil(briefData.target.length / 60) * 20 + 25;
    }

    // 핵심 메시지
    if (briefData.keyMessages.length > 0) {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#10B981',
        text: '💬 핵심 메시지',
      });
      currentY += 25;

      briefData.keyMessages.forEach((msg, idx) => {
        page.addElement({
          type: 'text',
          x: margin + 20,
          y: currentY,
          width: contentWidth - 20,
          fontSize: 12,
          fill: '#374151',
          text: `• ${msg}`,
        });
        currentY += 20;
      });
      currentY += 15;
    }

    // 타겟 채널
    if (briefData.channels.length > 0) {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#6366F1',
        text: '#️⃣ 타겟 채널',
      });
      currentY += 25;

      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 12,
        fill: '#374151',
        text: briefData.channels.map(ch => CHANNEL_TYPE_LABELS[ch]).join(' / '),
      });
      currentY += 30;
    }

    // Footer
    page.addElement({
      type: 'text',
      x: margin,
      y: pageHeight - 45,
      width: contentWidth,
      fontSize: 10,
      fill: '#9CA3AF',
      text: `Generated by Sparklio AI • ${new Date().toLocaleDateString('ko-KR')}`,
      align: 'center',
    });

    toast.success('브리프가 캔버스에 추가되었습니다!');
  };

  // 완성도 표시
  const completeness = validation?.completeness || 0;
  const isValid = validation?.isValid || false;

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm font-semibold text-neutral-800">Campaign Brief</h2>
        </div>
        {brief && (
          <div className="flex items-center gap-2">
            <div className={`text-xs px-2 py-1 rounded-full ${
              isValid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {completeness}% 완성
            </div>
            <button
              onClick={() => {
                if (confirm('브리프를 초기화하시겠습니까? 입력한 내용이 모두 삭제됩니다.')) {
                  reset();
                  toast.success('브리프가 초기화되었습니다.');
                }
              }}
              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="브리프 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 브리프가 없을 때 */}
        {!brief ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-500 mb-4">
              캠페인 브리프를 작성하여<br />
              AI 컨셉 생성에 활용하세요
            </p>
            <button
              onClick={initializeBrief}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              새 브리프 작성
            </button>
          </div>
        ) : (
          <>
            {/* 캠페인 목표 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                캠페인 목표 <span className="text-red-500">*</span>
              </label>
              <p className="text-[10px] text-neutral-400 -mt-1">
                무엇을 달성하고 싶은지 구체적으로 작성해주세요
              </p>
              <textarea
                value={brief.goal}
                onChange={(e) => updateBriefField('goal', e.target.value)}
                placeholder="예시:
• 프리미엄 단백질 바 신제품 출시로 브랜드 인지도 30% 상승
• 여름 시즌 한정 음료 프로모션으로 매출 20% 증가
• 친환경 패키지 리뉴얼 캠페인으로 ESG 브랜드 이미지 강화"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* 타겟 오디언스 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                타겟 오디언스 <span className="text-red-500">*</span>
              </label>
              <p className="text-[10px] text-neutral-400 -mt-1">
                연령, 성별, 직업, 관심사, 라이프스타일 등을 포함해주세요
              </p>
              <textarea
                value={brief.target}
                onChange={(e) => updateBriefField('target', e.target.value)}
                placeholder="예시:
• 25-35세 여성, 건강과 다이어트에 관심 높은 직장인
• 30-45세 남성, 가족과 주말 야외활동을 즐기는 아빠
• 18-24세 Z세대, SNS 트렌드에 민감하고 가성비를 중시"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* 핵심 인사이트 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                핵심 인사이트
              </label>
              <p className="text-[10px] text-neutral-400 -mt-1">
                타겟 고객의 니즈, 페인포인트, 구매 동기 등
              </p>
              <textarea
                value={brief.insight || ''}
                onChange={(e) => updateBriefField('insight', e.target.value)}
                placeholder="예시:
• 바쁜 일상에서 건강한 간식을 찾지만 맛과 영양 둘 다 포기 못함
• 가격보다 원료 품질과 브랜드 신뢰도를 더 중요하게 생각함
• 환경 문제에 관심은 있지만 실천이 어려워 브랜드가 대신해주길 원함"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* 핵심 메시지 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                핵심 메시지 <span className="text-red-500">*</span>
              </label>
              <p className="text-[10px] text-neutral-400 -mt-1">
                캠페인에서 전달하고 싶은 핵심 메시지를 추가하세요
              </p>

              {/* 예시 안내 (메시지가 없을 때만) */}
              {(brief.keyMessages?.length ?? 0) === 0 && (
                <div className="text-[10px] text-neutral-400 bg-neutral-50 p-2 rounded-lg">
                  💡 예시: "진짜 단백질, 진짜 맛있게" / "자연에서 온 에너지" / "오늘도 나를 위한 선택"
                </div>
              )}

              {/* 기존 메시지 목록 */}
              <div className="space-y-1.5">
                {(brief.keyMessages ?? []).map((msg, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm"
                  >
                    <span className="flex-1 text-neutral-700">{msg}</span>
                    <button
                      onClick={() => removeKeyMessage(index)}
                      className="p-0.5 hover:bg-green-200 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-green-600" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 새 메시지 입력 */}
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMessage()}
                  placeholder="예: 건강한 맛, 건강한 하루"
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleAddMessage}
                  disabled={!newMessage.trim()}
                  className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 타겟 채널 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                타겟 채널 <span className="text-red-500">*</span>
              </label>
              <p className="text-[10px] text-neutral-400 -mt-1">
                생성할 광고 콘텐츠 채널을 선택하세요 (복수 선택 가능)
              </p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CHANNELS.map((channel) => {
                  const isSelected = (brief.channels ?? []).includes(channel);
                  return (
                    <button
                      key={channel}
                      onClick={() => toggleChannel(channel)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-indigo-200'
                      }`}
                    >
                      <span>{CHANNEL_TYPE_ICONS[channel]}</span>
                      <span>{CHANNEL_TYPE_LABELS[channel]}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KPI */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <BarChart3 className="w-3.5 h-3.5 text-pink-500" />
                KPI 목표
              </label>
              <p className="text-[10px] text-neutral-400 -mt-1">
                캠페인 성과를 측정할 지표를 설정하세요
              </p>

              {/* 예시 안내 (KPI가 없을 때만) */}
              {(brief.kpis?.length ?? 0) === 0 && (
                <div className="text-[10px] text-neutral-400 bg-neutral-50 p-2 rounded-lg">
                  💡 예시: "CTR 3% 이상" / "도달률 100만 뷰" / "전환율 2% 달성" / "SNS 언급 1,000건"
                </div>
              )}

              {/* 기존 KPI 목록 */}
              <div className="space-y-1.5">
                {(brief.kpis ?? []).map((kpi, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-lg text-sm"
                  >
                    <span className="flex-1 text-neutral-700">{kpi}</span>
                    <button
                      onClick={() => removeKPI(index)}
                      className="p-0.5 hover:bg-pink-200 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-pink-600" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 새 KPI 입력 */}
              <div className="flex gap-2">
                <input
                  value={newKPI}
                  onChange={(e) => setNewKPI(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKPI()}
                  placeholder="예: 인스타그램 팔로워 10% 증가"
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  onClick={handleAddKPI}
                  disabled={!newKPI.trim()}
                  className="px-3 py-1.5 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 유효성 검사 결과 */}
            {validation && !isValid && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700">
                    <p className="font-medium mb-1">필수 항목을 입력해주세요:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {validation.missingRequired.map((field) => (
                        <li key={field}>{getFieldLabel(field)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 완료 상태 + 생성 버튼 */}
            {isValid && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-green-700 font-medium">
                    브리프가 완성되었습니다!
                  </p>
                </div>

                {/* 캔버스로 보내기 버튼 */}
                <button
                  onClick={handleSendToCanvas}
                  disabled={isRenderingToCanvas}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-all"
                >
                  {isRenderingToCanvas ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      레이아웃 생성 중...
                    </>
                  ) : (
                    <>
                      <Layout className="w-4 h-4" />
                      캔버스로 보내기
                    </>
                  )}
                </button>

                {/* ConceptBoard로 이동 버튼 - 워크플로우 모달 오픈 */}
                <button
                  onClick={() => {
                    // Brief 데이터를 BriefSourceData로 변환
                    if (brief) {
                      const briefSourceData: BriefSourceData = {
                        sourceType: 'brief',
                        briefId: brief.id || `brief-${Date.now()}`,
                        goal: brief.goal || '',
                        target: brief.target || '',
                        insight: brief.insight || '',
                        keyMessages: brief.keyMessages || [],
                        channels: brief.channels || [],
                        kpis: brief.kpis || [],
                      };

                      // 워크플로우 모달 열기 (Brief 소스 데이터와 함께)
                      const openWorkflowModal = useConceptWorkflowStore.getState().openModal;
                      openWorkflowModal(briefSourceData);
                    }

                    // ConceptBoard 탭으로 이동
                    useLeftPanelStore.getState().setActiveTab('conceptboard');
                    useLeftPanelStore.getState().setPanelTab('conceptboard');
                    toast.success('컨셉 생성 워크플로우를 시작합니다.');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  ConceptBoard에서 컨셉 생성하기
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
        <p className="text-[10px] text-neutral-500">
          <Sparkles className="w-3 h-3 inline mr-1" />
          브리프 정보는 ConceptBoard와 풀셋 생성 시 자동 반영됩니다
        </p>
      </div>
    </div>
  );
}

// 필드명 → 한글 라벨
function getFieldLabel(field: keyof Brief): string {
  const labels: Partial<Record<keyof Brief, string>> = {
    goal: '캠페인 목표',
    target: '타겟 오디언스',
    insight: '핵심 인사이트',
    keyMessages: '핵심 메시지',
    channels: '타겟 채널',
    kpis: 'KPI',
  };
  return labels[field] || field;
}
