import Container from '@/components/Layout/Container';
import Header from '@/components/Layout/Header';
import AssetUpload from '@/components/AssetUpload';

export default function AssetsPage() {
  return (
    <>
      <Header
        title="에셋 라이브러리"
        description="마케팅 자료를 업로드하고 관리하세요"
      />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <AssetUpload />
          </div>

          {/* Sidebar - Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">통계</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">총 에셋</span>
                  <span className="text-lg font-bold">145</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">이미지</span>
                  <span className="text-lg font-bold">98</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">비디오</span>
                  <span className="text-lg font-bold">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">텍스트</span>
                  <span className="text-lg font-bold">24</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 팁
              </h3>
              <p className="text-sm text-blue-700">
                업로드된 에셋은 자동으로 AI가 분석하여 태그를 생성합니다.
                브랜드 컬러와 스타일을 학습하여 더 나은 콘텐츠를 제작할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon - Asset List */}
        <div className="mt-8 bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            에셋 목록 (준비 중)
          </h3>
          <p className="text-gray-600">
            Backend API 연동 후 업로드된 에셋 목록이 여기에 표시됩니다.
          </p>
        </div>
      </Container>
    </>
  );
}
