/**
 * Meeting to Brief Converter
 *
 * Meeting 분석 결과를 Brief로 변환하는 유틸리티
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

import type { Meeting, MeetingAnalysisResult } from '@/types/meeting';
import type { Brief } from '@/types/brief';

/**
 * Meeting 분석 결과를 Brief로 변환
 */
export function convertMeetingToBrief(
  meeting: Meeting,
  analysis: MeetingAnalysisResult,
  projectId: string = 'default-project'
): Brief {
  // Campaign ideas를 목표로 변환
  const goal = analysis.campaign_ideas.length > 0
    ? analysis.campaign_ideas[0]
    : analysis.summary;

  // Agenda에서 타겟 오디언스 추출 (간단한 휴리스틱)
  const targetKeywords = ['타겟', 'target', '고객', 'audience', '오디언스'];
  const targetAgenda = analysis.agenda.find(item =>
    targetKeywords.some(keyword => item.toLowerCase().includes(keyword))
  );
  const target = targetAgenda || '회의에서 논의된 타겟 오디언스';

  // Summary를 인사이트로 사용
  const insight = analysis.summary;

  // Campaign ideas를 key messages로 변환
  const keyMessages = analysis.campaign_ideas.length > 0
    ? analysis.campaign_ideas
    : analysis.decisions.slice(0, 3);

  // 기본 채널 설정 (회의 내용 분석 기반으로 확장 가능)
  const channels: Brief['channels'] = ['instagram', 'youtube'];

  // KPIs는 action items에서 추출
  const kpis = analysis.action_items.slice(0, 3);

  return {
    id: `brief-from-meeting-${meeting.id}`,
    projectId,
    goal,
    target,
    insight,
    keyMessages,
    channels,
    kpis,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    sourceType: 'meeting',
    sourceMeetingId: meeting.id,
  };
}

/**
 * Meeting이 Brief로 변환 가능한지 확인
 */
export function canConvertToBrief(meeting: Meeting): boolean {
  // analyzed 상태이고 analysis 데이터가 있어야 함
  return meeting.status === 'analyzed' && meeting.analysis_id !== undefined;
}
