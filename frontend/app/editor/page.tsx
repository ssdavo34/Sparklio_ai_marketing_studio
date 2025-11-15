import Container from '@/components/Layout/Container';
import Header from '@/components/Layout/Header';

export default function EditorPage() {
  return (
    <>
      <Header
        title="Editor"
        description="AI 기반 비주얼 에디터"
      />

      <Container>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-6">✏️</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Editor 준비 중
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Fabric.js 기반의 고급 에디터가 곧 준비됩니다.
            자연어 명령으로 비주얼 콘텐츠를 편집할 수 있습니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-semibold mb-2">Canvas 편집</h3>
              <p className="text-sm text-gray-600">
                드래그앤드롭으로 요소를 배치하고 편집하세요
              </p>
            </div>

            <div className="p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-semibold mb-2">자연어 명령</h3>
              <p className="text-sm text-gray-600">
                "제목을 크게"와 같은 명령으로 즉시 편집
              </p>
            </div>

            <div className="p-6 bg-green-50 rounded-lg">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold mb-2">AI 지원</h3>
              <p className="text-sm text-gray-600">
                EditorAgent가 최적의 디자인을 제안합니다
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm text-gray-500">
              구현 예정: Phase 3 (2-3주)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              참고: <a href="/docs/EDITOR_ENGINE_IMPLEMENTATION.md" className="text-blue-600 hover:underline">
                EDITOR_ENGINE_IMPLEMENTATION.md
              </a>
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
