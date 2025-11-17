/**
 * useCanvasEngine Hook
 *
 * Fabric.js 캔버스를 초기화하고 관리하는 커스텀 Hook
 *
 * 주요 기능:
 * - Fabric.js Canvas 인스턴스 생성 및 초기화
 * - 캔버스 크기 설정 (800 × 600px)
 * - 줌/팬 이벤트 연동
 * - 그리드 표시/숨김
 * - 객체 추가/삭제/수정
 *
 * 사용법:
 * ```tsx
 * const { canvasRef, isReady } = useCanvasEngine();
 * ```
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore, useLayoutStore } from '../stores';

export interface UseCanvasEngineReturn {
  /** Canvas DOM 요소에 연결할 ref */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Fabric.js Canvas 인스턴스 (초기화 완료 후 사용 가능) */
  fabricCanvas: fabric.Canvas | null;
  /** 캔버스 초기화 완료 여부 */
  isReady: boolean;
  /** 도형 추가 함수 */
  addShape: (shapeType: 'rectangle' | 'circle' | 'triangle' | 'text') => void;
  /** Copy 함수 */
  copySelected: () => void;
  /** Paste 함수 */
  pasteSelected: () => void;
  /** 복제 함수 */
  duplicateSelected: () => void;
  /** 삭제 함수 */
  deleteSelected: () => void;
  /** 그룹 함수 */
  groupSelected: () => void;
  /** 언그룹 함수 */
  ungroupSelected: () => void;
  /** Undo 함수 */
  undo: () => void;
  /** Redo 함수 */
  redo: () => void;
}

// 🎨 로깅 유틸리티
const LOG_ENABLED = true; // false로 설정하면 모든 로그 비활성화
const log = {
  init: (msg: string) => LOG_ENABLED && console.log(`🚀 [INIT] ${msg}`),
  action: (msg: string) => LOG_ENABLED && console.log(`⚡ [ACTION] ${msg}`),
  history: (msg: string) => LOG_ENABLED && console.log(`📚 [HISTORY] ${msg}`),
  warning: (msg: string) => LOG_ENABLED && console.warn(`⚠️ [WARNING] ${msg}`),
  success: (msg: string) => LOG_ENABLED && console.log(`✅ [SUCCESS] ${msg}`),
  error: (msg: string) => LOG_ENABLED && console.error(`❌ [ERROR] ${msg}`),
};

