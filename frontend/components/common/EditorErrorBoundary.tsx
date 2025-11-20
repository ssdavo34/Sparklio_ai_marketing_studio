/**
 * Editor Error Boundary
 *
 * Catches errors in editor components and displays fallback UI
 * Provides recovery options and error reporting
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children: ReactNode;
    editorType?: 'polotno' | 'konva' | 'layerhub';
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCount: number;
}

export class EditorErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
            errorCount: 1,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Editor Error:', error, errorInfo);

        // Update state with error details
        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1,
        }));

        // Report to error tracking service (if configured)
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
            console.group('🚨 Editor Error Details');
            console.error('Error:', error);
            console.error('Component Stack:', errorInfo.componentStack);
            console.error('Editor Type:', this.props.editorType);
            console.groupEnd();
        }

        // You could send to error tracking service here
        // Example: Sentry.captureException(error);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback provided
            if (this.props.fallback) {
                return <>{this.props.fallback}</>;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full">
                        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                            {/* Error Header */}
                            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <AlertTriangle className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">
                                            에디터 오류 발생
                                        </h1>
                                        <p className="text-white/80 mt-1">
                                            {this.props.editorType
                                                ? `${this.props.editorType.toUpperCase()} 에디터에서 문제가 발생했습니다`
                                                : '에디터 로드 중 문제가 발생했습니다'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Error Details */}
                            <div className="p-6 space-y-6">
                                {/* Error Message */}
                                <div className="bg-slate-700/50 rounded-lg p-4">
                                    <h3 className="text-sm font-medium text-slate-300 mb-2">
                                        오류 메시지
                                    </h3>
                                    <code className="text-red-400 text-sm block p-3 bg-slate-900 rounded overflow-x-auto">
                                        {this.state.error?.message || '알 수 없는 오류'}
                                    </code>
                                </div>

                                {/* Debug Info (Development Only) */}
                                {process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' && (
                                    <details className="bg-slate-700/30 rounded-lg p-4">
                                        <summary className="text-sm font-medium text-slate-400 cursor-pointer hover:text-slate-300">
                                            기술적 세부사항 (개발자용)
                                        </summary>
                                        <div className="mt-3 space-y-3">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Stack Trace:</p>
                                                <pre className="text-xs text-slate-400 bg-slate-900 p-2 rounded overflow-auto max-h-40">
                                                    {this.state.error?.stack}
                                                </pre>
                                            </div>
                                            {this.state.errorInfo && (
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Component Stack:</p>
                                                    <pre className="text-xs text-slate-400 bg-slate-900 p-2 rounded overflow-auto max-h-40">
                                                        {this.state.errorInfo.componentStack}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={this.handleReset}
                                        className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        다시 시도
                                    </button>

                                    <button
                                        onClick={this.handleReload}
                                        className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        페이지 새로고침
                                    </button>
                                </div>

                                {/* Alternative Options */}
                                <div className="border-t border-slate-700 pt-6">
                                    <p className="text-sm text-slate-400 mb-4">
                                        다른 옵션을 시도해보세요:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Link
                                            href="/studio"
                                            className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <Home className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    에디터 선택 화면
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    다른 에디터 사용
                                                </p>
                                            </div>
                                        </Link>

                                        <Link
                                            href="/dashboard"
                                            className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <FileText className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    대시보드
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    프로젝트 목록 보기
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                {/* Error Count Warning */}
                                {this.state.errorCount > 2 && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                        <p className="text-sm text-yellow-400">
                                            ⚠️ 반복적인 오류가 감지되었습니다.
                                            브라우저 캐시를 지우거나 다른 브라우저를 사용해보세요.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}