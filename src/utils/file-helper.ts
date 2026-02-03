import fs from 'node:fs/promises';
import path from 'node:path';

// MIME type mapping for common extensions
const MIME_TYPES: Record<string, string> = {
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  // Videos
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  // Documents
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// Content type mappings by extension
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm']);
const FILE_EXTENSIONS = new Set(['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx']);

/**
 * Detect content type based on file extension
 */
export function detectFileType(filePath: string): 'image' | 'video' | 'file' | null {
  const ext = path.extname(filePath).toLowerCase();

  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (FILE_EXTENSIONS.has(ext)) return 'file';

  return null;
}

/**
 * Normalize user input - detect if it's a local path, URL, or base64
 */
export function normalizeInput(input: string): {
  type: 'local' | 'url' | 'base64';
  value: string;
} {
  if (input.startsWith('data:')) {
    return { type: 'base64', value: input };
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    return { type: 'url', value: input };
  }

  if (/^[A-Za-z0-9+/=]{20,}$/.test(input) && !input.includes(' ')) {
    return { type: 'base64', value: input };
  }

  return { type: 'local', value: input };
}

/**
 * Read local file and convert to base64
 */
export async function readAsBase64(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer.toString('base64');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read file: ${filePath}. Error: ${message}`);
  }
}

/**
 * Get MIME type based on file extension
 */
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}
