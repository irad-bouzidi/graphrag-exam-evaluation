'use client'

import { useQuery } from '@tanstack/react-query'
import { getHealthStats } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import Link from 'next/link'
import { 
  BookOpen, 
  Users, 
  FileText, 
  CheckCircle, 
  BarChart3, 
  Network,
  Upload,
  ArrowRight,
  Brain,
  FileSearch,
  TrendingUp,
  Target,
  GitBranch,
  PieChart,
  Plus
} from 'lucide-react'

export default function Home() {
  const { t } = useTranslation()
  
  const { data: stats } = useQuery({
    queryKey: ['health-stats'],
    queryFn: async () => {
      const response = await getHealthStats()
      return response.data
    },
  })

  const counts = stats?.counts || {}

  const statCards = [
    { label: t('totalExams'), value: counts.exams || 0, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t('totalStudents'), value: counts.students || 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('submissions'), value: counts.submissions || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('corrected'), value: counts.corrections || 0, icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const navItems = [
    { title: t('exams'), description: t('examsDescription'), icon: BookOpen, href: '/exams', count: counts.exams, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: t('students'), description: t('studentsDescription'), icon: Users, href: '/students', count: counts.students, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: t('submissionsNav'), description: t('submissionsDescription'), icon: FileText, href: '/submissions', count: counts.submissions, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: t('corrections'), description: t('correctionsDescription'), icon: CheckCircle, href: '/corrections', count: counts.corrections, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: t('statistics'), description: t('statisticsDescription'), icon: BarChart3, href: '/statistics', color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: t('graphExplorer'), description: t('graphExplorerDescription'), icon: Network, href: '/graph', color: 'text-slate-600', bg: 'bg-slate-100' },
  ]

  const features = [
    { icon: Brain, title: t('aiPoweredCorrection'), desc: t('aiPoweredCorrectionDescription') },
    { icon: FileSearch, title: t('ocrSupport'), desc: t('ocrSupportDescription') },
    { icon: TrendingUp, title: t('stepByStepSolutions'), desc: t('stepByStepSolutionsDescription') },
    { icon: Target, title: t('skillAnalysis'), desc: t('skillAnalysisDescription') },
    { icon: GitBranch, title: t('graphDatabase'), desc: t('graphDatabaseDescription') },
    { icon: PieChart, title: t('analyticsDashboard'), desc: t('analyticsDashboardDescription') },
  ]

  return (
    <main className="min-h-screen pb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-indigo-600 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">{t('quickActions')}</h2>
            <p className="text-indigo-200 text-sm">
              Start creating exams, adding students, or uploading submissions.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/exams/new"
              className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('createExam')}
            </Link>
            <Link
              href="/submissions/new"
              className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-400 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {t('uploadSubmission')}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('quickAccess')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white rounded-lg border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${item.bg}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                    {item.count !== undefined && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('features')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50">
              <div className="p-2 rounded-lg bg-indigo-100 w-fit mb-3">
                <feature.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-medium text-slate-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center">
        <p className="text-slate-400 text-sm">{t('footerText')}</p>
      </footer>
    </main>
  )
}
