'use client';

import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { getMockBrandDNA } from '@/lib/api/brand-api';

export function UploadTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: Array<{ id: string; url: string; name: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 10MB.`);
        continue;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file.`);
        continue;
      }

      // Create object URL
      const url = URL.createObjectURL(file);
      const id = `uploaded-${Date.now()}-${i}`;

      newImages.push({
        id,
        url,
        name: file.name,
      });
    }

    setUploadedImages((prev) => [...prev, ...newImages]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // Create a fake input event
    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      for (let i = 0; i < files.length; i++) {
        dataTransfer.items.add(files[i]);
      }
      input.files = dataTransfer.files;
      handleFileChange({ target: input } as any);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const addImageToCanvas = (imageUrl: string) => {
    if (!polotnoStore) {
      console.error('Polotno store not initialized');
      return;
    }

    // Get current page
    const page = polotnoStore.activePage;
    if (!page) {
      console.error('No active page');
      return;
    }

    // Add image to canvas
    page.addElement({
      type: 'image',
      src: imageUrl,
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    });
  };

  const removeImage = (id: string, url: string) => {
    // Revoke object URL to free memory
    URL.revokeObjectURL(url);
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAnalyze = async () => {
    if (uploadedImages.length === 0) {
      alert('먼저 이미지를 업로드해주세요.');
      return;
    }

    if (!polotnoStore) {
      alert('캔버스가 준비되지 않았습니다.');
      return;
    }

    setAnalyzing(true);
    try {
      // 실제 API 호출 (현재는 Mock 사용)
      // const dna = await analyzeBrandImages(uploadedImages);

      // Mock 응답
      const mockDNA = getMockBrandDNA();

      // 중앙 캔버스에 Brand DNA 결과 표시
      const page = polotnoStore.activePage;
      if (!page) {
        alert('활성 페이지가 없습니다.');
        return;
      }

      // 기존 요소 모두 제거
      page.children.forEach((child: any) => child.remove());

      const pageWidth = page.width;
      const pageHeight = page.height;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let currentY = margin;

      // 제목
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 48,
        fontWeight: 'bold',
        fill: '#7C3AED',
        text: '🧬 Brand DNA 분석 결과',
      });
      currentY += 80;

      // 신뢰도
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 20,
        fill: '#6B7280',
        text: `신뢰도: ${(mockDNA.confidence_score * 100).toFixed(0)}%`,
      });
      currentY += 60;

      // 톤앤매너
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#1F2937',
        text: '📣 톤앤매너',
      });
      currentY += 45;

      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 24,
        fill: '#4B5563',
        text: mockDNA.tone.primary,
      });
      currentY += 40;

      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 18,
        fill: '#6B7280',
        text: mockDNA.tone.description,
      });
      currentY += 60;

      // 핵심 메시지
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: contentWidth,
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#1F2937',
        text: '💡 핵심 메시지',
      });
      currentY += 45;

      mockDNA.key_messages.slice(0, 3).forEach((msg: string, index: number) => {
        page.addElement({
          type: 'text',
          x: margin,
          y: currentY,
          width: contentWidth,
          fontSize: 20,
          fill: '#4B5563',
          text: `${index + 1}. ${msg}`,
        });
        currentY += 35;
      });
      currentY += 30;

      // Do's & Don'ts (나란히 배치)
      const halfWidth = (contentWidth - 20) / 2;

      // Do's
      page.addElement({
        type: 'text',
        x: margin,
        y: currentY,
        width: halfWidth,
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#059669',
        text: '✓ Do\'s',
      });

      // Don'ts
      page.addElement({
        type: 'text',
        x: margin + halfWidth + 20,
        y: currentY,
        width: halfWidth,
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#DC2626',
        text: '✗ Don\'ts',
      });
      currentY += 45;

      const maxItems = Math.max(
        mockDNA.dos.slice(0, 3).length,
        mockDNA.donts.slice(0, 3).length
      );

      for (let i = 0; i < maxItems; i++) {
        if (mockDNA.dos[i]) {
          page.addElement({
            type: 'text',
            x: margin,
            y: currentY,
            width: halfWidth,
            fontSize: 18,
            fill: '#047857',
            text: `✓ ${mockDNA.dos[i]}`,
          });
        }

        if (mockDNA.donts[i]) {
          page.addElement({
            type: 'text',
            x: margin + halfWidth + 20,
            y: currentY,
            width: halfWidth,
            fontSize: 18,
            fill: '#B91C1C',
            text: `✗ ${mockDNA.donts[i]}`,
          });
        }
        currentY += 35;
      }

      alert(`✅ Brand DNA 분석 완료! 캔버스에 결과가 표시되었습니다.`);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('❌ 분석 실패');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Upload</h2>
        <p className="text-xs text-gray-500 mt-1">Upload your images</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Upload Area */}
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Click to upload</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG up to 10MB</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Uploaded Images */}
        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">
              Uploaded ({uploadedImages.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {uploadedImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-500 transition-colors cursor-pointer"
                  onClick={() => addImageToCanvas(image.url)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id, image.url);
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedImages.length === 0 && (
          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>Uploaded images will appear here...</p>
            <p className="mt-1">Click on an image to add it to canvas</p>
          </div>
        )}

        {/* Brand DNA Analysis */}
        <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">
                Brand DNA 분석
              </h3>
              <p className="text-xs text-purple-700 mb-3">
                업로드한 이미지를 AI가 자동으로 분석하여 브랜드의 톤앤매너, 핵심 메시지, Do's/Don'ts를 추출합니다.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || uploadedImages.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Brand DNA 분석 시작
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
