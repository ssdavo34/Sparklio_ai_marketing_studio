'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, X, Mic, Video, Sparkles, Loader2, FileAudio, Clock } from 'lucide-react';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import type { Meeting, MeetingAnalysisResult, TranscribeResponse } from '@/types';

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
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  // Load meetings on mount
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/meetings');
      // const data = await response.json();
      // setMeetings(data.items || data);

      // Mock data for now
      setMeetings([]);
    } catch (error) {
      console.error('Failed to load meetings:', error);
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
      // TODO: Replace with actual API call
      // const formData = new FormData();
      // formData.append('file', uploadedFile.file);
      // formData.append('title', uploadedFile.name);
      //
      // const response = await fetch('/api/v1/meetings/upload', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const meeting: Meeting = await response.json();

      // Mock meeting for now
      const meeting: Meeting = {
        id: `meeting-${Date.now()}`,
        title: uploadedFile.name,
        source_type: 'upload',
        status: 'uploaded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

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
      let detectedType: 'youtube' | 'webpage' = 'webpage';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        detectedType = 'youtube';
      }

      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/meetings/from-url', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ url, source_type: detectedType }),
      // });
      // const meeting: Meeting = await response.json();

      // Mock meeting for now
      const meeting: Meeting = {
        id: `meeting-${Date.now()}`,
        title: detectedType === 'youtube' ? 'YouTube Video' : 'Web Page Analysis',
        source_type: detectedType === 'youtube' ? 'youtube' : 'other',
        source_url: url,
        status: 'uploaded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMeetings((prev) => [meeting, ...prev]);
      setSelectedMeeting(meeting);
      setUrl('');

      alert('✅ Meeting이 생성되었습니다. Transcribe를 시작하세요.');
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
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/meetings/${meeting.id}/transcribe`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     importance: 'normal',
      //     run_meeting_agent: true,
      //   }),
      // });
      // const data: TranscribeResponse = await response.json();

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock analysis result
      const mockResult: MeetingAnalysisResult = {
        summary: '이번 마케팅 팀 회의에서는 신제품 론칭 캠페인 전략을 논의했습니다. 타겟 고객층을 20-30대로 설정하고, SNS 마케팅을 중심으로 진행하기로 결정했습니다.',
        agenda: [
          '신제품 론칭 일정 확정',
          'SNS 마케팅 채널 선정',
          '예산 배분 논의',
          'KPI 설정',
        ],
        decisions: [
          '론칭일: 2025년 12월 15일',
          '주요 채널: Instagram, TikTok',
          '총 예산: 5,000만원',
        ],
        action_items: [
          '마케팅 담당자: 채널별 콘텐츠 기획안 작성 (~ 11/30)',
          '디자인 팀: 비주얼 컨셉 초안 제출 (~ 12/05)',
          '개발팀: 랜딩페이지 구축 (~ 12/10)',
        ],
        campaign_ideas: [
          '인플루언서 협업 캠페인',
          '얼리버드 할인 이벤트',
          '사용자 후기 공모전',
        ],
        analyzed_at: new Date().toISOString(),
        analyzer_version: 'v1.0',
      };

      setAnalysisResult(mockResult);

      // Update meeting status
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meeting.id ? { ...m, status: 'analyzed' as const } : m
        )
      );

      alert('✅ Transcribe & 분석 완료!');
    } catch (error) {
      console.error('Transcribe failed:', error);
      alert('❌ 분석 실패');
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
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        meeting.status === 'analyzed'
                          ? 'bg-green-100 text-green-700'
                          : meeting.status === 'transcribed'
                          ? 'bg-blue-100 text-blue-700'
                          : meeting.status === 'transcribing'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {meeting.status}
                    </span>
                  </div>
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
