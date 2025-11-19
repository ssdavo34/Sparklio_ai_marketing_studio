'use client';

import { ChatInterface } from '../../components/spark/ChatInterface';

export default function SparkChatPage() {
    return (
        <div className="h-screen w-full flex">
            {/* Sidebar (Placeholder for History) */}
            <div className="w-64 bg-slate-900 text-slate-300 p-4 hidden md:flex flex-col border-r border-slate-800">
                <div className="font-bold text-white mb-6 px-2">Recent Chats</div>
                <div className="space-y-2">
                    <div className="p-2 hover:bg-slate-800 rounded cursor-pointer text-sm truncate">
                        나이키 에어맥스 광고
                    </div>
                    <div className="p-2 hover:bg-slate-800 rounded cursor-pointer text-sm truncate">
                        여름 시즌 세일 포스터
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 h-full">
                <ChatInterface />
            </div>
        </div>
    );
}
