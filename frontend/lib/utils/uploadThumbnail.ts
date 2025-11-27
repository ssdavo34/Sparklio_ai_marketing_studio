/**
 * 썸네일 업로드 유틸리티
 * 
 * Polotno 페이지의 썸네일을 생성하고 백엔드에 업로드하는 유틸리티
 * 
 * @author Antigravity AI
 * @version 2.0
 * @date 2025-11-27
 */

/**
 * 썸네일 생성 및 백엔드 업로드
 * 
 * @param page - Polotno page 객체
 * @param designPageId - 백엔드 design_page ID
 * @returns 업로드된 썸네일 URL
 */
export async function generateAndUploadThumbnail(
    page: any,
    designPageId: string
): Promise<string | null> {
    try {
        // 1. Polotno page에서 썸네일 생성
        const thumbnailDataUrl = await page.toDataURL({
            mimeType: 'image/jpeg',
            quality: 0.7,
            pixelRatio: 0.2,  // 20% 크기로 축소
        });

        if (!thumbnailDataUrl) {
            console.error('[uploadThumbnail] Failed to generate thumbnail dataUrl');
            return null;
        }

        // 2. 백엔드 API에 업로드
        const response = await fetch(`/api/pages/${designPageId}/thumbnail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dataUrl: thumbnailDataUrl,
                width: page.width,
                height: page.height,
            }),
        });

        if (!response.ok) {
            throw new Error(`Thumbnail upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[uploadThumbnail] ✅ Thumbnail uploaded: ${data.thumbnailUrl}`);

        // 3. Polotno page의 custom에 URL 저장
        page.set({
            custom: {
                ...page.custom,
                thumbnailUrl: data.thumbnailUrl,
                thumbnailGeneratedAt: data.generatedAt || new Date().toISOString(),
            },
        });

        return data.thumbnailUrl;
    } catch (error) {
        console.error('[uploadThumbnail] Error:', error);
        return null;
    }
}

/**
 * 여러 페이지의 썸네일을 일괄 업로드
 * 
 * @param pages - Polotno page 객체 배열
 * @returns 업로드된 썸네일 URL 맵 { pageId: thumbnailUrl }
 */
export async function batchUploadThumbnails(
    pages: any[]
): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    for (const page of pages) {
        const designPageId = page.custom?.designPageId;
        if (!designPageId) {
            console.warn('[batchUploadThumbnails] Page missing designPageId, skipping');
            continue;
        }

        const thumbnailUrl = await generateAndUploadThumbnail(page, designPageId);
        if (thumbnailUrl) {
            results[designPageId] = thumbnailUrl;
        }
    }

    console.log(`[batchUploadThumbnails] Uploaded ${Object.keys(results).length} thumbnails`);
    return results;
}
