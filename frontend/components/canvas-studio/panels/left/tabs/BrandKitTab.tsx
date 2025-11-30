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
  Eye,
  X,
  Check,
  Square,
  CheckSquare,
  FolderPlus,
  FolderOpen,
  Filter,
  RefreshCw,
  Pencil,
  Save,
} from 'lucide-react';
import { useWorkspaceStore } from '../../../stores';
import {
  uploadBrandDocument,
  crawlBrandUrl,
  listBrandDocuments,
  deleteBrandDocument,
  recrawlBrandDocument,
  updateBrandDocument,
  analyzeBrand,
  type BrandDocument,
  type BrandDNA,
  type CrawlOptions,
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
  const [recrawlingId, setRecrawlingId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [showDNAResult, setShowDNAResult] = useState(false);
  const [progress, setProgress] = useState(0);

  // 다중 페이지 크롤링 옵션
  const [multiPageCrawl, setMultiPageCrawl] = useState(true);  // 기본 활성화

  // 분석 상태 관련
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStatus, setAnalyzeStatus] = useState<'idle' | 'analyzing' | 'completed' | 'failed'>('idle');
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // 문서 내용 미리보기 모달
  const [previewDoc, setPreviewDoc] = useState<BrandDocument | null>(null);

  // 문서 편집 모드
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // 문서 선택 상태 (체크박스)
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // 프로젝트 저장 모달
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState('');

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
      // 다중 페이지 크롤링 옵션
      const crawlOptions: CrawlOptions = {
        multiPage: multiPageCrawl,
        maxPages: 5,
        includeCategories: true,
      };

      // 실제 API 호출
      const doc = await crawlBrandUrl(brandId, targetUrl, undefined, crawlOptions);

      clearInterval(progressInterval);
      setProgress(100);

      setDocuments((prev) => [...prev, doc]);
      if (!urlToCrawl) setUrlInput(''); // Retry가 아닐 때만 초기화
      setShowUrlForm(false);

      // 다중 페이지 크롤링 결과 표시
      const pageCount = doc.document_metadata?.page_count || 1;
      const successMsg = multiPageCrawl && pageCount > 1
        ? `${pageCount}개 페이지 크롤링 완료! (회사 소개, 서비스 등 자동 탐색)`
        : 'URL 크롤링 완료!';
      toast.success(successMsg);
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

  // URL 문서 재크롤링 (DataCleanerAgent V2 적용)
  const handleRecrawl = async (docId: string) => {
    if (!brandId || recrawlingId) return;

    setRecrawlingId(docId);
    try {
      const updatedDoc = await recrawlBrandDocument(brandId, docId);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? updatedDoc : d))
      );

      // 미리보기 모달이 열려있으면 업데이트
      if (previewDoc?.id === docId) {
        setPreviewDoc(updatedDoc);
      }

      const reduction = updatedDoc.extracted_text && updatedDoc.clean_text
        ? Math.round((1 - updatedDoc.clean_text.length / updatedDoc.extracted_text.length) * 100)
        : 0;
      toast.success(`재크롤링 완료! (${reduction}% 감소)`);
    } catch (error) {
      console.error('Recrawl failed:', error);
      toast.error(`재크롤링 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRecrawlingId(null);
    }
  };

  // 재시도
  const handleRetry = (url: string) => {
    setUrlInput(url);
    handleCrawlUrl(url);
  };

  // 편집 모드 시작
  const handleStartEdit = () => {
    if (!previewDoc) return;
    // clean_text가 있으면 우선, 없으면 extracted_text 사용
    setEditingText(previewDoc.clean_text || previewDoc.extracted_text || '');
    setIsEditing(true);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingText('');
  };

  // 편집 저장
  const handleSaveEdit = async () => {
    if (!brandId || !previewDoc) return;

    setSavingEdit(true);
    try {
      const updatedDoc = await updateBrandDocument(brandId, previewDoc.id, {
        clean_text: editingText,
      });

      // 문서 목록 및 미리보기 업데이트
      setDocuments((prev) =>
        prev.map((d) => (d.id === previewDoc.id ? updatedDoc : d))
      );
      setPreviewDoc(updatedDoc);
      setIsEditing(false);
      setEditingText('');
      toast.success('문서가 저장되었습니다.');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(`저장 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSavingEdit(false);
    }
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

    // 선택된 문서가 있으면 선택된 것만, 없으면 전체 분석
    const docsToAnalyze = selectedDocIds.size > 0
      ? documents.filter((d) => selectedDocIds.has(d.id))
      : documents;

    if (docsToAnalyze.length === 0) {
      toast.warning('분석할 문서가 없습니다. 먼저 문서를 업로드하거나 선택해주세요.');
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
      // 실제 API 호출 (선택된 문서만 분석)
      const documentIdsToAnalyze = selectedDocIds.size > 0
        ? Array.from(selectedDocIds)
        : undefined;
      const dna = await analyzeBrand(brandId, documentIdsToAnalyze);

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
      setSelectedDocIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
      toast.success('문서 삭제 완료');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(`삭제 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 문서 선택/해제 토글
  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedDocIds.size === documents.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(documents.map((d) => d.id)));
    }
  };

  // 선택된 문서 일괄 삭제
  const handleDeleteSelected = async () => {
    if (selectedDocIds.size === 0) {
      toast.warning('선택된 문서가 없습니다.');
      return;
    }

    if (!confirm(`선택한 ${selectedDocIds.size}개 문서를 삭제하시겠습니까?`)) return;

    try {
      const deletePromises = Array.from(selectedDocIds).map((docId) =>
        deleteBrandDocument(brandId, docId)
      );
      await Promise.all(deletePromises);

      setDocuments((prev) => prev.filter((d) => !selectedDocIds.has(d.id)));
      setSelectedDocIds(new Set());
      toast.success(`${selectedDocIds.size}개 문서 삭제 완료`);
    } catch (error) {
      console.error('Batch delete failed:', error);
      toast.error(`삭제 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 선택된 문서로 프로젝트 생성 (MVP: localStorage에 저장)
  const handleSaveAsProject = () => {
    if (selectedDocIds.size === 0) {
      toast.warning('먼저 문서를 선택해주세요.');
      return;
    }
    setShowProjectModal(true);
    setProjectName(`브랜드 분석 ${new Date().toLocaleDateString('ko-KR')}`);
  };

  // 프로젝트 저장 확인
  const confirmSaveProject = () => {
    if (!projectName.trim()) {
      toast.warning('프로젝트 이름을 입력해주세요.');
      return;
    }

    const selectedDocs = documents.filter((d) => selectedDocIds.has(d.id));
    const project = {
      id: `project-${Date.now()}`,
      name: projectName,
      documents: selectedDocs,
      brandId,
      createdAt: new Date().toISOString(),
    };

    // localStorage에 저장 (MVP)
    const existingProjects = JSON.parse(localStorage.getItem('brandProjects') || '[]');
    existingProjects.push(project);
    localStorage.setItem('brandProjects', JSON.stringify(existingProjects));

    toast.success(`프로젝트 "${projectName}" 저장 완료!`);
    setShowProjectModal(false);
    setProjectName('');
    setSelectedDocIds(new Set());
  };

  // 프로젝트 불러오기
  const handleLoadProject = () => {
    const existingProjects = JSON.parse(localStorage.getItem('brandProjects') || '[]');
    if (existingProjects.length === 0) {
      toast.info('저장된 프로젝트가 없습니다.');
      return;
    }

    // 간단한 선택 (MVP: 가장 최근 프로젝트)
    const latestProject = existingProjects[existingProjects.length - 1];
    if (confirm(`"${latestProject.name}" 프로젝트를 불러오시겠습니까?`)) {
      // 기존 문서와 병합 (중복 제거)
      const existingIds = new Set(documents.map((d) => d.id));
      const newDocs = latestProject.documents.filter(
        (d: BrandDocument) => !existingIds.has(d.id)
      );

      if (newDocs.length > 0) {
        setDocuments((prev) => [...prev, ...newDocs]);
        toast.success(`${newDocs.length}개 문서가 추가되었습니다.`);
      } else {
        toast.info('이미 모든 문서가 로드되어 있습니다.');
      }
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

                {/* 다중 페이지 크롤링 옵션 */}
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={multiPageCrawl}
                    onChange={(e) => setMultiPageCrawl(e.target.checked)}
                    className="w-3.5 h-3.5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <span>
                    다중 페이지 크롤링
                    <span className="text-gray-400 ml-1">(회사 소개, 서비스 페이지 자동 탐색)</span>
                  </span>
                </label>

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
                      {multiPageCrawl ? '사이트 전체 크롤링' : '단일 페이지 크롤링'}
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
              {/* 문서 목록 헤더 + 액션 버튼 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 전체 선택 체크박스 */}
                  <button
                    onClick={toggleSelectAll}
                    className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                    title={selectedDocIds.size === documents.length ? '전체 해제' : '전체 선택'}
                  >
                    {selectedDocIds.size === documents.length && documents.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <p className="text-xs text-gray-500">
                    문서 ({documents.length}개)
                    {selectedDocIds.size > 0 && (
                      <span className="text-purple-600 ml-1">• {selectedDocIds.size}개 선택됨</span>
                    )}
                  </p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleLoadProject}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="프로젝트 불러오기"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  {selectedDocIds.size > 0 && (
                    <>
                      <button
                        onClick={handleSaveAsProject}
                        className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                        title="프로젝트로 저장"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-purple-600" />
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                        title="선택 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 문서 리스트 */}
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex flex-col p-2 rounded text-xs gap-1 cursor-pointer transition-colors ${
                    selectedDocIds.has(doc.id)
                      ? 'bg-purple-50 border border-purple-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleDocSelection(doc.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* 체크박스 */}
                      <div className="flex-shrink-0">
                        {selectedDocIds.has(doc.id) ? (
                          <CheckSquare className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      {/* 상태 아이콘 */}
                      {doc.processed === 'completed' ? (
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      ) : doc.processed === 'failed' ? (
                        <XCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                      )}
                      {/* 정제 상태 아이콘 */}
                      {doc.clean_text && (
                        <Filter className="w-3 h-3 text-purple-500 flex-shrink-0" title="정제됨" />
                      )}
                      <span className="text-gray-700 truncate font-medium">{doc.title}</span>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* 미리보기 버튼 */}
                      {doc.extracted_text && (
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                          title="문서 내용 보기"
                        >
                          <Eye className="w-3 h-3 text-blue-600" />
                        </button>
                      )}
                      {doc.processed === 'failed' && doc.source_url && (
                        <button
                          onClick={() => handleRetry(doc.source_url!)}
                          className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-[10px]"
                        >
                          재시도
                        </button>
                      )}
                      {/* 재크롤링 버튼 (URL 문서만) */}
                      {doc.document_type === 'url' && doc.source_url && doc.processed === 'completed' && (
                        <button
                          onClick={() => handleRecrawl(doc.id)}
                          disabled={recrawlingId === doc.id}
                          className="p-1 hover:bg-purple-100 rounded transition-colors flex-shrink-0 disabled:opacity-50"
                          title="재크롤링 (정제 로직 다시 적용)"
                        >
                          {recrawlingId === doc.id ? (
                            <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3 text-purple-600" />
                          )}
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

                  {/* 추출된 텍스트 미리보기 (짧게) */}
                  {doc.extracted_text && (
                    <div
                      className="text-[10px] text-gray-500 pl-5 line-clamp-2 cursor-pointer hover:text-gray-700"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      {doc.extracted_text.substring(0, 100)}...
                    </div>
                  )}

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
                {selectedDocIds.size > 0
                  ? `선택된 ${selectedDocIds.size}개 문서 분석`
                  : 'Brand DNA 자동 분석 (전체)'}
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

      {/* 문서 내용 미리보기 모달 */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">{previewDoc.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* 편집/저장 버튼 */}
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={savingEdit}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      취소
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs disabled:opacity-50"
                    >
                      {savingEdit ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      저장
                    </button>
                  </>
                ) : (
                  <>
                    {/* 편집 버튼 */}
                    {previewDoc.processed === 'completed' && (previewDoc.clean_text || previewDoc.extracted_text) && (
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs"
                        title="텍스트 편집"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        편집
                      </button>
                    )}
                    {/* 재크롤링 버튼 (URL 문서만) */}
                    {previewDoc.document_type === 'url' && previewDoc.source_url && previewDoc.processed === 'completed' && (
                      <button
                        onClick={() => handleRecrawl(previewDoc.id)}
                        disabled={recrawlingId === previewDoc.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs disabled:opacity-50"
                        title="재크롤링 (정제 로직 다시 적용)"
                      >
                        {recrawlingId === previewDoc.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        재크롤링
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    setPreviewDoc(null);
                    setIsEditing(false);
                    setEditingText('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* 문서 메타정보 */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 space-y-1">
              <div className="flex gap-4 flex-wrap">
                <span>유형: <strong className="text-gray-800">{previewDoc.document_type}</strong></span>
                <span>상태: <strong className={previewDoc.processed === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
                  {previewDoc.processed}
                </strong></span>
                {previewDoc.clean_text && (
                  <span className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-purple-500" />
                    <strong className="text-purple-600">정제됨</strong>
                  </span>
                )}
              </div>
              {previewDoc.source_url && (
                <div>
                  출처: <a href={previewDoc.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {previewDoc.source_url}
                  </a>
                </div>
              )}
              <div className="flex gap-4">
                {previewDoc.extracted_text && (
                  <span>원본: <strong className="text-gray-800">{previewDoc.extracted_text.length.toLocaleString()}자</strong></span>
                )}
                {previewDoc.clean_text && (
                  <span>정제: <strong className="text-purple-600">{previewDoc.clean_text.length.toLocaleString()}자</strong>
                    <span className="text-gray-400 ml-1">
                      ({Math.round((1 - previewDoc.clean_text.length / previewDoc.extracted_text!.length) * 100)}% 감소)
                    </span>
                  </span>
                )}
              </div>
              {previewDoc.extracted_keywords && previewDoc.extracted_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {previewDoc.extracted_keywords.slice(0, 10).map((kw, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">
                      #{kw}
                    </span>
                  ))}
                  {previewDoc.extracted_keywords.length > 10 && (
                    <span className="text-gray-400 text-[10px]">+{previewDoc.extracted_keywords.length - 10}</span>
                  )}
                </div>
              )}
            </div>

            {/* 문서 내용 (편집 모드 또는 미리보기 모드) */}
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                /* 편집 모드 */
                <div className="h-full flex flex-col p-4 min-h-[400px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                      <Pencil className="w-3 h-3" />
                      편집 모드 - 불필요한 내용을 삭제하거나 수정하세요
                    </span>
                    <span className="text-xs text-gray-500">
                      {editingText.length.toLocaleString()}자
                    </span>
                  </div>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="flex-1 w-full min-h-[320px] p-4 text-xs font-mono bg-blue-50 border border-blue-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="텍스트를 입력하세요..."
                    disabled={savingEdit}
                  />
                  <p className="text-[10px] text-gray-400 mt-2">
                    Tip: 브랜드와 관련 없는 텍스트(네비게이션, 푸터, 광고 등)를 삭제하면 Brand DNA 분석 품질이 향상됩니다.
                  </p>
                </div>
              ) : previewDoc.clean_text ? (
                /* 미리보기 모드 - 정제된 텍스트 있음 */
                <div className="h-full flex flex-col">
                  {/* 탭 헤더 */}
                  <div className="flex border-b border-gray-200 bg-white sticky top-0">
                    <button
                      onClick={() => {}}
                      className="flex-1 px-4 py-2 text-xs font-medium text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                    >
                      정제된 텍스트 (Brand DNA 분석용)
                    </button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs text-gray-800 font-mono bg-purple-50 p-4 rounded-lg border border-purple-200">
                      {previewDoc.clean_text}
                    </pre>
                    {previewDoc.extracted_text && previewDoc.extracted_text !== previewDoc.clean_text && (
                      <details className="mt-4">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          원본 텍스트 보기 ({previewDoc.extracted_text.length.toLocaleString()}자)
                        </summary>
                        <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono bg-gray-50 p-4 rounded-lg mt-2">
                          {previewDoc.extracted_text}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ) : previewDoc.extracted_text ? (
                /* 미리보기 모드 - 원본 텍스트만 있음 */
                <div className="p-4">
                  <pre className="whitespace-pre-wrap text-xs text-gray-800 font-mono bg-gray-50 p-4 rounded-lg">
                    {previewDoc.extracted_text}
                  </pre>
                </div>
              ) : (
                /* 텍스트 없음 */
                <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                  추출된 텍스트가 없습니다.
                </div>
              )}
            </div>

            {/* 모달 푸터 (편집 모드에서는 숨김) */}
            {!isEditing && (
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 프로젝트 저장 모달 */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">프로젝트로 저장</h3>
              </div>
              <button
                onClick={() => setShowProjectModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="프로젝트 이름을 입력하세요"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium text-gray-700 mb-1">저장할 문서 ({selectedDocIds.size}개)</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {documents
                    .filter((d) => selectedDocIds.has(d.id))
                    .slice(0, 3)
                    .map((doc) => (
                      <li key={doc.id} className="truncate">{doc.title}</li>
                    ))}
                  {selectedDocIds.size > 3 && (
                    <li className="text-gray-400">외 {selectedDocIds.size - 3}개...</li>
                  )}
                </ul>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowProjectModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmSaveProject}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
