/**
 * CanvasEngine - Headless Konva Canvas Controller
 *
 * 역할:
 * 1. Konva Stage/Layer 초기화 및 관리
 * 2. Zustand Store ↔ Konva 동기화
 * 3. 이벤트 핸들링 (드래그, 리사이즈, 회전 등)
 * 4. Konva 객체 생성/업데이트/삭제
 *
 * 설계 원칙:
 * - Zustand Store = Single Source of Truth
 * - Konva = View Layer (렌더링만 담당)
 * - 모든 데이터 변경은 Store를 통해서만
 */

import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type {
  EditorDocument,
  EditorObject,
  EditorPage,
  TextObject,
  ImageObject,
  ShapeObject,
} from '../types/document';
import type { EditorStore } from '../types/store';

// ========================================
// Types
// ========================================

export type CanvasEngineConfig = {
  container: HTMLDivElement;
  width: number;
  height: number;
  store: EditorStore;
};

export type KonvaObjectMap = Map<string, Konva.Node>;

// ========================================
// CanvasEngine Class
// ========================================

export class CanvasEngine {
  private stage: Konva.Stage;
  private mainLayer: Konva.Layer;
  private store: EditorStore;

  // EditorObject.id → Konva.Node 매핑
  private objectMap: KonvaObjectMap = new Map();

  // Transformer (선택된 객체 조작)
  private transformer: Konva.Transformer;

  constructor(config: CanvasEngineConfig) {
    this.store = config.store;

    // Konva Stage 생성
    this.stage = new Konva.Stage({
      container: config.container,
      width: config.width,
      height: config.height,
    });

    // Main Layer 생성
    this.mainLayer = new Konva.Layer();
    this.stage.add(this.mainLayer);

    // Transformer 생성 (선택 핸들)
    this.transformer = new Konva.Transformer({
      borderStroke: '#0066cc',
      borderStrokeWidth: 2,
      anchorFill: '#ffffff',
      anchorStroke: '#0066cc',
      anchorSize: 8,
      rotateEnabled: true,
      enabledAnchors: [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'top-center',
        'bottom-center',
        'middle-left',
        'middle-right',
      ],
    });
    this.mainLayer.add(this.transformer);

    // 이벤트 리스너 등록
    this.setupEventListeners();
  }

  // ========================================
  // Public API
  // ========================================

  /**
   * EditorPage를 Konva에 렌더링
   */
  renderPage(page: EditorPage): void {
    // 기존 객체 모두 제거 (Transformer 제외)
    this.clearObjects();

    // 페이지 배경 설정
    this.stage.setAttrs({
      width: page.width,
      height: page.height,
    });

    // 각 EditorObject를 Konva Node로 변환하여 추가
    page.objects.forEach((obj) => {
      const node = this.createKonvaNode(obj);
      if (node) {
        this.mainLayer.add(node);
        this.objectMap.set(obj.id, node);
      }
    });

    // Transformer를 최상위로
    this.transformer.moveToTop();

    this.mainLayer.batchDraw();
  }

  /**
   * 특정 객체 업데이트
   */
  updateObject(id: string, updates: Partial<EditorObject>): void {
    const node = this.objectMap.get(id);
    if (!node) return;

    // Konva Node 속성 업데이트
    node.setAttrs({
      x: updates.x,
      y: updates.y,
      width: updates.width,
      height: updates.height,
      rotation: updates.rotation,
      opacity: updates.opacity,
      visible: updates.visible,
    });

    // 타입별 속성 업데이트
    if (updates.type === 'text' && node instanceof Konva.Text) {
      const textUpdates = updates as Partial<TextObject>;
      node.setAttrs({
        text: textUpdates.text,
        fontSize: textUpdates.fontSize,
        fontFamily: textUpdates.fontFamily,
        fontStyle: textUpdates.fontWeight,
        fill: textUpdates.fill,
      });
    } else if (updates.type === 'shape' && node instanceof Konva.Rect) {
      const shapeUpdates = updates as Partial<ShapeObject>;
      node.setAttrs({
        fill: shapeUpdates.fill,
        stroke: shapeUpdates.stroke,
        strokeWidth: shapeUpdates.strokeWidth,
      });
    }

    this.mainLayer.batchDraw();
  }

  /**
   * 객체 선택 상태 업데이트
   */
  updateSelection(selectedIds: string[]): void {
    if (selectedIds.length === 0) {
      this.transformer.nodes([]);
    } else {
      const nodes = selectedIds
        .map((id) => this.objectMap.get(id))
        .filter(Boolean) as Konva.Node[];
      this.transformer.nodes(nodes);
    }

    this.mainLayer.batchDraw();
  }

  /**
   * 줌/팬 업데이트
   */
  updateView(zoom: number, pan: { x: number; y: number }): void {
    this.stage.scale({ x: zoom, y: zoom });
    this.stage.position(pan);
    this.stage.batchDraw();
  }

  /**
   * 모든 객체 제거
   */
  clearObjects(): void {
    this.objectMap.forEach((node) => node.destroy());
    this.objectMap.clear();
  }

