/**
 * Brand Kit Tab
 *
 * Brand OS Module 통합:
 * - 브랜드 문서 업로드 (PDF, 이미지)
 * - URL 크롤링
 * - Brand DNA 자동 분석
 * - 문서 목록 및 관리
 *
 * @author C Team (Frontend Team)
 * @version 2.0
 * @date 2025-11-24
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Upload,
  Link,
  FileText,
  Sparkles,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useWorkspaceStore } from '../../../stores';
import {
  uploadBrandDocument,
  crawlBrandUrl,
  listBrandDocuments,
  deleteBrandDocument,
  analyzeBrand,
  type BrandDocument,
  type BrandDNA,
} from '@/lib/api/brand-api';
import { toast } from '@/components/ui/Toast';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { addBrandIdentityToCanvas } from '@/lib/canvas/brandIdentityTemplate';

export function BrandKitTab() {
  // 임시로 workspace에서 브랜드 ID 가져오기
  // 임시로 workspace에서 브랜드 ID 가져오기
  const { currentWorkspace } = useWorkspaceStore();

  // Auth Check & Brand ID Selection
  // If not authenticated, ALWAYS use Demo Brand ID (Nil UUID)
  // If authenticated, use workspace ID
  const [brandId, setBrandId] = useState<string>('00000000-0000-0000-0000-000000000000');

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      if (token && currentWorkspace?.id) {
        setBrandId(currentWorkspace.id);
      } else {
        setBrandId('00000000-0000-0000-0000-000000000000');
      }
    };

    checkAuth();
    // Listen for storage changes (login/logout)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [currentWorkspace]);

  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const currentTemplate = useCanvasStore((state) => state.currentTemplate);

  const [documents, setDocuments] = useState<BrandDocument[]>([]);
  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null);
  const [uploading, setUploading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [showDNAResult, setShowDNAResult] = useState(false);
  const [progress, setProgress] = useState(0);

  // 분석 상태 관련
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStatus, setAnalyzeStatus] = useState<'idle' | 'analyzing' | 'completed' | 'failed'>('idle');
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const analyzeAbortRef = useRef<AbortController | null>(null);
  const analyzeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load documents on mount
  useEffect(() => {
    if (!brandId) return;

    const loadDocuments = async () => {
      try {
        const result = await listBrandDocuments(brandId);
        setDocuments(result.documents);
      } catch (error) {
        console.error('Failed to load documents:', error);
        // Don't show error toast on mount - just log it
      }
    };

    loadDocuments();
  }, [brandId]);

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !brandId) return;

    setUploading(true);
    try {
      // 실제 API 호출
      const documentType = file.type.includes('pdf') ? 'pdf' : 'image';
      const doc = await uploadBrandDocument(brandId, file, file.name, documentType);

      setDocuments((prev) => [...prev, doc]);
      toast.success(`"${file.name}" 업로드 완료! 자동으로 임베딩이 생성됩니다.`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`업로드 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // URL 크롤링
  const handleCrawlUrl = async (urlToCrawl?: string) => {
    const targetUrl = urlToCrawl || urlInput;
    if (!targetUrl.trim() || !brandId) return;

    setCrawling(true);
    setProgress(0);
    setShowUrlForm(true); // Retry 시 폼이 닫혀있을 수 있으므로 열기

    // AbortController 설정
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 가짜 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      // 실제 API 호출 (Signal 전달은 api-client 수정 필요하지만, 여기서는 UI적 중단만 처리)
      // TODO: api-client에 signal 전달 기능 추가 권장
      const doc = await crawlBrandUrl(brandId, targetUrl);

      clearInterval(progressInterval);
      setProgress(100);

      setDocuments((prev) => [...prev, doc]);
      if (!urlToCrawl) setUrlInput(''); // Retry가 아닐 때만 초기화
      setShowUrlForm(false);
      toast.success('URL 크롤링 완료! 자동으로 임베딩이 생성됩니다.');
    } catch (error: any) {
      clearInterval(progressInterval);
      if (error.name === 'AbortError') {
        toast.info('크롤링이 중단되었습니다.');
      } else {
        console.error('Crawling failed:', error);
        toast.error(`크롤링 실패: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setCrawling(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  // 크롤링 중지
  const handleStopCrawl = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setCrawling(false);
      setProgress(0);
      toast.info('사용자에 의해 크롤링이 중지되었습니다.');
    }
  };

  // 재시도
  const handleRetry = (url: string) => {
    setUrlInput(url);
    handleCrawlUrl(url);
  };

  // 분석 진행률 정리
  const cleanupAnalyzeProgress = () => {
    if (analyzeIntervalRef.current) {
      clearInterval(analyzeIntervalRef.current);
      analyzeIntervalRef.current = null;
    }
  };

  // Brand DNA 분석
  const handleAnalyze = async () => {
    if (!brandId) return;

    if (documents.length === 0) {
      toast.warning('먼저 브랜드 문서를 업로드해주세요.');
      return;
    }

    // 이전 분석 중단
    if (analyzeAbortRef.current) {
      analyzeAbortRef.current.abort();
    }
    cleanupAnalyzeProgress();

    // 새 AbortController 설정
    const abortController = new AbortController();
    analyzeAbortRef.current = abortController;

    setAnalyzing(true);
    setAnalyzeStatus('analyzing');
    setAnalyzeProgress(0);
    setAnalyzeError(null);

    // 진행률 시뮬레이션 (분석은 시간이 걸리므로)
    // 단계: 문서 로딩 (0-20%), LLM 분석 (20-80%), 결과 정리 (80-100%)
    const stages = [
      { target: 20, duration: 2000, label: '문서 로딩 중...' },
      { target: 80, duration: 15000, label: 'AI 분석 중...' },
      { target: 95, duration: 3000, label: '결과 정리 중...' },
    ];
    let currentStage = 0;
    let stageStartTime = Date.now();
    let stageStartProgress = 0;

    analyzeIntervalRef.current = setInterval(() => {
      if (currentStage >= stages.length) return;

      const stage = stages[currentStage];
      const elapsed = Date.now() - stageStartTime;
      const stageProgress = Math.min(elapsed / stage.duration, 1);
      const newProgress = stageStartProgress + (stage.target - stageStartProgress) * stageProgress;

      setAnalyzeProgress(newProgress);

      if (stageProgress >= 1 && currentStage < stages.length - 1) {
        currentStage++;
        stageStartTime = Date.now();
        stageStartProgress = newProgress;
      }
    }, 100);

    try {
      // 실제 API 호출
      const dna = await analyzeBrand(brandId);

      cleanupAnalyzeProgress();
      setAnalyzeProgress(100);
      setAnalyzeStatus('completed');

      setBrandDNA(dna);
      setShowDNAResult(true);
      toast.success(`Brand DNA 분석 완료! (신뢰도: ${(dna.confidence_score * 100).toFixed(0)}%)`);
    } catch (error: any) {
      cleanupAnalyzeProgress();

      if (error.name === 'AbortError') {
        setAnalyzeStatus('idle');
        setAnalyzeProgress(0);
        toast.info('분석이 중단되었습니다.');
      } else {
        setAnalyzeStatus('failed');
        const errorMsg = error instanceof Error ? error.message : String(error);
        setAnalyzeError(errorMsg);
        console.error('Analysis failed:', error);
        toast.error(`분석 실패: ${errorMsg}`);
      }
    } finally {
      setAnalyzing(false);
      analyzeAbortRef.current = null;
    }
  };

  // 분석 중지
  const handleStopAnalyze = () => {
    if (analyzeAbortRef.current) {
      analyzeAbortRef.current.abort();
    }
    cleanupAnalyzeProgress();
    setAnalyzing(false);
    setAnalyzeStatus('idle');
    setAnalyzeProgress(0);
    toast.info('사용자에 의해 분석이 중지되었습니다.');
  };

  // 분석 재시작
  const handleRetryAnalyze = () => {
    setAnalyzeStatus('idle');
    setAnalyzeError(null);
    handleAnalyze();
  };

  // 문서 삭제
  const handleDelete = async (docId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      // 실제 API 호출
      await deleteBrandDocument(brandId, docId);

      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success('문서 삭제 완료');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(`삭제 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Brand DNA → Canvas 내보내기
  const handleSendToCanvas = () => {
    if (!polotnoStore || !brandDNA) {
      toast.error('Canvas가 준비되지 않았거나 Brand DNA가 없습니다.');
      return;
    }

    if (!currentTemplate) {
      toast.error('템플릿 정보가 없습니다.');
      return;
    }

    try {
      addBrandIdentityToCanvas(
        polotnoStore,
        brandDNA,
        currentTemplate.width,
        currentTemplate.height
      );
      toast.success('Brand Identity Canvas가 생성되었습니다!');
    } catch (error) {
      console.error('Failed to create canvas:', error);
      toast.error(`Canvas 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Brand Kit</h2>
        <p className="text-xs text-gray-500 mt-1">브랜드 자산 및 AI 분석</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 문서 업로드 섹션 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            브랜드 문서
          </h3>

          {/* 업로드 버튼들 */}
          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  파일 업로드 (PDF, 이미지)
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {!showUrlForm ? (
              <button
                onClick={() => setShowUrlForm(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
              >
                <Link className="w-4 h-4" />
                URL 크롤링
              </button>
            ) : (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                {/* Progress Bar */}
                {crawling && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}

                <div className="flex gap-2">
                  {crawling ? (
                    <button
                      onClick={handleStopCrawl}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
                    >
                      중지 ({Math.round(progress)}%)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCrawlUrl()}
                      disabled={!urlInput.trim()}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                    >
                      크롤링 시작
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!crawling) {
                        setShowUrlForm(false);
                        setUrlInput('');
                      }
                    }}
                    disabled={crawling}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 문서 목록 */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">업로드된 문서 ({documents.length}개)</p>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col p-2 bg-gray-50 rounded text-xs gap-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {doc.processed === 'completed' ? (
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      ) : doc.processed === 'failed' ? (
                        <XCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                      )}
                      <span className="text-gray-700 truncate font-medium">{doc.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.processed === 'failed' && doc.source_url && (
                        <button
                          onClick={() => handleRetry(doc.source_url!)}
                          className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-[10px]"
                        >
                          재시도
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* 실패 사유 표시 */}
                  {doc.processed === 'failed' && doc.document_metadata?.error && (
                    <div className="text-red-500 text-[10px] pl-5 break-all">
                      실패 사유: {doc.document_metadata.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Brand DNA 분석 섹션 */}
          <div className="space-y-2">
            {/* 분석 버튼 / 진행 상태 */}
            {analyzeStatus === 'analyzing' ? (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-xs font-medium text-purple-800">
                      AI 분석 중... {Math.round(analyzeProgress)}%
                    </span>
                  </div>
                  <button
                    onClick={handleStopAnalyze}
                    className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-medium rounded transition-colors"
                  >
                    중지
                  </button>
                </div>
                {/* 진행률 바 */}
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analyzeProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-purple-600">
                  {analyzeProgress < 20 && '문서 로딩 중...'}
                  {analyzeProgress >= 20 && analyzeProgress < 80 && 'AI가 브랜드를 분석하고 있습니다...'}
                  {analyzeProgress >= 80 && '결과 정리 중...'}
                </p>
              </div>
            ) : analyzeStatus === 'failed' ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-800">분석 실패</span>
                </div>
                {analyzeError && (
                  <p className="text-[10px] text-red-600 break-all">
                    {analyzeError}
                  </p>
                )}
                <button
                  onClick={handleRetryAnalyze}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  다시 시도
                </button>
              </div>
            ) : (
              <button
                onClick={handleAnalyze}
                disabled={documents.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Brand DNA 자동 분석
              </button>
            )}
          </div>
        </div>

        {/* Brand DNA 결과 */}
        {showDNAResult && brandDNA && (
          <div className="space-y-3 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-purple-900">Brand DNA</h3>
              <span className="text-xs text-purple-700">
                신뢰도: {(brandDNA.confidence_score * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <p className="font-semibold text-purple-800">톤앤매너</p>
                <p className="text-purple-900">{brandDNA.tone.primary}</p>
                <p className="text-purple-700 text-xs">{brandDNA.tone.description}</p>
              </div>

              <div>
                <p className="font-semibold text-purple-800">핵심 메시지</p>
                <ul className="list-disc list-inside text-purple-900 space-y-1">
                  {brandDNA.key_messages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-semibold text-purple-800">Do's</p>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  {brandDNA.dos.slice(0, 3).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-semibold text-purple-800">Don'ts</p>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  {brandDNA.donts.slice(0, 3).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-purple-600 italic">{brandDNA.analysis_notes}</p>
            </div>

            {/* Canvas로 내보내기 버튼 */}
            <button
              onClick={handleSendToCanvas}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Canvas로 내보내기
            </button>
          </div>
        )}

        {/* 기존 Brand Kit (색상) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-700">Brand Colors</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['#4F46E5', '#10B981', '#EAB308', '#EC4899'].map((color) => (
              <div
                key={color}
                className="aspect-square rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Click to add to canvas</p>
        </div>
      </div>
    </div>
  );
}
