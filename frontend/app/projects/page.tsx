import Container from '@/components/Layout/Container';
import Header from '@/components/Layout/Header';

export default function ProjectsPage() {
  const projects = [
    { id: 1, name: 'Q4 마케팅 캠페인', type: 'brochure', status: 'in_progress', assets: 24 },
    { id: 2, name: 'SNS 콘텐츠 패키지', type: 'sns', status: 'completed', assets: 45 },
    { id: 3, name: '제품 프레젠테이션', type: 'ppt', status: 'draft', assets: 12 },
    { id: 4, name: '브랜드 가이드라인', type: 'document', status: 'in_progress', assets: 8 },
  ];

  return (
    <>
      <Header
        title="프로젝트"
        description="모든 마케팅 프로젝트를 한눈에 관리하세요"
        action={
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            새 프로젝트
          </button>
        }
      />

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.status === 'completed' ? 'bg-green-100 text-green-700' :
                    project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status === 'completed' ? '완료' :
                     project.status === 'in_progress' ? '진행중' : '초안'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📁</span>
                    <span>{project.type}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🖼️</span>
                    <span>{project.assets}개 에셋</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    열기 →
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Project Card */}
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
            <div className="p-6 h-full flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4">➕</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                새 프로젝트
              </h3>
              <p className="text-sm text-gray-600">
                클릭하여 프로젝트를 만드세요
              </p>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
