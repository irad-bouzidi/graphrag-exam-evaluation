'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getExams, getStudents, createSubmission, uploadSubmission } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Upload, FileText, Send } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

export default function NewSubmissionPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [examId, setExamId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [mode, setMode] = useState<'upload' | 'manual'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [manualAnswers, setManualAnswers] = useState<{ question_id: string; answer: string }[]>([])

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => (await getExams()).data,
  })

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: async () => (await getStudents()).data,
  })

  const selectedExam = examsData?.exams?.find((e: any) => e.id === examId)

  // Update manual answers when exam changes
  const updateAnswersForExam = (exam: any) => {
    if (exam?.questions) {
      setManualAnswers(
        exam.questions.map((q: any) => ({ question_id: q.id, answer: '' }))
      )
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'upload' && file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('exam_id', examId)
        formData.append('student_id', studentId)
        return uploadSubmission(formData)
      } else {
        return createSubmission({
          exam_id: examId,
          student_id: studentId,
          answers: manualAnswers.filter(a => a.answer.trim()),
        })
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      toast.success('Submission created successfully!')
      router.push(`/submissions/${data.data.submission.id}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create submission')
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!examId) {
      toast.error('Please select an exam')
      return
    }
    
    if (!studentId) {
      toast.error('Please select a student')
      return
    }
    
    if (mode === 'upload' && !file) {
      toast.error('Please upload a file')
      return
    }

    createMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/submissions" className="text-gray-400 hover:text-gray-600">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">New Submission</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          {/* Exam & Student Selection */}
          <div className="card mb-6">
            <div className="card-header">Select Exam & Student</div>
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam
                </label>
                <select
                  className="input"
                  value={examId}
                  onChange={(e) => {
                    setExamId(e.target.value)
                    const exam = examsData?.exams?.find((ex: any) => ex.id === e.target.value)
                    updateAnswersForExam(exam)
                  }}
                >
                  <option value="">Select an exam...</option>
                  {examsData?.exams?.map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} (Grade {exam.grade_level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  className="input"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  <option value="">Select a student...</option>
                  {studentsData?.students?.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.class_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'upload'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              <Upload className="w-5 h-5" />
              Upload Scanned Exam
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'manual'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5" />
              Enter Answers Manually
            </button>
          </div>

          {/* Upload Mode */}
          {mode === 'upload' && (
            <div className="card mb-6">
              <div className="card-header">Upload Student Exam</div>
              <div className="card-body">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : file
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-primary-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div>
                      <FileText className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {isDragActive
                          ? 'Drop the file here...'
                          : 'Drag & drop a scanned exam, or click to select'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Supports PDF and images (PNG, JPG)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && selectedExam && (
            <div className="card mb-6">
              <div className="card-header">Enter Student Answers</div>
              <div className="card-body space-y-4">
                {selectedExam.questions?.map((question: any, index: number) => (
                  <div key={question.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2">{question.text}</p>
                        <div className="flex items-center gap-4">
                          <input
                            type="text"
                            className="input flex-1"
                            placeholder="Student's answer"
                            value={manualAnswers[index]?.answer || ''}
                            onChange={(e) => {
                              const updated = [...manualAnswers]
                              updated[index] = {
                                question_id: question.id,
                                answer: e.target.value,
                              }
                              setManualAnswers(updated)
                            }}
                          />
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {question.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'manual' && !selectedExam && (
            <div className="card mb-6">
              <div className="card-body text-center py-8 text-gray-500">
                Select an exam to enter answers
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/submissions" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn btn-primary"
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Create Submission
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
