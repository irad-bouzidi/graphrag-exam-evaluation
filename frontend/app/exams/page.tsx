'use client'

import { useQuery } from '@tanstack/react-query'
import { getExams } from '@/lib/api'
import Link from 'next/link'
import { BookOpen, Plus, ChevronRight, Clock, Target, GraduationCap, FileText, ArrowLeft, Upload } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

export default function ExamsPage() {
  const { t } = useLanguage()
  const { data, isLoading, error } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await getExams()
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-red-600 font-medium">{t('errorLoading')}</p>
        </div>
      </div>
    )
  }

  const exams = data?.exams || []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg
                           text-slate-600 hover:text-slate-900 hover:bg-slate-100
                           transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">{t('back')}</span>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">{t('exams')}</h1>
                  <p className="text-slate-500 text-sm">{t('manageExams')}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/exams/upload" 
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white
                           text-slate-700 font-medium hover:bg-slate-50
                           transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload PDF</span>
              </Link>
              <Link 
                href="/exams/new" 
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700
                           text-white font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t('createExam')}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {exams.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('noExams')}</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {t('createFirstExam')}
              </p>
              <Link 
                href="/exams/new" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                           bg-indigo-600 hover:bg-indigo-700 text-white font-medium
                           transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('createExam')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{exams.length}</p>
                  <p className="text-sm text-slate-500">{t('totalExams')}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {exams.reduce((acc: number, e: any) => acc + (e.questions?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-slate-500">{t('totalQuestions')}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {Array.from(new Set(exams.map((e: any) => e.grade_level))).length}
                  </p>
                  <p className="text-sm text-slate-500">{t('gradeLevels')}</p>
                </div>
              </div>
            </div>

            {/* Exams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam: any) => (
                <Link
                  key={exam.id}
                  href={`/exams/${exam.id}`}
                  className="group bg-white rounded-lg border border-slate-200 hover:border-indigo-300
                             hover:shadow-md transition-all"
                >
                  {/* Card Header */}
                  <div className="h-1 bg-indigo-600 rounded-t-lg" />
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 
                                       transition-colors line-clamp-2">
                          {exam.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Target className="w-4 h-4 text-slate-400" />
                            Grade {exam.grade_level}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {exam.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 
                                                group-hover:translate-x-0.5 transition-all" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                          {exam.questions?.length || 0} {t('questions')}
                        </span>
                        <span className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                          {exam.total_points} {t('points')}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {exam.created_at ? formatDate(exam.created_at) : t('noDate')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
