/**
 * 컨셉 썸네일 카드 컴포넌트
 * 
 * Representative Page 기반 실제 포맷 비율을 유지하는 컨셉 카드
 * 
 * @author Antigravity AI
 * @version 2.0
 * @date 2025-11-27
 */

'use client';

import React from 'react';
import { getAspectRatio, getFormatName, type CanvasFormat } from '@/lib/utils/conceptToPolotnoPage';

interface ConceptThumbnailCardProps {
    concept: {
        id: string;
        title: string;
        description?: string;
        thumbnailUrl?: string;
        representativeFormat?: CanvasFormat;
        pageCount?: number;
    };
    onClick?: () => void;
    className?: string;
}

export function ConceptThumbnailCard({
    concept,
    onClick,
    className = '',
}: ConceptThumbnailCardProps) {
    // 포맷별 aspect ratio 계산
    const aspectRatio = getAspectRatio(concept.representativeFormat);
    const formatName = getFormatName(concept.representativeFormat);

    return (
        <div
            className={`concept-card group cursor-pointer rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 ${className}`}
            onClick={onClick}
        >
            {/* 썸네일 영역 - 실제 포맷 비율 유지 */}
            <div
                className="thumbnail-container relative overflow-hidden bg-gray-100"
                style={{ aspectRatio }}
            >
                {concept.thumbnailUrl ? (
                    <>
                        <img
                            src={concept.thumbnailUrl}
                            alt={concept.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* 포맷 배지 */}
                        <div className="absolute top-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
                            {formatName}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="text-sm text-gray-500">썸네일 생성 중...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 정보 영역 */}
            <div className="p-4 space-y-2">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                    {concept.title}
                </h3>

                {concept.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {concept.description}
                    </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <span>{concept.pageCount || 1}개 페이지</span>
                    <span className="text-indigo-600 font-medium group-hover:underline">
                        편집하기 →
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * 컨셉 그리드 컨테이너
 */
interface ConceptGridProps {
    concepts: Array<{
        id: string;
        title: string;
        description?: string;
        thumbnailUrl?: string;
        representativeFormat?: CanvasFormat;
        pageCount?: number;
    }>;
    onConceptClick?: (conceptId: string) => void;
}

export function ConceptGrid({ concepts, onConceptClick }: ConceptGridProps) {
    if (!concepts || concepts.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>생성된 컨셉이 없습니다.</p>
                <p className="text-sm mt-2">채팅에서 캠페인 컨셉을 요청해보세요!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concepts.map((concept) => (
                <ConceptThumbnailCard
                    key={concept.id}
                    concept={concept}
                    onClick={() => onConceptClick?.(concept.id)}
                />
            ))}
        </div>
    );
}
