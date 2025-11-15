import Link from 'next/link';
import Container from '@/components/Layout/Container';

export default function Home() {
  const features = [
    {
      icon: '🎨',
      title: 'AI 기반 디자인',
      description: '자연어 명령으로 전문적인 마케팅 자료를 즉시 생성하세요',
      link: '/editor',
    },
    {
      icon: '📁',
      title: '프로젝트 관리',
      description: '모든 마케팅 캠페인을 한곳에서 체계적으로 관리하세요',
      link: '/projects',
    },
    {
      icon: '🖼️',
      title: '에셋 라이브러리',
      description: '마케팅 자료를 업로드하고 AI가 자동으로 분류합니다',
      link: '/assets',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <Container className="py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              AI로 만드는 마케팅 콘텐츠
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              브로셔, SNS 이미지, 프레젠테이션까지
              <br />
              자연어 명령만으로 전문적인 결과물을 만들어보세요
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                시작하기
              </Link>
              <Link
                href="/test"
                className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                API 테스트
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            주요 기능
          </h2>
          <p className="text-lg text-gray-600">
            Sparklio가 제공하는 강력한 기능들을 살펴보세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.link}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </Container>

      {/* CTA Section */}
      <div className="bg-gray-100">
        <Container className="py-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              무료로 Sparklio AI Marketing Studio를 경험해보세요
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              대시보드로 이동
            </Link>
          </div>
        </Container>
      </div>
    </>
  );
}
