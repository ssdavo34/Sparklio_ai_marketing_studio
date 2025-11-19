/**
 * Editor Test Page
 *
 * URL: http://localhost:3000/editor
 *
 * Phase 1 Day 2 첫 렌더링 테스트:
 * - EditorShell + CanvasStage + CanvasEngine
 * - 샘플 문서 자동 로드
 * - 드래그, 선택, 변형 테스트
 */

'use client';

import React, { useEffect } from 'react';
import { useEditorStore } from '@/modules/editor/store/editorStore';
import { EditorShell } from '@/modules/editor/components/EditorShell';
import { sampleDocument } from '@/modules/editor/mock/sampleDocument';

export default function EditorPage() {
  const { loadDocument } = useEditorStore();

  // 샘플 문서 자동 로드
  useEffect(() => {
    loadDocument(sampleDocument);
  }, [loadDocument]);

  return <EditorShell />;
}
