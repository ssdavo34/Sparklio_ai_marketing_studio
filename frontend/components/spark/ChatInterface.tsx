import React, { useState, useRef, useEffect } from 'react';
import { useSparkChat } from '../../hooks/useSparkChat';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { LLMSelector } from './LLMSelector';

interface ChatInterfaceProps {
    embedded?: boolean;
}

export const ChatInterface = ({ embedded = false }: ChatInterfaceProps) => {
    const { messages, isLoading, analysisResult, sendMessage, createDraft } = useSparkChat();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            sendMessage(input);
            setInput('');
        }
    };

    return (
        <div className={`relative h-full bg-slate-50 ${embedded ? '' : 'rounded-lg'} flex flex-col`}>
            {/* Header - Hide if embedded */}
            {!embedded && (
                <div className="p-4 border-b bg-white shadow-sm flex flex-col gap-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <h1 className="font-bold text-lg text-slate-800">Spark Chat</h1>
                        </div>
                        {analysisResult && (
                            <button
                                onClick={createDraft}
                                disabled={isLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                초안 만들기
                            </button>
                        )}
                    </div>
                    <LLMSelector />
                </div>
            )}

            {/* Embedded Header (Minimal) */}
            {embedded && (
                <div className="p-2 border-b bg-white shadow-sm flex-shrink-0">
                    <LLMSelector />
                </div>
            )}

            {/* Messages Area - Takes remaining space with padding for input */}
            <div className="flex-1 overflow-y-auto p-4 pb-24" style={{ minHeight: 0 }}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                        <div
                            className={`max-w-[90%] p-3 rounded-2xl shadow-sm whitespace-pre-wrap text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && !analysisResult && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="명령을 입력하세요..."
                        className="flex-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};
