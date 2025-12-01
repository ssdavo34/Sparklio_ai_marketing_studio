'use client';

import React, { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import { useCenterViewStore } from '../stores/useCenterViewStore';
import { useGeneratedAssetsStore } from '../stores/useGeneratedAssetsStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { addShortsScriptToCanvas } from '@/lib/canvas/shortsTemplate';
import { toast } from '@/components/ui/Toast';
import type { ShortsScriptData } from '@/types/demo';

// 통합 씬 타입
interface SceneViewData {
  scene_number: number;
  duration: string;
  visual: string;
  narration: string;
  text_overlay?: string;
  transition?: string;
  start_time?: number;
  end_time?: number;
  duration_seconds?: number;
  visual_description?: string;
  bgm_mood?: string;
}

interface ShortsViewData {
  id: string;
  title: string;
  hook: string;
  scenes: SceneViewData[];
  cta: string;
  music_suggestion?: string;
  total_duration?: string;
  video_specs?: {
    duration_seconds: number;
  };
  audio?: {
    tts_voice: string;
    tts_provider: string;
    bgm_track: string;
    bgm_volume: number;
  };
}

export function ShortsPreviewView() {
  const { selectedConcept, backToConceptBoard, backToCanvas, setView } = useCenterViewStore();
  const generatedShortsData = useGeneratedAssetsStore((state) => state.shortsData);
  const polotnoStore = useCanvasStore((state) => state.canvases.get(state.activeCanvasType) || null);
  const [mockData, setMockData] = useState<ShortsScriptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeScene, setActiveScene] = useState(0);
  const [dataSource, setDataSource] = useState<'generated' | 'mock'>('generated');

  // Mock 데이터 로드 (생성된 데이터가 없을 때만)
  useEffect(() => {
    async function loadMockData() {
      if (generatedShortsData) {
        setIsLoading(false);
        setDataSource('generated');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/mock-data/shorts-script-sample.json');
        const data = await response.json();
        setMockData(data);
        setDataSource('mock');
      } catch (err) {
        console.error('Error loading shorts script:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMockData();
  }, [generatedShortsData]);

  // 표시할 데이터 결정
  const shortsData: ShortsViewData | null = generatedShortsData
    ? {
        id: generatedShortsData.id,
        title: generatedShortsData.title,
        hook: generatedShortsData.hook,
        scenes: generatedShortsData.scenes.map((scene) => ({
          scene_number: scene.scene_number,
          duration: scene.duration,
          visual: scene.visual,
          narration: scene.narration,
          text_overlay: scene.text_overlay,
          transition: scene.transition,
        })),
        cta: generatedShortsData.cta,
        music_suggestion: generatedShortsData.music_suggestion,
        total_duration: generatedShortsData.total_duration,
      }
    : mockData
      ? {
          id: mockData.id,
          title: mockData.title,
          hook: mockData.hook.text,
          scenes: mockData.scenes.map((scene) => ({
            scene_number: scene.scene_number,
            duration: `${scene.duration_seconds}초`,
            visual: scene.visual_description,
            narration: scene.narration,
            text_overlay: scene.text_overlay || undefined,
            transition: scene.transition,
            start_time: scene.start_time,
            end_time: scene.end_time,
            duration_seconds: scene.duration_seconds,
            visual_description: scene.visual_description,
            bgm_mood: scene.bgm_mood,
          })),
          cta: mockData.cta.text,
          video_specs: mockData.video_specs,
          audio: mockData.audio,
        }
      : null;

  // Canvas로 변환 핸들러
  const handleEditInCanvas = () => {
    if (!polotnoStore) {
      toast.error('Canvas가 준비되지 않았습니다');
      return;
    }

    if (!shortsData || !shortsData.scenes || shortsData.scenes.length === 0) {
      toast.error('쇼츠 스크립트 데이터가 없습니다');
      return;
    }

    try {
      // Shorts Script를 Canvas에 추가 (타입 호환을 위해 as any 사용)
      addShortsScriptToCanvas(polotnoStore, shortsData as any);

      // Canvas 뷰로 전환
      setView('canvas');

      const totalScenes = shortsData.scenes.length + 2; // Hook + Scenes + CTA
      toast.success(`${totalScenes}개 씬이 Canvas에 추가되었습니다 (Hook, ${shortsData.scenes.length}개 씬, CTA)`);
    } catch (error: any) {
      console.error('[ShortsPreview] Canvas 변환 실패:', error);
      toast.error('Canvas 변환 실패: ' + (error?.message || '알 수 없는 오류'));
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shortsData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">쇼츠 스크립트 데이터를 불러올 수 없습니다.</p>
          <button
            onClick={backToCanvas}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            캔버스로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const scene = shortsData.scenes[activeScene];

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={backToConceptBoard}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600"
          >
            ← 컨셉보드로
          </button>
          <span className="text-gray-300">|</span>
          <h2 className="font-semibold text-gray-900">🎬 쇼츠 스크립트 미리보기</h2>
          {dataSource === 'generated' && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              AI 생성
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEditInCanvas}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            Canvas에서 편집
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {shortsData.video_specs && (
              <>
                <span>⏱️ {shortsData.video_specs.duration_seconds}초</span>
                <span className="text-gray-300">|</span>
              </>
            )}
            {shortsData.total_duration && (
              <>
                <span>⏱️ {shortsData.total_duration}</span>
                <span className="text-gray-300">|</span>
              </>
            )}
            <span>{shortsData.scenes.length}개 씬</span>
          </div>
        </div>
      </div>

      {/* 콘셉트 컨텍스트 */}
      {selectedConcept && (
        <div className="bg-purple-50 px-6 py-2 border-b">
          <p className="text-sm text-purple-700">
            <span className="font-medium">Concept:</span> {selectedConcept.concept_name}
          </p>
        </div>
      )}

      {/* 생성된 데이터 안내 */}
      {dataSource === 'generated' && (
        <div className="bg-green-50 px-6 py-2 border-b">
          <p className="text-sm text-green-700">
            Chat AI가 생성한 쇼츠 스크립트입니다.
          </p>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 씬 리스트 */}
        <div className="w-72 bg-white border-r overflow-auto">
          <div className="p-4">
            {/* Hook */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-700 mb-1">🎯 Hook</p>
              <p className="text-sm text-yellow-800">{shortsData.hook}</p>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3">씬 목록</h3>
            <div className="space-y-2">
              {shortsData.scenes.map((s, idx) => (
                <button
                  key={s.scene_number}
                  onClick={() => setActiveScene(idx)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeScene === idx
                      ? 'bg-purple-100 border-purple-300 border'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">
                      씬 {s.scene_number}
                    </span>
                    <span className="text-xs text-gray-400">
                      {s.duration}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {s.narration}
                  </p>
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-semibold text-red-700 mb-1">📣 CTA</p>
              <p className="text-sm text-red-800">{shortsData.cta}</p>
            </div>
          </div>
        </div>

        {/* 오른쪽: 씬 상세 */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-6">
            {/* 현재 씬 상세 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* 씬 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded">
                    씬 {scene.scene_number}
                  </span>
                  <span className="text-sm text-gray-500">
                    {scene.duration}
                  </span>
                </div>
                {scene.bgm_mood && (
                  <span className={`px-2 py-1 text-xs rounded ${
                    scene.bgm_mood === 'tense' ? 'bg-red-100 text-red-700' :
                    scene.bgm_mood === 'uplifting' ? 'bg-green-100 text-green-700' :
                    scene.bgm_mood === 'exciting' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    BGM: {scene.bgm_mood}
                  </span>
                )}
              </div>

              {/* 비주얼 프리뷰 (플레이스홀더) */}
              <div className="aspect-[9/16] max-w-[200px] mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-6 flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <span className="text-4xl mb-2 block">🎥</span>
                  <p className="text-xs opacity-70">{scene.visual || scene.visual_description}</p>
                </div>
              </div>

              {/* 씬 정보 */}
              <div className="space-y-4">
                {/* 나레이션 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-blue-700 mb-2">🎙️ 나레이션</h4>
                  <p className="text-gray-800">"{scene.narration}"</p>
                </div>

                {/* 화면 텍스트 */}
                {scene.text_overlay && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-yellow-700 mb-2">📝 화면 텍스트</h4>
                    <p className="text-gray-800 font-medium">{scene.text_overlay}</p>
                  </div>
                )}

                {/* 비주얼 설명 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">🎨 비주얼 설명</h4>
                  <p className="text-gray-700">{scene.visual || scene.visual_description}</p>
                </div>

                {/* 전환 효과 */}
                {scene.transition && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>전환:</span>
                    <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                      {scene.transition}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 오디오 설정 정보 (Mock 데이터용) */}
            {shortsData.audio && (
              <div className="mt-6 bg-white rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🎵 오디오 설정</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">TTS 음성:</span>
                    <span className="ml-2 text-gray-800">{shortsData.audio.tts_voice}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">TTS 제공자:</span>
                    <span className="ml-2 text-gray-800">{shortsData.audio.tts_provider}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">BGM 트랙:</span>
                    <span className="ml-2 text-gray-800">{shortsData.audio.bgm_track}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">BGM 볼륨:</span>
                    <span className="ml-2 text-gray-800">{shortsData.audio.bgm_volume * 100}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* 음악 제안 (생성된 데이터용) */}
            {shortsData.music_suggestion && (
              <div className="mt-6 bg-white rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">🎵 음악 제안</h3>
                <p className="text-sm text-gray-600">{shortsData.music_suggestion}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="bg-white border-t px-6 py-3 flex items-center justify-center gap-4">
        <button
          onClick={() => setActiveScene(Math.max(0, activeScene - 1))}
          disabled={activeScene === 0}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          ← 이전 씬
        </button>
        <span className="text-sm text-gray-500">
          {activeScene + 1} / {shortsData.scenes.length}
        </span>
        <button
          onClick={() => setActiveScene(Math.min(shortsData.scenes.length - 1, activeScene + 1))}
          disabled={activeScene === shortsData.scenes.length - 1}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          다음 씬 →
        </button>
      </div>
    </div>
  );
}

export default ShortsPreviewView;
