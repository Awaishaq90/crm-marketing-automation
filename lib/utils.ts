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
 */
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  
  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Convert various HTML elements to plain text equivalents
  const convertElement = (element: Element): string => {
    const tagName = element.tagName.toLowerCase()
    const text = Array.from(element.childNodes)
      .map(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || ''
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          return convertElement(node as Element)
        }
        return ''
      })
      .join('')
    
    switch (tagName) {
      case 'p':
      case 'div':
        return text + '\n\n'
      case 'br':
        return '\n'
      case 'li':
        return '• ' + text + '\n'
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return text + '\n\n'
      case 'a':
        const href = element.getAttribute('href')
        return href ? `${text} (${href})` : text
      case 'strong':
      case 'b':
        return text // Keep text but remove formatting
      case 'em':
      case 'i':
        return text // Keep text but remove formatting
      case 'u':
        return text // Keep text but remove formatting
      default:
        return text
    }
  }
  
  // Process the HTML and clean up
  let plainText = convertElement(temp)
  
  // Clean up extra whitespace and newlines
  plainText = plainText
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .trim()
  
  return plainText
}
