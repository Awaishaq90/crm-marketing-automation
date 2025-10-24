import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Consistent date formatting to prevent hydration mismatches
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Convert HTML to plain text for email fallback
 * Strips HTML tags while preserving structure and formatting
 * Works both client-side and server-side
 */
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  
  let text = html
  
  // Replace common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Replace block elements with newlines
  text = text
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
  
  // Handle list items
  text = text.replace(/<li[^>]*>/gi, '• ')
  
  // Handle links - extract text and URL
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')
  
  // Decode any remaining HTML entities
  text = text
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/&#\d+;/g, ' ')
  
  // Clean up whitespace
  text = text
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace 3+ newlines with 2
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces with single
    .replace(/^\s+/gm, '') // Remove leading whitespace from lines
    .trim()
  
  return text
}
