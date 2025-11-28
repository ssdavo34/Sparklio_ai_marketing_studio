/**
 * Right Dock
 *
 * Right dock with multiple tabs (Block 5)
 * - Inspector: Element properties editor
 * - Layers: Element hierarchy view
 * - Chat: AI assistant integration (Backend Agent System)
 *
 * @author C Team (Frontend Team)
 * @version 4.1
 * @date 2025-11-22
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useTabsStore } from '../../stores/useTabsStore';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useChatStore } from '../../stores/useChatStore';
import { useCenterViewStore } from '../../stores/useCenterViewStore';
import { useGeneratedAssetsStore } from '../../stores/useGeneratedAssetsStore';
import { useMeetingStore } from '../../stores/useMeetingStore';
import { useConceptGenerate, type ConceptOutput } from '../../../../hooks/useConceptGenerate';
import type { NextAction } from '@/types/demo';
import { AGENT_INFO, TASK_INFO, TEXT_LLM_INFO, IMAGE_LLM_INFO, VIDEO_LLM_INFO } from '../../stores/types/llm';
import type { AgentRole, TaskType, CostMode, TextLLMProvider, ImageLLMProvider, VideoLLMProvider } from '../../stores/types/llm';
import { MessageSquare, Layers, Settings, ChevronDown, ChevronUp, Paperclip, X, FileText, FileSpreadsheet, Image as ImageIcon, Video, Music, RefreshCw, Search } from 'lucide-react';
import { ErrorMessage } from '../../components/ErrorMessage';
import { getImageMetadata, canRegenerate, isNanoBananaImage, isUnsplashImage } from '@/lib/canvas/image-metadata';
import type { ImageMetadata } from '@/lib/canvas/image-metadata';

type UploadedFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
};

export function RightDock() {
  const activeTab = useTabsStore((state) => state.activeRightDockTab);
  const setActiveTab = useTabsStore((state) => state.setActiveRightDockTab);
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const [, forceUpdate] = useState({});

  // Force re-render when selection changes
  useEffect(() => {
    if (!polotnoStore) return;

    // Poll for changes every 100ms
    const interval = setInterval(() => {
      forceUpdate({});
    }, 100);

    return () => clearInterval(interval);
  }, [polotnoStore]);

  const selectedElements = polotnoStore?.selectedElements || [];
  const selectedElement = selectedElements[0];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'chat'
            ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'inspector'
            ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
        >
          <Settings className="w-4 h-4" />
          Inspector
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'layers'
            ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
        >
          <Layers className="w-4 h-4" />
          Layers
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'inspector' && <InspectorTab element={selectedElement} />}
        {activeTab === 'layers' && <LayersTab />}
      </div>
    </div>
  );
}

// Chat Tab Component
function ChatTab() {
  const {
    messages,
    isLoading: isChatLoading,
    error,
    errorType,
    errorDetails,
    sendMessage,
    generateImageFromPrompt,
    retryLastMessage,
    clearError,
    clearMessages,
    addMessage,
    chatConfig,
    setRole,
    setTask,
    setCostMode,
    setTextLLM,
    setImageLLM,
    setVideoLLM,
  } = useChatStore();

  const { generateConcepts, isLoading: isConceptLoading } = useConceptGenerate();
  const isLoading = isChatLoading || isConceptLoading;

  // Meeting Store - 회의 분석 결과 가져오기
  const { currentMeeting, analysisResult: meetingAnalysis } = useMeetingStore();

  // CenterView Store 연동
  const {
    currentView,
    openConceptBoard,
    openSlidesPreview,
    openDetailPreview,
    openInstagramPreview,
    openShortsPreview,
    backToCanvas,
  } = useCenterViewStore();

  // Generated Assets Store - 생성된 컨셉 데이터 가져오기
  const conceptBoardData = useGeneratedAssetsStore((state) => state.conceptBoardData);
  const firstConceptId = conceptBoardData?.concepts?.[0]?.concept_id || 'no-concept';

  const [input, setInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [mode, setMode] = useState<'chat' | 'concept'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side mount check to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    const message = input.trim();
    setInput('');

    // TODO: 파일이 있으면 multipart/form-data로 전송
    // 지금은 기존 방식으로만 처리하고 파일은 초기화
    if (uploadedFiles.length > 0) {
      console.log('[ChatTab] Files attached:', uploadedFiles.length);
      // 향후 파일을 API로 전송하는 로직 추가
    }

    if (mode === 'concept') {
      // Concept Generation Mode
      try {
        // Add user message manually since we are bypassing sendMessage
        addMessage(
          'user',
          message,
          undefined,
          undefined,
          undefined,
          undefined
        );

        // Meeting Analysis Context 통합
        let context = '';
        if (meetingAnalysis && currentMeeting) {
          context = `
[Meeting Analysis Context]
Title: ${currentMeeting.title}
Summary: ${meetingAnalysis.summary}
Agenda: ${meetingAnalysis.agenda.join(', ')}
Decisions: ${meetingAnalysis.decisions.join(', ')}
Campaign Ideas: ${meetingAnalysis.campaign_ideas.join(', ')}
`;
        }

        const response = await generateConcepts(message, 3, context);

        // Store in GeneratedAssetsStore (ConceptBoardData)
        const conceptBoardData = {
          campaign_id: `campaign-${Date.now()}`,
          campaign_name: message.length > 20 ? message.substring(0, 20) + '...' : message,
          status: 'completed' as const,
          created_at: new Date().toISOString(),
          meeting_summary: {
            title: currentMeeting?.title || 'User Request',
            duration_minutes: 0,
            participants: [],
            key_points: meetingAnalysis?.agenda || [message],
            core_message: meetingAnalysis?.summary || message,
          },
          concepts: response.concepts.map((c: ConceptOutput, idx: number) => ({
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

        // Add assistant message
        addMessage(
          'assistant',
          `✅ 컨셉 생성이 완료되었습니다.\n\n${response.reasoning}`,
          undefined,
          'ConceptAgent',
          'generate_concepts',
          undefined
        );

      } catch (err: any) {
        addMessage('assistant', `❌ 컨셉 생성 실패: ${err.message}`, undefined, undefined, undefined, undefined);
      }
    } else {
      // Normal Chat Mode
      if (chatConfig.task === 'image_generate') {
        await generateImageFromPrompt(message);
      } else {
        await sendMessage(message);
      }
    }

    // 전송 후 파일 초기화
    setUploadedFiles([]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI 어시스턴트</h3>
            <p className="text-xs text-gray-500">
              백엔드 게이트웨이 • 스마트 라우터
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              title={isSettingsOpen ? '설정 접기' : '설정 펼치기'}
            >
              {isSettingsOpen ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>접기</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>펼치기</span>
                </>
              )}
            </button>
            <button
              onClick={clearMessages}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            >
              지우기
            </button>
          </div>
        </div>

        {/* Meeting Context Indicator */}
        {meetingAnalysis && currentMeeting && (
          <div className="mb-2 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-700 truncate">
                회의 분석 컨텍스트 활성화
              </p>
              <p className="text-[10px] text-blue-500 truncate">
                {currentMeeting.title}
              </p>
            </div>
          </div>
        )}

        {/* Settings Section (Collapsible) */}
        {isSettingsOpen && (
          <>
            {/* Mode Selector */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                모드 선택
              </label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setMode('chat')}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${mode === 'chat'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  자유 대화
                </button>
                <button
                  onClick={() => setMode('concept')}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${mode === 'concept'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  컨셉 도출
                </button>
              </div>
            </div>

            {mode === 'chat' && (
              <>
                {/* Agent Role Selector */}
                <div className="mb-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                    에이전트 역할
                  </label>
                  <select
                    value={chatConfig.role}
                    onChange={(e) => setRole(e.target.value as AgentRole)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.entries(AGENT_INFO).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.name} - {info.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Task Selector */}
                <div className="mb-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                    작업 유형
                  </label>
                  <select
                    value={chatConfig.task}
                    onChange={(e) => setTask(e.target.value as TaskType)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.entries(TASK_INFO).map(([taskId, taskInfo]) => (
                      <option key={taskId} value={taskId}>
                        {taskInfo.name} - {taskInfo.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cost Mode Selector */}
                <div className="flex gap-2 mb-2">
                  {(['fast', 'balanced', 'quality'] as CostMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setCostMode(mode)}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${chatConfig.costMode === mode
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {mode === 'fast' && '⚡ 빠름'}
                      {mode === 'balanced' && '⚖️ 균형'}
                      {mode === 'quality' && '✨ 품질'}
                    </button>
                  ))}
                </div>

                {/* LLM Provider Selectors */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  {/* Text LLM Selector */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                      텍스트 LLM
                    </label>
                    <select
                      value={chatConfig.textLLM || 'auto'}
                      onChange={(e) => setTextLLM(e.target.value as TextLLMProvider)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {Object.entries(TEXT_LLM_INFO).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.name} - {info.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* DEMO: Quick View Switch Buttons */}
      <div className="p-2 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-purple-700">DEMO 뷰 전환</span>
          <span className="text-xs text-gray-500">현재: {currentView}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => backToCanvas()}
            className={`px-2 py-1 text-xs rounded transition-colors ${currentView === 'canvas'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-200'
              }`}
          >
            Canvas
          </button>
          <button
            onClick={() => openConceptBoard()}
            className={`px-2 py-1 text-xs rounded transition-colors ${currentView === 'concept_board'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-200'
              }`}
          >
            Concept Board
          </button>
          <button
            onClick={() => openSlidesPreview(firstConceptId, 'pres-1')}
            className={`px-2 py-1 text-xs rounded transition-colors ${currentView === 'slides_preview'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-200'
              }`}
          >
            Slides
          </button>
          <button
            onClick={() => openDetailPreview(firstConceptId, 'detail-1')}
            className={`px-2 py-1 text-xs rounded transition-colors ${currentView === 'detail_preview'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-200'
              }`}
          >
            Detail
          </button>
          <button
            onClick={() => openInstagramPreview(firstConceptId, 'insta-1')}
            className={`px-2 py-1 text-xs rounded transition-colors ${currentView === 'instagram_preview'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-200'
              }`}
          >
            Instagram
          </button>
          <button
            onClick={() => openShortsPreview(firstConceptId, 'shorts-1')}
            className={`px-2 py-1 text-xs rounded transition-colors ${currentView === 'shorts_preview'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-200'
              }`}
          >
            Shorts
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.imageUrl && (
                <div className="mt-2">
                  <img
                    src={message.imageUrl}
                    alt="Generated"
                    className="rounded max-w-full h-auto"
                  />
                </div>
              )}
              {isMounted && (
                <div
                  className={`text-xs mt-1 flex items-center gap-2 ${message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                    }`}
                >
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.agentUsed && (
                    <span className="text-xs opacity-75">
                      • {message.agentUsed}
                      {message.taskUsed && ` → ${message.taskUsed}`}
                    </span>
                  )}
                  {message.usage?.tokens && (
                    <span className="text-xs opacity-75">
                      • {message.usage.tokens} tokens
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        {error && errorType && (
          <ErrorMessage
            type={errorType}
            originalMessage={error}
            details={errorDetails || undefined}
            onRetry={retryLastMessage}
            onDismiss={clearError}
            showRetry={true}
            isRetrying={isLoading}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="mb-2 space-y-1">
            {uploadedFiles.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs"
                >
                  <Icon className="w-3 h-3 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {file.name}
                    </p>
                    <p className="text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter만 누르면 전송, Shift + Enter는 줄바꿈
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder={
                mode === 'concept'
                  ? '어떤 마케팅 컨셉을 원하시나요? (예: 20대 여성을 위한 립스틱)'
                  : chatConfig.task === 'image_generate'
                    ? 'Describe the image you want to generate...'
                    : 'Type a message... (Shift + Enter for new line)'
              }
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="파일 첨부"
            >
              <Paperclip className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mode === 'concept' ? '컨셉 도출' : chatConfig.task === 'image_generate' ? 'Generate' : uploadedFiles.length > 0 ? `Send (${uploadedFiles.length})` : 'Send'}
          </button>
        </form>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}

// Inspector Tab Component
function InspectorTab({ element }: { element: any }) {
  const [showUnsplashModal, setShowUnsplashModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!element) {
    return (
      <div className="p-4 text-center text-gray-400">
        <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No element selected</p>
        <p className="text-xs mt-1">Select an element to edit its properties</p>
      </div>
    );
  }

  // Get image metadata if this is an image element
  const imageMetadata: ImageMetadata | undefined = element.type === 'image' ? getImageMetadata(element) : undefined;
  const canRegenerateImage = canRegenerate(imageMetadata);
  const isAIImage = isNanoBananaImage(imageMetadata);
  const isUnsplash = isUnsplashImage(imageMetadata);

  const handleRegenerateImage = async () => {
    if (!canRegenerateImage || !imageMetadata) return;

    setIsRegenerating(true);
    try {
      // TODO: Call Nano Banana API to regenerate
      console.log('[Inspector] Regenerate image:', {
        prompt: imageMetadata.originalPrompt,
        style: imageMetadata.style,
        previousSeed: imageMetadata.seed,
      });

      // Placeholder: After API call, update element with new image
      // element.set({ src: newImageUrl, custom: newMetadata });

      alert('이미지 재생성 기능이 곧 추가됩니다!');
    } catch (error) {
      console.error('[Inspector] Regeneration failed:', error);
      alert('이미지 재생성 실패');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSearchUnsplash = () => {
    // TODO: Open Unsplash search modal
    setShowUnsplashModal(true);
    alert('Unsplash 검색 모달이 곧 추가됩니다!');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Element Name */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Name</label>
        <div className="mt-1 px-3 py-2 bg-gray-100 rounded text-sm">
          {element.name || element.type}
        </div>
      </div>

      {/* Image Editing Section (only for image elements) */}
      {element.type === 'image' && (
        <div className="border border-purple-200 rounded-lg p-3 bg-purple-50">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-semibold text-purple-900">이미지 편집</h4>
          </div>

          {/* Image Metadata Info */}
          {imageMetadata && (
            <div className="mb-3 p-2 bg-white rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">소스:</span>
                <span className="font-medium text-gray-900">
                  {imageMetadata.source === 'nano_banana' && '🤖 AI 생성'}
                  {imageMetadata.source === 'unsplash' && '📷 Unsplash'}
                  {imageMetadata.source === 'upload' && '📁 업로드'}
                  {imageMetadata.source === 'placeholder' && '🖼️ 플레이스홀더'}
                </span>
              </div>
              {imageMetadata.originalPrompt && (
                <div>
                  <span className="text-gray-600">프롬프트:</span>
                  <p className="text-gray-900 mt-0.5 line-clamp-2">
                    {imageMetadata.originalPrompt}
                  </p>
                </div>
              )}
              {imageMetadata.style && (
                <div className="flex justify-between">
                  <span className="text-gray-600">스타일:</span>
                  <span className="font-medium text-gray-900">{imageMetadata.style}</span>
                </div>
              )}
              {imageMetadata.regenerationCount !== undefined && imageMetadata.regenerationCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">재생성 횟수:</span>
                  <span className="font-medium text-gray-900">{imageMetadata.regenerationCount}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Regenerate with Nano Banana */}
            {canRegenerateImage && (
              <button
                onClick={handleRegenerateImage}
                disabled={isRegenerating}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? '재생성 중...' : 'AI 이미지 재생성'}
              </button>
            )}

            {/* Search Unsplash */}
            <button
              onClick={handleSearchUnsplash}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Search className="w-4 h-4" />
              Unsplash 검색
            </button>

            {/* Upload Image */}
            <button
              onClick={() => alert('파일 업로드 기능이 곧 추가됩니다!')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <ImageIcon className="w-4 h-4" />
              이미지 업로드
            </button>
          </div>

          {/* Unsplash Attribution */}
          {isUnsplash && imageMetadata?.unsplashAttribution && (
            <div className="mt-3 p-2 bg-white rounded text-xs text-gray-600">
              <p>
                Photo by <span className="font-medium">{imageMetadata.unsplashAttribution.photographerName}</span> on Unsplash
              </p>
            </div>
          )}
        </div>
      )}

      {/* Position */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Position</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600">X</label>
            <input
              type="number"
              value={Math.round(element.x || 0)}
              onChange={(e) => element.set({ x: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Y</label>
            <input
              type="number"
              value={Math.round(element.y || 0)}
              onChange={(e) => element.set({ y: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Size</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600">Width</label>
            <input
              type="number"
              value={Math.round(element.width || 0)}
              onChange={(e) => element.set({ width: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Height</label>
            <input
              type="number"
              value={Math.round(element.height || 0)}
              onChange={(e) => element.set({ height: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Rotation</label>
        <input
          type="number"
          value={Math.round(element.rotation || 0)}
          onChange={(e) => element.set({ rotation: Number(e.target.value) })}
          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Opacity</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={element.opacity || 1}
          onChange={(e) => element.set({ opacity: Number(e.target.value) })}
          className="mt-1 w-full"
        />
        <div className="text-xs text-gray-600 mt-1">
          {Math.round((element.opacity || 1) * 100)}%
        </div>
      </div>

      {/* Text specific properties */}
      {element.type === 'text' && (
        <>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">Text</label>
            <textarea
              value={element.text || ''}
              onChange={(e) => element.set({ text: e.target.value })}
              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">Font Size</label>
            <input
              type="number"
              value={element.fontSize || 16}
              onChange={(e) => element.set({ fontSize: Number(e.target.value) })}
              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">Color</label>
            <input
              type="color"
              value={element.fill || '#000000'}
              onChange={(e) => element.set({ fill: e.target.value })}
              className="mt-1 w-full h-10 border border-gray-300 rounded"
            />
          </div>
        </>
      )}
    </div>
  );
}

// Layers Tab Component
function LayersTab() {
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const [, forceUpdate] = useState({});

  // Force re-render when layers change
  useEffect(() => {
    if (!polotnoStore) return;

    // Poll for changes every 100ms
    const interval = setInterval(() => {
      forceUpdate({});
    }, 100);

    return () => clearInterval(interval);
  }, [polotnoStore]);

  const activePage = polotnoStore?.activePage;
  const elements = activePage?.children || [];
  // Reverse the array to show top layers first
  const reversedElements = [...elements].reverse();

  const moveLayerUp = (element: any) => {
    element.moveUp();
  };

  const moveLayerDown = (element: any) => {
    element.moveDown();
  };

  const moveToTop = (element: any) => {
    // Move to top by repeatedly calling moveUp
    while (element.zIndex < elements.length - 1) {
      element.moveUp();
    }
  };

  const moveToBottom = (element: any) => {
    // Move to bottom by repeatedly calling moveDown
    while (element.zIndex > 0) {
      element.moveDown();
    }
  };

  return (
    <div className="p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Elements</h3>
        <p className="text-xs text-gray-500">{elements.length} items</p>
      </div>

      {elements.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No elements</p>
          <p className="text-xs mt-1">Add elements to the canvas</p>
        </div>
      ) : (
        <div className="space-y-1">
          {reversedElements.map((element: any, index: number) => {
            const isSelected = polotnoStore?.selectedElements.includes(element);
            const actualIndex = elements.length - index;

            return (
              <div
                key={element.id}
                onClick={() => polotnoStore?.selectElements([element.id])}
                className={`px-3 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm flex items-center justify-between ${isSelected ? 'bg-purple-50 border border-purple-300' : ''
                  }`}
              >
                <span className="font-medium">{element.name || element.type}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveToTop(element);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                    title="Move to top"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerUp(element);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Move up one layer"
                  >
                    ▲
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerDown(element);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Move down one layer"
                  >
                    ▼
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveToBottom(element);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                    title="Move to bottom"
                  >
                    ⬇️
                  </button>
                  <span className="text-xs text-gray-400 ml-1">#{actualIndex}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
