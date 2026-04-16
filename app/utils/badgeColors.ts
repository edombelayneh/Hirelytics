import { JobApplication } from '../data/mockData'

/**
 * Get badge color classes for application status
 */
export function getStatusColor(status: JobApplication['status']): string {
  switch (status) {
    case 'APPLIED':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    case 'SCREENING':
      return 'bg-sky-100 text-sky-800 hover:bg-sky-100'
    case 'INTERVIEWS':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    case 'OFFERS':
      return 'bg-green-100 text-green-800 hover:bg-green-100'
    case 'REJECTED':
      return 'bg-red-100 text-red-800 hover:bg-red-100'
    case 'WITHDRAWN':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }
}
