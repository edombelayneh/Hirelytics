/**
 * Parse location string to extract city and country
 * @param location - Location string in format 'City, Country' or just 'City'
 * @returns Object with city and country properties
 */
export function parseLocation(location: string): { city: string; country: string } {
  const locationParts = location.split(', ');
  const city = locationParts[0] || location;
  const country = locationParts.length > 1 ? locationParts[locationParts.length - 1] : 'USA';

  return { city, country };
}
