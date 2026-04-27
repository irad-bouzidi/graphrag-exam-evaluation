/**
 * Form-related constants for exam and student forms
 */

/**
 * Academic topics for math questions
 */
export const TOPICS = [
  { value: 'numbers_operations', label: 'Numbers & Operations' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'measurement', label: 'Measurement' },
  { value: 'problem_solving', label: 'Problem Solving' },
  { value: 'ratios_proportions', label: 'Ratios & Proportions' },
] as const

/**
 * Question type options
 */
export const QUESTION_TYPES = [
  { value: 'calculation', label: 'Calculation' },
  { value: 'word_problem', label: 'Word Problem' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'true_false', label: 'True/False' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
] as const

/**
 * Skills that can be tested in questions
 */
export const SKILLS = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'fractions',
  'decimals',
  'percentages',
  'equations',
  'geometry',
  'measurement',
  'problem_solving',
  'estimation',
] as const

/**
 * Grade levels available in the system
 */
export const GRADE_LEVELS = [1, 2, 3, 4, 5, 6] as const

/**
 * Extended grade levels for higher education
 */
export const EXTENDED_GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

/**
 * Subject options
 */
export const SUBJECTS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'language_arts', label: 'Language Arts' },
  { value: 'social_studies', label: 'Social Studies' },
] as const

/**
 * Default duration for exams (in minutes)
 */
export const DEFAULT_EXAM_DURATION = 60

/**
 * Min/max exam duration bounds (in minutes)
 */
export const EXAM_DURATION_MIN = 15
export const EXAM_DURATION_MAX = 180

/**
 * Default points per question
 */
export const DEFAULT_QUESTION_POINTS = 1

/**
 * Max points per question
 */
export const MAX_QUESTION_POINTS = 20