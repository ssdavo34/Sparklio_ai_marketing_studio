import { create } from "zustand";

type LLMMode = "auto" | "manual";

type LLMProviderName =
    | "auto"
    | "mock"
    | "openai"
    | "gemini"
    | "ollama"
    | "qwen"
    | "llama"
    | "nanobanana"
    | "comfyui_image"
    | "comfyui_video";

interface LLMSelection {
    mode: LLMMode;
    text?: LLMProviderName;
    image?: LLMProviderName;
    video?: LLMProviderName;
}

interface LLMState {
    selection: LLMSelection;
    setMode: (mode: LLMMode) => void;
    setTextLLM: (name: LLMProviderName) => void;
    setImageLLM: (name: LLMProviderName) => void;
    setVideoLLM: (name: LLMProviderName) => void;
}

export const useLLMStore = create<LLMState>((set) => ({
    selection: {
        mode: "auto",
        text: "auto",
        image: "auto",
        video: "auto",
    },
    setMode: (mode) =>
        set((state) => ({ selection: { ...state.selection, mode } })),
    setTextLLM: (name) =>
        set((state) => ({ selection: { ...state.selection, text: name } })),
    setImageLLM: (name) =>
        set((state) => ({ selection: { ...state.selection, image: name } })),
    setVideoLLM: (name) =>
        set((state) => ({ selection: { ...state.selection, video: name } })),
}));
