/**
 * LayerHub Editor Component
 *
 * Experimental v2 editor using LayerHub SDK
 * Future replacement for Polotno
 *
 * Note: This is currently a mock implementation.
 * When LayerHub SDK is available, replace with actual implementation.
 *
 * @author C팀 (Frontend Team)
 * @version 2.0 (Experimental)
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Square,
  Type,
  Image,
  Download,
  Upload,
  Undo,
  Redo,
  Save,
  Settings,
  Palette,
  Grid3X3,
  Shapes
} from 'lucide-react';

interface LayerHubEditorProps {
  onDesignUpdate?: (design: any) => void;
}

export function LayerHubEditor({ onDesignUpdate }: LayerHubEditorProps) {
  const [design, setDesign] = useState<any>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedTab, setSelectedTab] = useState<string>('templates');

  // Initialize with empty design
  useEffect(() => {
    const initialDesign = {
      name: 'Untitled Design',
      frame: {
        width: 1920,
        height: 1080,
      },
      objects: [],
    };
    setDesign(initialDesign);
  }, []);

  const handleDesignUpdate = (updatedDesign: any) => {
    setDesign(updatedDesign);
    if (onDesignUpdate) {
      onDesignUpdate(updatedDesign);
    }
  };

  if (!design) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LayerHub Editor...</p>
        </div>
      </div>
    );
  }

  const tools = [
    { id: 'select', icon: Square, label: 'Select' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: Image, label: 'Image' },
    { id: 'shapes', icon: Shapes, label: 'Shapes' },
  ];

  const tabs = [
    { id: 'templates', label: 'Templates' },
    { id: 'elements', label: 'Elements' },
    { id: 'text', label: 'Text' },
    { id: 'images', label: 'Images' },
    { id: 'uploads', label: 'Uploads' },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Top Navbar */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Undo className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <button className="p-2 hover:bg-gray-100 rounded">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Layers className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm font-medium">
          LayerHub Editor (Experimental)
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Save className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Download className="w-4 h-4" />
          </button>
          <button className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
            Export
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`
                    px-4 py-3 text-sm font-medium whitespace-nowrap
                    ${selectedTab === tab.id
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedTab === 'templates' && (
              <div>
                <h3 className="font-medium mb-3">Templates</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-video bg-gray-100 rounded-lg hover:shadow-lg cursor-pointer transition-shadow">
                      <div className="h-full flex items-center justify-center text-gray-400">
                        Template {i}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'elements' && (
              <div>
                <h3 className="font-medium mb-3">Elements</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm text-gray-600 mb-2">Shapes</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {['Square', 'Circle', 'Triangle', 'Star'].map(shape => (
                        <div key={shape} className="aspect-square bg-gray-100 rounded hover:bg-gray-200 cursor-pointer flex items-center justify-center text-xs">
                          {shape}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-600 mb-2">Lines</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {['Straight', 'Arrow', 'Curved', 'Dashed'].map(line => (
                        <div key={line} className="aspect-square bg-gray-100 rounded hover:bg-gray-200 cursor-pointer flex items-center justify-center text-xs">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'text' && (
              <div>
                <h3 className="font-medium mb-3">Text Styles</h3>
                <div className="space-y-3">
                  {['Heading 1', 'Heading 2', 'Heading 3', 'Body', 'Caption'].map(style => (
                    <div key={style} className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                      <div className="font-medium">{style}</div>
                      <div className="text-sm text-gray-500">Click to add</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'images' && (
              <div>
                <h3 className="font-medium mb-3">Stock Images</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg hover:shadow-lg cursor-pointer transition-shadow">
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <Image className="w-8 h-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'uploads' && (
              <div>
                <h3 className="font-medium mb-3">Your Uploads</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">Drop files here or</p>
                  <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                    Browse Files
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex">
          {/* Tools Sidebar */}
          <div className="w-12 bg-white border-r flex flex-col items-center py-2">
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`
                    w-10 h-10 flex items-center justify-center rounded mb-1
                    ${selectedTool === tool.id
                      ? 'bg-green-500 text-white'
                      : 'hover:bg-gray-100 text-gray-700'}
                  `}
                  title={tool.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>

          {/* Main Canvas */}
          <div className="flex-1 p-8 flex items-center justify-center bg-gray-100">
            <div className="bg-white rounded-lg shadow-2xl" style={{ width: '960px', height: '540px' }}>
              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mx-auto flex items-center justify-center text-white">
                      <Layers className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    LayerHub Canvas
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 max-w-md">
                    실험적 에디터입니다. 현재는 기본 UI만 제공됩니다.
                    <br />
                    전체 기능은 SDK 통합 후 활성화됩니다.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
                      템플릿 선택
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                      빈 캔버스 시작
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-64 bg-white border-l p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Properties
          </h3>

          <div className="space-y-4">
            {/* Canvas Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Canvas</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Width</label>
                  <input
                    type="number"
                    value="1920"
                    className="w-full px-2 py-1 border rounded text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Height</label>
                  <input
                    type="number"
                    value="1080"
                    className="w-full px-2 py-1 border rounded text-sm"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Colors
              </h4>
              <div className="grid grid-cols-6 gap-1">
                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
                  '#00FFFF', '#FFFFFF', '#808080', '#800000', '#008000', '#000080'].map(color => (
                  <div
                    key={color}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Layers */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Layers
              </h4>
              <div className="bg-gray-50 rounded p-2 text-sm text-gray-500 text-center">
                No layers yet
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-10 bg-white border-t flex items-center justify-between px-4">
        <div className="text-xs text-gray-500">
          Ready
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>100%</span>
          <span>1920 × 1080</span>
          <span>RGB</span>
        </div>
      </div>
    </div>
  );
}