'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/store/editor-store';

/**
 * EditorCanvas 컴포넌트
 *
 * Fabric.js 기반 캔버스를 렌더링합니다.
 * - Editor JSON → Fabric Objects 변환
 * - Text, Image, Shape 렌더링
 * - Object 선택 이벤트
 * - 도형 추가, Undo/Redo 기능 (Phase 2 ✅)
 */
export default function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  // Undo/Redo를 위한 히스토리 스택
  const historyStack = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const isHistoryAction = useRef(false);

  const { currentDocument, setCanvas, setSelectedObjectId } = useEditorStore();

  // 히스토리에 현재 상태 추가
  const saveHistory = useCallback(() => {
    if (!fabricRef.current || isHistoryAction.current) return;

    const json = JSON.stringify(fabricRef.current.toJSON());

    // 현재 인덱스 이후의 히스토리 제거
    historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);

    // 새 상태 추가
    historyStack.current.push(json);
    historyIndex.current++;

    console.log(`📚 [HISTORY] Saved state (index: ${historyIndex.current}, total: ${historyStack.current.length})`);
  }, []);

  // 도형 추가 함수
  const addShape = useCallback((shapeType: 'rectangle' | 'circle' | 'triangle' | 'text') => {
    if (!fabricRef.current) return;

    console.log(`⚡ [ACTION] Adding shape: ${shapeType}`);
    let shape: fabric.Object;

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: 300,
          top: 200,
          width: 200,
          height: 150,
          fill: '#3b82f6',
          stroke: '#1e40af',
          strokeWidth: 2,
          hasControls: true,
          hasBorders: true,
        });
        break;

      case 'circle':
        shape = new fabric.Circle({
          left: 300,
          top: 200,
          radius: 75,
          fill: '#10b981',
          stroke: '#047857',
          strokeWidth: 2,
          hasControls: true,
          hasBorders: true,
        });
        break;

      case 'triangle':
        shape = new fabric.Triangle({
          left: 300,
          top: 200,
          width: 200,
          height: 150,
          fill: '#f59e0b',
          stroke: '#b45309',
          strokeWidth: 2,
          hasControls: true,
          hasBorders: true,
        });
        break;

      case 'text':
        shape = new fabric.Text('Text', {
          left: 300,
          top: 200,
          fontSize: 32,
          fill: '#1f2937',
          fontFamily: 'Arial',
          hasControls: true,
          hasBorders: true,
        });
        break;

      default:
        return;
    }

    fabricRef.current.add(shape);
    fabricRef.current.setActiveObject(shape);
    fabricRef.current.renderAll();
    saveHistory();
  }, [saveHistory]);

  // Undo 함수
  const handleUndo = useCallback(() => {
    if (!fabricRef.current || historyIndex.current <= 0) {
      console.log('⚠️ [UNDO] No more history');
      return;
    }

    isHistoryAction.current = true;
    historyIndex.current--;

    const json = historyStack.current[historyIndex.current];
    fabricRef.current.loadFromJSON(json, () => {
      fabricRef.current?.renderAll();
      isHistoryAction.current = false;
      console.log(`📚 [UNDO] Restored state (index: ${historyIndex.current})`);
    });
  }, []);

  // Redo 함수
  const handleRedo = useCallback(() => {
    if (!fabricRef.current || historyIndex.current >= historyStack.current.length - 1) {
      console.log('⚠️ [REDO] No more history');
      return;
    }

    isHistoryAction.current = true;
    historyIndex.current++;

    const json = historyStack.current[historyIndex.current];
    fabricRef.current.loadFromJSON(json, () => {
      fabricRef.current?.renderAll();
      isHistoryAction.current = false;
      console.log(`📚 [REDO] Restored state (index: ${historyIndex.current})`);
    });
  }, []);

  // Canvas 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: 1080,
      height: 1350,
      backgroundColor: '#ffffff',
    });

    setCanvas(fabricRef.current);
    setIsCanvasReady(true);

    // 초기 상태 저장
    saveHistory();

    // Object 선택 이벤트
    fabricRef.current.on('selection:created', (e: any) => {
      const selected = e.selected?.[0];
      if (selected) {
        // @ts-ignore - Fabric.js 커스텀 속성
        setSelectedObjectId(selected.id || null);
      }
    });

    fabricRef.current.on('selection:updated', (e: any) => {
      const selected = e.selected?.[0];
      if (selected) {
        // @ts-ignore
        setSelectedObjectId(selected.id || null);
      }
    });

    fabricRef.current.on('selection:cleared', () => {
      setSelectedObjectId(null);
    });

    // Object 이동/수정 이벤트 (히스토리 저장)
    fabricRef.current.on('object:modified', () => {
      saveHistory();
    });

    fabricRef.current.on('object:added', () => {
      if (!isHistoryAction.current) {
        saveHistory();
      }
    });

    fabricRef.current.on('object:removed', () => {
      if (!isHistoryAction.current) {
        saveHistory();
      }
    });

    return () => {
      fabricRef.current?.dispose();
    };
  }, [setCanvas, setSelectedObjectId, saveHistory]);

  // Document 로딩 시 Canvas 업데이트
  useEffect(() => {
    if (!currentDocument || !isCanvasReady) {
      return;
    }

    loadDocumentToCanvas(currentDocument);
  }, [currentDocument, isCanvasReady]);

  // Canvas에 문서 로딩하는 함수
  const loadDocumentToCanvas = (doc: any) => {
    if (!fabricRef.current) return;

    fabricRef.current.clear();
    fabricRef.current.backgroundColor = '#ffffff';

    const page = doc.pages[0];
    if (!page) return;

    // Canvas 크기 설정
    fabricRef.current.setWidth(page.width);
    fabricRef.current.setHeight(page.height);
    fabricRef.current.backgroundColor = page.background;

    // Objects 렌더링
    page.objects.forEach((obj: any) => {
      let fabricObj: fabric.Object | null = null;

      if (obj.type === 'text') {
        fabricObj = new fabric.Text(obj.props.text || '', {
          left: obj.bounds.x,
          top: obj.bounds.y,
          fontSize: obj.props.fontSize || 16,
          fill: obj.props.fill || '#000000',
          fontFamily: obj.props.fontFamily || 'Arial',
          fontWeight: obj.props.fontWeight || 'normal',
          textAlign: obj.props.textAlign || 'left',
          selectable: true,
          hasControls: true,
          hasBorders: true,
        });
      } else if (obj.type === 'image') {
        // Image는 비동기 로딩이 필요하므로 placeholder로 표시
        fabricObj = new fabric.Rect({
          left: obj.bounds.x,
          top: obj.bounds.y,
          width: obj.bounds.width,
          height: obj.bounds.height,
          fill: '#e0e0e0',
          stroke: '#999999',
          strokeWidth: 1,
          selectable: true,
          hasControls: true,
          hasBorders: true,
        });

        // 실제 이미지 로딩 (선택 사항)
        if (obj.props.src) {
          fabric.Image.fromURL(
            obj.props.src,
            (img: any) => {
              if (!fabricRef.current) return;
              img.set({
                left: obj.bounds.x,
                top: obj.bounds.y,
                scaleX: obj.bounds.width / (img.width || 1),
                scaleY: obj.bounds.height / (img.height || 1),
                selectable: true,
                hasControls: true,
                hasBorders: true,
              });
              // @ts-ignore
              img.id = obj.id;
              fabricRef.current.add(img);
              fabricRef.current.renderAll();
            },
            {
              crossOrigin: 'anonymous',
            }
          );
        }
      } else if (obj.type === 'shape') {
        fabricObj = new fabric.Rect({
          left: obj.bounds.x,
          top: obj.bounds.y,
          width: obj.bounds.width,
          height: obj.bounds.height,
          fill: obj.props.fill || '#cccccc',
          stroke: obj.props.stroke || '',
          strokeWidth: obj.props.strokeWidth || 0,
          selectable: true,
          hasControls: true,
          hasBorders: true,
        });
      }

      if (fabricObj) {
        // @ts-ignore - Fabric.js에 커스텀 속성 추가
        fabricObj.id = obj.id;
        fabricRef.current?.add(fabricObj);
      }
    });

    fabricRef.current.renderAll();
    saveHistory();
  };

  // EditorStore에 함수 노출 (나중에 Toolbar에서 사용)
  useEffect(() => {
    if (window) {
      // @ts-ignore
      window.__editorAddShape = addShape;
      // @ts-ignore
      window.__editorUndo = handleUndo;
      // @ts-ignore
      window.__editorRedo = handleRedo;
    }
  }, [addShape, handleUndo, handleRedo]);

  return (
    <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center overflow-auto">
      <div className="bg-white shadow-lg">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
