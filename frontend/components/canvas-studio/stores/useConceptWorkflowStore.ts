/**
 * Concept Workflow Store
 *
 * 컨셉보드 통합 워크플로우 상태 관리
 * - 4단계 모달 워크플로우
 * - BrandKit, Meeting AI, Brief, Chat 데이터 통합
 * - 컨셉 생성 및 이미지 프롬프트 편집
 * - 채널별 산출물 생성
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  WorkflowStep,
  IntegratedSourceData,
  OutputTargets,
  GeneratedConceptExtended,
  GenerationProgress,
  DataSourceType,
  SourceData,
  ChannelConfig,
  OutputChannelType,
  ConceptImagePrompts,
  ImagePromptConfig,
  ConceptWorkflowActions,
  ConceptGenerationModalState,
} from '@/types/conceptGeneration';
import {
  DEFAULT_OUTPUT_TARGETS,
  INITIAL_GENERATION_PROGRESS,
  createDefaultImagePrompt,
} from '@/types/conceptGeneration';
import { generateConcepts as callConceptAgent } from '@/lib/llm-gateway-client';
import { useGeneratedAssetsStore } from './useGeneratedAssetsStore';
import { useBrandStore } from './useBrandStore';
import { useBriefStore } from './useBriefStore';

// =============================================================================
// Initial State
// =============================================================================

const initialSourceData: IntegratedSourceData = {
  activeSources: [],
  lastUpdated: new Date(),
};

const initialState: ConceptGenerationModalState = {
  isOpen: false,
  currentStep: 1,
  sourceData: initialSourceData,
  outputTargets: DEFAULT_OUTPUT_TARGETS,
  generatedConcepts: [],
  selectedConceptId: null,
  progress: INITIAL_GENERATION_PROGRESS,
  error: null,
};

// =============================================================================
// Store Type
// =============================================================================

interface ConceptWorkflowState extends ConceptGenerationModalState, ConceptWorkflowActions {}

// =============================================================================
// Store Implementation
// =============================================================================

export const useConceptWorkflowStore = create<ConceptWorkflowState>()(
  devtools(
    (set, get) => ({
      // ========================================
      // Initial State
      // ========================================
      ...initialState,

      // ========================================
      // Modal 제어
      // ========================================

      /**
       * 모달 열기
       * @param initialSource 초기 소스 데이터 (선택)
       */
      openModal: (initialSource?: SourceData) => {
        const newState: Partial<ConceptGenerationModalState> = {
          isOpen: true,
          currentStep: 1,
          error: null,
        };

        // 초기 소스가 있으면 추가
        if (initialSource) {
          const sourceData: IntegratedSourceData = {
            activeSources: [initialSource.sourceType],
            lastUpdated: new Date(),
          };

          switch (initialSource.sourceType) {
            case 'brandKit':
              sourceData.brandKit = initialSource;
              break;
            case 'meeting':
              sourceData.meeting = initialSource;
              break;
            case 'brief':
              sourceData.brief = initialSource;
              break;
            case 'chat':
              sourceData.chat = initialSource;
              break;
            case 'manual':
              sourceData.manual = initialSource;
              break;
          }

          newState.sourceData = sourceData;
        } else {
          // 초기 소스가 없으면 자동으로 현재 컨텍스트에서 수집
          newState.sourceData = get().collectCurrentContext();
        }

        set(newState);
      },

      /**
       * 모달 닫기
       */
      closeModal: () => {
        set({ isOpen: false });
      },

      // ========================================
      // 단계 제어
      // ========================================

      /**
       * 특정 단계로 이동
       */
      goToStep: (step: WorkflowStep) => {
        set({ currentStep: step });
      },

      /**
       * 다음 단계로 이동
       */
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 4) {
          set({ currentStep: (currentStep + 1) as WorkflowStep });
        }
      },

      /**
       * 이전 단계로 이동
       */
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as WorkflowStep });
        }
      },

      // ========================================
      // 소스 데이터 관리
      // ========================================

      /**
       * 소스 데이터 설정
       */
      setSourceData: (data: Partial<IntegratedSourceData>) => {
        set((state) => ({
          sourceData: {
            ...state.sourceData,
            ...data,
            lastUpdated: new Date(),
          },
        }));
      },

      /**
       * 소스 추가
       */
      addSource: (source: SourceData) => {
        set((state) => {
          const newSourceData = { ...state.sourceData };

          // 활성 소스에 추가 (중복 제거)
          if (!newSourceData.activeSources.includes(source.sourceType)) {
            newSourceData.activeSources = [...newSourceData.activeSources, source.sourceType];
          }

          // 소스 데이터 설정
          switch (source.sourceType) {
            case 'brandKit':
              newSourceData.brandKit = source;
              break;
            case 'meeting':
              newSourceData.meeting = source;
              break;
            case 'brief':
              newSourceData.brief = source;
              break;
            case 'chat':
              newSourceData.chat = source;
              break;
            case 'manual':
              newSourceData.manual = source;
              break;
          }

          newSourceData.lastUpdated = new Date();
          return { sourceData: newSourceData };
        });
      },

      /**
       * 소스 제거
       */
      removeSource: (sourceType: DataSourceType) => {
        set((state) => {
          const newSourceData = { ...state.sourceData };

          // 활성 소스에서 제거
          newSourceData.activeSources = newSourceData.activeSources.filter((s) => s !== sourceType);

          // 소스 데이터 제거
          switch (sourceType) {
            case 'brandKit':
              delete newSourceData.brandKit;
              break;
            case 'meeting':
              delete newSourceData.meeting;
              break;
            case 'brief':
              delete newSourceData.brief;
              break;
            case 'chat':
              delete newSourceData.chat;
              break;
            case 'manual':
              delete newSourceData.manual;
              break;
          }

          newSourceData.lastUpdated = new Date();
          return { sourceData: newSourceData };
        });
      },

      /**
       * 모든 소스 제거
       */
      clearSources: () => {
        set({
          sourceData: {
            activeSources: [],
            lastUpdated: new Date(),
          },
        });
      },

      /**
       * 현재 컨텍스트에서 소스 데이터 수집
       */
      collectCurrentContext: (): IntegratedSourceData => {
        const sourceData: IntegratedSourceData = {
          activeSources: [],
          lastUpdated: new Date(),
        };

        // BrandKit/BrandDNA에서 수집
        const brandStore = useBrandStore.getState();
        if (brandStore.brandDNA || brandStore.brandKit) {
          const dna = brandStore.brandDNA;
          const kit = brandStore.brandKit;

          // BrandToneOfVoice 생성
          const toneKeywordsList = dna?.tone?.split(',').map((t: string) => t.trim()) || kit?.toneKeywords || [];
          const toneOfVoice = dna ? {
            summary: dna.tone,
            keywords: toneKeywordsList,
            dos: dna.dos || [],
            donts: dna.donts || [],
          } : undefined;

          // BrandAudience 생성
          const audience = dna ? {
            summary: dna.target_audience,
            segments: [],
            painPoints: [],
            needs: [],
          } : undefined;

          sourceData.brandKit = {
            sourceType: 'brandKit',
            brandId: kit?.id || '',
            brandName: kit?.id ? `Brand ${kit.id.slice(0, 8)}` : 'Unknown Brand',
            category: undefined,
            oneLiner: dna?.key_messages?.[0] || kit?.keyMessages?.[0] || '',
            description: dna?.key_messages?.join('. ') || kit?.keyMessages?.join('. ') || '',
            tone: toneOfVoice,
            audience: audience,
            colors: kit ? [
              { hex: kit.primaryColor, role: 'primary' as const },
              ...(kit.secondaryColor ? [{ hex: kit.secondaryColor, role: 'secondary' as const }] : []),
              ...(kit.accentColor ? [{ hex: kit.accentColor, role: 'accent' as const }] : []),
            ] : undefined,
            keywords: toneKeywordsList,
          };
          sourceData.activeSources.push('brandKit');
        }

        // Brief에서 수집
        const briefStore = useBriefStore.getState();
        if (briefStore.brief) {
          sourceData.brief = {
            sourceType: 'brief',
            briefId: briefStore.brief.id || '',
            goal: briefStore.brief.goal || '',
            target: briefStore.brief.target || '',
            insight: briefStore.brief.insight || '',
            keyMessages: briefStore.brief.keyMessages || [],
            channels: briefStore.brief.channels || [],
            kpis: briefStore.brief.kpis || [],
          };
          sourceData.activeSources.push('brief');
        }

        // Meeting에서 수집 (GeneratedAssets에서)
        const assetsStore = useGeneratedAssetsStore.getState();
        if (assetsStore.conceptBoardData?.sourceMessage) {
          // Meeting 소스가 있는 경우
          const conceptBoardData = assetsStore.conceptBoardData;
          if (conceptBoardData.sourceMessage?.includes('meeting')) {
            // TODO: Meeting 데이터 복원 로직 필요
          }
        }

        return sourceData;
      },

      // ========================================
      // 산출물 대상 설정
      // ========================================

      /**
       * 산출물 대상 설정
       */
      setOutputTargets: (targets: Partial<OutputTargets>) => {
        set((state) => ({
          outputTargets: {
            ...state.outputTargets,
            ...targets,
          },
        }));
      },

      /**
       * 채널 토글
       */
      toggleChannel: (channel: OutputChannelType, enabled: boolean) => {
        set((state) => {
          const channelKey = channel === 'detail_page' ? 'detailPage' : channel;
          return {
            outputTargets: {
              ...state.outputTargets,
              [channelKey]: {
                ...state.outputTargets[channelKey as keyof OutputTargets],
                enabled,
              },
            },
          };
        });
      },

      /**
       * 채널 설정 업데이트
       */
      updateChannelConfig: (channel: OutputChannelType, config: Partial<ChannelConfig>) => {
        set((state) => {
          const channelKey = channel === 'detail_page' ? 'detailPage' : channel;
          return {
            outputTargets: {
              ...state.outputTargets,
              [channelKey]: {
                ...state.outputTargets[channelKey as keyof OutputTargets],
                ...config,
              },
            },
          };
        });
      },

      // ========================================
      // 컨셉 관리
      // ========================================

      /**
       * 생성된 컨셉 설정
       */
      setGeneratedConcepts: (concepts: GeneratedConceptExtended[]) => {
        set({ generatedConcepts: concepts });
      },

      /**
       * 컨셉 업데이트
       */
      updateConcept: (conceptId: string, updates: Partial<GeneratedConceptExtended>) => {
        set((state) => ({
          generatedConcepts: state.generatedConcepts.map((concept) =>
            concept.conceptId === conceptId
              ? { ...concept, ...updates, isEdited: true }
              : concept
          ),
        }));
      },

      /**
       * 컨셉 선택
       */
      selectConcept: (conceptId: string) => {
        set((state) => ({
          selectedConceptId: conceptId,
          generatedConcepts: state.generatedConcepts.map((concept) => ({
            ...concept,
            isSelected: concept.conceptId === conceptId,
          })),
        }));
      },

      /**
       * 이미지 프롬프트 업데이트
       */
      updateImagePrompt: (
        conceptId: string,
        channel: keyof ConceptImagePrompts,
        index: number,
        prompt: Partial<ImagePromptConfig>
      ) => {
        set((state) => ({
          generatedConcepts: state.generatedConcepts.map((concept) => {
            if (concept.conceptId !== conceptId) return concept;

            const imagePrompts = { ...concept.imagePrompts };

            if (channel === 'main') {
              imagePrompts.main = {
                ...imagePrompts.main,
                ...prompt,
                isEdited: true,
              };
            } else if (channel === 'shortsThumbnail') {
              imagePrompts.shortsThumbnail = {
                ...(imagePrompts.shortsThumbnail || createDefaultImagePrompt()),
                ...prompt,
                isEdited: true,
              };
            } else {
              // slides, instagram, detailPage
              const arr = imagePrompts[channel] || [];
              const newArr = [...arr];
              newArr[index] = {
                ...(newArr[index] || createDefaultImagePrompt()),
                ...prompt,
                isEdited: true,
              };
              imagePrompts[channel] = newArr;
            }

            return { ...concept, imagePrompts, isEdited: true };
          }),
        }));
      },

      // ========================================
      // 생성 제어
      // ========================================

      /**
       * 컨셉 생성
       */
      generateConcepts: async () => {
        const { sourceData, outputTargets, setProgress, setError, setGeneratedConcepts } = get();

        try {
          setProgress({
            overallStatus: 'generating',
            currentStep: 3,
            channels: {
              ...INITIAL_GENERATION_PROGRESS.channels,
              concepts: { status: 'generating', progress: 0 },
            },
          });

          // 소스 데이터를 프롬프트로 변환
          const prompt = buildPromptFromSources(sourceData, outputTargets);

          console.log('[generateConcepts] 프롬프트:', prompt);

          // ConceptAgent v3 호출
          const response = await callConceptAgent({
            prompt,
            conceptCount: 3,
          });

          console.log('[generateConcepts] 응답:', response);

          // 응답을 GeneratedConceptExtended로 변환
          const concepts: GeneratedConceptExtended[] = response.concepts.map((c: any, idx: number) => ({
            conceptId: c.id || `concept-${Date.now()}-${idx}`,
            conceptName: c.name || `컨셉 ${idx + 1}`,
            description: c.topic || c.description || '',
            headline: c.core_promise || c.headline || '',
            subheadline: c.audience_insight || '',
            cta: '자세히 알아보기',
            taglines: c.hook_patterns || [],
            targetAudience: c.target_audience || '',
            tone: c.tone_and_manner || '',
            visualWorld: c.visual_world || {
              color_palette: '',
              photo_style: '',
              layout_motifs: [],
              hex_colors: [],
            },
            channelStrategy: c.channel_strategy || {},
            guardrails: c.guardrails || { avoid_claims: [], must_include: [] },
            imagePrompts: {
              main: createDefaultImagePrompt('product', '1:1'),
            },
            isSelected: idx === 0,
            isEdited: false,
            originalConcept: c,
          }));

          setGeneratedConcepts(concepts);

          // 첫 번째 컨셉 선택
          if (concepts.length > 0) {
            set({ selectedConceptId: concepts[0].conceptId });
          }

          setProgress({
            overallStatus: 'completed',
            channels: {
              ...get().progress.channels,
              concepts: { status: 'completed', progress: 100 },
            },
          });

        } catch (error) {
          console.error('[generateConcepts] 에러:', error);

          // 에러 메시지 추출
          let errorMessage = '컨셉 생성 실패';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object') {
            // API 에러 응답 형태 처리
            const errObj = error as any;
            errorMessage = errObj.message || errObj.error || errObj.detail || JSON.stringify(error);
          }

          setError(errorMessage);
          setProgress({
            overallStatus: 'failed',
            channels: {
              ...get().progress.channels,
              concepts: { status: 'failed', progress: 0, error: errorMessage },
            },
          });
        }
      },

      /**
       * 이미지 프롬프트 생성
       */
      generateImagePrompts: async (conceptId: string) => {
        const { generatedConcepts, outputTargets, setProgress, updateConcept } = get();

        const concept = generatedConcepts.find((c) => c.conceptId === conceptId);
        if (!concept) return;

        try {
          setProgress({
            channels: {
              ...get().progress.channels,
              imagePrompts: { status: 'generating', progress: 0 },
            },
          });

          // 이미지 프롬프트 생성 로직
          const imagePrompts: ConceptImagePrompts = {
            main: {
              prompt: `${concept.conceptName}, professional product photography, studio lighting, clean background, high quality, commercial advertising`,
              negativePrompt: 'blurry, low quality, distorted, text, watermark',
              style: 'product',
              aspectRatio: '1:1',
              isEdited: false,
            },
          };

          // 프레젠테이션 이미지
          if (outputTargets.presentation.enabled) {
            imagePrompts.slides = Array(outputTargets.presentation.pageCount)
              .fill(null)
              .map((_, i) => ({
                prompt: `${concept.conceptName}, slide ${i + 1}, professional presentation, ${concept.visualWorld.photo_style || 'modern design'}`,
                negativePrompt: 'blurry, low quality, text',
                style: 'photorealistic' as const,
                aspectRatio: '16:9' as const,
                isEdited: false,
              }));
          }

          // 인스타그램 이미지
          if (outputTargets.instagram.enabled) {
            imagePrompts.instagram = Array(outputTargets.instagram.adCount)
              .fill(null)
              .map((_, i) => ({
                prompt: `${concept.conceptName}, instagram ad ${i + 1}, social media, trendy, eye-catching, ${concept.visualWorld.color_palette || 'vibrant colors'}`,
                negativePrompt: 'blurry, low quality, text overlay',
                style: 'lifestyle' as const,
                aspectRatio: outputTargets.instagram.format === 'story' ? '9:16' as const : '1:1' as const,
                isEdited: false,
              }));
          }

          // 상세페이지 이미지
          if (outputTargets.detailPage.enabled) {
            imagePrompts.detailPage = Array(Math.min(outputTargets.detailPage.sectionCount, 4))
              .fill(null)
              .map((_, i) => ({
                prompt: `${concept.conceptName}, detail page section ${i + 1}, product detail, ${concept.visualWorld.photo_style || 'clean and professional'}`,
                negativePrompt: 'blurry, low quality, cluttered',
                style: 'product' as const,
                aspectRatio: '16:9' as const,
                isEdited: false,
              }));
          }

          updateConcept(conceptId, { imagePrompts });

          setProgress({
            channels: {
              ...get().progress.channels,
              imagePrompts: { status: 'completed', progress: 100 },
            },
          });

        } catch (error) {
          console.error('[generateImagePrompts] 에러:', error);
          setProgress({
            channels: {
              ...get().progress.channels,
              imagePrompts: { status: 'failed', progress: 0, error: String(error) },
            },
          });
        }
      },

      /**
       * 이미지 생성 (Z-Image 사용)
       */
      generateImages: async (conceptId: string) => {
        // TODO: Z-Image API 연동
        console.log('[generateImages] conceptId:', conceptId);
      },

      /**
       * 모든 산출물 생성
       */
      generateAllOutputs: async () => {
        const { selectedConceptId, generatedConcepts, outputTargets, setProgress, closeModal } = get();

        if (!selectedConceptId) {
          console.error('[generateAllOutputs] 선택된 컨셉이 없습니다');
          return;
        }

        const selectedConcept = generatedConcepts.find((c) => c.conceptId === selectedConceptId);
        if (!selectedConcept) {
          console.error('[generateAllOutputs] 선택된 컨셉을 찾을 수 없습니다');
          return;
        }

        try {
          setProgress({
            overallStatus: 'generating',
            currentStep: 4,
          });

          // GeneratedAssetsStore에 컨셉 데이터 저장
          const assetsStore = useGeneratedAssetsStore.getState();

          // 컨셉을 GeneratedConcept 형식으로 변환
          const generatedConcept = {
            concept_id: selectedConcept.conceptId,
            concept_name: selectedConcept.conceptName,
            description: selectedConcept.description,
            headline: selectedConcept.headline,
            subheadline: selectedConcept.subheadline,
            cta: selectedConcept.cta,
            target_audience: selectedConcept.targetAudience,
            tone: selectedConcept.tone,
          };

          // 채널별 산출물 생성
          const promises: Promise<void>[] = [];

          if (outputTargets.presentation.enabled) {
            setProgress({
              channels: {
                ...get().progress.channels,
                presentation: { status: 'generating', progress: 0 },
              },
            });
            promises.push(
              assetsStore.generateSlidesFromConcept(generatedConcept).then(() => {
                setProgress({
                  channels: {
                    ...get().progress.channels,
                    presentation: { status: 'completed', progress: 100 },
                  },
                });
              })
            );
          }

          if (outputTargets.instagram.enabled) {
            setProgress({
              channels: {
                ...get().progress.channels,
                instagram: { status: 'generating', progress: 0 },
              },
            });
            promises.push(
              assetsStore.generateInstagramFromConcept(generatedConcept).then(() => {
                setProgress({
                  channels: {
                    ...get().progress.channels,
                    instagram: { status: 'completed', progress: 100 },
                  },
                });
              })
            );
          }

          if (outputTargets.detailPage.enabled) {
            setProgress({
              channels: {
                ...get().progress.channels,
                detailPage: { status: 'generating', progress: 0 },
              },
            });
            promises.push(
              assetsStore.generateDetailFromConcept(generatedConcept).then(() => {
                setProgress({
                  channels: {
                    ...get().progress.channels,
                    detailPage: { status: 'completed', progress: 100 },
                  },
                });
              })
            );
          }

          if (outputTargets.shorts.enabled) {
            setProgress({
              channels: {
                ...get().progress.channels,
                shorts: { status: 'generating', progress: 0 },
              },
            });
            promises.push(
              assetsStore.generateShortsFromConcept(generatedConcept).then(() => {
                setProgress({
                  channels: {
                    ...get().progress.channels,
                    shorts: { status: 'completed', progress: 100 },
                  },
                });
              })
            );
          }

          await Promise.all(promises);

          setProgress({
            overallStatus: 'completed',
            overallProgress: 100,
            completedAt: new Date(),
          });

          // 모달 닫기
          closeModal();

          // TODO: 생성된 채널 탭으로 이동

        } catch (error) {
          console.error('[generateAllOutputs] 에러:', error);
          setProgress({
            overallStatus: 'failed',
          });
        }
      },

      // ========================================
      // 진행 상태
      // ========================================

      /**
       * 진행 상태 설정
       */
      setProgress: (progress: Partial<GenerationProgress>) => {
        set((state) => ({
          progress: {
            ...state.progress,
            ...progress,
            channels: {
              ...state.progress.channels,
              ...(progress.channels || {}),
            },
          },
        }));
      },

      /**
       * 진행 상태 초기화
       */
      resetProgress: () => {
        set({ progress: INITIAL_GENERATION_PROGRESS });
      },

      // ========================================
      // 에러 처리
      // ========================================

      /**
       * 에러 설정
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * 에러 제거
       */
      clearError: () => {
        set({ error: null });
      },

      // ========================================
      // 전체 초기화
      // ========================================

      /**
       * 전체 상태 초기화
       */
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'ConceptWorkflowStore' }
  )
);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 소스 데이터를 프롬프트로 변환
 */
