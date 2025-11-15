export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">
          Sparklio AI Marketing Studio
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Frontend Development Starting Point
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Phase 1</h2>
            <p className="text-sm text-gray-600">
              Next.js 설정, API Client, 인증, 기본 레이아웃
            </p>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Phase 2</h2>
            <p className="text-sm text-gray-600">
              프로젝트 관리 UI, Editor 기본, Asset Library
            </p>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Phase 3</h2>
            <p className="text-sm text-gray-600">
              Editor 고급 기능, Workflow 통합, Export
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
