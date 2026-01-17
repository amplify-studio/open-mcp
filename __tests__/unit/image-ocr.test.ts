import { extractTextFromImage } from '../../src/tools/image-ocr.js';
import assert from 'assert';

// Mock fetch to avoid real HTTP calls
global.fetch = jest.fn();

describe('image_ocr tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should call paddleocr service with correct parameters', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        text: 'Test text',
        confidence: 0.95,
        language: 'en',
        blocks: []
      })
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await extractTextFromImage({
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAA...',
      lang: 'en'
    });

    assert.equal(result.success, true);
    assert.equal(result.text, 'Test text');
    assert.equal(result.engine, 'paddleocr');
  });

  test('should handle low confidence results', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        text: 'Low quality text',
        confidence: 0.3,
        language: 'ch',
        blocks: []
      })
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await extractTextFromImage({
      image: 'test.png',
      lang: 'auto'
    });

    assert.equal(result.warning, 'Low confidence score, image quality may be poor');
  });

  test('should throw error for unsupported format', async () => {
    await assert.rejects(
      async () => await extractTextFromImage({ image: 'test.xyz' }),
      /Unsupported image format/
    );
  });

  test('should throw error when service is unavailable', async () => {
    (global.fetch as jest.Mock).mockRejectedValue({
      cause: { code: 'ECONNREFUSED' }
    });

    await assert.rejects(
      async () => await extractTextFromImage({ image: 'test.png' }),
      /OCR service is not running/
    );
  });

  test('should throw error for timeout', async () => {
    const abortError = new Error('Aborted');
    (abortError as any).name = 'AbortError';
    (global.fetch as jest.Mock).mockRejectedValue(abortError);

    await assert.rejects(
      async () => await extractTextFromImage({ image: 'test.png' }),
      /OCR request timeout/
    );
  });
});
