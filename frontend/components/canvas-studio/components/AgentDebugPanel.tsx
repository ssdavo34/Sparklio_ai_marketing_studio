/**
 * Agent Debug Panel
 *
 * 개발자/QA를 위한 AI Agent 디버그 패널
 * - Dev Mode 토글
 * - Raw LLM 출력 표시
 * - ValidationResult 상세 보기
 * - Agent 실행 로그
 * - 에러 스택 추적
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference C_TEAM_WORK_BRIEF_2025-11-23.md
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Bug,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  Terminal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface AgentExecutionLog {
  /** 로그 ID */
  id: string;
  /** Agent 이름 */
  agentName: string;
  /** 실행 시작 시간 */
  startTime: string;
  /** 실행 종료 시간 */
  endTime?: string;
  /** 실행 시간 (ms) */
  duration?: number;
  /** 상태 */
  status: 'running' | 'success' | 'error';
  /** 입력 프롬프트 */
  input: string;
  /** Raw LLM 출력 */
  rawOutput?: string;
  /** 파싱된 출력 */
  parsedOutput?: any;
  /** Validation 결과 */
  validationResult?: any;
  /** 에러 정보 */
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  /** 메타 정보 */
  meta?: {
    model?: string;
    tokens?: number;
    temperature?: number;
  };
}

export interface AgentDebugPanelProps {
  /** 현재 실행 로그 */
  currentLog?: AgentExecutionLog;
  /** 이전 로그 목록 */
  logs?: AgentExecutionLog[];
  /** 최대 로그 개수 */
  maxLogs?: number;
}

// ============================================================================
// Main Component
// ============================================================================

