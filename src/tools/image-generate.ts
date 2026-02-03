import { callImageGenAPI } from '../api/zhipu.js';
import type { ImageGenerateArgs } from '../types.js';

const VALID_SIZES = new Set([
  '1024x1024', '768x1344', '864x1152', '1344x768',
  '1152x864', '1440x720', '720x1440'
]);

const MAX_PROMPT_LENGTH = 4000;

/**
 * Validate image generation parameters
 */
function validateImageGenArgs(args: ImageGenerateArgs): void {
  const { prompt, size } = args;

  if (!prompt?.trim()) {
    throw new Error('Prompt is required');
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt is too long (max ${MAX_PROMPT_LENGTH} characters)`);
  }

  if (size && !VALID_SIZES.has(size)) {
    throw new Error(
      `Invalid size: ${size}. Must be one of: ${Array.from(VALID_SIZES).join(', ')}`
    );
  }
}

/**
 * Main function: Generate image from text prompt
 */
export async function generateImage(
  args: ImageGenerateArgs
): Promise<string> {
  validateImageGenArgs(args);

  const { prompt, size = '1024x1024' } = args;
  return callImageGenAPI(prompt, size);
}
