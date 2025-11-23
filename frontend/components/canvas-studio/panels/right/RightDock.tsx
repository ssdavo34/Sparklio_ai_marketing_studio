/**
 * Right Dock
 *
 * Right dock with multiple tabs (Block 5)
 * - Inspector: Element properties editor
 * - Layers: Element hierarchy view
 * - Chat: AI assistant integration (Backend Agent System)
 *
 * @author C Team (Frontend Team)
 * @version 4.1
 * @date 2025-11-22
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useTabsStore } from '../../stores/useTabsStore';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useChatStore } from '../../stores/useChatStore';
import { AGENT_INFO, TASK_INFO } from '../../stores/types/llm';
import type { AgentRole, TaskType, CostMode } from '../../stores/types/llm';
import { MessageSquare, Layers, Settings } from 'lucide-react';
import { ErrorMessage } from '../../components/ErrorMessage';

export function RightDock() {
  const activeTab = useTabsStore((state) => state.activeRightDockTab);
  const setActiveTab = useTabsStore((state) => state.setActiveRightDockTab);
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const [, forceUpdate] = useState({});

  // Force re-render when selection changes
  useEffect(() => {
    if (!polotnoStore) return;

    // Poll for changes every 100ms
    const interval = setInterval(() => {
      forceUpdate({});
    }, 100);

    return () => clearInterval(interval);
  }, [polotnoStore]);

  const selectedElements = polotnoStore?.selectedElements || [];
  const selectedElement = selectedElements[0];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'inspector'
              ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          Inspector
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'layers'
              ? 'border-b-2 border-purple-600 text-purple-600 bg-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Layers
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'inspector' && <InspectorTab element={selectedElement} />}
        {activeTab === 'layers' && <LayersTab />}
      </div>
    </div>
  );
}

// Chat Tab Component
function ChatTab() {
  const {
    messages,
    isLoading,
    error,
    errorType,
    errorDetails,
    sendMessage,
    generateImageFromPrompt,
    retryLastMessage,
    clearError,
    clearMessages,
    chatConfig,
    setRole,
    setTask,
    setCostMode,
  } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');

    if (chatConfig.task === 'image_generate') {
      await generateImageFromPrompt(message);
    } else {
      await sendMessage(message);
    }
  };

  // Get supported tasks for current role
  const supportedTasks = AGENT_INFO[chatConfig.role]?.supportedTasks || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-xs text-gray-500">
              Backend Gateway • Smart Router
            </p>
          </div>
          <button
            onClick={clearMessages}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
          >
            Clear
          </button>
        </div>

        {/* Agent Role Selector */}
        <div className="mb-2">
          <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
            Agent Role
          </label>
          <select
            value={chatConfig.role}
            onChange={(e) => setRole(e.target.value as AgentRole)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(AGENT_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.name} - {info.description}
              </option>
            ))}
          </select>
        </div>

        {/* Task Selector */}
        <div className="mb-2">
          <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
            Task Type
          </label>
          <select
            value={chatConfig.task}
            onChange={(e) => setTask(e.target.value as TaskType)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {supportedTasks.map((taskId) => {
              const taskInfo = TASK_INFO[taskId];
              return (
                <option key={taskId} value={taskId}>
                  {taskInfo.name} - {taskInfo.description}
                </option>
              );
            })}
          </select>
        </div>

        {/* Cost Mode Selector */}
        <div className="flex gap-2">
          {(['fast', 'balanced', 'quality'] as CostMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCostMode(mode)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                chatConfig.costMode === mode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode === 'fast' && '⚡ Fast'}
              {mode === 'balanced' && '⚖️ Balanced'}
              {mode === 'quality' && '✨ Quality'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.imageUrl && (
                <div className="mt-2">
                  <img
                    src={message.imageUrl}
                    alt="Generated"
                    className="rounded max-w-full h-auto"
                  />
                </div>
              )}
              <div
                className={`text-xs mt-1 flex items-center gap-2 ${
                  message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                }`}
              >
                <span>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {message.agentUsed && (
                  <span className="text-xs opacity-75">
                    • {message.agentUsed}
                    {message.taskUsed && ` → ${message.taskUsed}`}
                  </span>
                )}
                {message.usage?.tokens && (
                  <span className="text-xs opacity-75">
                    • {message.usage.tokens} tokens
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        {error && errorType && (
          <ErrorMessage
            type={errorType}
            originalMessage={error}
            details={errorDetails || undefined}
            onRetry={retryLastMessage}
            onDismiss={clearError}
            showRetry={true}
            isRetrying={isLoading}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              chatConfig.task === 'image_generate'
                ? 'Describe the image you want to generate...'
                : 'Type a message...'
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {chatConfig.task === 'image_generate' ? 'Generate' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Inspector Tab Component
function InspectorTab({ element }: { element: any }) {
  if (!element) {
    return (
      <div className="p-4 text-center text-gray-400">
        <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No element selected</p>
        <p className="text-xs mt-1">Select an element to edit its properties</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Element Name */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Name</label>
        <div className="mt-1 px-3 py-2 bg-gray-100 rounded text-sm">
          {element.name || element.type}
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Position</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600">X</label>
            <input
              type="number"
              value={Math.round(element.x || 0)}
              onChange={(e) => element.set({ x: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Y</label>
            <input
              type="number"
              value={Math.round(element.y || 0)}
              onChange={(e) => element.set({ y: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Size</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600">Width</label>
            <input
              type="number"
              value={Math.round(element.width || 0)}
              onChange={(e) => element.set({ width: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Height</label>
            <input
              type="number"
              value={Math.round(element.height || 0)}
              onChange={(e) => element.set({ height: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Rotation</label>
        <input
          type="number"
          value={Math.round(element.rotation || 0)}
          onChange={(e) => element.set({ rotation: Number(e.target.value) })}
          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="text-xs font-semibold text-gray-700 uppercase">Opacity</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={element.opacity || 1}
          onChange={(e) => element.set({ opacity: Number(e.target.value) })}
          className="mt-1 w-full"
        />
        <div className="text-xs text-gray-600 mt-1">
          {Math.round((element.opacity || 1) * 100)}%
        </div>
      </div>

      {/* Text specific properties */}
      {element.type === 'text' && (
        <>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">Text</label>
            <textarea
              value={element.text || ''}
              onChange={(e) => element.set({ text: e.target.value })}
              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">Font Size</label>
            <input
              type="number"
              value={element.fontSize || 16}
              onChange={(e) => element.set({ fontSize: Number(e.target.value) })}
              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">Color</label>
            <input
              type="color"
              value={element.fill || '#000000'}
              onChange={(e) => element.set({ fill: e.target.value })}
              className="mt-1 w-full h-10 border border-gray-300 rounded"
            />
          </div>
        </>
      )}
    </div>
  );
}

// Layers Tab Component
function LayersTab() {
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const [, forceUpdate] = useState({});

  // Force re-render when layers change
  useEffect(() => {
    if (!polotnoStore) return;

    // Poll for changes every 100ms
    const interval = setInterval(() => {
      forceUpdate({});
    }, 100);

    return () => clearInterval(interval);
  }, [polotnoStore]);

  const activePage = polotnoStore?.activePage;
  const elements = activePage?.children || [];
  // Reverse the array to show top layers first
  const reversedElements = [...elements].reverse();

  const moveLayerUp = (element: any) => {
    element.moveUp();
  };

  const moveLayerDown = (element: any) => {
    element.moveDown();
  };

  const moveToTop = (element: any) => {
    // Move to top by repeatedly calling moveUp
    while (element.zIndex < elements.length - 1) {
      element.moveUp();
    }
  };

  const moveToBottom = (element: any) => {
    // Move to bottom by repeatedly calling moveDown
    while (element.zIndex > 0) {
      element.moveDown();
    }
  };

  return (
    <div className="p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Elements</h3>
        <p className="text-xs text-gray-500">{elements.length} items</p>
      </div>

      {elements.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No elements</p>
          <p className="text-xs mt-1">Add elements to the canvas</p>
        </div>
      ) : (
        <div className="space-y-1">
          {reversedElements.map((element: any, index: number) => {
            const isSelected = polotnoStore?.selectedElements.includes(element);
            const actualIndex = elements.length - index;

            return (
              <div
                key={element.id}
                onClick={() => polotnoStore?.selectElements([element.id])}
                className={`px-3 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm flex items-center justify-between ${
                  isSelected ? 'bg-purple-50 border border-purple-300' : ''
                }`}
              >
                <span className="font-medium">{element.name || element.type}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveToTop(element);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                    title="Move to top"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerUp(element);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Move up one layer"
                  >
                    ▲
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerDown(element);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Move down one layer"
                  >
                    ▼
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveToBottom(element);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                    title="Move to bottom"
                  >
                    ⬇️
                  </button>
                  <span className="text-xs text-gray-400 ml-1">#{actualIndex}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
