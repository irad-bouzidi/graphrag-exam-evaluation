'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createStudent, bulkCreateStudents } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2 } from 'lucide-react'

export default function NewStudentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'single' | 'bulk'>('single')

  // Single student form
  const [name, setName] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [className, setClassName] = useState('')
  const [gradeLevel, setGradeLevel] = useState(6)

  // Bulk student form
  const [students, setStudents] = useState([
    { name: '', student_number: '', class_name: '', grade_level: 6 }
  ])

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student added successfully!')
      router.push('/students')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add student')
    },
  })

  const bulkMutation = useMutation({
    mutationFn: bulkCreateStudents,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success(`${data.data.created} students added!`)
      router.push('/students')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add students')
    },
  })

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !studentNumber.trim() || !className.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    createMutation.mutate({
      name,
      student_number: studentNumber,
      class_name: className,
      grade_level: gradeLevel,
    })
  }

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validStudents = students.filter(
      s => s.name.trim() && s.student_number.trim() && s.class_name.trim()
    )

    if (validStudents.length === 0) {
      toast.error('Please add at least one valid student')
      return
    }

    bulkMutation.mutate(validStudents)
  }

  const addStudent = () => {
    setStudents([...students, { name: '', student_number: '', class_name: '', grade_level: 6 }])
  }

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index))
    }
  }

  const updateStudent = (index: number, field: string, value: any) => {
    const updated = [...students]
    updated[index] = { ...updated[index], [field]: value }
    setStudents(updated)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/students" className="text-gray-400 hover:text-gray-600">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Add Students</h1>
          </div>
        </div>
      </header>

      {/* Mode Toggle */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'single'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            Single Student
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'bulk'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            Multiple Students
          </button>
        </div>
      </div>

      {/* Forms */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit}>
            <div className="card">
              <div className="card-header">Student Details</div>
              <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Number
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., 2024001"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., CM2-A"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level
                  </label>
                  <select
                    className="input"
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
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Link href="/students" className="btn btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary"
              >
                {createMutation.isPending ? 'Adding...' : (
                  <>
                    <Save className="w-5 h-5" />
                    Add Student
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit}>
            <div className="space-y-4">
              {students.map((student, index) => (
                <div key={index} className="card">
                  <div className="card-header flex items-center justify-between">
                    <span>Student {index + 1}</span>
                    {students.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStudent(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Name"
                        value={student.name}
                        onChange={(e) => updateStudent(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student Number
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Number"
                        value={student.student_number}
                        onChange={(e) => updateStudent(index, 'student_number', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Class"
                        value={student.class_name}
                        onChange={(e) => updateStudent(index, 'class_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade
                      </label>
                      <select
                        className="input"
                        value={student.grade_level}
                        onChange={(e) => updateStudent(index, 'grade_level', Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6].map((grade) => (
                          <option key={grade} value={grade}>
                            Grade {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={addStudent}
                className="btn btn-secondary"
              >
                <Plus className="w-5 h-5" />
                Add Another
              </button>
              <div className="flex gap-4">
                <Link href="/students" className="btn btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={bulkMutation.isPending}
                  className="btn btn-primary"
                >
                  {bulkMutation.isPending ? 'Adding...' : (
                    <>
                      <Save className="w-5 h-5" />
                      Add {students.length} Student{students.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