export function AgentDebugPanel({
  currentLog,
  logs = [],
  maxLogs = 50,
}: AgentDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // localStorage에서 devMode 로드
  useEffect(() => {
    const stored = localStorage.getItem('sparklio_dev_mode');
    if (stored) {
      setDevMode(stored === 'true');
      setIsOpen(stored === 'true');
    }
  }, []);

  // devMode 변경 시 localStorage 저장
  const toggleDevMode = () => {
    const newMode = !devMode;
    setDevMode(newMode);
    setIsOpen(newMode);
    localStorage.setItem('sparklio_dev_mode', String(newMode));
  };

  // 섹션 토글
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const isSectionExpanded = (section: string) => expandedSections.has(section);

  // 선택된 로그 (currentLog 우선, 없으면 selectedLogId)
  const activeLog = currentLog || logs.find((log) => log.id === selectedLogId);

  // JSON 복사
  const copyJSON = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('JSON이 클립보드에 복사되었습니다!');
  };

  // JSON 다운로드
  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!devMode && !isOpen) {
    // Dev Mode 토글 버튼만 표시
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleDevMode}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
          title="개발자 모드 활성화"
        >
          <Bug className="w-4 h-4" />
          Dev Mode
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 left-0 z-50 bg-gray-900 text-white shadow-2xl border-t border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            {isOpen ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
          <Bug className="w-5 h-5 text-green-400" />
          <h3 className="text-sm font-semibold">Agent Debug Panel</h3>
          {activeLog && (
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                activeLog.status === 'success'
                  ? 'bg-green-900 text-green-200'
                  : activeLog.status === 'error'
                    ? 'bg-red-900 text-red-200'
                    : 'bg-yellow-900 text-yellow-200'
              }`}
            >
              {activeLog.status.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Dev Mode Toggle */}
          <button
            onClick={toggleDevMode}
            className={`flex items-center gap-2 px-3 py-1 text-xs rounded transition-colors ${
              devMode
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {devMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {devMode ? 'Dev Mode ON' : 'Dev Mode OFF'}
          </button>

          {/* 로그 개수 */}
          <span className="text-xs text-gray-400">{logs.length} logs</span>
        </div>
      </div>

      {/* Content (접기/펼치기) */}
      {isOpen && (
        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-12 gap-4 p-4">
            {/* 좌측: 로그 목록 */}
            <div className="col-span-3 space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase">
                Execution Logs
              </h4>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {currentLog && (
                  <LogListItem
                    log={currentLog}
                    isActive={!selectedLogId}
                    onClick={() => setSelectedLogId(null)}
                  />
                )}
                {logs.slice(0, maxLogs).map((log) => (
                  <LogListItem
                    key={log.id}
                    log={log}
                    isActive={selectedLogId === log.id}
                    onClick={() => setSelectedLogId(log.id)}
                  />
                ))}
              </div>
            </div>

            {/* 우측: 로그 상세 */}
            <div className="col-span-9 space-y-3">
              {activeLog ? (
                <>
                  {/* Basic Info */}
                  <Section
                    title="Basic Info"
                    icon={<Terminal className="w-4 h-4" />}
                    expanded={isSectionExpanded('basic')}
                    onToggle={() => toggleSection('basic')}
                  >
                    <div className="space-y-2 text-xs">
                      <InfoRow label="Agent" value={activeLog.agentName} />
                      <InfoRow
                        label="Start Time"
                        value={new Date(activeLog.startTime).toLocaleString()}
                      />
                      {activeLog.endTime && (
                        <InfoRow
                          label="End Time"
                          value={new Date(activeLog.endTime).toLocaleString()}
                        />
                      )}
                      {activeLog.duration && (
                        <InfoRow
                          label="Duration"
                          value={`${activeLog.duration}ms`}
                        />
                      )}
                      {activeLog.meta?.model && (
                        <InfoRow label="Model" value={activeLog.meta.model} />
                      )}
                      {activeLog.meta?.tokens && (
                        <InfoRow
                          label="Tokens"
                          value={String(activeLog.meta.tokens)}
                        />
                      )}
                    </div>
                  </Section>

                  {/* Input */}
                  <Section
                    title="Input Prompt"
                    icon={<Terminal className="w-4 h-4" />}
                    expanded={isSectionExpanded('input')}
                    onToggle={() => toggleSection('input')}
                  >
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {activeLog.input}
                    </pre>
                  </Section>

                  {/* Raw Output */}
                  {activeLog.rawOutput && (
                    <Section
                      title="Raw LLM Output"
                      icon={<Terminal className="w-4 h-4" />}
                      expanded={isSectionExpanded('raw')}
                      onToggle={() => toggleSection('raw')}
                      actions={
                        <>
                          <button
                            onClick={() => copyJSON(activeLog.rawOutput)}
                            className="p-1 hover:bg-gray-700 rounded"
                            title="Copy"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              downloadJSON(
                                activeLog.rawOutput,
                                `raw-output-${activeLog.id}.txt`
                              )
                            }
                            className="p-1 hover:bg-gray-700 rounded"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </>
                      }
                    >
                      <pre className="text-xs text-green-400 whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {activeLog.rawOutput}
                      </pre>
                    </Section>
                  )}

                  {/* Parsed Output */}
                  {activeLog.parsedOutput && (
                    <Section
                      title="Parsed Output"
                      icon={<CheckCircle className="w-4 h-4" />}
                      expanded={isSectionExpanded('parsed')}
                      onToggle={() => toggleSection('parsed')}
                      actions={
                        <>
                          <button
                            onClick={() => copyJSON(activeLog.parsedOutput)}
                            className="p-1 hover:bg-gray-700 rounded"
                            title="Copy JSON"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              downloadJSON(
                                activeLog.parsedOutput,
                                `parsed-output-${activeLog.id}.json`
                              )
                            }
                            className="p-1 hover:bg-gray-700 rounded"
                            title="Download JSON"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </>
                      }
                    >
                      <JSONViewer data={activeLog.parsedOutput} />
                    </Section>
                  )}

                  {/* Validation Result */}
                  {activeLog.validationResult && (
                    <Section
                      title="Validation Result"
                      icon={<CheckCircle className="w-4 h-4" />}
                      expanded={isSectionExpanded('validation')}
                      onToggle={() => toggleSection('validation')}
                      actions={
                        <button
                          onClick={() => copyJSON(activeLog.validationResult)}
                          className="p-1 hover:bg-gray-700 rounded"
                          title="Copy JSON"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      }
                    >
                      <JSONViewer data={activeLog.validationResult} />
                    </Section>
                  )}

                  {/* Error */}
                  {activeLog.error && (
                    <Section
                      title="Error"
                      icon={<XCircle className="w-4 h-4 text-red-400" />}
                      expanded={isSectionExpanded('error')}
                      onToggle={() => toggleSection('error')}
                    >
                      <div className="space-y-2 text-xs">
                        <div className="text-red-400 font-semibold">
                          {activeLog.error.message}
                        </div>
                        {activeLog.error.code && (
                          <div className="text-gray-400">
                            Code: {activeLog.error.code}
                          </div>
                        )}
                        {activeLog.error.stack && (
                          <pre className="text-xs text-gray-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {activeLog.error.stack}
                          </pre>
                        )}
                      </div>
                    </Section>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">로그를 선택하세요</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function LogListItem({
  log,
  isActive,
  onClick,
}: {
  log: AgentExecutionLog;
  isActive: boolean;
  onClick: () => void;
}) {
  const statusIcon =
    log.status === 'success' ? (
      <CheckCircle className="w-3 h-3 text-green-400" />
    ) : log.status === 'error' ? (
      <XCircle className="w-3 h-3 text-red-400" />
    ) : (
      <Clock className="w-3 h-3 text-yellow-400 animate-spin" />
    );

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
        isActive
          ? 'bg-gray-700 text-white'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-750'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {statusIcon}
        <span className="font-medium truncate">{log.agentName}</span>
      </div>
      <div className="text-xs text-gray-500 truncate">{log.input}</div>
      {log.duration && (
        <div className="text-xs text-gray-600 mt-1">{log.duration}ms</div>
      )}
    </button>
  );
}

function Section({
  title,
  icon,
  expanded,
  onToggle,
  actions,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 rounded border border-gray-700">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </button>
      {expanded && <div className="px-3 py-2 border-t border-gray-700">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className="text-gray-200 font-mono">{value}</span>
    </div>
  );
}

function JSONViewer({ data }: { data: any }) {
  return (
    <pre className="text-xs text-blue-300 whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-900 p-2 rounded">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
