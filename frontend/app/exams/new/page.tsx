'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createExam, Question } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Plus, Trash2, Save, BookOpen, ArrowLeft, Sparkles, Clock, Target, FileQuestion, Lightbulb, GraduationCap } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

const TOPICS = [
  { value: 'numbers_operations', label: 'Numbers & Operations' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'measurement', label: 'Measurement' },
  { value: 'problem_solving', label: 'Problem Solving' },
  { value: 'ratios_proportions', label: 'Ratios & Proportions' },
]

const QUESTION_TYPES = [
  { value: 'calculation', label: 'Calculation' },
  { value: 'word_problem', label: 'Word Problem' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'true_false', label: 'True/False' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
]

const SKILLS = [
  'addition', 'subtraction', 'multiplication', 'division',
  'fractions', 'decimals', 'percentages', 'equations',
  'geometry', 'measurement', 'problem_solving', 'estimation',
]

interface QuestionForm {
  text: string
  type: string
  correct_answer: string
  points: number
  topic: string
  skills: string[]
}

export default function NewExamPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [gradeLevel, setGradeLevel] = useState(6)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [questions, setQuestions] = useState<QuestionForm[]>([])

  const createMutation = useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Exam created successfully!')
      router.push('/exams')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create exam')
    },
  })

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'calculation',
        correct_answer: '',
        points: 1,
        topic: 'numbers_operations',
        skills: [],
      },
    ])
  }

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const toggleSkill = (index: number, skill: string) => {
    const updated = [...questions]
    const skills = updated[index].skills
    if (skills.includes(skill)) {
      updated[index].skills = skills.filter((s) => s !== skill)
    } else {
      updated[index].skills = [...skills, skill]
    }
    setQuestions(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim() || !questions[i].correct_answer.trim()) {
        toast.error(`Please complete question ${i + 1}`)
        return
      }
    }

    createMutation.mutate({
      title,
      grade_level: gradeLevel,
      subject: 'mathematics',
      duration_minutes: durationMinutes,
      questions,
    } as any)
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                href="/exams" 
                className="group flex items-center gap-2 px-4 py-2 rounded-xl
                           bg-white/50 hover:bg-white/80 border border-white/50
                           text-gray-600 hover:text-purple-600 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium">{t('back')}</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 
                                flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 
                               bg-clip-text text-transparent">
                  {t('createNewExam')}
                </h1>
              </div>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">{t('totalPoints')}:</span>
              <span className="font-bold text-purple-700">{totalPoints}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="relative max-w-4xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit}>
          {/* Exam Details */}
          <div className="glass-card overflow-hidden mb-8">
            <div className="h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 
                              flex items-center justify-center">
                <FileQuestion className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-bold text-gray-900">{t('examTitle')}</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('examTitle')}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 
                             bg-white/50 focus:bg-white focus:border-purple-300 
                             focus:ring-4 focus:ring-purple-500/10 
                             transition-all duration-300 outline-none"
                  placeholder="e.g., Math Test - Chapter 5"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  {t('gradeLevel')}
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 
                             bg-white/50 focus:bg-white focus:border-purple-300 
                             focus:ring-4 focus:ring-purple-500/10 
                             transition-all duration-300 outline-none"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {t('examDuration')} ({t('min')})
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 
                             bg-white/50 focus:bg-white focus:border-purple-300 
                             focus:ring-4 focus:ring-purple-500/10 
                             transition-all duration-300 outline-none"
                  min={15}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 
                             bg-gray-50 text-gray-500 cursor-not-allowed"
                  value="Mathematics"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 
                                flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t('examQuestions')} ({questions.length})</h2>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-gradient-to-r from-indigo-500 to-purple-500
                           text-white font-semibold shadow-lg shadow-indigo-500/30
                           hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5
                           transition-all duration-300"
              >
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="glass-card overflow-hidden">
                <div className="relative p-12 text-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 
                                  bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl 
                                    bg-gradient-to-br from-indigo-100 to-purple-100 
                                    flex items-center justify-center">
                      <Lightbulb className="w-10 h-10 text-indigo-400" />
                    </div>
                    <p className="text-gray-500 mb-6">No questions added yet</p>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                                 bg-gradient-to-r from-purple-600 to-pink-600
                                 text-white font-semibold shadow-lg shadow-purple-500/30
                                 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1
                                 transition-all duration-300"
                    >
                      <Plus className="w-5 h-5" />
                      Add First Question
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className="glass-card overflow-hidden 
                                               hover:shadow-xl hover:shadow-purple-500/10 
                                               transition-all duration-300">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 
                                        flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-900">Question {index + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="group w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100
                                   flex items-center justify-center transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                      </button>
                    </div>
                    <div className="p-6 space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Question Text
                        </label>
                        <textarea
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 
                                     bg-white/50 focus:bg-white focus:border-purple-300 
                                     focus:ring-4 focus:ring-purple-500/10 
                                     transition-all duration-300 outline-none min-h-[100px] resize-none"
                          placeholder="Enter the question..."
                          value={question.text}
                          onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Type
                          </label>
                          <select
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 
                                       bg-white/50 focus:bg-white focus:border-purple-300 
                                       focus:ring-4 focus:ring-purple-500/10 
                                       transition-all duration-300 outline-none"
                            value={question.type}
                            onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                          >
                            {QUESTION_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Topic
                          </label>
                          <select
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 
                                       bg-white/50 focus:bg-white focus:border-purple-300 
                                       focus:ring-4 focus:ring-purple-500/10 
                                       transition-all duration-300 outline-none"
                            value={question.topic}
                            onChange={(e) => updateQuestion(index, 'topic', e.target.value)}
                          >
                            {TOPICS.map((topic) => (
                              <option key={topic.value} value={topic.value}>
                                {topic.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {t('points')}
                          </label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 
                                       bg-white/50 focus:bg-white focus:border-purple-300 
                                       focus:ring-4 focus:ring-purple-500/10 
                                       transition-all duration-300 outline-none"
                            min={1}
                            max={20}
                            value={question.points}
                            onChange={(e) => updateQuestion(index, 'points', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {t('correctAnswer')}
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 
                                       bg-white/50 focus:bg-white focus:border-purple-300 
                                       focus:ring-4 focus:ring-purple-500/10 
                                       transition-all duration-300 outline-none"
                            placeholder="Answer"
                            value={question.correct_answer}
                            onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Skills Tested
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {SKILLS.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(index, skill)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-full 
                                          transition-all duration-300 ${
                                question.skills.includes(skill)
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20'
                                  : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'
                              }`}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="glass-card p-6 flex items-center justify-end gap-4">
            <Link 
              href="/exams" 
              className="px-6 py-3 rounded-xl border border-gray-200 bg-white/50
                         text-gray-700 font-semibold hover:bg-white hover:border-gray-300
                         transition-all duration-300"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="group relative overflow-hidden px-8 py-3 rounded-xl
                         bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600
                         bg-[length:200%_100%] hover:bg-right
                         text-white font-semibold shadow-lg shadow-purple-500/30
                         hover:shadow-xl hover:shadow-purple-500/40
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300 flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('createExam')}
                  <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
