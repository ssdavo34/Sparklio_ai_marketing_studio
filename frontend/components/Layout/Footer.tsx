export default function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="text-sm text-gray-500">
            &copy; 2025 Sparklio AI Marketing Studio. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                문서
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                지원
              </a>
              <a href="/test" className="text-sm text-gray-500 hover:text-gray-900">
                API 테스트
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
