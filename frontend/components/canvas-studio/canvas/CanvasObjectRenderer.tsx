/**
 * Canvas Object Renderer
 *
 * StudioObject를 Konva 컴포넌트로 렌더링하는 컴포넌트
 * - Text, Image, Shape 타입을 지원
 * - 선택, 드래그, 변형 기능 포함
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 */

'use client';

import { useRef, useEffect } from 'react';
import { Text, Rect, Circle, Image as KonvaImage, Transformer } from 'react-konva';
import type { CanvasObject } from '../stores/types';
import { useEditorStore } from '../stores';

interface CanvasObjectProps {
    object: CanvasObject;
    isSelected: boolean;
    onSelect: () => void;
}

export function CanvasObjectRenderer({ object, isSelected, onSelect }: CanvasObjectProps) {
    const transformerRef = useRef<any>(null);
    const shapeRef = useRef<any>(null);
    const updateObject = useEditorStore((state) => state.updateObject);

    // Transformer 연결
    useEffect(() => {
        if (isSelected && transformerRef.current && shapeRef.current) {
            transformerRef.current.nodes([shapeRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    // 드래그 종료 시 위치 업데이트
    const handleDragEnd = (e: any) => {
        updateObject(object.id, {
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    // 변형 종료 시 크기/회전 업데이트
    const handleTransformEnd = (e: any) => {
        const node = shapeRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // 스케일 초기화 및 실제 크기로 변환
        node.scaleX(1);
        node.scaleY(1);

        updateObject(object.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
        });
    };

    // 공통 속성
    const commonProps = {
        ref: shapeRef,
        x: object.x,
        y: object.y,
        rotation: object.rotation || 0,
        draggable: true,
        onClick: onSelect,
        onTap: onSelect,
        onDragEnd: handleDragEnd,
        onTransformEnd: handleTransformEnd,
    };

    // 타입별 렌더링
    let shape = null;

    if (object.type === 'text') {
        shape = (
            <Text
                {...commonProps}
                text={object.text}
                fontSize={object.fontSize || 16}
                fontFamily={object.fontFamily || 'Arial'}
                fill={object.fill || '#000000'}
                align={object.align || 'left'}
                width={object.width}
            />
        );
    } else if (object.type === 'shape') {
        if (object.shapeType === 'rect') {
            shape = (
                <Rect
                    {...commonProps}
                    width={object.width || 100}
                    height={object.height || 100}
                    fill={object.fill || '#3b82f6'}
                    stroke={object.stroke}
                    strokeWidth={object.strokeWidth || 0}
                    cornerRadius={object.cornerRadius || 0}
                />
            );
        } else if (object.shapeType === 'circle') {
            shape = (
                <Circle
                    {...commonProps}
                    radius={object.radius || 50}
                    fill={object.fill || '#3b82f6'}
                    stroke={object.stroke}
                    strokeWidth={object.strokeWidth || 0}
                />
            );
        }
    } else if (object.type === 'image') {
        // TODO: Image 타입은 Phase 2.3에서 구현
    }

    return (
        <>
            {shape}
            {isSelected && <Transformer ref={transformerRef} />}
        </>
    );
}
