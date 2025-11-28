/**
 * Chat Panel
 *
 * AI와 대화하여 콘텐츠를 생성하는 패널
 *
 * 기능:
 * - Kind 선택 (product_detail, sns, brand_kit)
 * - 프롬프트 입력
 * - Generate API 호출
 * - Canvas에 결과 반영
 * - AI 응답 자동 감지 및 렌더링 (ContentPlan, AdCopy 등)
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-23
 */

'use client';

import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Paperclip, X, FileText, FileSpreadsheet, Image as ImageIcon, Video, Music } from 'lucide-react';
import type { GenerateKind } from '@/lib/api/types';
import { useGenerate } from '../hooks/useGenerate';
import { useConceptGenerate } from '../../../hooks/useConceptGenerate';
import { AIResponseRenderer } from './AIResponseRenderer';
import { getPolotnoStore } from '../polotno/polotnoStoreSingleton';
import { useCanvasStore } from '../stores/useCanvasStore';
import { useGeneratedAssetsStore } from '../stores/useGeneratedAssetsStore';
import { useCenterViewStore } from '../stores/useCenterViewStore';

type UploadedFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
};

/**
 * 단일 페이지에 컨셉 내용을 추가하는 헬퍼 함수
 */
function addConceptToPage(page: any, concept: {
  headline: string;
  subheadline?: string;
  description?: string;
  bullets?: string[];
}) {
  let yPosition = 100;
  const xPosition = 100;
  const spacing = 120;

  // Headline 추가
  if (concept.headline) {
    page.addElement({
      type: 'text',
      x: xPosition,
      y: yPosition,
      width: page.width - 200,
      height: 80,
      fontSize: 48,
      fontFamily: 'Noto Sans KR',
      fontWeight: 'bold',
      text: concept.headline,
      fill: '#FFFFFF',
      align: 'center',
    });
    yPosition += spacing;
  }

  // Subheadline 추가
  if (concept.subheadline) {
    page.addElement({
      type: 'text',
      x: xPosition,
      y: yPosition,
      width: page.width - 200,
      height: 60,
      fontSize: 32,
      fontFamily: 'Noto Sans KR',
      text: concept.subheadline,
      fill: '#F3F4F6',
      align: 'center',
    });
    yPosition += spacing - 20;
  }

  // Description/Body 추가
  if (concept.description) {
    page.addElement({
      type: 'text',
      x: xPosition,
      y: yPosition,
      width: page.width - 200,
      height: 150,
      fontSize: 24,
      fontFamily: 'Noto Sans KR',
      text: concept.description,
      fill: '#E5E7EB',
      align: 'center',
    });
    yPosition += 160;
  }

  // Bullets 추가
  if (concept.bullets && Array.isArray(concept.bullets)) {
    const bulletText = concept.bullets.map((b: string) => `• ${b}`).join('\n');
    page.addElement({
      type: 'text',
      x: xPosition,
      y: yPosition,
      width: page.width - 200,
      height: 200,
      fontSize: 20,
      fontFamily: 'Noto Sans KR',
      text: bulletText,
      fill: '#D1D5DB',
      align: 'left',
    });
  }
}

/**
 * Generate 응답을 Polotno Canvas에 추가하는 헬퍼 함수
 * - 백엔드 응답의 다양한 필드를 파싱
 * - 컨셉이 여러 개면 각 컨셉을 별도 페이지로 생성
 * - 첫 번째 페이지만 활성화
 */
