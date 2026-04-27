/**
 * File-related constants for uploads
 */

/**
 * Valid MIME types for exam template uploads
 */
export const VALID_EXAM_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
] as const

/**
 * Valid file extensions for exam uploads
 */
export const VALID_EXAM_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff'] as const

/**
 * File type categories
 */
export const FILE_TYPE_CATEGORIES = {
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/png', 'image/tiff'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Maximum file size in MB for display
 */
export const MAX_FILE_SIZE_MB = 10

/**
 * File size display helper thresholds
 */
export const FILE_SIZE_THRESHOLDS = {
  KB: 1024,
  MB: 1024 * 1024,
} as const

/**
 * Get icon name based on file type
 */
export function getFileTypeIcon(fileType: string): 'pdf' | 'image' | 'document' {
  if (fileType === 'application/pdf') return 'pdf'
  if (fileType.startsWith('image/')) return 'image'
  return 'document'
}

/**
 * Check if file type is valid for exam upload
 */
export function isValidExamFileType(file: File): boolean {
  return VALID_EXAM_FILE_TYPES.includes(file.type as typeof VALID_EXAM_FILE_TYPES[number])
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < FILE_SIZE_THRESHOLDS.KB) {
    return bytes + ' B'
  }
  if (bytes < FILE_SIZE_THRESHOLDS.MB) {
    return (bytes / FILE_SIZE_THRESHOLDS.KB).toFixed(1) + ' KB'
  }
  return (bytes / FILE_SIZE_THRESHOLDS.MB).toFixed(1) + ' MB'
}