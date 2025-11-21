/**
 * Polotno Editor Stub Component
 *
 * Placeholder component shown when Polotno API key is not available
 * Provides mock UI and demonstrates the editor layout
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

'use client';

import React, { useState } from 'react';
import {
  FileText,
  Image,
  Square,
  Type,
  Layers,
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Users,
  Package
} from 'lucide-react';

interface PolotnoEditorStubProps {
  onApiKeyRequired?: () => void;
}

export function PolotnoEditorStub({ onApiKeyRequired }: PolotnoEditorStubProps) {
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedPanel, setSelectedPanel] = useState<string>('elements');
  const [showApiKeyAlert, setShowApiKeyAlert] = useState(true);

  const tools = [
    { id: 'select', icon: Square, label: 'Select' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: Image, label: 'Image' },
    { id: 'shape', icon: Square, label: 'Shape' },
  ];

  const panels = [
    { id: 'elements', icon: Package, label: 'Elements' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'spark', icon: Sparkles, label: 'Spark Chat' },
    { id: 'meeting', icon: Users, label: 'Meeting AI' },
    { id: 'brand', icon: FileText, label: 'Brand Kit' },
  ];

  const mockLayers = [
    { id: '1', name: 'Background', visible: true, locked: false },
    { id: '2', name: 'Image 1', visible: true, locked: false },
    { id: '3', name: 'Heading Text', visible: true, locked: false },
    { id: '4', name: 'Button', visible: false, locked: true },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* API Key Alert */}
      {showApiKeyAlert && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                Polotno API 키가 필요합니다.
                <button
                  onClick={onApiKeyRequired}
                  className="ml-2 text-amber-900 underline hover:no-underline"
                >
                  API 키 설정하기
                </button>
              </span>
            </div>
            <button
              onClick={() => setShowApiKeyAlert(false)}
              className="text-amber-600 hover:text-amber-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded" title="Undo">
              <Undo className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded" title="Redo">
              <Redo className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button className="p-2 hover:bg-gray-100 rounded" title="Copy">
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded" title="Save">
              <Save className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded" title="Export">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded" title="Import">
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-16 bg-white border-r flex flex-col">
          <div className="p-2 space-y-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`
                    w-12 h-12 flex items-center justify-center rounded-lg
                    ${selectedTool === tool.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 text-gray-700'}
                  `}
                  title={tool.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl aspect-video flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mx-auto flex items-center justify-center text-white">
                  <FileText className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Polotno Editor Preview
              </h3>
              <p className="text-gray-500 text-sm mb-4 max-w-md">
                실제 에디터는 API 키 설정 후 이 영역에 로드됩니다.
                <br />
                현재는 레이아웃과 패널 시스템을 미리보기로 표시합니다.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onApiKeyRequired}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  API 키 설정
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  onClick={() => window.location.href = '/studio/layerhub'}
                >
                  LayerHub 사용
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Panels */}
        <div className="w-80 bg-white border-l flex flex-col">
          {/* Panel Tabs */}
          <div className="border-b">
            <div className="flex">
              {panels.map((panel) => {
                const Icon = panel.icon;
                return (
                  <button
                    key={panel.id}
                    onClick={() => setSelectedPanel(panel.id)}
                    className={`
                      flex-1 px-3 py-3 flex flex-col items-center gap-1
                      ${selectedPanel === panel.id
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                        : 'hover:bg-gray-50 text-gray-600'}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{panel.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedPanel === 'layers' && (
              <div>
                <h3 className="font-semibold mb-3">Layers</h3>
                <div className="space-y-2">
                  {mockLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <button className="p-1 hover:bg-gray-200 rounded">
                        {layer.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded">
                        {layer.locked ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>
                      <span className="flex-1 text-sm">{layer.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPanel === 'spark' && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Spark Chat
                </h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      AI 명령으로 디자인을 수정하세요
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm">
                      "제목을 더 크게 만들어줘"
                    </button>
                    <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm">
                      "배경색을 파란색으로 변경"
                    </button>
                    <button className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm">
                      "버튼을 오른쪽으로 이동"
                    </button>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="AI 명령 입력..."
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        disabled
                      />
                      <button className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm" disabled>
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPanel === 'meeting' && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  Meeting AI
                </h3>
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      회의록을 업로드하면 자동으로 프레젠테이션을 생성합니다
                    </p>
                  </div>
                  <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
                    <Upload className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-sm text-gray-600">회의록 업로드</span>
                  </button>
                </div>
              </div>
            )}

            {selectedPanel === 'brand' && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-500" />
                  Brand Kit
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Colors</h4>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="w-12 h-12 bg-blue-500 rounded"></div>
                      <div className="w-12 h-12 bg-green-500 rounded"></div>
                      <div className="w-12 h-12 bg-yellow-500 rounded"></div>
                      <div className="w-12 h-12 bg-red-500 rounded"></div>
                      <div className="w-12 h-12 bg-purple-500 rounded"></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Fonts</h4>
                    <div className="space-y-1">
                      <div className="p-2 hover:bg-gray-50 rounded text-sm">Inter</div>
                      <div className="p-2 hover:bg-gray-50 rounded text-sm">Roboto</div>
                      <div className="p-2 hover:bg-gray-50 rounded text-sm">Open Sans</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Logos</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPanel === 'elements' && (
              <div>
                <h3 className="font-semibold mb-3">Elements</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Templates</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-video bg-gray-100 rounded hover:shadow-lg cursor-pointer transition-shadow">
                          <div className="h-full flex items-center justify-center text-gray-400">
                            Template {i}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Shapes</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {['Square', 'Circle', 'Triangle', 'Star'].map(shape => (
                        <div key={shape} className="aspect-square bg-gray-100 rounded hover:bg-gray-200 cursor-pointer flex items-center justify-center text-xs text-gray-600">
                          {shape}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}