function addGenerateResponseToPolotno(response: any) {
  console.log('[ChatPanel] Adding response to Polotno canvas');
  console.log('[ChatPanel] Response data:', JSON.stringify(response, null, 2));

  // Polotno 싱글톤 store 가져오기
  const polotnoStore = getPolotnoStore();
  if (!polotnoStore) {
    console.error('[ChatPanel] Polotno store not available');
    return false;
  }

  try {
    // 기존 페이지 모두 삭제
    while (polotnoStore.pages.length > 0) {
      polotnoStore.pages[0].remove();
    }

    // 응답 데이터에서 컨셉 추출
    const concepts: Array<{
      headline: string;
      subheadline?: string;
      description?: string;
      bullets?: string[];
    }> = [];

    // 백엔드 응답 구조 분석 (다양한 필드명 지원)
    const data = response.text || response;

    // 제품 제목/헤드라인 추출
    const productTitle = data.product_title || data.optimized_product_title ||
      data.headline || data.title || '';

    // 제품 설명 추출
    const productDescription = data.product_description || data.optimized_description ||
      data.description || data.body || '';

    // USP (Unique Selling Points) 추출
    const usps = data.unique_selling_points || data.usp || data.bullets || [];

    // 타겟 고객 추출
    const targetAudience = data.target_audience || data.marketing_brief?.target_audience || '';

    // 톤앤매너 추출
    const tone = data.tone || data.marketing_brief?.tone || '';

    // product_features와 product_benefits에서 최대 3개 컨셉 생성
    const allFeatures: string[] = [];

    // product_features 처리 (문자열 배열 또는 객체 배열 둘 다 지원)
    if (data.product_features && Array.isArray(data.product_features)) {
      data.product_features.forEach((feature: any) => {
        if (typeof feature === 'string') {
          allFeatures.push(feature);
        } else if (feature.feature_title || feature.title || feature.name) {
          allFeatures.push(feature.feature_title || feature.title || feature.name);
        }
      });
    }

    // product_benefits 처리
    if (data.product_benefits && Array.isArray(data.product_benefits)) {
      data.product_benefits.forEach((benefit: any) => {
        if (typeof benefit === 'string') {
          allFeatures.push(benefit);
        } else if (benefit.benefit_title || benefit.title || benefit.name) {
          allFeatures.push(benefit.benefit_title || benefit.title || benefit.name);
        }
      });
    }

    // 최대 3개 컨셉만 생성
    if (allFeatures.length > 0) {
      allFeatures.slice(0, 3).forEach((featureTitle: string) => {
        concepts.push({
          headline: featureTitle,
          subheadline: productTitle,
          description: productDescription,
          bullets: usps,
        });
      });
    }

    // 컨셉이 없으면 메인 컨셉에서 3가지 변형 생성 (제품 정보 기반)
    if (concepts.length === 0 && (productTitle || productDescription)) {
      // 컨셉 1: 메인 (제품 특징 강조)
      concepts.push({
        headline: productTitle,
        subheadline: targetAudience ? `${targetAudience}를 위한` : '당신을 위한',
        description: productDescription,
        bullets: usps,
      });

      // 컨셉 2: 혜택 강조 (USP가 있으면 사용)
      if (usps && usps.length > 0) {
        concepts.push({
          headline: usps[0],
          subheadline: productTitle,
          description: productDescription,
          bullets: usps.slice(1),
        });
      }

      // 컨셉 3: 추가 USP (있으면)
      if (usps && usps.length > 1) {
        concepts.push({
          headline: usps[1],
          subheadline: productTitle,
          description: productDescription,
          bullets: usps.slice(2),
        });
      }
    }

    // text 객체의 직접적인 headline/body가 있으면 추가
    if (concepts.length === 0 && response.text?.headline) {
      concepts.push({
        headline: response.text.headline || '',
        subheadline: response.text.subheadline || '',
        description: response.text.body || '',
        bullets: response.text.bullets || [],
      });
    }

    // 컨셉이 없으면 기본 정보 페이지 생성
    if (concepts.length === 0) {
      console.log('[ChatPanel] No concepts found, creating info page');
      const newPage = polotnoStore.addPage({
        width: 1080,
        height: 1920,
        background: '#1F2937',
      });

      // 기본 안내 메시지 추가
      newPage.addElement({
        type: 'text',
        x: 100,
        y: 800,
        width: 880,
        height: 100,
        fontSize: 32,
        fontFamily: 'Noto Sans KR',
        text: '콘텐츠를 생성하려면 프롬프트를 입력하세요',
        fill: '#9CA3AF',
        align: 'center',
      });
      return true;
    }

    // 각 컨셉에 대해 별도 페이지 생성
    console.log('[ChatPanel] Creating', concepts.length, 'pages for concepts');

    concepts.forEach((concept, index) => {
      // 새 페이지 생성
      const newPage = polotnoStore.addPage({
        width: 1080,
        height: 1920,
        background: '#1F2937',
      });

      console.log(`[ChatPanel] Adding concept ${index + 1}:`, concept.headline);

      // 페이지에 컨셉 내용 추가
      addConceptToPage(newPage, concept);
    });

    // 첫 번째 페이지 선택 (활성화)
    if (polotnoStore.pages.length > 0) {
      polotnoStore.selectPage(polotnoStore.pages[0].id);
      console.log('[ChatPanel] Selected first page');
    }

    console.log('[ChatPanel] ✅ Response added to canvas successfully -', concepts.length, 'pages created');
    return true;
  } catch (error) {
    console.error('[ChatPanel] ❌ Error adding response to canvas:', error);
    return false;
  }
}

