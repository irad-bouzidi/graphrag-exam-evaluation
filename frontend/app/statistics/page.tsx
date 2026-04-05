'use client'

import { useQuery } from '@tanstack/react-query'
import { getHealthStats, api } from '@/lib/api'
import Link from 'next/link'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  CheckCircle,
  AlertTriangle,
  Target
} from 'lucide-react'
import { getScoreClass } from '@/lib/utils'

export default function StatisticsPage() {
  const { data: stats } = useQuery({
    queryKey: ['overall-stats'],
    queryFn: async () => {
      const response = await api.get('/health/stats')
      return response.data.counts
    },
  })

  const { data: examService } = useQuery({
    queryKey: ['exam-service-stats'],
    queryFn: async () => {
      // This would call a dedicated statistics endpoint
      // For now, we'll simulate with available data
      return {
        average_score: 72.5,
        pass_rate: 78,
        total_questions_answered: 156,
        most_common_errors: [
          { type: 'calculation_error', count: 23 },
          { type: 'conceptual_error', count: 15 },
          { type: 'procedural_error', count: 12 },
        ],
        skill_performance: [
          { skill: 'addition', mastery: 85 },
          { skill: 'subtraction', mastery: 82 },
          { skill: 'multiplication', mastery: 78 },
          { skill: 'division', mastery: 65 },
          { skill: 'fractions', mastery: 58 },
          { skill: 'decimals', mastery: 72 },
        ]
      }
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
              <p className="text-gray-500">Performance analytics and insights</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Exams</p>
                  <p className="text-3xl font-bold">{stats?.exams || 0}</p>
                </div>
                <BookOpen className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-3xl font-bold">{stats?.students || 0}</p>
                </div>
                <Users className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Submissions</p>
                  <p className="text-3xl font-bold">{stats?.submissions || 0}</p>
                </div>
                <Target className="w-10 h-10 text-purple-500 opacity-20" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Corrected</p>
                  <p className="text-3xl font-bold">{stats?.corrections || 0}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-orange-500 opacity-20" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Overview */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Performance Overview
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Average Score</p>
                  <p className={`text-4xl font-bold ${getScoreClass(examService?.average_score || 0)}`}>
                    {examService?.average_score?.toFixed(1) || 0}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Pass Rate</p>
                  <p className={`text-4xl font-bold ${getScoreClass(examService?.pass_rate || 0)}`}>
                    {examService?.pass_rate?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Questions Answered</span>
                  <span className="font-medium">{examService?.total_questions_answered || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Errors */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gray-400" />
              Common Error Types
            </div>
            <div className="card-body">
              {examService?.most_common_errors?.length ? (
                <div className="space-y-4">
                  {examService.most_common_errors.map((error: any) => (
                    <div key={error.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{error.type.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{error.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(error.count / examService.most_common_errors[0].count) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No error data available</p>
              )}
            </div>
          </div>

          {/* Skill Performance */}
          <div className="card lg:col-span-2">
            <div className="card-header flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              Skill Mastery
            </div>
            <div className="card-body">
              {examService?.skill_performance?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {examService.skill_performance.map((skill: any) => (
                    <div key={skill.skill} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium capitalize">{skill.skill}</span>
                        <span className={`text-sm font-bold ${getScoreClass(skill.mastery)}`}>
                          {skill.mastery}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all ${
                            skill.mastery >= 80 ? 'bg-green-500' :
                            skill.mastery >= 60 ? 'bg-blue-500' :
                            skill.mastery >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${skill.mastery}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No skill data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Detailed Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/students" className="card hover:shadow-md transition-shadow">
              <div className="card-body flex items-center gap-4">
                <Users className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="font-medium">Student Reports</p>
                  <p className="text-sm text-gray-500">View individual performance</p>
                </div>
              </div>
            </Link>
            <Link href="/exams" className="card hover:shadow-md transition-shadow">
              <div className="card-body flex items-center gap-4">
                <BookOpen className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium">Exam Analysis</p>
                  <p className="text-sm text-gray-500">Review exam statistics</p>
                </div>
              </div>
            </Link>
            <Link href="/graph" className="card hover:shadow-md transition-shadow">
              <div className="card-body flex items-center gap-4">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="font-medium">Data Explorer</p>
                  <p className="text-sm text-gray-500">Explore relationships</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