export function useCanvasEngine(): UseCanvasEngineReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Undo/Redo를 위한 히스토리 스택
  const historyStack = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const isHistoryAction = useRef(false);

  // Copy/Paste를 위한 클립보드
  const clipboard = useRef<fabric.Object | null>(null);

  // Zustand Store에서 상태 가져오기
  // zoom은 useCanvasStore.ts의 setZoom()에서 직접 처리됨
  const showGrid = useCanvasStore((state) => state.showGrid);
  // panX, panY는 CSS scroll로 대체되어 더 이상 사용하지 않음
  const setFabricCanvasToStore = useCanvasStore((state) => state.setFabricCanvas);
  const toggleLeftPanel = useLayoutStore((state) => state.toggleLeftPanel);
  const toggleRightDock = useLayoutStore((state) => state.toggleRightDock);

  // 5️⃣ 도형 추가 함수
  const addShape = (shapeType: 'rectangle' | 'circle' | 'triangle' | 'text') => {
    if (!fabricCanvas) return;

    log.action(`Adding shape: ${shapeType}`);

    // 캔버스 중앙 계산 (줌 레벨 고려)
    const canvasCenter = fabricCanvas.getVpCenter();
    const centerX = canvasCenter.x;
    const centerY = canvasCenter.y;

    let shape: fabric.Object;

    switch (shapeType) {
      case 'rectangle':
        // 사각형 생성 (캔버스 중앙)
        shape = new fabric.Rect({
          left: centerX - 100, // width 200의 절반
          top: centerY - 75,   // height 150의 절반
          width: 200,
          height: 150,
          fill: '#3b82f6', // blue-500
          stroke: '#1e40af', // blue-800
          strokeWidth: 2,
          // 크기 조절 & 회전 활성화
          hasControls: true,
          hasBorders: true,
          hasRotatingPoint: true,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
        });
        break;

      case 'circle':
        // 원 생성 (캔버스 중앙)
        shape = new fabric.Circle({
          left: centerX - 75, // radius의 절반
          top: centerY - 75,
          radius: 75,
          fill: '#10b981', // green-500
          stroke: '#047857', // green-800
          strokeWidth: 2,
          // 크기 조절 & 회전 활성화
          hasControls: true,
          hasBorders: true,
          hasRotatingPoint: true,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
        });
        break;

      case 'triangle':
        // 삼각형 생성 (캔버스 중앙)
        shape = new fabric.Triangle({
          left: centerX - 100,
          top: centerY - 75,
          width: 200,
          height: 150,
          fill: '#f59e0b', // amber-500
          stroke: '#b45309', // amber-800
          strokeWidth: 2,
          // 크기 조절 & 회전 활성화
          hasControls: true,
          hasBorders: true,
          hasRotatingPoint: true,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
        });
        break;

      case 'text':
        // 텍스트 생성 (캔버스 중앙)
        shape = new fabric.IText('Double click to edit', {
          left: centerX - 80, // 대략적인 텍스트 너비의 절반
          top: centerY - 12,  // fontSize 24의 절반
          fontSize: 24,
          fill: '#1f2937', // neutral-800
          fontFamily: 'Inter, sans-serif',
          // 크기 조절 & 회전 활성화
          hasControls: true,
          hasBorders: true,
          hasRotatingPoint: true,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
        });
        break;

      default:
        return;
    }

    // 캔버스에 도형 추가
    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape); // 추가한 도형 선택
    fabricCanvas.requestRenderAll();

    log.success(`Shape added (${shapeType}). Total objects: ${fabricCanvas.getObjects().length}`);
  };

  // 6️⃣ 복제 함수
  const duplicateSelected = () => {
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      log.warning('No object selected to duplicate');
      return;
    }

    log.action(`Duplicating object: ${activeObject.type}`);

    // clone 메서드로 객체 복제
    activeObject.clone((cloned: fabric.Object) => {
      // 복제된 객체 위치를 조금 이동 (10px 오른쪽 아래)
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
      });

      // ActiveSelection (다중 선택)인 경우
      if (cloned.type === 'activeSelection') {
        cloned.canvas = fabricCanvas;
        (cloned as fabric.ActiveSelection).forEachObject((obj: fabric.Object) => {
          fabricCanvas.add(obj);
        });
        cloned.setCoords();
      } else {
        fabricCanvas.add(cloned);
      }

      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.requestRenderAll();
      log.success('Object duplicated successfully');
    });
  };

  // 7️⃣ 삭제 함수
  const deleteSelected = () => {
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      log.warning('No object selected to delete');
      return;
    }

    log.action(`Deleting object: ${activeObject.type}`);

    // 히스토리 저장 방지 플래그 설정
    isHistoryAction.current = true;

    // ActiveSelection (다중 선택)인 경우
    if (activeObject.type === 'activeSelection') {
      const selection = activeObject as fabric.ActiveSelection;
      const objects = selection.getObjects().slice(); // 복사본 생성

      fabricCanvas.discardActiveObject(); // 먼저 선택 해제

      // 모든 객체 삭제
      objects.forEach((obj: fabric.Object) => {
        fabricCanvas.remove(obj);
      });

      log.success(`Deleted ${objects.length} objects`);
    } else {
      fabricCanvas.remove(activeObject);
      log.success('Object deleted successfully');
    }

    fabricCanvas.requestRenderAll();

    // 히스토리 수동 저장 (debounce 시간보다 길게 대기)
    setTimeout(() => {
      const json = JSON.stringify(fabricCanvas.toJSON());
      historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
      historyStack.current.push(json);
      historyIndex.current++;
      log.history(`Saved after delete [${historyIndex.current}/${historyStack.current.length - 1}]`);

      // 플래그 해제 (히스토리 저장 후)
      setTimeout(() => {
        isHistoryAction.current = false;
      }, 100);
    }, 150);
  };

  // 8️⃣ 그룹 함수
  const groupSelected = () => {
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      log.warning('No objects selected to group');
      return;
    }

    // 이미 그룹이 아니고, ActiveSelection인 경우에만 그룹화
    if (activeObject.type !== 'activeSelection') {
      log.warning('Need to select multiple objects to group');
      return;
    }

    log.action('Grouping selected objects');

    const selection = activeObject as fabric.ActiveSelection;
    selection.toGroup();
    fabricCanvas.requestRenderAll();
    log.success('Objects grouped successfully');
  };

  // 9️⃣ 언그룹 함수
  const ungroupSelected = () => {
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      log.warning('No object selected to ungroup');
      return;
    }

    if (activeObject.type !== 'group') {
      log.warning('Selected object is not a group');
      return;
    }

    log.action('Ungrouping object');

    const group = activeObject as fabric.Group;
    const items = group.getObjects();
    group._restoreObjectsState();
    fabricCanvas.remove(group);

    items.forEach((item) => {
      fabricCanvas.add(item);
    });

      fabricCanvas.requestRenderAll();
    log.success('Group ungrouped successfully');
  };

  // 🔟 Copy 함수
  const copySelected = () => {
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      log.warning('No object selected to copy');
      return;
    }

    log.action('Copying object to clipboard');
    activeObject.clone((cloned: fabric.Object) => {
      clipboard.current = cloned;
      log.success('Object copied to clipboard');
    });
  };

  // 1️⃣1️⃣ Paste 함수
  const pasteSelected = () => {
    if (!fabricCanvas || !clipboard.current) {
      log.warning('Clipboard is empty');
      return;
    }

    log.action('Pasting object from clipboard');
    clipboard.current.clone((clonedObj: fabric.Object) => {
      fabricCanvas.discardActiveObject();
      clonedObj.set({
        left: (clonedObj.left || 0) + 10,
        top: (clonedObj.top || 0) + 10,
        evented: true,
      });

      if (clonedObj.type === 'activeSelection') {
        const activeSelection = clonedObj as fabric.ActiveSelection;
        activeSelection.canvas = fabricCanvas;
        activeSelection.forEachObject((obj: fabric.Object) => {
          fabricCanvas.add(obj);
        });
        activeSelection.setCoords();
      } else {
        fabricCanvas.add(clonedObj);
      }

      clipboard.current = clonedObj;
      fabricCanvas.setActiveObject(clonedObj);
      fabricCanvas.requestRenderAll();
      log.success('Object pasted successfully');
    });
  };

  // 1️⃣2️⃣ 히스토리 저장 함수 (사용하지 않음 - 이벤트 리스너에서 직접 처리)
  // const saveHistory = () => {
  //   if (!fabricCanvas || isHistoryAction.current) return;
  //   const json = JSON.stringify(fabricCanvas.toJSON());
  //   historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
  //   historyStack.current.push(json);
  //   historyIndex.current++;
  //   if (historyStack.current.length > 50) {
  //     historyStack.current.shift();
  //     historyIndex.current--;
  //   }
  //   log.history(`Saved [${historyIndex.current}/${historyStack.current.length - 1}]`);
  // };

  // 1️⃣1 Undo 함수
  const undo = () => {
    if (!fabricCanvas) return;

    if (historyIndex.current <= 0) {
      log.warning('Nothing to undo (at oldest state)');
      return;
    }

    log.action(`Undo (moving to state ${historyIndex.current - 1})`);
    historyIndex.current--;

    const state = historyStack.current[historyIndex.current];

    // History stack이 비어있는 경우 방어 코드
    if (!state) {
      log.warning('History state is undefined, skipping undo');
      historyIndex.current++;
      return;
    }

    // 🔒 JSON 파싱 및 유효성 검증 (TypeError 방지)
    let parsedState: any;
    try {
      parsedState = JSON.parse(state);
    } catch (error) {
      log.error(`Failed to parse history state JSON, skipping undo: ${error}`);
      historyIndex.current++;
      return;
    }

    // objects 배열 검증
    if (!parsedState || !Array.isArray(parsedState.objects)) {
      log.error(`Invalid history state (missing objects array), skipping undo: ${JSON.stringify(parsedState)}`);
      historyIndex.current++;
      return;
    }

    isHistoryAction.current = true;

    try {
      fabricCanvas.loadFromJSON(parsedState, () => {
        fabricCanvas.renderAll();
        log.history(`Undo complete [${historyIndex.current}/${historyStack.current.length - 1}]`);

        // 300ms 후에 플래그 해제 (모든 이벤트가 처리될 때까지 대기)
        setTimeout(() => {
          isHistoryAction.current = false;
        }, 300);
      });
    } catch (error) {
      log.error(`Exception during undo loadFromJSON: ${error}`);
      historyIndex.current++;
      isHistoryAction.current = false;
    }
  };

  // 1️⃣2 Redo 함수
  const redo = () => {
    if (!fabricCanvas) return;

    if (historyIndex.current >= historyStack.current.length - 1) {
      log.warning('Nothing to redo (at newest state)');
      return;
    }

    log.action(`Redo (moving to state ${historyIndex.current + 1})`);
    historyIndex.current++;

    const state = historyStack.current[historyIndex.current];

    // History stack이 비어있는 경우 방어 코드
    if (!state) {
      log.warning('History state is undefined, skipping redo');
      historyIndex.current--;
      return;
    }

    // 🔒 JSON 파싱 및 유효성 검증 (TypeError 방지)
    let parsedState: any;
    try {
      parsedState = JSON.parse(state);
    } catch (error) {
      log.error(`Failed to parse history state JSON, skipping redo: ${error}`);
      historyIndex.current--;
      return;
    }

    // objects 배열 검증
    if (!parsedState || !Array.isArray(parsedState.objects)) {
      log.error(`Invalid history state (missing objects array), skipping redo: ${JSON.stringify(parsedState)}`);
      historyIndex.current--;
      return;
    }

    isHistoryAction.current = true;

    try {
      fabricCanvas.loadFromJSON(parsedState, () => {
        fabricCanvas.renderAll();
        log.history(`Redo complete [${historyIndex.current}/${historyStack.current.length - 1}]`);

        // 300ms 후에 플래그 해제 (모든 이벤트가 처리될 때까지 대기)
        setTimeout(() => {
          isHistoryAction.current = false;
        }, 300);
      });
    } catch (error) {
      log.error(`Exception during redo loadFromJSON: ${error}`);
      historyIndex.current--;
      isHistoryAction.current = false;
    }
  };

  // 1️⃣ Fabric.js Canvas 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    log.init('Initializing Fabric.js Canvas...');

    // Canvas 인스턴스 생성
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: true, // 다중 선택 활성화
      preserveObjectStacking: true, // 객체 순서 유지
    });

    // Store에 Canvas 인스턴스 저장 (나중에 다른 곳에서 사용 가능)
    setFabricCanvas(canvas);
    setFabricCanvasToStore(canvas); // Zustand Store에도 등록
    setIsReady(true);

    // 초기 히스토리 저장
    const initialState = JSON.stringify(canvas.toJSON());
    historyStack.current = [initialState];
    historyIndex.current = 0;
    log.init('Canvas initialized successfully (800×600px)');

    // 히스토리 이벤트 리스너 (canvas 인스턴스 직접 사용)
    // 🐛 FIX: debounce 시간을 300ms로 증가하여 동시 이벤트 발생 시 한 번만 저장
    // canvasInstance를 클로저로 캡처하여 사용
    const canvasInstance = canvas;
    let saveTimeout: NodeJS.Timeout | null = null;
    const saveHistoryDebounced = () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      saveTimeout = setTimeout(() => {
        if (isHistoryAction.current) {
          log.history('Skipping save (Undo/Redo in progress)');
          return;
        }

        // Canvas가 없으면 저장 스킵
        if (!canvasInstance) {
          log.warning('Canvas is not initialized, skipping history save');
          return;
        }

        // Canvas 상태 검증 후 저장
        let canvasJSON: any;
        try {
          canvasJSON = canvasInstance.toJSON();
        } catch (error) {
          log.error(`Failed to serialize Canvas to JSON: ${error}`);
          return; // 저장 실패 시 스킵
        }

        // JSON 유효성 검증
        if (!canvasJSON || !Array.isArray(canvasJSON.objects)) {
          log.error(`Invalid Canvas JSON (missing objects array), skipping save`);
          return;
        }

        const json = JSON.stringify(canvasJSON);
        historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
        historyStack.current.push(json);
        historyIndex.current++;

        if (historyStack.current.length > 50) {
          historyStack.current.shift();
          historyIndex.current--;
        }

        log.history(`Auto-saved [${historyIndex.current}/${historyStack.current.length - 1}] (${historyStack.current.length} states)`);
      }, 300); // 100ms → 300ms로 증가
    };

    canvas.on('object:added', saveHistoryDebounced);
    canvas.on('object:removed', saveHistoryDebounced);
    canvas.on('object:modified', saveHistoryDebounced);

    log.init('History event listeners attached (300ms debounce)');

    // 클린업: 컴포넌트 언마운트 시 Canvas 제거
    return () => {
      log.init('Cleaning up Canvas and event listeners');

      // Pending timeout clear (중요!)
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }

      canvas.off('object:added', saveHistoryDebounced);
      canvas.off('object:removed', saveHistoryDebounced);
      canvas.off('object:modified', saveHistoryDebounced);
      canvas.dispose();
      setFabricCanvas(null);
      setFabricCanvasToStore(null); // Zustand Store도 정리
      setIsReady(false);
    };
  }, []);

  // 2️⃣ Zoom은 useCanvasStore.ts의 setZoom()에서 처리됨
  // (중복 적용 방지 - 이전에는 여기서도 줌을 적용해서 문제 발생)

  // 3️⃣ Pan (이동)은 CSS scroll로 처리됨 (handleMouseMove에서 직접 조작)
  // viewportTransform 사용 안 함 - CSS transform: scale()과 충돌 방지

  // 4️⃣ Grid 표시/숨김
  useEffect(() => {
    if (!fabricCanvas) return;

    // 기존 그리드 제거
    const gridObjects = fabricCanvas.getObjects().filter((obj) => obj.name === 'grid-line');
    gridObjects.forEach((obj) => fabricCanvas.remove(obj));

    // Grid 표시
    if (showGrid) {
      const gridSize = 20; // 20px 간격
      const width = fabricCanvas.getWidth();
      const height = fabricCanvas.getHeight();

      // 세로선 그리기
      for (let i = 0; i <= width / gridSize; i++) {
        const line = new fabric.Line([i * gridSize, 0, i * gridSize, height], {
          stroke: '#e5e7eb', // neutral-200
          strokeWidth: 1,
          selectable: false,
          evented: false,
          name: 'grid-line',
        });
        fabricCanvas.add(line);
        fabricCanvas.sendToBack(line); // 그리드를 맨 뒤로
      }

      // 가로선 그리기
      for (let i = 0; i <= height / gridSize; i++) {
        const line = new fabric.Line([0, i * gridSize, width, i * gridSize], {
          stroke: '#e5e7eb', // neutral-200
          strokeWidth: 1,
          selectable: false,
          evented: false,
          name: 'grid-line',
        });
        fabricCanvas.add(line);
        fabricCanvas.sendToBack(line); // 그리드를 맨 뒤로
      }
    }

    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, showGrid]);

  // 🔟 Pan (손 도구) 기능 - 스페이스바 + 드래그
  useEffect(() => {
    if (!fabricCanvas) return;

    let isPanning = false;
    let isSpacePressed = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 스페이스바 무시
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && !isSpacePressed) {
        isSpacePressed = true;
        fabricCanvas.selection = false; // 선택 비활성화
        fabricCanvas.defaultCursor = 'grab';
        fabricCanvas.hoverCursor = 'grab';
        fabricCanvas.renderAll();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed = false;
        isPanning = false;
        fabricCanvas.selection = true; // 선택 활성화
        fabricCanvas.defaultCursor = 'default';
        fabricCanvas.hoverCursor = 'move';
        fabricCanvas.renderAll();
      }
    };

    const handleMouseDown = (opt: any) => {
      const evt = opt.e;
      if (isSpacePressed) {
        isPanning = true;
        fabricCanvas.defaultCursor = 'grabbing';
        fabricCanvas.renderAll();
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    };

    const handleMouseMove = (opt: any) => {
      if (isPanning && isSpacePressed) {
        const evt = opt.e;

        // CSS scroll 직접 조작 (CanvasViewport의 section 요소 찾기)
        const section = canvasRef.current?.closest('section');
        if (section) {
          const deltaX = evt.clientX - lastPosX;
          const deltaY = evt.clientY - lastPosY;

          section.scrollLeft -= deltaX;
          section.scrollTop -= deltaY;
        }

        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        isPanning = false;
        if (isSpacePressed) {
          fabricCanvas.defaultCursor = 'grab';
        } else {
          fabricCanvas.defaultCursor = 'default';
        }
        fabricCanvas.renderAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
    };
  }, [fabricCanvas]);

  // 1️⃣1️⃣ 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas) return;
      // 입력 필드에서는 단축키 무시
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd 키 감지
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl+C: Copy
      if (isCtrlOrCmd && e.key === 'c') {
        e.preventDefault();
        copySelected();
        return;
      }

      // Ctrl+V: Paste
      if (isCtrlOrCmd && e.key === 'v') {
        e.preventDefault();
        pasteSelected();
        return;
      }

      // Ctrl+D: 복제
      if (isCtrlOrCmd && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Delete 또는 Backspace: 삭제
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }

      // Ctrl+G: 그룹
      if (isCtrlOrCmd && e.key === 'g') {
        e.preventDefault();
        groupSelected();
      }

      // Ctrl+Shift+G: 언그룹
      if (isCtrlOrCmd && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        ungroupSelected();
      }

      // Ctrl+Z: Undo
      if (isCtrlOrCmd && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y 또는 Ctrl+Shift+Z: Redo
      if (isCtrlOrCmd && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+B: 좌측 패널 토글
      if (isCtrlOrCmd && e.key === 'b') {
        e.preventDefault();
        toggleLeftPanel();
      }

      // Ctrl+Shift+B: 우측 Dock 토글
      if (isCtrlOrCmd && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        toggleRightDock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fabricCanvas, duplicateSelected, deleteSelected, groupSelected, ungroupSelected, undo, redo, toggleLeftPanel, toggleRightDock]);

  return {
    canvasRef,
    fabricCanvas,
    isReady,
    addShape,
    copySelected,
    pasteSelected,
    duplicateSelected,
    deleteSelected,
    groupSelected,
    ungroupSelected,
    undo,
    redo,
  };
}
