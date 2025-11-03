/**
 * Format date to 'Jun 10' format as per guidelines
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Format date to 'Jun 10, 2024' format for more detailed display
 */
export function formatDateWithYear(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Get current date in YYYY-MM-DD format for date inputs
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}
