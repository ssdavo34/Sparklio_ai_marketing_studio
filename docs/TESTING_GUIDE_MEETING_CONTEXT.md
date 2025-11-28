# Meeting Context Integration Testing Guide

## Overview
This guide details how to verify the integration of Meeting Analysis Context into the Chat Tab of the Right Dock.

## Prerequisites
- Ensure the backend server is running (Mac Mini or local).
- Ensure the frontend application is running (`npm run dev`).
- Ensure you have at least one meeting with analysis results in the system.

## Test Scenarios

### Scenario 1: Verify Meeting Context Indicator
1.  Navigate to the **Meeting Tab** in the Left Panel.
2.  Select a meeting that has been successfully analyzed (status: `analyzed`).
3.  Observe that the meeting details are displayed.
4.  Navigate to the **Chat Tab** in the Right Dock.
5.  **Expected Result**: You should see a blue badge at the top of the Chat Tab saying "회의 분석 컨텍스트 활성화" along with the meeting title.

### Scenario 2: Verify Concept Generation Mode
1.  In the Chat Tab, click on the "Settings" (chevron) icon if closed.
2.  Locate the "모드 선택" (Mode Selection) toggle.
3.  Switch from "자유 대화" (Free Chat) to "컨셉 도출" (Concept Derivation).
4.  **Expected Result**:
    *   The input placeholder changes to "어떤 마케팅 컨셉을 원하시나요? (예: 20대 여성을 위한 립스틱)".
    *   The submit button text changes to "컨셉 도출".

### Scenario 3: Generate Concepts with Context
1.  Ensure "Concept Derivation" mode is selected and a meeting context is active (Scenario 1 & 2).
2.  Enter a prompt related to the meeting content (e.g., "이 회의 내용을 바탕으로 SNS 마케팅 컨셉 3가지를 제안해줘").
3.  Click "컨셉 도출".
4.  **Expected Result**:
    *   A loading indicator appears.
    *   After a few seconds, the AI responds with "✅ 컨셉 생성이 완료되었습니다." and provides reasoning.
    *   The center view automatically switches to the **Concept Board**.
    *   The generated concepts are displayed on the board.
    *   The generated concepts should reflect insights from the meeting (check for specific keywords or decisions mentioned in the meeting).

### Scenario 4: Verify Normal Chat Mode
1.  Switch back to "자유 대화" mode.
2.  Enter a general question (e.g., "안녕하세요").
3.  Click "Send".
4.  **Expected Result**:
    *   The AI responds normally without triggering the concept generation flow.
    *   The center view does *not* switch to the Concept Board automatically.

## Troubleshooting
- **No Context Indicator**: Ensure `useMeetingStore` has `analysisResult` populated. Try re-selecting the meeting in the Meeting Tab.
- **Generation Failed**: Check the browser console and network tab for API errors (`POST /api/v1/concepts/from-prompt`). Ensure the backend URL is correct.
