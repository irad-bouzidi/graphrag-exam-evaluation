import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/formatters';
import {
  Home,
  FileText,
  Users,
  Upload,
  GitBranch,
  BarChart3,
  GraduationCap,
  CheckCircle,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC<{ location: any }> = ({ location }) => {
  const pathname = location?.pathname || '/';

  const navigationItems: NavItem[] = [
    { name: 'Accueil', href: '/', icon: Home },
    { name: 'Examens', href: '/exams', icon: FileText },
    { name: 'Élèves', href: '/students', icon: Users },
    { name: 'Soumissions', href: '/submissions', icon: Upload },
    { name: 'Explorateur', href: '/graph', icon: GitBranch },
    { name: 'Statistiques', href: '/statistics', icon: BarChart3 },
  ];

  const isActive = (itemHref: string) =>
    pathname === itemHref ||
    (itemHref !== '/' && pathname.startsWith(itemHref));

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-800">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div className="ml-3">
          <span className="text-lg font-semibold text-white">
            ExamEval
          </span>
          <p className="text-xs text-slate-400">Enterprise</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Menu
        </p>
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-300">Système de correction</p>
          <p className="text-xs text-slate-500 mt-0.5">Mathématiques Grade 6</p>
        </div>
      </div>
    </div>
  );
};
