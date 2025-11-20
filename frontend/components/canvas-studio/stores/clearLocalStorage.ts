/**
 * Clear localStorage helper
 *
 * 개발 중 초기 상태를 리셋하기 위한 유틸리티
 */
export const clearEditorLocalStorage = () => {
  if (typeof window !== 'undefined') {
    // Editor store 관련 데이터 삭제
    localStorage.removeItem('canvas-studio-editor');

    // 전체 localStorage 클리어가 필요하면:
    // localStorage.clear();

    console.log('Editor localStorage cleared');
  }
};