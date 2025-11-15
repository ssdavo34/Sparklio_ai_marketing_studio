'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [isCanvasReady, setIsCanvasReady] = useState(false);
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
    setIsCanvasReady(true);

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

    // Object 이동/수정 이벤트
    fabricRef.current.on('object:modified', (e) => {
      const obj = e.target;
      if (obj) {
        // @ts-ignore
        const objectId = obj.id;
        if (objectId) {
          const bounds = {
            x: obj.left || 0,
            y: obj.top || 0,
            width: (obj.width || 0) * (obj.scaleX || 1),
            height: (obj.height || 0) * (obj.scaleY || 1),
          };

          // EditorStore 업데이트는 나중에 구현
          // updateObject(objectId, { bounds });
        }
      }
    });

    return () => {
      fabricRef.current?.dispose();
    };
  }, [setCanvas, setSelectedObjectId]);

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
          selectable: true,
          hasControls: true,
          hasBorders: true,
          editable: true,
          editingBorderColor: '#2563eb',
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
          selectable: true,
          hasControls: true,
          hasBorders: true,
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
              selectable: true,
              hasControls: true,
              hasBorders: true,
            });
            // @ts-ignore
            img.id = obj.id;
            fabricRef.current.add(img);
            fabricRef.current.renderAll();
          }).catch(() => {
            // 이미지 로딩 실패 시 placeholder 유지 (이미 추가됨)
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
  };

  return (
    <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center overflow-auto">
      <div className="bg-white shadow-lg">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
