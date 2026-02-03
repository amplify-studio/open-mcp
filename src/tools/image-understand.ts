import {
  detectFileType,
  getMimeType,
  normalizeInput,
  readAsBase64,
} from '../utils/file-helper.js';
import { callVisionAPI, type VisionContentItem } from '../api/zhipu.js';
import type { ImageUnderstandArgs } from '../types.js';

type ContentItem = VisionContentItem | { type: 'text'; text: string };

const DEFAULT_MIME_TYPES = {
  image: 'image/png',
  video: 'video/mp4',
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

  if (normalized.type === 'base64' && !normalized.value.startsWith('data:')) {
    const fileType = detectFileType(normalized.value) as keyof typeof DEFAULT_MIME_TYPES;
    const mimeType = DEFAULT_MIME_TYPES[fileType] ?? 'application/octet-stream';
    return `data:${mimeType};base64,${normalized.value}`;
  }

  return normalized.value;
}

/**
 * Create content item based on file type
 */
function createContentItem(dataUrl: string, file: string): ContentItem {
  const fileType = detectFileType(file.split('?')[0]);

  if (fileType === 'image') {
    return { type: 'image_url', image_url: { url: dataUrl } };
  }

  if (fileType === 'video') {
    return { type: 'video_url', video_url: { url: dataUrl } };
  }

  return { type: 'file_url', file_url: { url: dataUrl } };
}

/**
 * Main function: Process image understanding request
 */
export async function understandImage(
  args: ImageUnderstandArgs
): Promise<string> {
  const { file, prompt, thinking = true } = args;

  if (!file?.trim()) {
    throw new Error('File is required');
  }

  if (!prompt?.trim()) {
    throw new Error('Prompt is required');
  }

  const dataUrl = await fileToDataUrl(file);
  const contentItem = createContentItem(dataUrl, file);

  return callVisionAPI([{
    role: 'user',
    content: [contentItem, { type: 'text', text: prompt }]
  }], thinking);
}
