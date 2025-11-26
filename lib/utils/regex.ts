/**
 * Regex Utilities
 * Provides safe regex operations to prevent ReDoS attacks
 */

/**
 * Escape special regex characters in user input
 * Prevents ReDoS (Regular Expression Denial of Service) attacks
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Create a safe regex pattern for case-insensitive search
 */
export function createSafeSearchPattern(searchTerm: string): string {
  return escapeRegex(searchTerm)
}

/**
 * Validate that a string is safe to use in regex
 * Returns true if safe, false if potentially dangerous
 */
export function isRegexSafe(pattern: string): boolean {
  // Check for common ReDoS patterns
  const dangerousPatterns = [
    /(\(.*\+.*\)){2,}/, // Nested quantifiers
    /(\w+\*){3,}/, // Multiple consecutive wildcards
    /(\.\*){2,}/, // Multiple .* patterns
  ]
  
  return !dangerousPatterns.some(p => p.test(pattern))
}
