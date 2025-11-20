/**
 * LayerHub Adapter
 *
 * Converts between LayerHub format and SparklioDocument
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

import type { SparklioDocument, SparklioPage, SparklioObject } from '@/models/SparklioDocument';

// ============================================================================
// Type definitions for LayerHub (simplified - extend as needed)
// ============================================================================

interface LayerHubDesign {
    id?: string;
    name: string;
    frame: {
        width: number;
        height: number;
    };
    objects: LayerHubObject[];
    background?: string;
    preview?: string;
}

interface LayerHubObject {
    id: string;
    type: 'StaticText' | 'DynamicText' | 'StaticImage' | 'Background' | 'StaticPath' | 'Group';
    name?: string;
    left: number;
    top: number;
    width?: number;
    height?: number;
    angle?: number;
    opacity?: number;
    visible?: boolean;
    locked?: boolean;
    // Type-specific properties
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    src?: string;
    path?: string;
}

// ============================================================================
// LayerHub to Sparklio Conversion
// ============================================================================

export class LayerHubToSparklioAdapter {
    /**
     * Convert LayerHub design to SparklioDocument
     */
    static toSparklioDocument(design: LayerHubDesign): SparklioDocument {
        const page: SparklioPage = {
            id: design.id || `page-${Date.now()}`,
            name: design.name || 'Untitled Page',
            width: design.frame.width,
            height: design.frame.height,
            backgroundColor: design.background,
            objects: this.convertLayerHubObjects(design.objects),
            order: 0,
        };

        return {
            id: `doc-${Date.now()}`,
            name: design.name || 'Untitled Design',
            mode: 'presentation',
            pages: [page],
            currentPageId: page.id,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
    }

    /**
     * Convert LayerHub objects to Sparklio objects
     */
    private static convertLayerHubObjects(objects: LayerHubObject[]): SparklioObject[] {
        return objects.map(obj => {
            const baseObject = {
                id: obj.id,
                name: obj.name,
                x: obj.left || 0,
                y: obj.top || 0,
                width: obj.width || 100,
                height: obj.height || 100,
                rotation: obj.angle || 0,
                opacity: obj.opacity ?? 1,
                visible: obj.visible ?? true,
                locked: obj.locked || false,
            };

            switch (obj.type) {
                case 'StaticText':
                case 'DynamicText':
                    return {
                        ...baseObject,
                        type: 'text' as const,
                        text: obj.text || '',
                        fontSize: obj.fontSize,
                        fontFamily: obj.fontFamily,
                        color: obj.fill,
                    };

                case 'StaticImage':
                    return {
                        ...baseObject,
                        type: 'image' as const,
                        src: obj.src || '',
                    };

                case 'StaticPath':
                    return {
                        ...baseObject,
                        type: 'shape' as const,
                        shapeType: 'polygon',
                        fill: obj.fill,
                        stroke: obj.stroke,
                        strokeWidth: obj.strokeWidth,
                        // Path data would need conversion
                    };

                case 'Group':
                    return {
                        ...baseObject,
                        type: 'group' as const,
                        children: [], // Would need to process nested objects
                    };

                case 'Background':
                    // Skip background as it's handled at page level
                    return null as any;

                default:
                    return {
                        ...baseObject,
                        type: 'shape' as const,
                        shapeType: 'rectangle',
                        fill: obj.fill || '#cccccc',
                    };
            }
        }).filter(Boolean);
    }
}

// ============================================================================
// Sparklio to LayerHub Conversion
// ============================================================================

export class SparklioToLayerHubAdapter {
    /**
     * Convert SparklioDocument to LayerHub format
     */
    static toLayerHubDesign(document: SparklioDocument): LayerHubDesign {
        // LayerHub typically works with single designs, so we'll use the first page
        const page = document.pages[0];
        if (!page) {
            throw new Error('Document must have at least one page');
        }

        return {
            id: page.id,
            name: document.name,
            frame: {
                width: page.width,
                height: page.height,
            },
            objects: this.convertSparklioObjects(page.objects),
            background: page.backgroundColor,
        };
    }

    /**
     * Convert Sparklio objects to LayerHub format
     */
    private static convertSparklioObjects(objects: SparklioObject[]): LayerHubObject[] {
        return objects.map(obj => {
            const baseObject: LayerHubObject = {
                id: obj.id,
                type: 'StaticPath', // Default
                name: obj.name,
                left: obj.x,
                top: obj.y,
                width: obj.width,
                height: obj.height,
                angle: obj.rotation || 0,
                opacity: obj.opacity ?? 1,
                visible: obj.visible ?? true,
                locked: obj.locked || false,
            };

            switch (obj.type) {
                case 'text':
                    return {
                        ...baseObject,
                        type: 'StaticText',
                        text: obj.text,
                        fontSize: obj.fontSize,
                        fontFamily: obj.fontFamily,
                        fill: obj.color,
                    };

                case 'image':
                    return {
                        ...baseObject,
                        type: 'StaticImage',
                        src: obj.src,
                    };

                case 'shape':
                    return {
                        ...baseObject,
                        type: 'StaticPath',
                        fill: obj.fill,
                        stroke: obj.stroke,
                        strokeWidth: obj.strokeWidth,
                    };

                case 'group':
                    return {
                        ...baseObject,
                        type: 'Group',
                        // Children would need to be processed recursively
                    };

                case 'video':
                    // LayerHub may not support video directly
                    return {
                        ...baseObject,
                        type: 'StaticImage',
                        src: obj.thumbnail || '',
                    };

                default:
                    return baseObject;
            }
        });
    }
}

// ============================================================================
// Main Adapter Class
// ============================================================================

export class LayerHubAdapter {
    /**
     * Import from LayerHub to Sparklio
     */
    static import(layerHubData: LayerHubDesign): SparklioDocument {
        return LayerHubToSparklioAdapter.toSparklioDocument(layerHubData);
    }

    /**
     * Export from Sparklio to LayerHub
     */
    static export(document: SparklioDocument): LayerHubDesign {
        return SparklioToLayerHubAdapter.toLayerHubDesign(document);
    }

    /**
     * Validate if data is valid LayerHub format
     */
    static isValidLayerHubData(data: any): boolean {
        return data && data.frame && Array.isArray(data.objects);
    }

    /**
     * Apply Sparklio object to LayerHub design
     */
    static applyObject(design: LayerHubDesign, object: SparklioObject): void {
        const layerHubObject = SparklioToLayerHubAdapter.convertSparklioObjects([object])[0];
        design.objects.push(layerHubObject);
    }

    /**
     * Convert multiple pages to multiple designs (for LayerHub projects)
     */
    static toLayerHubProject(document: SparklioDocument): LayerHubDesign[] {
        return document.pages.map(page => ({
            id: page.id,
            name: page.name,
            frame: {
                width: page.width,
                height: page.height,
            },
            objects: SparklioToLayerHubAdapter.convertSparklioObjects(page.objects),
            background: page.backgroundColor,
        }));
    }
}