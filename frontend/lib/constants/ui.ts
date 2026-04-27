import { BookOpen, Users, FileText, CheckCircle, BarChart3, Network, Brain, FileSearch, TrendingUp, Target, GitBranch, PieChart } from 'lucide-react';

export const STAT_CARDS_CONFIG = [
  { key: 'totalExams', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'totalStudents', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'submissions', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'corrected', icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
];

export const NAV_ITEMS_CONFIG = [
  { titleKey: 'exams', descriptionKey: 'examsDescription', icon: BookOpen, href: '/exams', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { titleKey: 'students', descriptionKey: 'studentsDescription', icon: Users, href: '/students', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { titleKey: 'submissionsNav', descriptionKey: 'submissionsDescription', icon: FileText, href: '/submissions', color: 'text-blue-600', bg: 'bg-blue-50' },
  { titleKey: 'corrections', descriptionKey: 'correctionsDescription', icon: CheckCircle, href: '/corrections', color: 'text-amber-600', bg: 'bg-amber-50' },
  { titleKey: 'statistics', descriptionKey: 'statisticsDescription', icon: BarChart3, href: '/statistics', color: 'text-purple-600', bg: 'bg-purple-50' },
  { titleKey: 'graphExplorer', descriptionKey: 'graphExplorerDescription', icon: Network, href: '/graph', color: 'text-slate-600', bg: 'bg-slate-100' },
];

export const FEATURES_CONFIG = [
  { icon: Brain, titleKey: 'aiPoweredCorrection', descKey: 'aiPoweredCorrectionDescription' },
  { icon: FileSearch, titleKey: 'ocrSupport', descKey: 'ocrSupportDescription' },
  { icon: TrendingUp, titleKey: 'stepByStepSolutions', descKey: 'stepByStepSolutionsDescription' },
  { icon: Target, titleKey: 'skillAnalysis', descKey: 'skillAnalysisDescription' },
  { icon: GitBranch, titleKey: 'graphDatabase', descKey: 'graphDatabaseDescription' },
  { icon: PieChart, titleKey: 'analyticsDashboard', descKey: 'analyticsDashboardDescription' },
];
