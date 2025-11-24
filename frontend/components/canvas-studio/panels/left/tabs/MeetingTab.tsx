'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, X, Mic, Video, Sparkles, Loader2, FileAudio, Clock, Download, Radio } from 'lucide-react';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import type { Meeting, MeetingAnalysisResult, MeetingStatus } from '@/types/meeting';
import {
  createMeetingFromFile,
  createMeetingFromUrl,
  transcribeMeeting,
  analyzeMeeting,
  meetingToBrief,
  listMeetings,
  getMeeting,
} from '@/lib/api/meeting-api';

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
  const [sourceType, setSourceType] = useState<'upload' | 'youtube' | 'webpage'>('upload');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [analysisResult, setAnalysisResult] = useState<MeetingAnalysisResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [pollingMeetings, setPollingMeetings] = useState<Set<string>>(new Set());
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  // Load meetings on mount
  useEffect(() => {
    loadMeetings();
  }, []);

  // Polling logic for meetings in progress
  useEffect(() => {
    if (pollingMeetings.size === 0) return;

    const interval = setInterval(async () => {
      for (const meetingId of Array.from(pollingMeetings)) {
        try {
          const updatedMeeting = await getMeeting(meetingId);

          // Update meetings list
          setMeetings((prev) =>
            prev.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m))
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
      const meetings = await listMeetings();
      setMeetings(meetings);
    } catch (error) {
      console.error('Failed to load meetings:', error);
      // 에러 발생 시 빈 배열로 초기화
      setMeetings([]);
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

      setMeetings((prev) => [meeting, ...prev]);
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

      setMeetings((prev) => [meeting, ...prev]);
      setSelectedMeeting(meeting);
      setUrl('');

      // Start polling if meeting is in progress
      if (['created', 'downloading', 'ready_for_stt', 'transcribing'].includes(meeting.status)) {
        setPollingMeetings((prev) => new Set(prev).add(meeting.id));
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
        prev.map((m) =>
          m.id === meeting.id ? { ...m, status: 'transcribed' as const } : m
        )
      );

      // Step 2: Analyze
      console.log(`[MeetingTab] Analyzing meeting ${meeting.id}...`);
      const analyzeResponse = await analyzeMeeting(meeting.id);

      setAnalysisResult(analyzeResponse.analysis);

      // Update meeting status to analyzed
      setMeetings((prev) =>
        prev.map((m) =>
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

  const handleSendToCanvas = () => {
    if (!analysisResult || !polotnoStore) {
      alert('분석 결과가 없거나 캔버스가 준비되지 않았습니다.');
      return;
    }

    const page = polotnoStore.activePage;
    if (!page) {
      alert('활성 페이지가 없습니다.');
      return;
    }

    // Clear existing elements
    page.children.forEach((child: any) => child.remove());

    const pageWidth = page.width;
    const pageHeight = page.height;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    // Title
    page.addElement({
      type: 'text',
      x: margin,
      y: currentY,
      width: contentWidth,
      fontSize: 48,
      fontWeight: 'bold',
      fill: '#7C3AED',
      text: '📊 Meeting Summary',
    });
    currentY += 80;

    // Summary
    page.addElement({
      type: 'text',
      x: margin,
      y: currentY,
      width: contentWidth,
      fontSize: 20,
      fill: '#4B5563',
      text: analysisResult.summary,
    });
    currentY += 80;

    // Agenda
    page.addElement({
      type: 'text',
      x: margin,
      y: currentY,
      width: contentWidth,
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#1F2937',
      text: '📋 Agenda',
    });
    currentY += 45;

    analysisResult.agenda.forEach((item: string) => {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 18,
        fill: '#4B5563',
        text: `• ${item}`,
      });
      currentY += 30;
    });
    currentY += 20;

    // Decisions
    page.addElement({
      type: 'text',
      x: margin,
      y: currentY,
      width: contentWidth,
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#059669',
      text: '✓ Decisions',
    });
    currentY += 45;

    analysisResult.decisions.forEach((item: string) => {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 18,
        fill: '#047857',
        text: `✓ ${item}`,
      });
      currentY += 30;
    });
    currentY += 20;

    // Action Items
    page.addElement({
      type: 'text',
      x: margin,
      y: currentY,
      width: contentWidth,
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#DC2626',
      text: '⚡ Action Items',
    });
    currentY += 45;

    analysisResult.action_items.forEach((item: string) => {
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 18,
        fill: '#B91C1C',
        text: `→ ${item}`,
      });
      currentY += 35;
    });

    alert('✅ Meeting Summary가 캔버스에 표시되었습니다!');
  };

  const removeFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url);
      setUploadedFile(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <h3 className="text-xs font-semibold text-gray-700 mb-3">
              Meetings ({meetings.length})
            </h3>
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                    selectedMeeting?.id === meeting.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMeeting(meeting)}
                >
                  <div className="flex items-start justify-between gap-2">
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
                  if (selectedMeeting) handleTranscribe(selectedMeeting);
                  else alert('Meeting을 먼저 선택해주세요.');
                }}
                disabled={transcribing || !selectedMeeting}
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

        {/* Analysis Result */}
        {analysisResult && selectedMeeting?.status === 'analyzed' && (
          <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">
              📊 Analysis Result
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Summary</p>
                <p className="text-xs text-gray-600">{analysisResult.summary}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Campaign Ideas ({analysisResult.campaign_ideas.length})
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {analysisResult.campaign_ideas.map((idea, idx) => (
                    <li key={idx}>• {idea}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={handleSendToCanvas}
              className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Send to Canvas
            </button>
          </div>
        )}

        {meetings.length === 0 && !uploadedFile && (
          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>No meetings yet...</p>
            <p className="mt-1">Upload a meeting recording to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
