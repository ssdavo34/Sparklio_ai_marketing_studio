'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: '홈', href: '/', icon: '🏠' },
  { name: '대시보드', href: '/dashboard', icon: '📊' },
  { name: '프로젝트', href: '/projects', icon: '📁' },
  { name: '에셋', href: '/assets', icon: '🖼️' },
  { name: 'Editor', href: '/editor', icon: '✏️' },
  { name: '테스트', href: '/test', icon: '🧪' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Sparklio</span>
              <span className="ml-2 text-sm text-gray-500">AI Marketing Studio</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <button className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
              로그인
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
