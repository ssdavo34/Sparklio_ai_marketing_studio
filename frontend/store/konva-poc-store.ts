import { create } from 'zustand';

export type Shape = {
  id: string;
  type: 'rect' | 'circle';
  x: number;
  y: number;
  fill: string;
  // rect 전용
  width?: number;
  height?: number;
  // circle 전용
  radius?: number;
};

type KonvaPocStore = {
  shapes: Shape[];
  selectedId: string | null;

  // Actions
  setSelectedId: (id: string | null) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  addShape: (shape: Shape) => void;
};

export const useKonvaPocStore = create<KonvaPocStore>((set) => ({
  // 초기 하드코딩 데이터 - 3개 도형
  shapes: [
    {
      id: '1',
      type: 'rect',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      fill: '#0066cc',
    },
    {
      id: '2',
      type: 'rect',
      x: 350,
      y: 150,
      width: 150,
      height: 150,
      fill: '#ff6600',
    },
    {
      id: '3',
      type: 'circle',
      x: 600,
      y: 200,
      radius: 60,
      fill: '#00cc66',
    },
  ],
  selectedId: null,

  // 선택 변경
  setSelectedId: (id) => set({ selectedId: id }),

  // 도형 업데이트 (드래그 시)
  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((shape) =>
        shape.id === id ? { ...shape, ...updates } : shape
      ),
    })),

  // 도형 추가
  addShape: (shape) =>
    set((state) => ({
      shapes: [...state.shapes, shape],
    })),
}));
