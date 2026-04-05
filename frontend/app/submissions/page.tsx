'use client'

import { useQuery } from '@tanstack/react-query'
import { getSubmissions } from '@/lib/api'
import Link from 'next/link'
import { FileText, Upload, ChevronRight, CheckCircle, Clock, AlertCircle, ArrowLeft, Sparkles, Search, Trophy, TrendingUp } from 'lucide-react'
import { formatDateTime, getScoreClass } from '@/lib/utils'
import { useState } from 'react'
import { useLanguage } from '@/lib/i18n'

export default function SubmissionsPage() {
  const { t } = useLanguage()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      const response = await getSubmissions()
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-pink-50">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">😕</span>
          </div>
          <p className="text-red-600 font-medium">{t('errorLoading')}</p>
        </div>
      </div>
    )
  }

  const submissions = data?.submissions || []

  // Filter submissions
  const filteredSubmissions = submissions.filter((item: any) => {
    const matchesSearch = item.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.exam?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'corrected' && item.score !== null) ||
                          (statusFilter === 'pending' && item.score === null)
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const correctedCount = submissions.filter((s: any) => s.score !== null).length
  const avgScore = submissions.length > 0 
    ? submissions.reduce((acc: number, s: any) => acc + (s.score || 0), 0) / submissions.length 
    : 0

  const getStatusBadge = (submission: any) => {
    if (submission.score !== null && submission.score !== undefined) {
      const scoreClass = getScoreClass(submission.score)
      return (
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold
                         ${submission.score >= 80 
                           ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700' 
                           : submission.score >= 60 
                             ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                             : submission.score >= 40
                               ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700'
                               : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'}`}>
          {submission.score.toFixed(1)}%
        </span>
      )
    }
    
    switch (submission.submission?.status) {
      case 'corrected':
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700">{t('completed')}</span>
      case 'pending':
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700">{t('pending')}</span>
      default:
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700">{t('inProgress')}</span>
    }
  }

  const getStatusIcon = (submission: any) => {
    if (submission.score !== null && submission.score !== undefined) {
      return (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 
                        flex items-center justify-center shadow-md shadow-emerald-500/20">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      )
    }
    
    switch (submission.submission?.status) {
      case 'corrected':
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 
                          flex items-center justify-center shadow-md shadow-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )
      case 'pending':
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 
                          flex items-center justify-center shadow-md shadow-yellow-500/20">
            <Clock className="w-4 h-4 text-white" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 
                          flex items-center justify-center shadow-md shadow-blue-500/20">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                href="/" 
                className="group flex items-center gap-2 px-4 py-2 rounded-xl
                           bg-white/50 hover:bg-white/80 border border-white/50
                           text-gray-600 hover:text-emerald-600 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium">{t('back')}</span>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 
                                  flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-gray-900 
                                   bg-clip-text text-transparent">
                      {t('submissions')}
                    </h1>
                    <p className="text-gray-500 text-sm">{t('manageSubmissions')}</p>
                  </div>
                </div>
              </div>
            </div>
            <Link 
              href="/submissions/new" 
              className="group relative overflow-hidden px-6 py-3 rounded-xl
                         bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600
                         bg-[length:200%_100%] hover:bg-right
                         text-white font-semibold shadow-lg shadow-emerald-500/30
                         hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5
                         transition-all duration-300 flex items-center gap-2"
            >
              <Upload className="w-5 h-5 transition-transform group-hover:scale-110 duration-300" />
              <span>{t('uploadSubmission')}</span>
              <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {submissions.length === 0 ? (
          <div className="glass-card overflow-hidden">
            <div className="relative p-12 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 
                              bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl 
                                bg-gradient-to-br from-emerald-100 to-teal-100 
                                flex items-center justify-center">
                  <FileText className="w-12 h-12 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('noSubmissions')}</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {t('uploadFirstSubmission')}
                </p>
                <Link 
                  href="/submissions/new" 
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl
                             bg-gradient-to-r from-emerald-600 to-teal-600
                             text-white font-semibold shadow-lg shadow-emerald-500/30
                             hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1
                             transition-all duration-300"
                >
                  <Upload className="w-5 h-5" />
                  {t('uploadSubmission')}
                  <Sparkles className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 
                                flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
                  <p className="text-sm text-gray-500">{t('submissions')}</p>
                </div>
              </div>
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 
                                flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{correctedCount}</p>
                  <p className="text-sm text-gray-500">{t('corrected')}</p>
                </div>
              </div>
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 
                                flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{avgScore.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">{t('averageScore')}</p>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="glass-card p-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 
                               bg-white/50 focus:bg-white focus:border-emerald-300 
                               focus:ring-4 focus:ring-emerald-500/10 
                               transition-all duration-300 outline-none"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-200 bg-white/50
                             focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10
                             transition-all duration-300 outline-none font-medium text-gray-700"
                >
                  <option value="all">{t('allStatuses')}</option>
                  <option value="corrected">{t('corrected')}</option>
                  <option value="pending">{t('pending')}</option>
                </select>
              </div>
            </div>

            {/* Submissions List */}
            <div className="glass-card overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('students')}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('exams')}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('date')}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('status')}</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSubmissions.map((item: any, index: number) => (
                      <tr 
                        key={item.submission?.id} 
                        className="group hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 
                                   transition-all duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 
                                            flex items-center justify-center shadow-md shadow-emerald-500/20
                                            group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                              <span className="text-white font-bold">
                                {item.student?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-emerald-700 
                                            transition-colors duration-300">
                                {item.student?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500 px-2 py-0.5 rounded-md bg-gray-100 w-fit font-mono">
                                #{item.student?.student_number}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{item.exam?.title || 'Unknown'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500">
                            {item.submission?.submitted_at
                              ? formatDateTime(item.submission.submitted_at)
                              : t('noDate')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(item)}
                            {getStatusBadge(item)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/submissions/${item.submission?.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                                       bg-gradient-to-r from-emerald-50 to-teal-50
                                       hover:from-emerald-100 hover:to-teal-100
                                       text-emerald-700 font-semibold
                                       transition-all duration-300 group/link"
                          >
                            <span>{t('viewCorrection')}</span>
                            <ChevronRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
