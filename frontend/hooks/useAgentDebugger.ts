/**
 * useAgentDebugger Hook
 *
 * Agent 실행 로그를 수집하고 관리하는 Hook
 * - 로그 추가/제거
 * - 현재 실행 중인 Agent 추적
 * - localStorage 영구 저장 옵션
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AgentExecutionLog } from '@/components/canvas-studio/components/AgentDebugPanel';

// ============================================================================
// Types
// ============================================================================

export interface UseAgentDebuggerOptions {
  /** 최대 로그 개수 */
  maxLogs?: number;
  /** localStorage에 저장 여부 */
  persist?: boolean;
  /** Storage key */
  storageKey?: string;
}

export interface UseAgentDebuggerReturn {
  /** 현재 실행 중인 로그 */
  currentLog: AgentExecutionLog | null;
  /** 이전 로그 목록 */
  logs: AgentExecutionLog[];
  /** 로그 시작 */
  startLog: (agentName: string, input: string, meta?: any) => string;
  /** 로그 업데이트 (raw output 추가) */
  updateLog: (logId: string, updates: Partial<AgentExecutionLog>) => void;
  /** 로그 완료 (success) */
  completeLog: (
    logId: string,
    parsedOutput: any,
    validationResult?: any
  ) => void;
  /** 로그 실패 (error) */
  failLog: (logId: string, error: { message: string; stack?: string; code?: string }) => void;
  /** 로그 제거 */
  removeLog: (logId: string) => void;
  /** 모든 로그 제거 */
  clearLogs: () => void;
}

const DEFAULT_OPTIONS: Required<UseAgentDebuggerOptions> = {
  maxLogs: 50,
  persist: true,
  storageKey: 'sparklio_agent_logs',
};

// ============================================================================
// Hook
// ============================================================================

export function useAgentDebugger(
  options: UseAgentDebuggerOptions = {}
): UseAgentDebuggerReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [currentLog, setCurrentLog] = useState<AgentExecutionLog | null>(null);
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const logIdCounter = useRef(0);

  // localStorage에서 로드
  useEffect(() => {
    if (!opts.persist) return;

    try {
      const stored = localStorage.getItem(opts.storageKey);
      if (stored) {
        const parsedLogs = JSON.parse(stored);
        setLogs(parsedLogs.slice(0, opts.maxLogs));
      }
    } catch (error) {
      console.error('[useAgentDebugger] Failed to load logs from localStorage:', error);
    }
  }, [opts.persist, opts.storageKey, opts.maxLogs]);

  // localStorage에 저장
  useEffect(() => {
    if (!opts.persist) return;

    try {
      localStorage.setItem(opts.storageKey, JSON.stringify(logs));
    } catch (error) {
      console.error('[useAgentDebugger] Failed to save logs to localStorage:', error);
    }
  }, [logs, opts.persist, opts.storageKey]);

  // 로그 시작
  const startLog = useCallback(
    (agentName: string, input: string, meta?: any): string => {
      const logId = `log_${Date.now()}_${logIdCounter.current++}`;
      const startTime = new Date().toISOString();

      const newLog: AgentExecutionLog = {
        id: logId,
        agentName,
        startTime,
        status: 'running',
        input,
        meta,
      };

      setCurrentLog(newLog);

      console.log(`[AgentDebugger] Started log ${logId} for ${agentName}`);

      return logId;
    },
    []
  );

  // 로그 업데이트
  const updateLog = useCallback(
    (logId: string, updates: Partial<AgentExecutionLog>) => {
      setCurrentLog((prev) => {
        if (prev?.id === logId) {
          return { ...prev, ...updates };
        }
        return prev;
      });

      setLogs((prev) =>
        prev.map((log) =>
          log.id === logId ? { ...log, ...updates } : log
        )
      );
    },
    []
  );

  // 로그 완료
  const completeLog = useCallback(
    (logId: string, parsedOutput: any, validationResult?: any) => {
      const endTime = new Date().toISOString();

      setCurrentLog((prev) => {
        if (prev?.id === logId) {
          const completed: AgentExecutionLog = {
            ...prev,
            endTime,
            duration: new Date(endTime).getTime() - new Date(prev.startTime).getTime(),
            status: 'success',
            parsedOutput,
            validationResult,
          };

          // 완료된 로그를 logs에 추가
          setLogs((prevLogs) => {
            const updated = [completed, ...prevLogs].slice(0, opts.maxLogs);
            return updated;
          });

          console.log(`[AgentDebugger] Completed log ${logId}`);

          return null; // currentLog 초기화
        }
        return prev;
      });
    },
    [opts.maxLogs]
  );

  // 로그 실패
  const failLog = useCallback(
    (
      logId: string,
      error: { message: string; stack?: string; code?: string }
    ) => {
      const endTime = new Date().toISOString();

      setCurrentLog((prev) => {
        if (prev?.id === logId) {
          const failed: AgentExecutionLog = {
            ...prev,
            endTime,
            duration: new Date(endTime).getTime() - new Date(prev.startTime).getTime(),
            status: 'error',
            error,
          };

          // 실패한 로그를 logs에 추가
          setLogs((prevLogs) => {
            const updated = [failed, ...prevLogs].slice(0, opts.maxLogs);
            return updated;
          });

          console.error(`[AgentDebugger] Failed log ${logId}:`, error);

          return null; // currentLog 초기화
        }
        return prev;
      });
    },
    [opts.maxLogs]
  );

  // 로그 제거
  const removeLog = useCallback((logId: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== logId));
  }, []);

  // 모든 로그 제거
  const clearLogs = useCallback(() => {
    setLogs([]);
    setCurrentLog(null);
    if (opts.persist) {
      localStorage.removeItem(opts.storageKey);
    }
  }, [opts.persist, opts.storageKey]);

  return {
    currentLog,
    logs,
    startLog,
    updateLog,
    completeLog,
    failLog,
    removeLog,
    clearLogs,
  };
}

// ============================================================================
// Helper: Wrap Agent Call with Logging
// ============================================================================

/**
 * Agent 호출을 자동으로 로깅하는 래퍼
 */
export async function withAgentLogging<T>(
  agentDebugger: UseAgentDebuggerReturn,
  agentName: string,
  input: string,
  fn: () => Promise<T>,
  options?: {
    meta?: any;
    extractRawOutput?: (result: T) => string;
    extractValidation?: (result: T) => any;
  }
): Promise<T> {
  const logId = agentDebugger.startLog(agentName, input, options?.meta);

  try {
    const result = await fn();

    // Raw output 추출
    if (options?.extractRawOutput) {
      const rawOutput = options.extractRawOutput(result);
      agentDebugger.updateLog(logId, { rawOutput });
    }

    // Validation 추출
    const validationResult = options?.extractValidation
      ? options.extractValidation(result)
      : undefined;

    agentDebugger.completeLog(logId, result, validationResult);

    return result;
  } catch (error: any) {
    agentDebugger.failLog(logId, {
      message: error.message || 'Unknown error',
      stack: error.stack,
      code: error.code,
    });

    throw error;
  }
}
