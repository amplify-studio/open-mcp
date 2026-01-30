import { readFile } from 'node:fs/promises';
import { detectFileType } from '../utils/file-helper.js';
import type { ImageOCRArgs } from '../types.js';

interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  language: string;
  processingTime: string;
  engine: 'paddleocr';
  warning?: string;
}

const SUPPORTED_FORMATS = new Set(['png', 'jpg', 'jpeg', 'bmp', 'gif']);
const MAX_IMAGE_SIZE = 10485760; // 10MB
const LOW_CONFIDENCE_THRESHOLD = 0.5;
const DEFAULT_CONFIDENCE = 0.9;

/**
 * Check if path is a local file
 */
function isLocalFile(imagePath: string): boolean {
  return imagePath.startsWith('/') ||
    imagePath.startsWith('./') ||
    imagePath.startsWith('../');
}

/**
 * Get file extension from path
 */
function getFileExtension(imagePath: string): string {
  return imagePath.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * Validate image file format and size
 */
async function validateImage(imagePath: string): Promise<void> {
  const ext = getFileExtension(imagePath);

  if (!SUPPORTED_FORMATS.has(ext)) {
    throw new Error(
      `Unsupported image format: ${ext}. Supported formats: ${Array.from(SUPPORTED_FORMATS).join(', ')}`
    );
  }

  if (!isLocalFile(imagePath)) {
    return;
  }

  try {
    const buffer = await readFile(imagePath);
    const maxSize = Number(process.env.MAX_IMAGE_SIZE) || MAX_IMAGE_SIZE;

    if (buffer.length > maxSize) {
      throw new Error(
        `Image too large: ${buffer.length} bytes (max: ${maxSize} bytes)`
      );
    }
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    throw error;
  }
}

/**
 * Call PaddleOCR service
 */
async function callPaddleOCR(imagePath: string): Promise<OCRResult> {
  const paddleocrUrl = process.env.PADDLEOCR_URL || 'http://localhost:8080';

  const imageBuffer = await readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await fetch(`${paddleocrUrl}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Image,
      lang: 'auto'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`OCR service error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Main function: Extract text from image using OCR
 */
export async function extractTextFromImage(
  args: ImageOCRArgs
): Promise<string> {
  const { imageFile } = args;

  if (!imageFile?.trim()) {
    throw new Error('Image file path is required');
  }

  const startTime = Date.now();

  try {
    await validateImage(imageFile);
    const result = await callPaddleOCR(imageFile);

    const processingTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    const confidence = result.confidence || DEFAULT_CONFIDENCE;
    const warning = confidence < LOW_CONFIDENCE_THRESHOLD
      ? 'Low confidence score, image quality may be poor'
      : undefined;

    const response: OCRResult = {
      success: true,
      text: result.text,
      confidence,
      language: result.language || 'unknown',
      processingTime,
      engine: 'paddleocr',
      warning
    };

    return JSON.stringify(response, null, 2);
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === 'ECONNREFUSED') {
      throw new Error('OCR service is not running. Please start the PaddleOCR service.');
    }
    throw error;
  }
}
