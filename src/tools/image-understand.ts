import {
  detectFileType,
  getMimeType,
  normalizeInput,
  readAsBase64,
} from '../utils/file-helper.js';
import { callVisionAPI } from '../api/zhipu.js';
import type { ImageUnderstandArgs } from '../types.js';

interface ContentItem {
  type: 'text' | 'image_url' | 'video_url' | 'file_url';
  text?: string;
  image_url?: { url: string };
  video_url?: { url: string };
  file_url?: { url: string };
}

const DEFAULT_MIME_TYPES = {
  image: 'image/png',
  video: 'video/mp4',
  file: 'application/octet-stream'
} as const;

/**
 * Convert file input to data URL
 */
async function fileToDataUrl(file: string): Promise<string> {
  const normalized = normalizeInput(file);

  if (normalized.type === 'local') {
    const base64 = await readAsBase64(normalized.value);
    const mimeType = getMimeType(normalized.value);
    return `data:${mimeType};base64,${base64}`;
  }

  if (normalized.type === 'base64') {
    if (normalized.value.startsWith('data:')) {
      return normalized.value;
    }
    const fileType = detectFileType(normalized.value);
    const mimeType = DEFAULT_MIME_TYPES[fileType || 'file'];
    return `data:${mimeType};base64,${normalized.value}`;
  }

  return normalized.value;
}

/**
 * Create content item based on file type
 */
function createContentItem(dataUrl: string, file: string): ContentItem {
  const fileType = detectFileType(file);

  if (fileType === 'image') {
    return { type: 'image_url', image_url: { url: dataUrl } };
  }

  if (fileType === 'video') {
    return { type: 'video_url', video_url: { url: dataUrl } };
  }

  return { type: 'file_url', file_url: { url: dataUrl } };
}

/**
 * Build Zhipu API message format from user input
 */
async function buildVisionContent(
  files: string[],
  prompt: string
): Promise<ContentItem[]> {
  const content: ContentItem[] = [];

  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    content.push(createContentItem(dataUrl, file));
  }

  content.push({
    type: 'text',
    text: prompt
  });

  return content;
}

/**
 * Main function: Process image understanding request
 */
export async function understandImage(
  args: ImageUnderstandArgs
): Promise<string> {
  const { files, prompt, thinking = false } = args;

  if (!files?.length) {
    throw new Error('At least one file is required');
  }

  if (!prompt?.trim()) {
    throw new Error('Prompt is required');
  }

  const content = await buildVisionContent(files, prompt);

  return callVisionAPI([{
    role: 'user',
    content
  }], thinking);
}
