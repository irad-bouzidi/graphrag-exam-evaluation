'use client'

import { useQuery } from '@tanstack/react-query'
import { getStudents } from '@/lib/api'
import Link from 'next/link'
import { Users, Plus, ChevronRight, GraduationCap, Search, ArrowLeft, Sparkles, UserPlus, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/lib/i18n'

export default function StudentsPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await getStudents()
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600 animate-pulse" />
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

  const students = data?.students || []

  // Get unique classes
  const classes = Array.from(new Set(students.map((s: any) => s.class_name || 'Unassigned')))

  // Filter students
  const filteredStudents = students.filter((student: any) => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.student_number?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = selectedClass === 'all' || student.class_name === selectedClass
    return matchesSearch && matchesClass
  })

  // Group students by class
  const byClass = filteredStudents.reduce((acc: any, student: any) => {
    const className = student.class_name || 'Unassigned'
    if (!acc[className]) acc[className] = []
    acc[className].push(student)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl" />
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
                           text-gray-600 hover:text-blue-600 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium">{t('back')}</span>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 
                                  flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 
                                   bg-clip-text text-transparent">
                      {t('students')}
                    </h1>
                    <p className="text-gray-500 text-sm">{t('manageStudents')}</p>
                  </div>
                </div>
              </div>
            </div>
            <Link 
              href="/students/new" 
              className="group relative overflow-hidden px-6 py-3 rounded-xl
                         bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600
                         bg-[length:200%_100%] hover:bg-right
                         text-white font-semibold shadow-lg shadow-blue-500/30
                         hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5
                         transition-all duration-300 flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110 duration-300" />
              <span>{t('addStudent')}</span>
              <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {students.length === 0 ? (
          <div className="glass-card overflow-hidden">
            <div className="relative p-12 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 
                              bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl 
                                bg-gradient-to-br from-blue-100 to-cyan-100 
                                flex items-center justify-center">
                  <Users className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('noStudents')}</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {t('addFirstStudent')}
                </p>
                <Link 
                  href="/students/new" 
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl
                             bg-gradient-to-r from-blue-600 to-cyan-600
                             text-white font-semibold shadow-lg shadow-blue-500/30
                             hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1
                             transition-all duration-300"
                >
                  <UserPlus className="w-5 h-5" />
                  {t('addStudent')}
                  <Sparkles className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div className="glass-card p-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('searchStudents')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 
                               bg-white/50 focus:bg-white focus:border-blue-300 
                               focus:ring-4 focus:ring-blue-500/10 
                               transition-all duration-300 outline-none"
                  />
                </div>
                
                {/* Class Filter */}
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-200 bg-white/50
                             focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10
                             transition-all duration-300 outline-none font-medium text-gray-700"
                >
                  <option value="all">{t('allClasses')}</option>
                  {classes.map((className: string) => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 
                                flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                  <p className="text-sm text-gray-500">{t('totalStudents')}</p>
                </div>
              </div>
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 
                                flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                  <p className="text-sm text-gray-500">{t('class')}</p>
                </div>
              </div>
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 
                                flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
                  <p className="text-sm text-gray-500">{t('filter')}</p>
                </div>
              </div>
            </div>

            {/* Students by Class */}
            <div className="space-y-6">
              {Object.entries(byClass).map(([className, classStudents]: [string, any], classIndex: number) => (
                <div key={className} className="glass-card overflow-hidden"
                     style={{ animationDelay: `${classIndex * 100}ms` }}>
                  {/* Class Header */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100
                                      flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-bold text-gray-900">{className}</span>
                    </div>
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold
                                     bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700">
                      {classStudents.length} {t('students').toLowerCase()}
                    </span>
                  </div>
                  
                  {/* Students List */}
                  <div className="divide-y divide-gray-50">
                    {classStudents.map((student: any, index: number) => (
                      <Link
                        key={student.id}
                        href={`/students/${student.id}`}
                        className="group flex items-center justify-between px-6 py-4 
                                   hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50
                                   transition-all duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 
                                          flex items-center justify-center shadow-md shadow-blue-500/20
                                          group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                            <span className="text-white font-bold text-lg">
                              {student.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-blue-700 
                                          transition-colors duration-300">
                              {student.name}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-mono">
                                #{student.student_number}
                              </span>
                              <span>•</span>
                              <span>{t('gradeLevel')} {student.grade_level}</span>
                            </p>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100
                                        flex items-center justify-center transition-all duration-300">
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 
                                                    group-hover:translate-x-0.5 transition-all duration-300" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
