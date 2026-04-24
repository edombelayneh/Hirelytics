/**
 * Utility functions barrel export
 */

export { formatDate, formatDateWithYear, getCurrentDateString } from './dateFormatter'
export { parseLocation } from './locationParser'
export { getStatusColor } from './badgeColors'
export { ApplicationStatusColor } from './applicationStatusStyles'
export { CHART_COLORS, chartStyles } from './chartConfig'
export { mergeJobHistoryItems, parseResumeTextToExperiences } from './resume/resumeParser'
export type { JobHistoryItem, JobHistoryMergeOptions } from './resume/resumeParser'
