/**
 * Polotno Adapter
 *
 * Converts between Polotno format and SparklioDocument
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

import type { SparklioDocument, SparklioPage, SparklioObject } from '@/models/SparklioDocument';

// ============================================================================
// Type definitions for Polotno (simplified - extend as needed)
// ============================================================================

interface PolotnoPage {
    id: string;
    children: any[];
    background?: string;
    width?: number;
    height?: number;
}

interface PolotnoStore {
    pages: PolotnoPage[];
    width: number;
    height: number;
}

// ============================================================================
// Polotno to Sparklio Conversion
// ============================================================================

export class PolotnoToSparklioAdapter {
    /**
     * Convert Polotno store to SparklioDocument
     */
    static toSparklioDocument(store: PolotnoStore): SparklioDocument {
        const pages: SparklioPage[] = store.pages.map((page, index) => ({
            id: page.id,
            name: `Page ${index + 1}`,
            width: page.width || store.width || 800,
            height: page.height || store.height || 600,
            backgroundColor: page.background,
            objects: this.convertPolotnoObjects(page.children),
            order: index,
        }));

        return {
            id: `doc-${Date.now()}`,
            name: 'Untitled Design',
            mode: 'presentation',
            pages,
            currentPageId: pages[0]?.id,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
    }

    /**
     * Convert Polotno objects to Sparklio objects
     */
    private static convertPolotnoObjects(children: any[]): SparklioObject[] {
        return children.map(child => {
            const baseObject = {
                id: child.id,
                name: child.name,
                x: child.x || 0,
                y: child.y || 0,
                width: child.width || 100,
                height: child.height || 100,
                rotation: child.rotation || 0,
                opacity: child.opacity ?? 1,
                visible: child.visible ?? true,
                locked: child.locked || false,
            };

            // Convert based on Polotno type
            switch (child.type) {
                case 'text':
                    return {
                        ...baseObject,
                        type: 'text' as const,
                        text: child.text || '',
                        fontSize: child.fontSize,
                        fontFamily: child.fontFamily,
                        color: child.fill,
                        textAlign: child.align,
                    };

                case 'image':
                    return {
                        ...baseObject,
                        type: 'image' as const,
                        src: child.src || '',
                        alt: child.alt,
                    };

                case 'svg':
                case 'shape':
                    return {
                        ...baseObject,
                        type: 'shape' as const,
                        shapeType: 'rectangle', // Default, need mapping
                        fill: child.fill,
                        stroke: child.stroke,
                        strokeWidth: child.strokeWidth,
                    };

                default:
                    // Fallback to shape
                    return {
                        ...baseObject,
                        type: 'shape' as const,
                        shapeType: 'rectangle',
                        fill: child.fill || '#cccccc',
                    };
            }
        });
    }
}

// ============================================================================
// Sparklio to Polotno Conversion
// ============================================================================

export class SparklioToPolotnoAdapter {
    /**
     * Convert SparklioDocument to Polotno format
     */
    static toPolotnoStore(document: SparklioDocument): PolotnoStore {
        const pages: PolotnoPage[] = document.pages.map(page => ({
            id: page.id,
            children: this.convertSparklioObjects(page.objects),
            background: page.backgroundColor,
            width: page.width,
            height: page.height,
        }));

        return {
            pages,
            width: document.pages[0]?.width || 800,
            height: document.pages[0]?.height || 600,
        };
    }

    /**
     * Convert Sparklio objects to Polotno format
     */
    private static convertSparklioObjects(objects: SparklioObject[]): any[] {
        return objects.map(obj => {
            const baseObject = {
                id: obj.id,
                name: obj.name,
                x: obj.x,
                y: obj.y,
                width: obj.width,
                height: obj.height,
                rotation: obj.rotation || 0,
                opacity: obj.opacity ?? 1,
                visible: obj.visible ?? true,
                locked: obj.locked || false,
            };

            switch (obj.type) {
                case 'text':
                    return {
                        ...baseObject,
                        type: 'text',
                        text: obj.text,
                        fontSize: obj.fontSize,
                        fontFamily: obj.fontFamily,
                        fill: obj.color,
                        align: obj.textAlign,
                    };

                case 'image':
                    return {
                        ...baseObject,
                        type: 'image',
                        src: obj.src,
                        alt: obj.alt,
                    };

                case 'shape':
                    return {
                        ...baseObject,
                        type: 'shape',
                        fill: obj.fill,
                        stroke: obj.stroke,
                        strokeWidth: obj.strokeWidth,
                    };

                case 'video':
                    // Polotno may not support video directly
                    return {
                        ...baseObject,
                        type: 'image', // Fallback to image with thumbnail
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

export class PolotnoAdapter {
    /**
     * Import from Polotno to Sparklio
     */
    static import(polotnoData: any): SparklioDocument {
        return PolotnoToSparklioAdapter.toSparklioDocument(polotnoData);
    }

    /**
     * Export from Sparklio to Polotno
     */
    static export(document: SparklioDocument): any {
        return SparklioToPolotnoAdapter.toPolotnoStore(document);
    }

    /**
     * Validate if data is valid Polotno format
     */
    static isValidPolotnoData(data: any): boolean {
        return data && Array.isArray(data.pages);
    }

    /**
     * Apply Sparklio object to Polotno store
     */
    static applyObject(store: any, object: SparklioObject): void {
        const polotnoObject = SparklioToPolotnoAdapter.convertSparklioObjects([object])[0];
        // This would need actual Polotno store API calls
        console.log('Applying object to Polotno store:', polotnoObject);
    }
}