import { MCPSearXNGError } from '../error-handler.js';
import fs from 'fs/promises';
import type { ImageOCRArgs } from '../types.js';

interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  language: string;
  processingTime: string;
  engine: 'paddleocr';
  blocks?: Array<{
    text: string;
    box: number[];
    confidence: number;
  }>;
  warning?: string;
}

// Constants
const DEFAULT_PADDLEOCR_URL = 'http://paddleocr-service:8080';
const DEFAULT_MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const OCR_TIMEOUT_MS = 30000; // 30 seconds
const LOW_CONFIDENCE_THRESHOLD = 0.5;

const SUPPORTED_IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'bmp'] as const;
type SupportedFormat = typeof SUPPORTED_IMAGE_FORMATS[number];

function isSupportedFormat(ext: string): ext is SupportedFormat {
  return SUPPORTED_IMAGE_FORMATS.includes(ext as SupportedFormat);
}

function isUrl(image: string): boolean {
  return image.startsWith('http://') || image.startsWith('https://');
}

function isBase64(image: string): boolean {
  return image.startsWith('data:image');
}

function isLocalPath(image: string): boolean {
  return image.startsWith('/') || image.startsWith('./') || image.startsWith('../');
}

function getFileExtension(image: string): string | undefined {
  return image.split('.').pop()?.toLowerCase();
}

async function validateImage(image: string): Promise<void> {
  // URLs and base64 data are accepted without validation
  if (isUrl(image) || isBase64(image)) {
    return;
  }

  // Validate file extension
  const ext = getFileExtension(image);
  if (!ext || !isSupportedFormat(ext)) {
    throw new MCPSearXNGError(
      `Unsupported image format: ${ext}. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`
    );
  }

  // Check file size for local files
  if (isLocalPath(image)) {
    try {
      const stats = await fs.stat(image);
      const maxSize = Number.parseInt(process.env.MAX_IMAGE_SIZE || `${DEFAULT_MAX_IMAGE_SIZE}`, 10);

      if (stats.size > maxSize) {
        throw new MCPSearXNGError(
          `Image too large: ${stats.size} bytes (max: ${maxSize} bytes)`
        );
      }
    } catch (error) {
      if (isEnoentError(error)) {
        throw new MCPSearXNGError(`Image file not found: ${image}`);
      }
      if (error instanceof MCPSearXNGError) {
        throw error;
      }
      throw new MCPSearXNGError(`Failed to access image file: ${image}`);
    }
  }
}

function isEnoentError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function formatProcessingTime(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

async function callPaddleOCR(options: ImageOCRArgs): Promise<unknown> {
  const paddleocrUrl = process.env.PADDLEOCR_URL || DEFAULT_PADDLEOCR_URL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

  try {
    const response = await fetch(`${paddleocrUrl}/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        image: options.image,
        lang: options.lang || 'auto',
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new MCPSearXNGError(
        `OCR service error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (isAbortError(error)) {
      throw new MCPSearXNGError(`OCR request timeout (${OCR_TIMEOUT_MS}ms)`);
    }

    if (isConnectionRefusedError(error)) {
      throw new MCPSearXNGError(
        'OCR service is not running. Start the paddleocr-service container using: docker-compose up -d paddleocr-service'
      );
    }

    if (error instanceof MCPSearXNGError) {
      throw error;
    }

    throw new MCPSearXNGError(`OCR request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function isAbortError(error: unknown): error is { name: string } {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

function isConnectionRefusedError(error: unknown): error is { cause?: { code?: string } } {
  return typeof error === 'object' && error !== null && 'cause' in error &&
         typeof error.cause === 'object' && error.cause !== null &&
         'code' in error.cause && error.cause.code === 'ECONNREFUSED';
}

export async function extractTextFromImage(
  options: ImageOCRArgs
): Promise<OCRResult> {
  const startTime = Date.now();

  await validateImage(options.image);
  const result = await callPaddleOCR(options) as Record<string, unknown>;

  const confidence = typeof result.confidence === 'number' ? result.confidence : 0.9;
  const response: OCRResult = {
    success: true,
    text: String(result.text ?? ''),
    confidence,
    language: String(result.language ?? 'unknown'),
    processingTime: formatProcessingTime(Date.now() - startTime),
    engine: 'paddleocr',
    blocks: result.blocks as OCRResult['blocks'],
  };

  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    response.warning = 'Low confidence score, image quality may be poor';
  }

  return response;
}

