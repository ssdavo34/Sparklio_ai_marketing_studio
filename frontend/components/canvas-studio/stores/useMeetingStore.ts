import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Meeting, MeetingAnalysisResult } from '@/types/meeting';

interface MeetingStore {
    // State
    meetings: Meeting[];
    currentMeeting: Meeting | null;
    analysisResult: MeetingAnalysisResult | null;

    // Actions
    setMeetings: (meetings: Meeting[]) => void;
    setCurrentMeeting: (meeting: Meeting | null) => void;
    setAnalysisResult: (result: MeetingAnalysisResult | null) => void;
    addMeeting: (meeting: Meeting) => void;
    updateMeeting: (id: string, data: Partial<Meeting>) => void;
    deleteMeeting: (id: string) => void;
}

export const useMeetingStore = create<MeetingStore>()(
    persist(
        (set) => ({
            meetings: [],
            currentMeeting: null,
            analysisResult: null,

            setMeetings: (meetings) => set({ meetings }),
            setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),
            setAnalysisResult: (result) => set({ analysisResult: result }),

            addMeeting: (meeting) => set((state) => ({
                meetings: [meeting, ...state.meetings]
            })),

            updateMeeting: (id, data) => set((state) => ({
                meetings: state.meetings.map((m) =>
                    m.id === id ? { ...m, ...data } : m
                ),
                currentMeeting: state.currentMeeting?.id === id
                    ? { ...state.currentMeeting, ...data }
                    : state.currentMeeting
            })),

            deleteMeeting: (id) => set((state) => ({
                meetings: state.meetings.filter((m) => m.id !== id),
                currentMeeting: state.currentMeeting?.id === id ? null : state.currentMeeting,
                analysisResult: state.currentMeeting?.id === id ? null : state.analysisResult
            })),
        }),
        {
            name: 'meeting-storage',
            partialize: (state) => ({
                // Persist only current meeting context
                currentMeeting: state.currentMeeting,
                analysisResult: state.analysisResult
            }),
        }
    )
);
