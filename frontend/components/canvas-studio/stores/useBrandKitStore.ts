import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BrandProfileData, BrandSource, Brand } from '@/types/brandKit';

interface BrandKitState {
    brandProfileId?: string;
    projectId?: string;

    profile: BrandProfileData | null;
    sources: BrandSource[];
    brand: Brand | null;

    isLoading: boolean;
    lastAnalysisStatus?: "idle" | "queued" | "running" | "succeeded" | "failed";

    // Actions
    loadBrandKit: (brandId: string) => Promise<void>;
    updateProfilePartial: (patch: Partial<BrandProfileData>) => void;
    saveProfile: () => Promise<void>;

    addSource: (file: File, type: 'pdf' | 'image') => Promise<void>;
    addUrlSource: (url: string) => Promise<void>;
    deleteSource: (sourceId: string) => Promise<void>;

    requestAnalysis: () => Promise<void>;
}

// Mock Data for MVP (until API connection is fully verified)
const MOCK_PROFILE: BrandProfileData = {
    name: "Sparklio",
    category: "SaaS",
    oneLiner: "AI Marketing Studio for Everyone",
    visual: {
        colors: [
            { role: "primary", name: "Sparklio Purple", hex: "#8B5CF6", source: "manual" },
            { role: "secondary", name: "Teal", hex: "#14B8A6", source: "manual" },
            { role: "accent", name: "Pink", hex: "#EC4899", source: "manual" },
        ],
        imageStyleKeywords: ["Modern", "Minimalist", "Vibrant"],
        logoAssets: []
    },
    tone: {
        summary: "Professional yet friendly",
        keywords: ["Innovative", "Helpful", "Smart"],
        dos: ["Use active voice", "Be concise"],
        donts: ["No jargon", "Don't be rude"]
    },
    copyLibrary: {
        subSlogans: [],
        defaultCtas: ["Get Started", "Learn More"],
        examplesGood: [],
        examplesBad: []
    },
    constraints: {
        requiredDisclaimers: [],
        forbiddenPhrases: []
    }
};

export const useBrandKitStore = create<BrandKitState>()(
    devtools(
        (set, get) => ({
            profile: null,
            sources: [],
            brand: null,
            isLoading: false,
            lastAnalysisStatus: "idle",

            loadBrandKit: async (brandId) => {
                set({ isLoading: true });
                try {
                    // TODO: Replace with actual API call
                    // const response = await fetch(`/api/v1/brands/${brandId}`);
                    // const data = await response.json();

                    // Simulating API delay
                    await new Promise(resolve => setTimeout(resolve, 500));

                    set({
                        brandProfileId: brandId,
                        profile: MOCK_PROFILE,
                        brand: {
                            id: brandId,
                            name: "Sparklio",
                            slug: "sparklio",
                            brand_kit: MOCK_PROFILE
                        }
                    });
                } catch (error) {
                    console.error("Failed to load brand kit:", error);
                } finally {
                    set({ isLoading: false });
                }
            },

            updateProfilePartial: (patch) => {
                const { profile } = get();
                if (!profile) return;
                set({ profile: { ...profile, ...patch } });
            },

            saveProfile: async () => {
                const { brandProfileId, profile } = get();
                if (!brandProfileId || !profile) return;

                set({ isLoading: true });
                try {
                    // TODO: Replace with actual API call
                    // await fetch(`/api/v1/brands/${brandProfileId}`, {
                    //   method: 'PATCH',
                    //   body: JSON.stringify({ brand_kit: profile })
                    // });
                    console.log("Saving profile:", profile);
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error("Failed to save profile:", error);
                } finally {
                    set({ isLoading: false });
                }
            },

            addSource: async (file, type) => {
                set({ isLoading: true });
                try {
                    // TODO: Upload API
                    const newSource: BrandSource = {
                        id: Math.random().toString(),
                        sourceType: "file",
                        title: file.name,
                        status: "pending",
                        included: true,
                        contentType: type,
                        createdAt: new Date().toISOString()
                    };

                    set(state => ({ sources: [...state.sources, newSource] }));
                } finally {
                    set({ isLoading: false });
                }
            },

            addUrlSource: async (url) => {
                set({ isLoading: true });
                try {
                    // TODO: Crawl API
                    const newSource: BrandSource = {
                        id: Math.random().toString(),
                        sourceType: "url",
                        url: url,
                        title: url,
                        status: "analyzing",
                        included: true,
                        createdAt: new Date().toISOString()
                    };

                    set(state => ({ sources: [...state.sources, newSource] }));

                    // Simulate crawling completion
                    setTimeout(() => {
                        set(state => ({
                            sources: state.sources.map(s =>
                                s.id === newSource.id ? { ...s, status: "done", title: "Crawled Page Title" } : s
                            )
                        }));
                    }, 2000);

                } finally {
                    set({ isLoading: false });
                }
            },

            deleteSource: async (sourceId) => {
                set(state => ({
                    sources: state.sources.filter(s => s.id !== sourceId)
                }));
            },

            requestAnalysis: async () => {
                set({ lastAnalysisStatus: "running" });
                try {
                    // TODO: Call analysis API
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    set({ lastAnalysisStatus: "succeeded" });
                } catch (error) {
                    set({ lastAnalysisStatus: "failed" });
                }
            }
        }),
        { name: 'BrandKitStore' }
    )
);
