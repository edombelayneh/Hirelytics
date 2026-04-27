import type { ApplicationStatus } from '../types/job'

/**
 * Get badge color classes for application status
 */
export function getStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case 'Applied':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    case 'Screening':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    case 'Interviews':
      return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100'
    case 'Offer':
      return 'bg-green-100 text-green-800 hover:bg-green-100'
    case 'Rejected':
      return 'bg-red-100 text-red-800 hover:bg-red-100'
    case 'Withdrawn':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }
}
