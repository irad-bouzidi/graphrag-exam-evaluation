import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/formatters';
import {
  Home,
  FileText,
  Users,
  Upload,
  GitBranch,
  BarChart3,
  CheckCircle,
} from 'lucide-react';

interface HeaderProps {
  appName?: string;
  appSubtitle?: string;
  connected?: boolean;
}

const navItems = [
  { name: 'Accueil', icon: Home, href: '/' },
  { name: 'Examens', icon: FileText, href: '/exams' },
  { name: 'Élèves', icon: Users, href: '/students' },
  { name: 'Soumissions', icon: Upload, href: '/submissions' },
  { name: 'Explorateur', icon: GitBranch, href: '/graph' },
  { name: 'Statistiques', icon: BarChart3, href: '/statistics' },
];

export const Header: React.FC<HeaderProps> = ({
  appName = 'ExamEval',
  appSubtitle = 'Système Enterprise',
  connected = true,
}) => {
  return (
    <header className="flex h-16 items-center justify-between bg-white px-6 border-b border-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{appName}</h2>
        <p className="text-sm text-slate-500">{appSubtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">École Primaire</p>
            <p className="text-xs text-slate-500">Class 6A</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            {connected ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
      </div>
    </header>
  );
};
