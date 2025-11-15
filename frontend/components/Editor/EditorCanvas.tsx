'use client';

import { useEffect, useRef } from 'react';
import { Canvas, FabricText, FabricImage, Rect, FabricObject } from 'fabric';
import { useEditorStore } from '@/store/editor-store';

/**
 * EditorCanvas 컴포넌트
 *
 * Fabric.js 기반 캔버스를 렌더링합니다.
 * - Editor JSON → Fabric Objects 변환
 * - Text, Image, Shape 렌더링
 * - Object 선택 이벤트
 */
export default function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const { currentDocument, setCanvas, setSelectedObjectId } = useEditorStore();

  // Canvas 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    fabricRef.current = new Canvas(canvasRef.current, {
      width: 1080,
      height: 1350,
      backgroundColor: '#ffffff',
    });

    setCanvas(fabricRef.current);

    // Object 선택 이벤트
    fabricRef.current.on('selection:created', (e) => {
      const selected = e.selected?.[0];
      if (selected) {
        // @ts-ignore - Fabric.js 커스텀 속성
        setSelectedObjectId(selected.id || null);
      }
    });

    fabricRef.current.on('selection:updated', (e) => {
      const selected = e.selected?.[0];
      if (selected) {
        // @ts-ignore
        setSelectedObjectId(selected.id || null);
      }
    });

    fabricRef.current.on('selection:cleared', () => {
      setSelectedObjectId(null);
    });

    return () => {
      fabricRef.current?.dispose();
    };
  }, [setCanvas, setSelectedObjectId]);

  // Document 로딩 시 Canvas 업데이트
  useEffect(() => {
    if (!fabricRef.current || !currentDocument) return;

    fabricRef.current.clear();
    fabricRef.current.backgroundColor = '#ffffff';

    const page = currentDocument.pages[0];
    if (!page) return;

    // Canvas 크기 설정
    fabricRef.current.setWidth(page.width);
    fabricRef.current.setHeight(page.height);
    fabricRef.current.backgroundColor = page.background;

    // Objects 렌더링
    page.objects.forEach((obj) => {
      let fabricObj: FabricObject | null = null;

      if (obj.type === 'text') {
        fabricObj = new FabricText(obj.props.text || '', {
          left: obj.bounds.x,
          top: obj.bounds.y,
          fontSize: obj.props.fontSize || 16,
          fill: obj.props.fill || '#000000',
          fontFamily: obj.props.fontFamily || 'Arial',
          fontWeight: obj.props.fontWeight || 'normal',
          textAlign: obj.props.textAlign || 'left',
        });
      } else if (obj.type === 'image') {
        // Image는 비동기 로딩이 필요하므로 placeholder로 표시
        fabricObj = new Rect({
          left: obj.bounds.x,
          top: obj.bounds.y,
          width: obj.bounds.width,
          height: obj.bounds.height,
          fill: '#e0e0e0',
          stroke: '#999999',
          strokeWidth: 1,
        });

        // 실제 이미지 로딩 (선택 사항)
        if (obj.props.src) {
          FabricImage.fromURL(
            obj.props.src,
            {
              crossOrigin: 'anonymous',
            }
          ).then((img) => {
            if (!fabricRef.current) return;
            img.set({
              left: obj.bounds.x,
              top: obj.bounds.y,
              scaleX: obj.bounds.width / (img.width || 1),
              scaleY: obj.bounds.height / (img.height || 1),
            });
            // @ts-ignore
            img.id = obj.id;
            fabricRef.current.add(img);
            fabricRef.current.renderAll();
          });
        }
      } else if (obj.type === 'shape') {
        fabricObj = new Rect({
          left: obj.bounds.x,
          top: obj.bounds.y,
          width: obj.bounds.width,
          height: obj.bounds.height,
          fill: obj.props.fill || '#cccccc',
          stroke: obj.props.stroke || '',
          strokeWidth: obj.props.strokeWidth || 0,
        });
      }

      if (fabricObj) {
        // @ts-ignore - Fabric.js에 커스텀 속성 추가
        fabricObj.id = obj.id;
        fabricRef.current?.add(fabricObj);
      }
    });

    fabricRef.current.renderAll();
  }, [currentDocument]);

  return (
    <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center overflow-auto">
      {currentDocument ? (
        <div className="bg-white shadow-lg">
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <div className="bg-white shadow-lg" style={{ width: '1080px', height: '1350px' }}>
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-lg font-medium">Canvas Area</p>
              <p className="text-sm mt-2">Chat에서 생성된 초안이 여기에 로딩됩니다</p>
              <p className="text-xs text-gray-400 mt-4">
                좌측 Chat에서 "제품 상세페이지 만들어줘" 를 입력해보세요
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
