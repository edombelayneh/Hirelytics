/**
 * Utility functions barrel export
 */

export { formatDate, formatDateWithYear, getCurrentDateString } from './dateFormatter'
export { parseLocation } from './locationParser'
export { getStatusColor } from './badgeColors'
export { ApplicationStatusColor } from './applicationStatusStyles'
export { CHART_COLORS, chartStyles } from './chartConfig'
export {
  mergeJobHistoryItems,
  mapExperiencesToJobHistory,
  parseResumeTextToExperiences,
} from './resumeParser'
export type { JobHistoryItem, JobHistoryMergeOptions, JobHistoryMapOptions } from './resumeParser'
