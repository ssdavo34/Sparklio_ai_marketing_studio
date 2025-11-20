import React from "react";
import { useLLMStore } from "@/store/llmStore";

export const LLMSelector = () => {
    const { selection, setMode, setTextLLM, setImageLLM, setVideoLLM } =
        useLLMStore();

    return (
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LLM Mode</span>
                <select
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={selection.mode}
                    onChange={(e) => setMode(e.target.value as "auto" | "manual")}
                >
                    <option value="auto">Auto (Smart Router)</option>
                    <option value="manual">Manual Selection</option>
                </select>
            </div>

            {selection.mode === "manual" && (
                <div className="grid grid-cols-1 gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Text LLM</span>
                        <select
                            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-40"
                            value={selection.text || "auto"}
                            onChange={(e) =>
                                setTextLLM(e.target.value as any)
                            }
                        >
                            <option value="auto">Auto</option>
                            <option value="openai">GPT-4o</option>
                            <option value="gemini">Gemini 2.5 Flash</option>
                            <option value="anthropic">Claude 3.5 Sonnet</option>
                            <option value="ollama">Ollama (Qwen)</option>
                            <option value="llama">Ollama (Llama 3)</option>
                            <option value="mistral">Ollama (Mistral)</option>
                            <option value="mock">Mock (Dev)</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Image Engine</span>
                        <select
                            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-40"
                            value={selection.image || "auto"}
                            onChange={(e) =>
                                setImageLLM(e.target.value as any)
                            }
                        >
                            <option value="auto">Auto</option>
                            <option value="comfyui_image">ComfyUI (Desktop)</option>
                            <option value="nanobanana">Nanobanana (Cloud)</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Video Engine</span>
                        <select
                            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-40"
                            value={selection.video || "auto"}
                            onChange={(e) =>
                                setVideoLLM(e.target.value as any)
                            }
                        >
                            <option value="auto">Auto</option>
                            <option value="comfyui_video">ComfyUI Video</option>
                            <option value="nanobanana">Nanobanana Video</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};