function buildPromptFromSources(
  sourceData: IntegratedSourceData,
  outputTargets: OutputTargets
): string {
  const parts: string[] = [];

  // BrandKit 정보
  if (sourceData.brandKit) {
    const { brandName, category, oneLiner, description, tone, audience, keywords } = sourceData.brandKit;
    parts.push(`[브랜드 정보]
- 브랜드명: ${brandName}
- 카테고리: ${category || '미정'}
- 슬로건: ${oneLiner || ''}
- 설명: ${description || ''}
- 톤앤매너: ${tone?.summary || ''}
- 타겟 오디언스: ${audience?.summary || ''}
- 키워드: ${keywords?.join(', ') || ''}`);
  }

  // Brief 정보
  if (sourceData.brief) {
    const { goal, target, insight, keyMessages, channels, kpis } = sourceData.brief;
    parts.push(`[캠페인 브리프]
- 목표: ${goal}
- 타겟: ${target}
- 인사이트: ${insight}
- 핵심 메시지: ${keyMessages.join(', ')}
- 채널: ${channels.join(', ')}
- KPI: ${kpis.join(', ')}`);
  }

  // Meeting 정보
  if (sourceData.meeting) {
    const { meetingTitle, summary, campaignIdeas, keywords } = sourceData.meeting;
    parts.push(`[미팅 분석 결과]
- 제목: ${meetingTitle}
- 요약: ${summary}
- 캠페인 아이디어: ${campaignIdeas.join(', ')}
- 키워드: ${keywords.join(', ')}`);
  }

  // Chat 정보
  if (sourceData.chat) {
    parts.push(`[사용자 요청]
${sourceData.chat.userPrompt}`);
  }

  // Manual 정보
  if (sourceData.manual) {
    parts.push(`[직접 입력]
- 제목: ${sourceData.manual.title}
- 설명: ${sourceData.manual.description}`);
  }

  // 산출물 대상 정보
  const enabledChannels: string[] = [];
  if (outputTargets.presentation.enabled) {
    enabledChannels.push(`프레젠테이션 ${outputTargets.presentation.pageCount}페이지`);
  }
  if (outputTargets.instagram.enabled) {
    enabledChannels.push(`인스타그램 광고 ${outputTargets.instagram.adCount}개`);
  }
  if (outputTargets.detailPage.enabled) {
    enabledChannels.push(`상세페이지 ${outputTargets.detailPage.sectionCount}섹션`);
  }
  if (outputTargets.shorts.enabled) {
    enabledChannels.push(`쇼츠 스크립트 ${outputTargets.shorts.duration}초`);
  }

  if (enabledChannels.length > 0) {
    parts.push(`[산출물 대상]
${enabledChannels.join('\n')}`);
  }

  return parts.join('\n\n');
}

// =============================================================================
// Exports
// =============================================================================

export type { ConceptWorkflowState };
