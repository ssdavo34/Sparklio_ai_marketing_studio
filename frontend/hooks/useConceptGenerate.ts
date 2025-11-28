import { useState } from 'react';

export interface ConceptOutput {
    concept_name: string;
    concept_description: string;
    target_audience: string;
    key_message: string;
    tone_and_manner: string;
    visual_style: string;
    color_palette: string[];
    keywords: string[];
}

export interface ConceptResponse {
    concepts: ConceptOutput[];
    reasoning: string;
}

export function useConceptGenerate() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function generateConcepts(
        prompt: string,
        conceptCount: number = 3,
        brandContext?: string
    ): Promise<ConceptResponse> {
        setIsLoading(true);
        setError(null);

        try {
            // Use env var or default to the Mac Mini IP as per request
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://100.123.51.5:8000';
            // Ensure no double slash if baseUrl ends with /
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const url = `${cleanBaseUrl}/api/v1/concepts/from-prompt`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    concept_count: conceptCount,
                    brand_context: brandContext
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            return await res.json();
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setIsLoading(false);
        }
    }

    return { generateConcepts, isLoading, error };
}