  /**
   * Engine 파괴
   */
  destroy(): void {
    this.clearObjects();
    this.stage.destroy();
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * EditorObject → Konva Node 변환
   */
  private createKonvaNode(obj: EditorObject): Konva.Node | null {
    let node: Konva.Node | null = null;

    switch (obj.type) {
      case 'text':
        node = this.createTextNode(obj);
        break;
      case 'shape':
        node = this.createShapeNode(obj);
        break;
      case 'image':
        node = this.createImageNode(obj);
        break;
      default:
        console.warn(`Unknown object type: ${(obj as any).type}`);
    }

    if (node) {
      // 공통 속성 설정
      node.setAttrs({
        id: obj.id,
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation || 0,
        opacity: obj.opacity ?? 1,
        visible: obj.visible ?? true,
        draggable: !obj.locked,
      });

      // 드래그 이벤트
      node.on('dragmove', this.handleDragMove.bind(this));
      node.on('dragend', this.handleDragEnd.bind(this));

      // 클릭 선택
      node.on('click tap', this.handleObjectClick.bind(this));
    }

    return node;
  }

  /**
   * TextObject → Konva.Text
   */
  private createTextNode(obj: TextObject): Konva.Text {
    return new Konva.Text({
      text: obj.text,
      fontSize: obj.fontSize,
      fontFamily: obj.fontFamily,
      fontStyle: obj.fontWeight === 'bold' ? 'bold' : 'normal',
      fill: obj.fill,
      width: obj.width,
      height: obj.height,
      align: obj.align || 'left',
      verticalAlign: obj.verticalAlign || 'top',
    });
  }

  /**
   * ShapeObject → Konva.Shape
   */
  private createShapeNode(obj: ShapeObject): Konva.Shape {
    switch (obj.shapeType) {
      case 'rect':
        return new Konva.Rect({
          width: obj.width,
          height: obj.height,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth || 0,
          cornerRadius: obj.cornerRadius || 0,
        });

      case 'circle':
        return new Konva.Circle({
          radius: obj.width / 2, // width를 지름으로 사용
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth || 0,
        });

      case 'ellipse':
        return new Konva.Ellipse({
          radiusX: obj.width / 2,
          radiusY: obj.height / 2,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth || 0,
        });

      default:
        // 기본: 사각형
        return new Konva.Rect({
          width: obj.width,
          height: obj.height,
          fill: obj.fill || '#cccccc',
        });
    }
  }

  /**
   * ImageObject → Konva.Image
   */
  private createImageNode(obj: ImageObject): Konva.Group {
    // 이미지 로딩은 비동기이므로 Group으로 래핑
    const group = new Konva.Group();

    const imageObj = new Image();
    imageObj.onload = () => {
      const konvaImage = new Konva.Image({
        image: imageObj,
        width: obj.width,
        height: obj.height,
      });
      group.add(konvaImage);
      this.mainLayer.batchDraw();
    };
    imageObj.src = obj.src;

    return group;
  }

  /**
   * 이벤트 리스너 등록
   */
  private setupEventListeners(): void {
    // Stage 클릭 → 선택 해제
    this.stage.on('click tap', (e) => {
      // Stage 빈 공간 클릭 시
      if (e.target === this.stage) {
        this.store.deselectAll();
      }
    });

    // Transformer 변형 종료 시 Store 업데이트
    this.transformer.on('transformend', () => {
      const nodes = this.transformer.nodes();
      nodes.forEach((node) => {
        const id = node.id();
        this.store.updateObject(id, {
          x: node.x(),
          y: node.y(),
          width: node.width() * node.scaleX(),
          height: node.height() * node.scaleY(),
          rotation: node.rotation(),
        });

        // Scale 초기화 (width/height에 반영됨)
        node.scaleX(1);
        node.scaleY(1);
      });

      // History 저장
      this.store.saveHistory();
    });
  }

  /**
   * 드래그 중 (실시간 업데이트)
   */
  private handleDragMove(e: KonvaEventObject<DragEvent>): void {
    const node = e.target;
    const id = node.id();

    // Store 업데이트 (히스토리는 저장하지 않음 - 성능 최적화)
    this.store.updateObject(id, {
      x: node.x(),
      y: node.y(),
    });
  }

  /**
   * 드래그 종료 (히스토리 저장)
   */
  private handleDragEnd(e: KonvaEventObject<DragEvent>): void {
    this.store.saveHistory();
  }

  /**
   * 객체 클릭 → 선택
   */
  private handleObjectClick(e: KonvaEventObject<MouseEvent>): void {
    const node = e.target;
    const id = node.id();

    // Shift 키: 다중 선택
    if (e.evt.shiftKey) {
      const currentSelected = this.store.selectedIds;
      if (currentSelected.includes(id)) {
        this.store.selectObjects(currentSelected.filter((sid) => sid !== id));
      } else {
        this.store.selectObjects([...currentSelected, id]);
      }
    } else {
      this.store.selectObject(id);
    }
  }
}
