/**
 * Mixboard Panel
 *
 * 레퍼런스 이미지 관리 패널
 * - 이미지 업로드/URL 입력
 * - Role/Tags/GroupId 설정
 * - Weight 조절
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-03
 */

'use client';

import { useState, useRef } from 'react';
import { Upload, Link, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useImageTabStore } from '../../stores/useImageTabStore';
import { MixRefCard } from './MixRefCard';
import type { MixRole } from '../../stores/types/imageTab';
import { MIX_ROLE_LABELS } from '../../stores/types/imageTab';

export function MixboardPanel() {
  const mixRefs = useImageTabStore((s) => s.mixRefs);
  const addMixRef = useImageTabStore((s) => s.addMixRef);
  const clearMixRefs = useImageTabStore((s) => s.clearMixRefs);
  const setMixboardOpen = useImageTabStore((s) => s.setMixboardOpen);

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedRole, setSelectedRole] = useState<MixRole>('product');
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [groupId, setGroupId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFromUrl = () => {
    if (!imageUrl.trim()) return;

    addMixRef({
      url: imageUrl.trim(),
      role: selectedRole,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      note: note.trim() || undefined,
      weight: 1.0,
      groupId: groupId.trim() || undefined,
    });

    // 폼 초기화
    setImageUrl('');
    setTags('');
    setNote('');
    setGroupId('');
    setIsAddFormOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 파일을 Data URL로 변환
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        addMixRef({
          url: dataUrl,
          role: selectedRole,
          tags: [],
          weight: 1.0,
        });
      };
      reader.readAsDataURL(file);
    });

    // 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-b border-purple-200 bg-purple-50">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-purple-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-purple-800">Mixboard</span>
          <span className="px-1.5 py-0.5 bg-purple-200 text-purple-700 text-[10px] rounded-full">
            {mixRefs.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {mixRefs.length > 0 && (
            <button
              onClick={clearMixRefs}
              className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1"
            >
              전체 삭제
            </button>
          )}
          <button
            onClick={() => setMixboardOpen(false)}
            className="p-1 hover:bg-purple-100 rounded"
          >
            <X className="w-4 h-4 text-purple-600" />
          </button>
        </div>
      </div>

      {/* 레퍼런스 목록 */}
      {mixRefs.length > 0 && (
        <div className="p-2 space-y-2 max-h-[200px] overflow-auto">
          {mixRefs.map((ref) => (
            <MixRefCard key={ref.id} mixRef={ref} />
          ))}
        </div>
      )}

      {/* 추가 폼 */}
      <div className="p-2">
        {isAddFormOpen ? (
          <div className="bg-white rounded-lg border border-purple-200 p-3 space-y-3">
            {/* URL 입력 */}
            <div>
              <label className="text-xs text-neutral-600 mb-1 block">이미지 URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 text-xs border border-neutral-200 rounded px-2 py-1.5"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 border border-neutral-200 rounded hover:bg-neutral-50"
                  title="파일 업로드"
                >
                  <Upload className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </div>

            {/* Role 선택 */}
            <div>
              <label className="text-xs text-neutral-600 mb-1 block">분류</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as MixRole)}
                className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5"
              >
                {Object.entries(MIX_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags 입력 */}
            <div>
              <label className="text-xs text-neutral-600 mb-1 block">태그 (쉼표로 구분)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="cosmetics, lipstick, red"
                className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5"
              />
            </div>

            {/* Note + GroupId */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-neutral-600 mb-1 block">메모</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="선택사항"
                  className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 mb-1 block">그룹 ID</label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="model_A"
                  className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5"
                />
              </div>
            </div>

            {/* 버튼들 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddFormOpen(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded"
              >
                취소
              </button>
              <button
                onClick={handleAddFromUrl}
                disabled={!imageUrl.trim()}
                className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                추가
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddFormOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-purple-300 rounded-lg text-xs text-purple-600 hover:bg-purple-100 hover:border-purple-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>레퍼런스 추가</span>
          </button>
        )}
      </div>

      {/* 숨김 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
