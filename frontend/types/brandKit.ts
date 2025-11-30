export type BrandColorRole =
    | "primary"
    | "secondary"
    | "accent"
    | "background"
    | "text"
    | "error";

export interface BrandColorToken {
    role: BrandColorRole;
    name: string;
    hex: string;
    source: "auto" | "manual";
}

export interface BrandTypography {
    primaryFontFamily?: string;
    secondaryFontFamily?: string;
    headingExample?: string;
    bodyExample?: string;
    webFallbackFont?: string;
}

export interface BrandVisualIdentity {
    colors: BrandColorToken[];
    typography?: BrandTypography;
    imageStyleKeywords: string[];
    logoAssets: string[]; // file ids
}

export interface BrandToneOfVoice {
    summary: string;
    keywords: string[];
    dos: string[];
    donts: string[];
}

export interface BrandCopyLibrary {
    mainSlogan?: string;
    subSlogans: string[];
    defaultCtas: string[];
    examplesGood: string[];
    examplesBad: string[];
}

export interface BrandConstraints {
    requiredDisclaimers: string[];
    forbiddenPhrases: string[];
    legalNotes?: string;
}

export interface BrandAudience {
    summary?: string;
    segments: string[];
    painPoints: string[];
    needs: string[];
}

export interface BrandProfileData {
    name: string;
    category?: string;
    oneLiner?: string;
    description?: string;
    audience?: BrandAudience;
    visual?: BrandVisualIdentity;
    tone?: BrandToneOfVoice;
    copyLibrary?: BrandCopyLibrary;
    constraints?: BrandConstraints;
}

export interface BrandSource {
    id: string;
    sourceType: "file" | "url";
    title?: string;
    status: "pending" | "analyzing" | "done" | "failed";
    included: boolean;
    contentType?: string;
    url?: string;
    createdAt: string;
}

export interface Brand {
    id: string;
    name: string;
    slug: string;
    description?: string;
    brand_kit?: any; // JSONB
    brand_dna?: any; // JSONB
    logo_url?: string;
    website_url?: string;
    industry?: string;
}