export function ChatPanel() {
  const { generate, isLoading: isGenerateLoading, error: generateError, clearError } = useGenerate();
  const { generateConcepts, isLoading: isConceptLoading, error: conceptError } = useConceptGenerate();

  const isLoading = isGenerateLoading || isConceptLoading;
  const error = generateError || conceptError;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTheme = useCanvasStore((state) => state.currentTheme);
  const applyThemeToCanvas = useCanvasStore((state) => state.applyThemeToCanvas);

  // Form State
  const [mode, setMode] = useState<'copy' | 'concept'>('copy');
  const [kind, setKind] = useState<GenerateKind>('product_detail');
  const [prompt, setPrompt] = useState('');
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newFiles.push({
        id: `file-${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf')) return FileText;
    if (type.includes('sheet') || type.includes('excel')) return FileSpreadsheet;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim() && uploadedFiles.length === 0) {
      alert('메시지를 입력하거나 파일을 업로드해주세요');
      return;
    }

    // Polotno Store 확인
    const polotnoStore = getPolotnoStore();
    if (!polotnoStore) {
      alert('Canvas가 초기화되지 않았습니다. Canvas 탭을 먼저 열어주세요.');
      return;
    }

    clearError();

    try {
      console.log('[ChatPanel] Generating:', { mode, kind, prompt, files: uploadedFiles.length });

      if (mode === 'concept') {
        // Concept Generation Mode
        const response = await generateConcepts(prompt, 3);
        console.log('[ChatPanel] Concept Response:', response);

        // Store in GeneratedAssetsStore (ConceptBoardData)
        const conceptBoardData = {
          campaign_id: `campaign-${Date.now()}`,
          campaign_name: prompt.length > 20 ? prompt.substring(0, 20) + '...' : prompt,
          status: 'completed' as const,
          created_at: new Date().toISOString(),
          meeting_summary: {
            title: 'User Request',
            duration_minutes: 0,
            participants: [],
            key_points: [prompt],
            core_message: prompt,
          },
          concepts: response.concepts.map((c, idx) => ({
            concept_id: `concept-${Date.now()}-${idx}`,
            concept_name: c.concept_name,
            concept_description: c.concept_description,
            target_audience: c.target_audience,
            key_message: c.key_message,
            tone_and_manner: c.tone_and_manner,
            visual_style: c.visual_style,
            color_palette: c.color_palette,
            assets: {
              presentation: { id: `pres-${idx}`, status: 'pending' as const },
              product_detail: { id: `detail-${idx}`, status: 'pending' as const },
              instagram_ads: { id: `insta-${idx}`, status: 'pending' as const, count: 0 },
              shorts_script: { id: `shorts-${idx}`, status: 'pending' as const, duration_seconds: 0 },
            },
          })),
        };

        // Update CenterViewStore
        useCenterViewStore.getState().setConceptBoardData(conceptBoardData);

        // Open ConceptBoard View
        useCenterViewStore.getState().openConceptBoard(conceptBoardData.campaign_id);

        // Select first concept
        if (conceptBoardData.concepts.length > 0) {
          useCenterViewStore.getState().setConceptId(conceptBoardData.concepts[0].concept_id);
          useCenterViewStore.getState().setSelectedConcept(conceptBoardData.concepts[0]);
        }

        // Add success message to chat (as a fake response for now)
        setLastResponse({
          kind: 'concept_board',
          text: {
            headline: '컨셉 생성이 완료되었습니다',
            body: response.reasoning,
            bullets: response.concepts.map(c => c.concept_name)
          }
        });

      } else {
        // Existing Copy Generation Mode
        // TODO: 파일이 있으면 multipart/form-data로 전송
        // 지금은 기존 방식으로만 처리
        const response = await generate(kind, prompt);

        console.log('[ChatPanel] Generate response:', response);

        // 응답 저장 (AIResponseRenderer에서 자동 감지)
        setLastResponse(response);

        // 현재 테마를 Canvas에 적용 (배경색 등)
        if (applyThemeToCanvas) {
          applyThemeToCanvas(currentTheme);
        }

        // Polotno Canvas에 결과 반영
        const success = addGenerateResponseToPolotno(response);
        if (success) {
          console.log('[ChatPanel] ✅ Polotno canvas updated successfully');
        } else {
          console.warn('[ChatPanel] ⚠️ Failed to update Polotno canvas');
        }

        // GeneratedAssetsStore에 저장 (좌측 패널 프리뷰용)
        try {
          useGeneratedAssetsStore.getState().parseAndStoreFromAIResponse(
            JSON.stringify(response.text || response),
            prompt
          );

          // CenterViewStore에도 동기화 (Preview 뷰에서 사용)
          // GeneratedConceptBoardData → ConceptBoardData 변환
          const generatedAssets = useGeneratedAssetsStore.getState();
          if (generatedAssets.conceptBoardData) {
            const converted = {
              campaign_id: generatedAssets.conceptBoardData.id,
              campaign_name: generatedAssets.conceptBoardData.campaign_name,
              status: 'completed' as const,
              created_at: generatedAssets.conceptBoardData.createdAt.toISOString(),
              meeting_summary: {
                title: generatedAssets.conceptBoardData.campaign_name,
                duration_minutes: 0,
                participants: [],
                key_points: [],
                core_message: generatedAssets.conceptBoardData.sourceMessage || '',
              },
              concepts: generatedAssets.conceptBoardData.concepts.map((c) => ({
                concept_id: c.concept_id,
                concept_name: c.concept_name,
                concept_description: c.description,
                target_audience: c.target_audience || '',
                key_message: c.headline,
                tone_and_manner: c.tone || '',
                visual_style: '',
                thumbnail_url: undefined,
                assets: {
                  presentation: { id: `pres-${c.concept_id}`, status: 'pending' as const },
                  product_detail: { id: `detail-${c.concept_id}`, status: 'pending' as const },
                  instagram_ads: { id: `insta-${c.concept_id}`, status: 'pending' as const, count: 0 },
                  shorts_script: { id: `shorts-${c.concept_id}`, status: 'pending' as const, duration_seconds: 0 },
                },
              })),
            };
            useCenterViewStore.getState().setConceptBoardData(converted);
            console.log('[ChatPanel] ✅ CenterViewStore synced with conceptBoardData');

            // 생성 완료 후 ConceptBoard 뷰로 자동 전환 + 첫 컨셉 자동 선택
            console.log('[ChatPanel] 🚀 Opening ConceptBoard view...');
            useCenterViewStore.getState().openConceptBoard(converted.campaign_id);

            // 첫 번째 컨셉 자동 선택
            if (converted.concepts && converted.concepts.length > 0) {
              const firstConcept = converted.concepts[0];
              useCenterViewStore.getState().setConceptId(firstConcept.concept_id);
              useCenterViewStore.getState().setSelectedConcept(firstConcept);
              console.log('[ChatPanel] ✅ First concept auto-selected:', firstConcept.concept_id);
            }
          }
        } catch (storeError) {
          console.warn('[ChatPanel] Failed to store in GeneratedAssetsStore:', storeError);
        }
      }

      // 성공 시 초기화
      setPrompt('');
      setUploadedFiles([]);
    } catch (e: any) {
      console.error('[ChatPanel] Generation failed:', e);
      // error는 useGenerate에서 이미 설정되어 있음
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-neutral-200 p-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl">💬</span>
            <h3 className="ml-2 text-sm font-semibold text-neutral-800">
              Spark Chat
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            {isSettingsOpen ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>설정 접기</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>설정 펼치기</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          AI와 대화하여 콘텐츠를 생성하세요
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Settings Section (Collapsible) */}
          {isSettingsOpen && (
            <div className="space-y-4 pb-4 border-b border-neutral-200">
              {/* Mode 선택 */}
              <div>
                <label className="mb-2 block text-xs font-medium text-neutral-700">
                  생성 모드
                </label>
                <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setMode('copy')}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${mode === 'copy'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                  >
                    카피라이팅
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('concept')}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${mode === 'concept'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                  >
                    컨셉 도출
                  </button>
                </div>
              </div>

              {/* Kind 선택 (Copy 모드일 때만) */}
              {mode === 'copy' && (
                <div>
                  <label
                    htmlFor="kind"
                    className="mb-2 block text-xs font-medium text-neutral-700"
                  >
                    콘텐츠 타입
                  </label>
                  <select
                    id="kind"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as GenerateKind)}
                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="product_detail">상품 상세</option>
                    <option value="sns">SNS 콘텐츠</option>
                    <option value="brand_kit">브랜드킷</option>
                    <option value="presentation">프레젠테이션</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* File Upload Area */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 p-2"
                  >
                    <Icon className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 rounded hover:bg-neutral-200 transition-colors"
                    >
                      <X className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 프롬프트 입력 */}
          <div>
            <label
              htmlFor="prompt"
              className="mb-2 block text-xs font-medium text-neutral-700"
            >
              무엇을 만들까요?
            </label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 고급 스킨케어 제품 상세 페이지를 만들어줘"
                className="w-full rounded border border-neutral-300 px-3 py-2 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={4}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 rounded hover:bg-neutral-100 transition-colors"
                title="파일 첨부"
              >
                <Paperclip className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 에러 표시 */}
          {error && (
            <div className="rounded bg-red-50 p-3 text-xs text-red-700">
              <strong>에러:</strong> {error}
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            type="submit"
            disabled={isLoading || (!prompt.trim() && uploadedFiles.length === 0)}
            className="w-full rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isLoading ? '생성 중...' : uploadedFiles.length > 0 ? `생성하기 (${uploadedFiles.length}개 파일 포함)` : '생성하기'}
          </button>
        </form>

        {/* 안내 메시지 */}
        {!isLoading && !error && !lastResponse && (
          <div className="mt-6 rounded bg-blue-50 p-3 text-xs text-blue-700">
            <strong>💡 Tip:</strong> 구체적으로 설명할수록 더 좋은 결과를
            얻을 수 있습니다.
          </div>
        )}

        {/* AI 응답 자동 렌더링 */}
        {lastResponse && !isLoading && (
          <div className="mt-6">
            <AIResponseRenderer
              response={lastResponse}
              responseId={`chat-${Date.now()}`}
              editable={true}
              showFeedback={true}
              showQualityScore={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
