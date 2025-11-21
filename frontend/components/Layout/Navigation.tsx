/**
 * Main Navigation Component
 *
 * Unified navigation for all Sparklio pages
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-21
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  Sparkles,
  Users,
  Palette,
  Settings,
} from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Spark Chat', href: '/spark', icon: Sparkles },
  { name: 'Meeting AI', href: '/meeting', icon: Users },
  { name: 'Studio', href: '/studio', icon: Palette },
  { name: 'Admin', href: '/admin', icon: Settings },
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
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
