/**
 * Image Settings Bar
 *
 * ImageTab 상단 설정 바
 * - 비율 선택
 * - 배치 사이즈
 * - LLM 선택
 * - Mixboard 토글
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-03
 */

'use client';

import { Settings2, Layers, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useImageTabStore } from '../../stores/useImageTabStore';
import type { AspectRatio, ImageProvider, PromptLLM } from '../../stores/types/imageTab';

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

const BATCH_SIZES: { value: 1 | 2 | 4; label: string }[] = [
  { value: 1, label: '1장' },
  { value: 2, label: '2장' },
  { value: 4, label: '4장' },
];

const PROMPT_LLMS: { value: PromptLLM; label: string }[] = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude', label: 'Claude' },
  { value: 'qwen', label: 'Qwen' },
];

const IMAGE_PROVIDERS: { value: ImageProvider | 'auto'; label: string }[] = [
  { value: 'zimage', label: 'Z-Image' },
  { value: 'comfyui', label: 'ComfyUI' },
  { value: 'nanobanana', label: 'NanoBanana' },
  { value: 'auto', label: '자동' },
];

export function ImageSettingsBar() {
  const settings = useImageTabStore((s) => s.settings);
  const updateSettings = useImageTabStore((s) => s.updateSettings);
  const isMixboardOpen = useImageTabStore((s) => s.isMixboardOpen);
  const toggleMixboard = useImageTabStore((s) => s.toggleMixboard);
  const mixRefCount = useImageTabStore((s) => s.mixRefs.length);

  return (
    <div className="border-b border-neutral-200 bg-neutral-50 p-3 space-y-3">
      {/* 첫 번째 줄: 비율 + 배치 */}
      <div className="flex items-center gap-4">
        {/* 비율 선택 */}
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-neutral-500" />
          <div className="flex gap-1">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => updateSettings({ aspectRatio: ratio.value })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  settings.aspectRatio === ratio.value
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:border-green-300'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* 배치 사이즈 */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-neutral-500" />
          <div className="flex gap-1">
            {BATCH_SIZES.map((batch) => (
              <button
                key={batch.value}
                onClick={() => updateSettings({ batchSize: batch.value })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  settings.batchSize === batch.value
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:border-green-300'
                }`}
              >
                {batch.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 두 번째 줄: LLM 선택 + Mixboard 토글 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 프롬프트 LLM */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neutral-500" />
            <select
              value={settings.promptLLM}
              onChange={(e) => updateSettings({ promptLLM: e.target.value as PromptLLM })}
              className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white"
            >
              {PROMPT_LLMS.map((llm) => (
                <option key={llm.value} value={llm.value}>
                  {llm.label}
                </option>
              ))}
            </select>
          </div>

          {/* 이미지 Provider */}
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-neutral-500" />
            <select
              value={settings.imageLLM}
              onChange={(e) => updateSettings({ imageLLM: e.target.value as ImageProvider | 'auto' })}
              className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white"
            >
              {IMAGE_PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mixboard 토글 */}
        <button
          onClick={toggleMixboard}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
            isMixboardOpen
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:border-purple-300'
          }`}
        >
          <span className="font-medium">Mixboard</span>
          {mixRefCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              isMixboardOpen ? 'bg-purple-200' : 'bg-neutral-100'
            }`}>
              {mixRefCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
