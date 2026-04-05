'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadExamTemplate } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  FileUp,
  Eye,
  BookOpen,
  Settings
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

interface ExtractedQuestion {
  number: number
  text: string
  type: string
  correct_answer: string
  points: number
  skills: string[]
  topic: string
}

interface ExtractionResult {
  success: boolean
  extracted_text: string
  exam_data: {
    title: string
    grade_level: number
    duration_minutes: number
    total_points: number
    questions: ExtractedQuestion[]
  }
  created_exam?: {
    id: string
    title: string
  }
  metadata: {
    filename: string
    content_type: string
    file_size: number
    questions_found: number
  }
}

export default function UploadExamPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [gradeLevel, setGradeLevel] = useState(6)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [autoCreate, setAutoCreate] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('grade_level', gradeLevel.toString())
      formData.append('subject', 'mathematics')
      formData.append('duration_minutes', durationMinutes.toString())
      formData.append('auto_create', autoCreate.toString())
      
      const response = await uploadExamTemplate(formData)
      return response.data as ExtractionResult
    },
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      
      if (data.created_exam) {
        toast.success(`Exam created with ${data.metadata.questions_found} questions!`)
      } else {
        toast.success('Document processed successfully!')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to process document')
    },
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (isValidFileType(droppedFile)) {
        setFile(droppedFile)
        setResult(null)
      } else {
        toast.error('Invalid file type. Please upload PDF, JPEG, PNG, or TIFF')
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile)
        setResult(null)
      } else {
        toast.error('Invalid file type. Please upload PDF, JPEG, PNG, or TIFF')
      }
    }
  }

  const isValidFileType = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
    return validTypes.includes(file.type)
  }

  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12 text-gray-400" />
    if (file.type === 'application/pdf') return <FileText className="w-12 h-12 text-red-500" />
    return <ImageIcon className="w-12 h-12 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/exams" 
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('back')}</span>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <FileUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    Upload Exam
                  </h1>
                  <p className="text-sm text-slate-500">Extract questions from PDF or image</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : file
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-300 bg-white hover:border-indigo-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.tiff"
                onChange={handleFileChange}
              />
              
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <div className={`p-4 rounded-full mb-4 ${file ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  {getFileIcon()}
                </div>
                
                {file ? (
                  <div className="text-center">
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-emerald-600 mt-2 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Ready to process
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-medium text-slate-700">
                      Drop your exam file here
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      or click to browse
                    </p>
                    <p className="text-xs text-slate-400 mt-3">
                      Supports PDF, JPEG, PNG, TIFF
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Options */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
              <h3 className="font-medium text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                Extraction Options
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Exam Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Math Test - Chapter 5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Grade Level
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                    min={15}
                    max={180}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto-create"
                  checked={autoCreate}
                  onChange={(e) => setAutoCreate(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="auto-create" className="text-sm text-slate-700">
                  Automatically create exam after extraction
                </label>
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => uploadMutation.mutate()}
              disabled={!file || uploadMutation.isPending}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                !file || uploadMutation.isPending
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Extract Questions
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {result ? (
              <>
                {/* Success Banner */}
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  result.created_exam ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'
                }`}>
                  {result.created_exam ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-blue-600" />
                  )}
                  <div>
                    <p className={`font-medium ${result.created_exam ? 'text-emerald-800' : 'text-blue-800'}`}>
                      {result.created_exam ? 'Exam Created Successfully!' : 'Extraction Complete'}
                    </p>
                    <p className={`text-sm ${result.created_exam ? 'text-emerald-600' : 'text-blue-600'}`}>
                      Found {result.metadata.questions_found} questions
                    </p>
                  </div>
                </div>

                {/* Extracted Questions */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Extracted Questions
                    </h3>
                    <span className="text-sm text-slate-500">
                      Total: {result.exam_data.total_points} points
                    </span>
                  </div>
                  
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
                    {result.exam_data.questions.map((question, index) => (
                      <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-medium flex items-center justify-center text-sm">
                            {question.number}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-900">{question.text}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                {question.type}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                {question.points} pt{question.points > 1 ? 's' : ''}
                              </span>
                              {question.correct_answer && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">
                                  Answer: {question.correct_answer}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {question.skills.map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OCR Text Preview */}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full py-2 px-4 text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Show'} OCR Text
                </button>
                
                {showPreview && (
                  <div className="bg-slate-50 rounded-lg p-4 max-h-60 overflow-y-auto border border-slate-200">
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
                      {result.extracted_text}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {result.created_exam ? (
                    <Link
                      href={`/exams/${result.created_exam.id}`}
                      className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-center transition-colors"
                    >
                      View Exam
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        toast.success('Manual creation coming soon!')
                      }}
                      className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-center transition-colors"
                    >
                      Create Exam
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setFile(null)
                      setResult(null)
                    }}
                    className="py-2.5 px-4 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    Upload Another
                  </button>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Upload an Exam Document
                </h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Our AI will automatically extract questions, answers, and metadata from your exam PDF or scanned image.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xl font-semibold text-indigo-600">1</p>
                    <p className="text-xs text-slate-500 mt-1">Upload File</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xl font-semibold text-indigo-600">2</p>
                    <p className="text-xs text-slate-500 mt-1">AI Extracts</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xl font-semibold text-indigo-600">3</p>
                    <p className="text-xs text-slate-500 mt-1">Review & Save</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
