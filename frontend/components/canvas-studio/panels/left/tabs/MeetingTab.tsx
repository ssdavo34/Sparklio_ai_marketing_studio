'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, X, Video, Sparkles, Loader2, FileAudio, Clock, Download, Radio, Trash2, StopCircle, CheckSquare, Square, FileText, ChevronDown, ChevronUp, Copy, FolderPlus, Eye, Pencil } from 'lucide-react';
import { MeetingAnalysisEditModal } from './MeetingAnalysisEditModal';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { useMeetingStore } from '../../../stores/useMeetingStore';
import { useBriefStore } from '../../../stores/useBriefStore';
import { useGeneratedAssetsStore } from '../../../stores/useGeneratedAssetsStore';
import { useLeftPanelStore } from '../../../stores/useLeftPanelStore';
import { useConceptWorkflowStore } from '../../../stores/useConceptWorkflowStore';
import type { MeetingSourceData } from '@/types/conceptGeneration';
import type { Meeting, MeetingAnalysisResult, MeetingStatus } from '@/types/meeting';
import {
  createMeetingFromFile,
  createMeetingFromUrl,
  transcribeMeeting,
  analyzeMeeting,
  listMeetings,
  getMeeting,
  deleteMeeting,
  getMeetingTranscripts,
  type MeetingTranscriptResponse,
} from '@/lib/api/meeting-api';
import { layoutApi, type DocumentLayout, type LayoutElement, type PageLayout } from '@/lib/api/layout-api';
// import { convertMeetingToBrief, canConvertToBrief } from '@/lib/utils/meetingToBrief'; // 미사용
import { toast } from '@/components/ui/Toast';

// Status Badge Helper
const getStatusBadgeConfig = (status: MeetingStatus) => {
  switch (status) {
    case 'created':
      return { label: 'Created', color: 'bg-gray-100 text-gray-700', icon: null };
    case 'downloading':
      return { label: 'Downloading', color: 'bg-blue-100 text-blue-700', icon: Download };
    case 'caption_ready':
      return { label: 'Caption Ready', color: 'bg-cyan-100 text-cyan-700', icon: null };
    case 'ready_for_stt':
      return { label: 'Ready for STT', color: 'bg-indigo-100 text-indigo-700', icon: null };
    case 'transcribing':
      return { label: 'Transcribing', color: 'bg-yellow-100 text-yellow-700', icon: Radio };
    case 'ready':
      return { label: 'Ready', color: 'bg-green-100 text-green-700', icon: null };
    case 'download_failed':
      return { label: 'Download Failed', color: 'bg-red-100 text-red-700', icon: null };
    case 'stt_failed':
      return { label: 'STT Failed', color: 'bg-orange-100 text-orange-700', icon: null };
    case 'uploaded':
      return { label: 'Uploaded', color: 'bg-gray-100 text-gray-700', icon: null };
    case 'transcribed':
      return { label: 'Transcribed', color: 'bg-blue-100 text-blue-700', icon: null };
    case 'analyzed':
      return { label: 'Analyzed', color: 'bg-green-100 text-green-700', icon: null };
    case 'failed':
      return { label: 'Failed', color: 'bg-red-100 text-red-700', icon: null };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700', icon: null };
  }
};

// Progress mapping
const getStatusProgress = (status: MeetingStatus): number => {
  switch (status) {
    case 'created': return 10;
    case 'downloading': return 30;
    case 'caption_ready': return 50;
    case 'ready_for_stt': return 60;
    case 'transcribing': return 80;
    case 'ready': return 100;
    case 'analyzed': return 100;
    case 'download_failed': return 0;
    case 'stt_failed': return 0;
    case 'failed': return 0;
    default: return 0;
  }
};

type UploadedMeetingFile = {
  id: string;
  url: string;
  name: string;
  type: 'audio' | 'video';
  file: File;
};

