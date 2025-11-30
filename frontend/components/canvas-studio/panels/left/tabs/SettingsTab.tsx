/**
 * Settings Tab
 *
 * 시스템 설정 탭
 * - AI & 모델 설정 (LLM 선택, 스마트 라우터)
 * - 일반 설정
 * - 계정 정보
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-30
 */

'use client';

import { Settings, Cpu, User, Bell, Globe, Palette } from 'lucide-react';
import { useChatStore } from '../../../stores/useChatStore';
import { TEXT_LLM_INFO, IMAGE_LLM_INFO } from '../../../stores/types/llm';
import type { TextLLMProvider, ImageLLMProvider } from '../../../stores/types/llm';

export function SettingsTab() {
  const {
    chatConfig,
    setTextLLM,
    setImageLLM,
    setSmartRouterEnabled,
    setTextPriority,
    setImagePriority,
  } = useChatStore();

  const smartRouter = chatConfig.smartRouter || {
    enabled: true,
    textPriority: ['gpt-4o', 'claude', 'gemini', 'llama'] as TextLLMProvider[],
    imagePriority: ['comfyui', 'nanobanana', 'dalle', 'stable-diffusion'] as ImageLLMProvider[],
    videoPriority: ['veo3', 'kling', 'sora2', 'runway'],
  };

  // 우선순위 변경 핸들러
  const moveTextPriority = (index: number, direction: 'up' | 'down') => {
    const newPriority = [...smartRouter.textPriority];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPriority.length) return;
    [newPriority[index], newPriority[targetIndex]] = [newPriority[targetIndex], newPriority[index]];
    setTextPriority(newPriority);
  };

  const moveImagePriority = (index: number, direction: 'up' | 'down') => {
    const newPriority = [...smartRouter.imagePriority];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPriority.length) return;
    [newPriority[index], newPriority[targetIndex]] = [newPriority[targetIndex], newPriority[index]];
    setImagePriority(newPriority);
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-neutral-600" />
        <h2 className="text-lg font-semibold text-neutral-800">설정</h2>
      </div>

      {/* 설정 섹션들 */}
      <div className="space-y-6">
        {/* AI & 모델 설정 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-neutral-700">AI & 모델 설정</h3>
          </div>

          {/* Smart Router ON/OFF Toggle */}
          <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-purple-900">스마트 라우터</h4>
                  <p className="text-[10px] text-purple-600">자동 모델 선택 및 폴백</p>
                </div>
              </div>
              <button
                onClick={() => setSmartRouterEnabled(!smartRouter.enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  smartRouter.enabled ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    smartRouter.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
            {smartRouter.enabled && (
              <ul className="text-xs text-purple-600 space-y-1 ml-12">
                <li>• 비용/속도 최적화</li>
                <li>• 작업 유형별 모델 매칭</li>
                <li>• 자동 폴백 처리</li>
              </ul>
            )}
          </div>

          {/* 기본 텍스트 LLM */}
          <div className="mb-4">
            <label className="text-xs font-medium text-neutral-600 mb-2 block">
              기본 텍스트 LLM
            </label>
            <select
              value={chatConfig.textLLM || 'auto'}
              onChange={(e) => setTextLLM(e.target.value as TextLLMProvider)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {Object.entries(TEXT_LLM_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.name} - {info.description}
                </option>
              ))}
            </select>

            {/* Text LLM Priority */}
            {smartRouter.enabled && (
              <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs font-medium text-neutral-700 mb-2">텍스트 LLM 우선순위</p>
                <div className="space-y-1">
                  {smartRouter.textPriority.map((provider, index) => (
                    <div key={provider} className="flex items-center justify-between px-2 py-1.5 bg-white rounded border border-neutral-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400 w-4">{index + 1}.</span>
                        <span className="text-xs font-medium text-neutral-700">
                          {TEXT_LLM_INFO[provider]?.name || provider}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveTextPriority(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveTextPriority(index, 'down')}
                          disabled={index === smartRouter.textPriority.length - 1}
                          className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 기본 이미지 LLM */}
          <div className="mb-4">
            <label className="text-xs font-medium text-neutral-600 mb-2 block">
              기본 이미지 LLM
            </label>
            <select
              value={chatConfig.imageLLM || 'auto'}
              onChange={(e) => setImageLLM(e.target.value as ImageLLMProvider)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {Object.entries(IMAGE_LLM_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.name} - {info.description}
                </option>
              ))}
            </select>

            {/* Image LLM Priority */}
            {smartRouter.enabled && (
              <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs font-medium text-neutral-700 mb-2">이미지 LLM 우선순위</p>
                <div className="space-y-1">
                  {smartRouter.imagePriority.map((provider, index) => (
                    <div key={provider} className="flex items-center justify-between px-2 py-1.5 bg-white rounded border border-neutral-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400 w-4">{index + 1}.</span>
                        <span className="text-xs font-medium text-neutral-700">
                          {IMAGE_LLM_INFO[provider]?.name || provider}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveImagePriority(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveImagePriority(index, 'down')}
                          disabled={index === smartRouter.imagePriority.length - 1}
                          className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 품질 프로필 매핑 정보 */}
          <div className="p-3 bg-neutral-50 rounded-lg text-xs space-y-1">
            <p className="font-medium text-neutral-700">품질 프로필별 모델 매핑:</p>
            <div className="flex justify-between text-neutral-600">
              <span>⚡ 빠름</span>
              <span>GPT-4o-mini / Claude Haiku</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>● 균형</span>
              <span>GPT-4o / Claude Sonnet</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>★ 품질</span>
              <span>GPT-4o / Claude Opus</span>
            </div>
          </div>
        </section>

        {/* 구분선 */}
        <div className="border-t border-neutral-200" />

        {/* 일반 설정 (플레이스홀더) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-neutral-700">일반</h3>
          </div>

          <div className="space-y-3">
            {/* 언어 */}
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-2 block">언어</label>
              <select
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                defaultValue="ko"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* 테마 */}
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-2 block">테마</label>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-xs border border-purple-300 bg-purple-50 text-purple-700 rounded-lg">
                  라이트
                </button>
                <button className="flex-1 px-3 py-2 text-xs border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-50">
                  다크 (준비중)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 구분선 */}
        <div className="border-t border-neutral-200" />

        {/* 알림 설정 (플레이스홀더) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-neutral-700">알림</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">작업 완료 알림</span>
              <button className="relative w-10 h-5 rounded-full bg-purple-600">
                <span className="absolute top-0.5 left-5 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">에러 알림</span>
              <button className="relative w-10 h-5 rounded-full bg-purple-600">
                <span className="absolute top-0.5 left-5 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </section>

        {/* 구분선 */}
        <div className="border-t border-neutral-200" />

        {/* 계정 정보 (플레이스홀더) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-semibold text-neutral-700">계정</h3>
          </div>

          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-600 mb-2">로그인하지 않음</p>
            <button className="w-full py-2 px-4 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
              로그인
            </button>
          </div>
        </section>

        {/* 버전 정보 */}
        <div className="pt-4 text-center">
          <p className="text-xs text-neutral-400">
            Sparklio AI Marketing Studio v0.1.0
          </p>
        </div>
      </div>
    </div>
  );
}
