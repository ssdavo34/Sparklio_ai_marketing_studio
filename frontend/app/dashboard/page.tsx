import Container from '@/components/Layout/Container';
import Header from '@/components/Layout/Header';

export default function DashboardPage() {
  const stats = [
    { label: '총 프로젝트', value: '12', change: '+2', icon: '📁' },
    { label: '생성된 에셋', value: '145', change: '+23', icon: '🖼️' },
    { label: '이번 달 사용', value: '89', change: '+12', icon: '📊' },
    { label: '저장된 템플릿', value: '34', change: '+5', icon: '📄' },
  ];

  const recentProjects = [
    { id: 1, name: 'Q4 마케팅 캠페인', type: 'brochure', status: 'in_progress', updated: '2시간 전' },
    { id: 2, name: 'SNS 콘텐츠 패키지', type: 'sns', status: 'completed', updated: '1일 전' },
    { id: 3, name: '제품 프레젠테이션', type: 'ppt', status: 'draft', updated: '3일 전' },
  ];

  return (
    <>
      <Header
        title="대시보드"
        description="Sparklio AI Marketing Studio에 오신 것을 환영합니다"
        action={
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            새 프로젝트
          </button>
        }
      />

      <Container>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} 이번 주</p>
                </div>
                <div className="text-4xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">최근 프로젝트</h2>
          </div>
          <div className="divide-y">
            {recentProjects.map((project) => (
              <div key={project.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-gray-500">{project.type}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status === 'completed' ? '완료' :
                         project.status === 'in_progress' ? '진행중' : '초안'}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{project.updated}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              모든 프로젝트 보기 →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">새 이미지 생성</h3>
            <p className="text-sm text-blue-100 mb-4">AI로 마케팅 이미지를 빠르게 생성하세요</p>
            <button className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 text-sm font-medium">
              시작하기
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">브로셔 만들기</h3>
            <p className="text-sm text-purple-100 mb-4">템플릿으로 전문적인 브로셔를 제작하세요</p>
            <button className="px-4 py-2 bg-white text-purple-600 rounded-md hover:bg-purple-50 text-sm font-medium">
              시작하기
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">에셋 라이브러리</h3>
            <p className="text-sm text-green-100 mb-4">모든 마케팅 자료를 한곳에서 관리하세요</p>
            <button className="px-4 py-2 bg-white text-green-600 rounded-md hover:bg-green-50 text-sm font-medium">
              둘러보기
            </button>
          </div>
        </div>
      </Container>
    </>
  );
}
