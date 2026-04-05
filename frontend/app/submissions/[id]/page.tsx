'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSubmission, correctSubmission, getCorrection } from '@/lib/api'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Sparkles,
  FileText,
  User,
  BookOpen
} from 'lucide-react'
import { formatDateTime, getScoreClass, getScoreLabel } from '@/lib/utils'

export default function SubmissionDetailPage() {
  const params = useParams()
  const submissionId = params.id as string
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: async () => {
      const response = await getSubmission(submissionId)
      return response.data.submission
    },
  })

  const correctionMutation = useMutation({
    mutationFn: () => correctSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] })
      toast.success('Submission corrected successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to correct submission')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error loading submission</div>
      </div>
    )
  }

  const submission = data
  const correction = submission.correction

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/submissions" className="text-gray-400 hover:text-gray-600">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Submission Details</h1>
                <p className="text-gray-500">
                  {submission.exam?.title || 'Unknown Exam'}
                </p>
              </div>
            </div>
            {!correction && (
              <button
                onClick={() => correctionMutation.mutate()}
                disabled={correctionMutation.isPending}
                className="btn btn-primary"
              >
                {correctionMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Correcting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Correct with AI
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="space-y-6">
            {/* Student Info */}
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                Student
              </div>
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 text-xl font-bold">
                      {submission.student?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {submission.student?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      #{submission.student?.student_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {submission.student?.class_name} • Grade {submission.student?.grade_level}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Info */}
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-400" />
                Exam
              </div>
              <div className="card-body">
                <p className="font-semibold text-gray-900">
                  {submission.exam?.title || 'Unknown'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Grade {submission.exam?.grade_level} • {submission.exam?.subject}
                </p>
              </div>
            </div>

            {/* Submission Info */}
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Submission
              </div>
              <div className="card-body space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`badge ${
                    submission.status === 'corrected' 
                      ? 'badge-success' 
                      : 'badge-warning'
                  }`}>
                    {submission.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted</span>
                  <span className="text-gray-900 text-sm">
                    {submission.submitted_at 
                      ? formatDateTime(submission.submitted_at)
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Answers</span>
                  <span className="text-gray-900">
                    {submission.answers?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Card (if corrected) */}
            {correction && (
              <div className="card">
                <div className="card-header">Score</div>
                <div className="card-body text-center">
                  <div className={`text-5xl font-bold ${getScoreClass(correction.percentage)}`}>
                    {correction.percentage.toFixed(1)}%
                  </div>
                  <p className="text-gray-500 mt-2">
                    {correction.earned_points} / {correction.total_points} points
                  </p>
                  <span className={`badge mt-2 ${
                    correction.percentage >= 50 ? 'badge-success' : 'badge-error'
                  }`}>
                    {getScoreLabel(correction.percentage)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Correction Details */}
          <div className="lg:col-span-2">
            {correction ? (
              <div className="space-y-4">
                {/* Overall Feedback */}
                {correction.feedback && (
                  <div className="card">
                    <div className="card-header">Overall Feedback</div>
                    <div className="card-body">
                      <p className="text-gray-700">{correction.feedback}</p>
                    </div>
                  </div>
                )}

                {/* Question by Question */}
                <div className="card">
                  <div className="card-header">Question Corrections</div>
                  <div className="card-body space-y-6">
                    {correction.question_corrections?.map((qc: any, index: number) => (
                      <div 
                        key={qc.id || index}
                        className={`p-4 rounded-lg border-l-4 ${
                          qc.is_correct
                            ? 'bg-green-50 border-green-500'
                            : qc.points_earned > 0
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-red-50 border-red-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {qc.is_correct ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : qc.points_earned > 0 ? (
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="font-medium">Question {index + 1}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {qc.points_earned} / {qc.points_possible} pts
                          </span>
                        </div>

                        {/* Question text */}
                        {qc.question && (
                          <p className="text-gray-700 mb-3">{qc.question.text}</p>
                        )}

                        {/* Answers comparison */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Student's Answer</p>
                            <p className="font-mono bg-white px-2 py-1 rounded text-sm">
                              {qc.student_answer || '(no answer)'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Correct Answer</p>
                            <p className="font-mono bg-white px-2 py-1 rounded text-sm text-green-700">
                              {qc.correct_answer}
                            </p>
                          </div>
                        </div>

                        {/* Feedback */}
                        {qc.feedback && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 uppercase mb-1">Feedback</p>
                            <p className="text-sm text-gray-700">{qc.feedback}</p>
                          </div>
                        )}

                        {/* Step by step solution */}
                        {qc.step_by_step_solution && (
                          <div className="bg-white rounded p-3">
                            <p className="text-xs text-gray-500 uppercase mb-2">
                              Step-by-Step Solution
                            </p>
                            <div className="text-sm text-gray-700 whitespace-pre-line">
                              {qc.step_by_step_solution}
                            </div>
                          </div>
                        )}

                        {/* Error types */}
                        {qc.error_types?.length > 0 && (
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {qc.error_types.map((error: string, i: number) => (
                              <span key={i} className="badge badge-error text-xs">
                                {error.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Not Corrected Yet</h3>
                  <p className="text-gray-500 mt-1">
                    Click "Correct with AI" to get detailed feedback and scoring.
                  </p>
                  <button
                    onClick={() => correctionMutation.mutate()}
                    disabled={correctionMutation.isPending}
                    className="btn btn-primary mt-4"
                  >
                    {correctionMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Correcting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Correct with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
