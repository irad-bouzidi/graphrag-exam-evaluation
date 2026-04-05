'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getExam } from '@/lib/api'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function ExamDetailPage() {
  const params = useParams()
  const examId = params.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const response = await getExam(examId)
      return response.data.exam
    },
    enabled: Boolean(examId),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading exam...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-slate-700 font-medium">Unable to load this exam.</p>
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to exams
          </Link>
        </div>
      </div>
    )
  }

  const questions = data.questions || []

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/exams"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{data.title}</h1>
                <p className="text-slate-500 text-sm">Exam details and questions</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100">
              <Target className="w-4 h-4" />
              <span className="text-sm">Grade {data.grade_level}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{data.duration_minutes} min</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-slate-500 text-sm">Subject</p>
              <p className="text-slate-900 font-semibold capitalize">{data.subject}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-slate-500 text-sm">Total points</p>
              <p className="text-slate-900 font-semibold">{data.total_points}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-slate-500 text-sm">Created</p>
              <p className="text-slate-900 font-semibold">
                {data.created_at ? formatDate(data.created_at) : 'N/A'}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-slate-500 text-sm">Status</p>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                {data.status || 'draft'}
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
                <span className="ml-auto text-sm text-slate-500">{questions.length} total</span>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No questions found for this exam.</div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q: any, idx: number) => (
                    <div
                      key={q.id || idx}
                      className="rounded-lg border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold">
                            Q{q.number || idx + 1}
                          </span>
                          <span className="text-slate-500 text-sm capitalize">{q.type || 'question'}</span>
                        </div>
                        <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                          {q.points || 0} pts
                        </span>
                      </div>
                      <p className="text-slate-900 whitespace-pre-line">{q.text}</p>
                      {q.correct_answer && (
                        <div className="mt-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-800">Answer:</span>{' '}
                          <span className="font-mono">{q.correct_answer}</span>
                        </div>
                      )}
                      {q.skills?.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {q.skills.map((skill: string, i: number) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