export function MeetingTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedMeetingFile | null>(null);
  const [url, setUrl] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [analysisResult, setAnalysisResult] = useState<MeetingAnalysisResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [pollingMeetings, setPollingMeetings] = useState<Set<string>>(new Set());
  const [selectedMeetings, setSelectedMeetings] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [transcripts, setTranscripts] = useState<MeetingTranscriptResponse[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const polotnoStore = useCanvasStore((state) => state.canvases.get(state.activeCanvasType) || null);
  const setGlobalAnalysis = useMeetingStore((state) => state.setAnalysisResult);
  const setBrief = useBriefStore((state) => state.setBrief);
  const setActiveTab = useLeftPanelStore((state) => state.setActiveTab);

  // Load meetings on mount
  useEffect(() => {
    loadMeetings();
  }, []);

  // Polling logic for meetings in progress
  useEffect(() => {
    if (pollingMeetings.size === 0) return;

    const interval = setInterval(async () => {
      for (const meetingId of Array.from(pollingMeetings)) {
        // Skip if meetingId is invalid
        if (!meetingId || meetingId === 'undefined') {
          setPollingMeetings((prev) => {
            const next = new Set(prev);
            next.delete(meetingId);
            return next;
          });
          continue;
        }

        try {
          const updatedMeeting = await getMeeting(meetingId);

          // Update meetings list
          setMeetings((prev) =>
            (Array.isArray(prev) ? prev : []).map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m))
          );

          // Update selected meeting if it's the one being polled
          if (selectedMeeting?.id === updatedMeeting.id) {
            setSelectedMeeting(updatedMeeting);
          }

          // Stop polling if meeting is done
          const isDone = !['created', 'downloading', 'ready_for_stt', 'transcribing'].includes(
            updatedMeeting.status
          );

          if (isDone) {
            setPollingMeetings((prev) => {
              const next = new Set(prev);
              next.delete(meetingId);
              return next;
            });

            // Show notification
            if (updatedMeeting.status === 'ready') {
              alert(`✅ Meeting "${updatedMeeting.title}" is ready!`);
            } else if (updatedMeeting.status.includes('failed')) {
              alert(`❌ Meeting "${updatedMeeting.title}" failed: ${updatedMeeting.status}`);
            }
          }
        } catch (error) {
          console.error(`Failed to poll meeting ${meetingId}:`, error);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [pollingMeetings, selectedMeeting]);

  const loadMeetings = async () => {
    try {
      const loadedMeetings = await listMeetings();
      setMeetings(loadedMeetings);
    } catch (error) {
      console.error('Failed to load meetings:', error);
      setMeetings([]);
    }
  };

  // 트랜스크립트 로드
  const loadTranscripts = async (meetingId: string) => {
    setLoadingTranscript(true);
    try {
      const loadedTranscripts = await getMeetingTranscripts(meetingId);
      setTranscripts(loadedTranscripts);
      setShowTranscript(true);
    } catch (error) {
      console.error('Failed to load transcripts:', error);
      setTranscripts([]);
      toast.error('트랜스크립트를 불러오지 못했습니다.');
    } finally {
      setLoadingTranscript(false);
    }
  };

  // 트랜스크립트 복사
  const copyTranscript = () => {
    const primaryTranscript = transcripts.find(t => t.is_primary) || transcripts[0];
    if (primaryTranscript) {
      navigator.clipboard.writeText(primaryTranscript.transcript_text);
      toast.success('트랜스크립트가 클립보드에 복사되었습니다.');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert(`${file.name} is too large. Maximum file size is 100MB.`);
      return;
    }

    // Check file type
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');

    if (!isAudio && !isVideo) {
      alert(`${file.name} is not an audio or video file.`);
      return;
    }

    // Create object URL
    const url = URL.createObjectURL(file);
    const id = `meeting-${Date.now()}`;

    setUploadedFile({
      id,
      url,
      name: file.name,
      type: isAudio ? 'audio' : 'video',
      file,
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      input.files = dataTransfer.files;
      handleFileChange({ target: input } as any);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUploadMeeting = async () => {
    if (!uploadedFile) {
      alert('먼저 파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    try {
      const meeting = await createMeetingFromFile({
        file: uploadedFile.file,
        title: uploadedFile.name,
        source_type: 'upload',
      });

      setMeetings((prev) => [meeting, ...(Array.isArray(prev) ? prev : [])]);
      setSelectedMeeting(meeting);
      setUploadedFile(null);

      alert('✅ Meeting이 생성되었습니다. Transcribe를 시작하세요.');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('❌ 업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFromUrl = async () => {
    if (!url.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }

    setUploading(true);
    try {
      // Detect source type from URL
      let detectedType: 'youtube' | 'other' = 'other';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        detectedType = 'youtube';
      }

      const meeting = await createMeetingFromUrl({
        url: url,
        title: detectedType === 'youtube' ? 'YouTube Video' : 'Web Page Analysis',
        source_type: detectedType,
      });

      setMeetings((prev) => [meeting, ...(Array.isArray(prev) ? prev : [])]);
      setSelectedMeeting(meeting);
      setUrl('');

      // Start polling if meeting is in progress (moved to setTimeout to avoid render phase setState)
      if (['created', 'downloading', 'ready_for_stt', 'transcribing'].includes(meeting.status)) {
        setTimeout(() => {
          setPollingMeetings((prev) => new Set(prev).add(meeting.id));
        }, 0);
      }

      alert(`✅ Meeting이 생성되었습니다 (Status: ${meeting.status}). 자동으로 처리 중입니다.`);
    } catch (error) {
      console.error('Create from URL failed:', error);
      alert('❌ URL 처리 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleTranscribe = async (meeting: Meeting) => {
    setTranscribing(true);
    setSelectedMeeting(meeting);

    try {
      // Step 1: Transcribe
      console.log(`[MeetingTab] Transcribing meeting ${meeting.id}...`);
      await transcribeMeeting(meeting.id, {
        mode: 'hybrid_quality', // 또는 사용자 선택
      });

      // Update meeting status to transcribed
      setMeetings((prev) =>
        (Array.isArray(prev) ? prev : []).map((m) =>
          m.id === meeting.id ? { ...m, status: 'transcribed' as const } : m
        )
      );

      // Step 2: Analyze
      console.log(`[MeetingTab] Analyzing meeting ${meeting.id}...`);
      const analyzeResponse = await analyzeMeeting(meeting.id);

      setAnalysisResult(analyzeResponse.analysis);
      setGlobalAnalysis(analyzeResponse.analysis);

      // Update meeting status to analyzed
      setMeetings((prev) =>
        (Array.isArray(prev) ? prev : []).map((m) =>
          m.id === meeting.id ? { ...m, status: 'analyzed' as const } : m
        )
      );

      alert('✅ Transcribe & 분석 완료!');
    } catch (error) {
      console.error('Transcribe failed:', error);
      alert(`❌ 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setTranscribing(false);
    }
  };

  // Layout API 기반 캔버스 렌더링
  const handleSendToCanvas = async () => {
    if (!analysisResult || !polotnoStore) {
      alert('분석 결과가 없거나 캔버스가 준비되지 않았습니다.');
      return;
    }

    const page = polotnoStore.activePage;
    if (!page) {
      alert('활성 페이지가 없습니다.');
      return;
    }

    const pageWidth = page.width as number;
    const pageHeight = page.height as number;

    // Loading toast
    toast.info('레이아웃을 생성하고 있습니다...');

    try {
      // Layout API 호출
      const response = await layoutApi.generateMeetingLayout({
        title: selectedMeeting?.title || 'Meeting Summary',
        summary: analysisResult.summary || '',
        agenda: analysisResult.agenda || [],
        decisions: analysisResult.decisions || [],
        action_items: (analysisResult.action_items || []).map((item: string) => ({
          task: item,
        })),
        keywords: analysisResult.keywords || [],
        options: {
          page_width: pageWidth,
          page_height: pageHeight,
          style: 'modern',
        },
      });

      const layout = response.layout;

      // 캔버스에 레이아웃 적용
      await applyLayoutToCanvas(layout, polotnoStore, page);

      toast.success(`Meeting Summary가 ${layout.total_pages}페이지로 캔버스에 추가되었습니다!`);
    } catch (error) {
      console.error('[MeetingTab] Layout API failed, using fallback:', error);
      toast.warning('Layout API 실패, 기본 레이아웃을 사용합니다.');

      // 폴백: 기존 로컬 렌더링
      applyFallbackLayout(polotnoStore, page, analysisResult, selectedMeeting);
    }
  };

  // Layout API 응답을 캔버스에 적용
  const applyLayoutToCanvas = async (
    layout: DocumentLayout,
    store: any,
    firstPage: any
  ) => {
    const pageWidth = layout.page_width;
    const pageHeight = layout.page_height;

    console.log('[MeetingTab] Layout page size:', { pageWidth, pageHeight });
    console.log('[MeetingTab] Full layout response:', layout);

    // 모든 페이지 처리
    layout.pages.forEach((pageLayout: PageLayout, pageIndex: number) => {
      let targetPage: any;

      if (pageIndex === 0) {
        // 첫 페이지는 기존 페이지 사용 (기존 요소 제거 + 크기 조정)
        targetPage = firstPage;
        targetPage.children.forEach((child: any) => child.remove());
        // 첫 페이지 크기도 레이아웃에 맞게 조정
        targetPage.set({ width: pageWidth, height: pageHeight });
        console.log(`[MeetingTab] Page ${pageIndex} set to:`, targetPage.width, 'x', targetPage.height);
      } else {
        // 추가 페이지 생성
        targetPage = store.addPage();
        // Polotno의 addPage는 파라미터를 무시할 수 있으므로 명시적으로 크기 설정
        targetPage.set({ width: pageWidth, height: pageHeight });
        console.log(`[MeetingTab] Page ${pageIndex} set to:`, targetPage.width, 'x', targetPage.height);
      }

      // 각 요소를 페이지에 추가
      pageLayout.elements.forEach((element: LayoutElement) => {
        addElementToPage(targetPage, element);
      });

      // 페이지 Footer 추가
      targetPage.addElement({
        type: 'text',
        x: 60,
        y: pageHeight - 45,
        width: pageWidth - 120,
        fontSize: 10,
        fill: '#9CA3AF',
        text: `Page ${pageIndex + 1} of ${layout.total_pages} • Generated by Sparklio AI • ${new Date().toLocaleDateString('ko-KR')}`,
        align: 'center',
      });
    });
  };

  // LayoutElement를 Polotno 요소로 변환하여 추가
  const addElementToPage = (page: any, element: LayoutElement) => {
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
          align: 'left',
          lineHeight: 1.6,
        });
        break;

      case 'card':
        // 카드 배경
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

        // 카드 내용
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

      case 'divider':
        page.addElement({
          type: 'figure',
          x: element.x,
          y: element.y,
          width: element.width,
          height: 2,
          fill: props.color || '#e0e0e0',
        });
        break;

      case 'badge':
        const variantColors: Record<string, string> = {
          primary: '#3b82f6',
          secondary: '#6b7280',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        };
        const badgeColor = variantColors[props.variant || 'primary'] || '#3b82f6';

        page.addElement({
          type: 'figure',
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          fill: badgeColor,
          cornerRadius: props.borderRadius || 4,
        });

        page.addElement({
          type: 'text',
          x: element.x + 8,
          y: element.y + (element.height - (props.fontSize || 12)) / 2,
          width: element.width - 16,
          text: element.content || '',
          fontSize: props.fontSize || 12,
          fill: '#ffffff',
          fontWeight: 'bold',
          align: 'center',
        });
        break;

      case 'image':
        page.addElement({
          type: 'image',
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          src: element.content || props.placeholder || 'https://via.placeholder.com/400x300',
        });
        break;

      case 'cta_button':
        page.addElement({
          type: 'figure',
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          fill: props.backgroundColor || '#3b82f6',
          cornerRadius: props.borderRadius || 8,
        });

        page.addElement({
          type: 'text',
          x: element.x,
          y: element.y + (element.height - (props.fontSize || 16)) / 2,
          width: element.width,
          text: element.content || 'Click Here',
          fontSize: props.fontSize || 16,
          fill: props.color || '#ffffff',
          fontWeight: 'bold',
          align: 'center',
        });
        break;

      case 'figure':
      case 'rect':
        // 사각형/배경 요소
        page.addElement({
          type: 'figure',
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height || 100,
          fill: props.fill || props.backgroundColor || '#f3f4f6',
          cornerRadius: props.cornerRadius || props.borderRadius || 0,
          stroke: props.stroke || props.borderColor,
          strokeWidth: props.strokeWidth || 0,
        });
        break;

      case 'tag':
        // 태그 배지 (작은 라벨)
        page.addElement({
          type: 'figure',
          x: element.x,
          y: element.y,
          width: element.width || 80,
          height: element.height || 28,
          fill: props.backgroundColor || '#EEF2FF',
          cornerRadius: props.cornerRadius || 14,
        });
        if (element.content) {
          page.addElement({
            type: 'text',
            x: element.x + 12,
            y: element.y + 7,
            width: (element.width || 80) - 24,
            text: element.content,
            fontSize: props.fontSize || 11,
            fill: props.color || '#4F46E5',
          });
        }
        break;

      default:
        // 기본: 텍스트로 처리
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
  const applyFallbackLayout = (
    store: any,
    page: any,
    result: MeetingAnalysisResult,
    meeting: Meeting | null
  ) => {
    // Clear existing elements
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
      height: 180,
      fill: '#7C3AED',
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
      text: 'Meeting Summary',
    });

    // 서브타이틀
    if (meeting?.title) {
      page.addElement({
        type: 'text',
        x: margin,
        y: 100,
        width: contentWidth,
        fontSize: 16,
        fill: 'rgba(255,255,255,0.9)',
        text: meeting.title,
      });
    }

    // 날짜
    page.addElement({
      type: 'text',
      x: margin,
      y: 140,
      width: contentWidth,
      fontSize: 12,
      fill: 'rgba(255,255,255,0.7)',
      text: new Date().toLocaleDateString('ko-KR'),
    });

    currentY = 210;

    // 요약
    if (result.summary) {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 18,
        fontWeight: 'bold',
        fill: '#1F2937',
        text: 'Executive Summary',
      });
      currentY += 30;

      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 13,
        fill: '#374151',
        text: result.summary,
        lineHeight: 1.5,
      });
      currentY += Math.ceil(result.summary.length / 80) * 20 + 30;
    }

    // 주요 안건
    if (result.agenda && result.agenda.length > 0) {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#1F2937',
        text: '📋 주요 안건',
      });
      currentY += 25;

      result.agenda.forEach((item: string, idx: number) => {
        page.addElement({
          type: 'text',
          x: margin + 20,
          y: currentY,
          width: contentWidth - 20,
          fontSize: 12,
          fill: '#374151',
          text: `${idx + 1}. ${item}`,
        });
        currentY += 22;
      });
      currentY += 20;
    }

    // 결정사항
    if (result.decisions && result.decisions.length > 0) {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#059669',
        text: '✅ 결정 사항',
      });
      currentY += 25;

      result.decisions.forEach((item: string) => {
        page.addElement({
          type: 'text',
          x: margin + 20,
          y: currentY,
          width: contentWidth - 20,
          fontSize: 12,
          fill: '#047857',
          text: `✓ ${item}`,
        });
        currentY += 22;
      });
      currentY += 20;
    }

    // 액션 아이템
    if (result.action_items && result.action_items.length > 0) {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#DC2626',
        text: '⚡ Action Items',
      });
      currentY += 25;

      result.action_items.forEach((item: string, idx: number) => {
        page.addElement({
          type: 'text',
          x: margin + 20,
          y: currentY,
          width: contentWidth - 20,
          fontSize: 12,
          fill: '#991B1B',
          text: `${idx + 1}. ${item}`,
        });
        currentY += 22;
      });
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

    toast.success('Meeting Summary가 캔버스에 추가되었습니다!');
  };

  // 분석 결과 저장 핸들러 (편집 모달에서 호출)
  const handleSaveAnalysisResult = (updatedResult: MeetingAnalysisResult) => {
    setAnalysisResult(updatedResult);

    // 선택된 미팅의 analysis_result도 업데이트
    if (selectedMeeting) {
      const updatedMeeting = { ...selectedMeeting, analysis_result: updatedResult };
      setSelectedMeeting(updatedMeeting);

      // meetings 목록도 업데이트
      setMeetings(prev => prev.map(m =>
        m.id === selectedMeeting.id ? updatedMeeting : m
      ));
    }

    toast.success('분석 결과가 저장되었습니다.');
  };

  // 컨셉보드로 보내기 (워크플로우 모달 오픈)
  const handleSendToConceptBoard = (customAnalysisResult?: MeetingAnalysisResult) => {
    const result = customAnalysisResult || analysisResult;
    if (!result) {
      toast.error('분석 결과가 없습니다.');
      return;
    }

    // Meeting 분석 결과에서 MeetingSourceData 생성
    const meetingTitle = selectedMeeting?.title || 'Meeting 분석 결과';
    const meetingSourceData: MeetingSourceData = {
      sourceType: 'meeting',
      meetingId: selectedMeeting?.id || `meeting-${Date.now()}`,
      meetingTitle: meetingTitle,
      summary: result.summary || '',
      agenda: result.agenda || [],
      decisions: result.decisions || [],
      actionItems: result.action_items || [],
      campaignIdeas: result.campaign_ideas || [],
      keywords: result.keywords || [],
    };

    // 워크플로우 모달 열기 (Meeting 소스 데이터와 함께)
    const openWorkflowModal = useConceptWorkflowStore.getState().openModal;
    openWorkflowModal(meetingSourceData);

    // ConceptBoard 탭으로 이동 (모달이 ConceptBoard에서 열림)
    setActiveTab('conceptboard');
    toast.success('컨셉 생성 워크플로우를 시작합니다.');
  };

  const removeFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url);
      setUploadedFile(null);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 개별 Meeting 삭제
  const handleDeleteMeeting = async (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`"${meeting.title}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteMeeting(meeting.id);

      // UI에서 제거
      setMeetings((prev) => (Array.isArray(prev) ? prev : []).filter((m) => m.id !== meeting.id));

      // 선택된 meeting이면 선택 해제
      if (selectedMeeting?.id === meeting.id) {
        setSelectedMeeting(null);
        setAnalysisResult(null);
        setGlobalAnalysis(null);
      }

      // 폴링 중이면 폴링 중지
      if (pollingMeetings.has(meeting.id)) {
        setPollingMeetings((prev) => {
          const next = new Set(prev);
          next.delete(meeting.id);
          return next;
        });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`❌ 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 폴링 중지 (진행 중인 Meeting 취소)
  const handleStopPolling = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();

    setPollingMeetings((prev) => {
      const next = new Set(prev);
      next.delete(meeting.id);
      return next;
    });

    alert(`⏹️ "${meeting.title}" 모니터링을 중지했습니다.`);
  };

  // 체크박스 토글
  const toggleSelectMeeting = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMeetings((prev) => {
      const next = new Set(prev);
      if (next.has(meetingId)) {
        next.delete(meetingId);
      } else {
        next.add(meetingId);
      }
      return next;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedMeetings.size === meetings.length) {
      // 전체 해제
      setSelectedMeetings(new Set());
    } else {
      // 전체 선택
      setSelectedMeetings(new Set(meetings.filter((m) => m && m.id).map((m) => m.id)));
    }
  };

  // 선택 모드 종료
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedMeetings(new Set());
  };

  // 선택된 항목 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedMeetings.size === 0) {
      toast.error('삭제할 항목을 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedMeetings.size}개의 Meeting을 삭제하시겠습니까?`)) {
      return;
    }

    const deletePromises = Array.from(selectedMeetings).map(async (id) => {
      try {
        await deleteMeeting(id);
        return { id, success: true };
      } catch (error) {
        console.error(`Failed to delete meeting ${id}:`, error);
        return { id, success: false };
      }
    });

    const results = await Promise.all(deletePromises);
    const successIds = results.filter((r) => r.success).map((r) => r.id);
    const failedCount = results.filter((r) => !r.success).length;

    // UI 업데이트
    setMeetings((prev) => (Array.isArray(prev) ? prev : []).filter((m) => !successIds.includes(m.id)));

    // 선택된 meeting이 삭제되었으면 선택 해제
    if (selectedMeeting && successIds.includes(selectedMeeting.id)) {
      setSelectedMeeting(null);
      setAnalysisResult(null);
      setGlobalAnalysis(null);
    }

    // 폴링 중인 meeting이 삭제되었으면 폴링 중지
    setPollingMeetings((prev) => {
      const next = new Set(prev);
      successIds.forEach((id) => next.delete(id));
      return next;
    });

    // 선택 모드 종료
    exitSelectMode();

    if (failedCount > 0) {
      toast.success(`${successIds.length}개 삭제 완료`);
      toast.error(`${failedCount}개 삭제 실패`);
    } else {
      toast.success(`${successIds.length}개 삭제 완료`);
    }
  };

  // 선택된 항목 일괄 분석
  const handleBulkAnalyze = async () => {
    if (selectedMeetings.size === 0) {
      toast.error('분석할 항목을 선택해주세요.');
      return;
    }

    const selectedMeetingsList = meetings.filter(m => selectedMeetings.has(m.id));
    const analyzableMeetings = selectedMeetingsList.filter(m =>
      ['uploaded', 'ready', 'ready_for_stt', 'caption_ready'].includes(m.status)
    );

    if (analyzableMeetings.length === 0) {
      toast.error('분석 가능한 Meeting이 없습니다.');
      return;
    }

    toast.info(`${analyzableMeetings.length}개 Meeting 분석을 시작합니다...`);

    for (const meeting of analyzableMeetings) {
      try {
        await handleTranscribe(meeting);
      } catch (error) {
        console.error(`Failed to analyze meeting ${meeting.id}:`, error);
      }
    }

    exitSelectMode();
  };

  // 선택된 항목 프로젝트에 추가
  const handleBulkAddToProject = () => {
    if (selectedMeetings.size === 0) {
      toast.error('추가할 항목을 선택해주세요.');
      return;
    }

    // TODO: 프로젝트 선택 다이얼로그 구현
    toast.info(`${selectedMeetings.size}개 Meeting을 프로젝트에 추가하는 기능은 준비 중입니다.`);
    // exitSelectMode();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Meeting AI</h2>
        <p className="text-xs text-gray-500 mt-1">Upload audio/video for analysis</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Upload Area */}
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Click to upload</p>
          <p className="text-xs text-gray-500 mt-1">MP3, WAV, MP4, MOV up to 100MB</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* URL Input Section */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gray-300"></div>
            <span className="text-xs text-gray-500">OR</span>
            <div className="h-px flex-1 bg-gray-300"></div>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube URL or Web Page URL"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFromUrl();
                }
              }}
            />
            <button
              onClick={handleCreateFromUrl}
              disabled={uploading || !url.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add'
              )}
            </button>
          </div>
        </div>

        {/* Uploaded File */}
        {uploadedFile && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              {uploadedFile.type === 'audio' ? (
                <FileAudio className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Video className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-purple-900 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={removeFile}
                className="p-1 hover:bg-purple-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-purple-600" />
              </button>
            </div>
            <button
              onClick={handleUploadMeeting}
              disabled={uploading}
              className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Create Meeting
                </>
              )}
            </button>
          </div>
        )}

        {/* Meeting List */}
        {meetings.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-700">
                Meetings ({meetings.length})
              </h3>
              {!isSelectMode ? (
                <button
                  onClick={() => setIsSelectMode(true)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  선택
                </button>
              ) : (
                <button
                  onClick={exitSelectMode}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  취소
                </button>
              )}
            </div>

            {/* 선택 모드 컨트롤 */}
            {isSelectMode && (
              <div className="mb-3 p-2 bg-purple-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs text-purple-700 hover:text-purple-800 font-medium"
                  >
                    {selectedMeetings.size === meetings.filter((m) => m && m.id).length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {selectedMeetings.size === meetings.filter((m) => m && m.id).length ? '전체 해제' : '전체 선택'}
                  </button>
                  <span className="text-xs text-purple-600 font-medium">
                    {selectedMeetings.size}개 선택됨
                  </span>
                </div>

                {/* 다중 액션 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkAnalyze}
                    disabled={selectedMeetings.size === 0}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3" />
                    분석
                  </button>
                  <button
                    onClick={handleBulkAddToProject}
                    disabled={selectedMeetings.size === 0}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FolderPlus className="w-3 h-3" />
                    프로젝트 추가
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedMeetings.size === 0}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3" />
                    삭제
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {meetings.filter((m) => m && m.id).map((meeting, index) => (
                <div
                  key={meeting.id || `meeting-fallback-${index}`}
                  className={`p-3 border rounded-lg transition-colors cursor-pointer ${selectedMeetings.has(meeting.id)
                      ? 'border-purple-300 bg-purple-50'
                      : selectedMeeting?.id === meeting.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectMeeting(meeting.id, { stopPropagation: () => { } } as React.MouseEvent);
                    } else {
                      setSelectedMeeting(meeting);
                      // 분석 결과가 있으면 로드
                      if (meeting.analysis_result) {
                        setAnalysisResult(meeting.analysis_result);
                        setGlobalAnalysis(meeting.analysis_result);
                      }
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* 선택 모드일 때 체크박스 표시 */}
                    {isSelectMode && (
                      <button
                        onClick={(e) => toggleSelectMeeting(meeting.id, e)}
                        className="flex-shrink-0 mt-0.5"
                      >
                        {selectedMeetings.has(meeting.id) ? (
                          <CheckSquare className="w-4 h-4 text-purple-500" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {meeting.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {formatDate(meeting.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const statusConfig = getStatusBadgeConfig(meeting.status);
                        const Icon = statusConfig.icon;
                        return (
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${statusConfig.color}`}
                          >
                            {Icon && <Icon className="w-3 h-3" />}
                            {statusConfig.label}
                          </span>
                        );
                      })()}
                      {/* 삭제 버튼 (선택 모드가 아닐 때만) */}
                      {!isSelectMode && (
                        <button
                          onClick={(e) => handleDeleteMeeting(meeting, e)}
                          className="p-1 hover:bg-red-100 rounded-full transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Progress Bar for in-progress meetings */}
                  {['created', 'downloading', 'ready_for_stt', 'transcribing'].includes(meeting.status) && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Processing...</span>
                        <span>{getStatusProgress(meeting.status)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${getStatusProgress(meeting.status)}%` }}
                        ></div>
                      </div>
                      {/* 중지 버튼 (폴링 중일 때만) */}
                      {pollingMeetings.has(meeting.id) && (
                        <button
                          onClick={(e) => handleStopPolling(meeting, e)}
                          className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded transition-colors"
                        >
                          <StopCircle className="w-3 h-3" />
                          모니터링 중지
                        </button>
                      )}
                    </div>
                  )}
                  {meeting.status === 'uploaded' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTranscribe(meeting);
                      }}
                      disabled={transcribing}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                    >
                      {transcribing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Transcribe & Analyze
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Commands */}
        {meetings.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">
              ⚡ Quick Commands
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (!selectedMeeting || !selectedMeeting.id) {
                    alert('Meeting을 먼저 선택해주세요.');
                    return;
                  }
                  handleTranscribe(selectedMeeting);
                }}
                disabled={transcribing || !selectedMeeting || !selectedMeeting.id}
                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Analyze
              </button>
              <button
                onClick={() => {
                  if (analysisResult) handleSendToCanvas();
                  else alert('분석 결과가 없습니다.');
                }}
                disabled={!analysisResult}
                className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📊 To Canvas
              </button>
              <button
                onClick={() => handleSendToConceptBoard()}
                disabled={!analysisResult}
                className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                컨셉보드로 보내기
              </button>
              <button
                onClick={() => {
                  const text = analysisResult?.summary || '';
                  if (text) {
                    navigator.clipboard.writeText(text);
                    alert('✅ Summary copied to clipboard!');
                  }
                }}
                disabled={!analysisResult}
                className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📋 Copy Summary
              </button>
              <button
                onClick={() => {
                  setMeetings([]);
                  setSelectedMeeting(null);
                  setAnalysisResult(null);
                }}
                className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        )}

        {/* Selected Meeting Details */}
        {selectedMeeting && (
          <div className="mt-6 space-y-4">
            {/* Meeting Info Header */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
                  {selectedMeeting.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeConfig(selectedMeeting.status).color}`}>
                  {getStatusBadgeConfig(selectedMeeting.status).label}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {formatDate(selectedMeeting.created_at)}
                {selectedMeeting.duration_seconds && ` • ${Math.floor(selectedMeeting.duration_seconds / 60)}분 ${selectedMeeting.duration_seconds % 60}초`}
              </p>
            </div>

            {/* Transcript Section */}
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  if (!showTranscript && transcripts.length === 0) {
                    loadTranscripts(selectedMeeting.id);
                  } else {
                    setShowTranscript(!showTranscript);
                  }
                }}
                className="w-full p-3 bg-blue-50 flex items-center justify-between hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">트랜스크립트 (스크립트)</span>
                </div>
                <div className="flex items-center gap-2">
                  {loadingTranscript && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                  {showTranscript ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </button>

              {showTranscript && (
                <div className="p-3 bg-white border-t border-blue-200">
                  {transcripts.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {transcripts[0]?.language || 'Unknown'} • {transcripts[0]?.backend || 'Unknown'}
                        </span>
                        <button
                          onClick={copyTranscript}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="w-3 h-3" />
                          복사
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap">
                        {transcripts.find(t => t.is_primary)?.transcript_text || transcripts[0]?.transcript_text || '트랜스크립트가 없습니다.'}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">
                      트랜스크립트가 없습니다. 먼저 분석을 실행해주세요.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Analysis Result Section */}
            {analysisResult && (
              <div className="border border-purple-200 rounded-lg overflow-hidden">
                <div className="p-3 bg-purple-50 flex items-center justify-between">
                  <button
                    onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
                    className="flex items-center gap-2 hover:bg-purple-100 rounded px-2 py-1 -ml-2 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">분석 결과</span>
                    {showAnalysisDetails ? (
                      <ChevronUp className="w-4 h-4 text-purple-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-purple-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition-colors"
                    title="분석 결과 편집"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    편집
                  </button>
                </div>

                {showAnalysisDetails && (
                  <div className="p-3 bg-white border-t border-purple-200 space-y-3">
                    {/* Summary */}
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">📝 요약</p>
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{analysisResult.summary || '요약 없음'}</p>
                    </div>

                    {/* Agenda */}
                    {analysisResult.agenda && analysisResult.agenda.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">📋 안건 ({analysisResult.agenda.length})</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {analysisResult.agenda.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-purple-500">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Decisions */}
                    {analysisResult.decisions && analysisResult.decisions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">✓ 결정사항 ({analysisResult.decisions.length})</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {analysisResult.decisions.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-green-500">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Items */}
                    {analysisResult.action_items && analysisResult.action_items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-1">⚡ 액션 아이템 ({analysisResult.action_items.length})</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {analysisResult.action_items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-red-500">→</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Campaign Ideas */}
                    {analysisResult.campaign_ideas && analysisResult.campaign_ideas.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-indigo-700 mb-1">💡 캠페인 아이디어 ({analysisResult.campaign_ideas.length})</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {analysisResult.campaign_ideas.map((idea, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-indigo-500">•</span>
                              <span>{idea}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleSendToCanvas}
                  disabled={!analysisResult}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  캔버스에 추가
                </button>
                <button
                  onClick={() => handleSendToConceptBoard()}
                  disabled={!analysisResult}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  컨셉보드로 보내기
                </button>
              </div>
              <button
                onClick={() => toast.info('프로젝트 추가 기능은 준비 중입니다.')}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                프로젝트에 추가
              </button>
            </div>
          </div>
        )}

        {meetings.length === 0 && !uploadedFile && (
          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>No meetings yet...</p>
            <p className="mt-1">Upload a meeting recording to get started</p>
          </div>
        )}
      </div>

      {/* 분석 결과 편집 모달 */}
      {analysisResult && (
        <MeetingAnalysisEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          analysisResult={analysisResult}
          onSave={handleSaveAnalysisResult}
          onSendToConceptBoard={handleSendToConceptBoard}
          meetingTitle={selectedMeeting?.title}
        />
      )}
    </div>
  );
}
