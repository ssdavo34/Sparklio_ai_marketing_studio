/**
 * Image Grid
 *
 * 생성된 이미지 그리드 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-03
 */

'use client';

import { ImageCard } from './ImageCard';
import { useImageTabStore } from '../../stores/useImageTabStore';
import type { GeneratedImage } from '../../stores/types/imageTab';

interface ImageGridProps {
  images: GeneratedImage[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

export function ImageGrid({ images, selectedIds, onToggleSelect }: ImageGridProps) {
  const addToCanvas = useImageTabStore((s) => s.addToCanvas);
  const saveAsAsset = useImageTabStore((s) => s.saveAsAsset);
  const savingAssetIds = useImageTabStore((s) => s.savingAssetIds);

  return (
    <div className="grid grid-cols-2 gap-2">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          isSelected={selectedIds.includes(image.id)}
          isSaving={savingAssetIds.includes(image.id)}
          onToggleSelect={() => onToggleSelect(image.id)}
          onAddToCanvas={() => addToCanvas(image.id)}
          onSaveAsAsset={() => saveAsAsset(image.id)}
        />
      ))}
    </div>
  );
}
