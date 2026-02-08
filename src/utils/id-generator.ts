/**
 * Generates a unique ID for annotations
 * Format: timestamp-random
 * Example: 1234567890123-abc123def
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
