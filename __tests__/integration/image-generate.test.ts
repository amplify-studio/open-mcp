import { describe, it, after } from 'node:test';
import assert from 'node:assert';

// Set environment variable before importing the module
process.env.ZHIPUAI_API_KEY = 'test-api-key-12345';

import { generateImage } from '../../src/tools/image-generate.js';
import { FetchMocker } from '../helpers/mock-fetch.js';

describe('image-generate tool', () => {
  const fetchMocker = new FetchMocker();
  let capturedRequest: { url: string; body?: string } = { url: '' };

  after(() => {
    fetchMocker.restore();
  });

  it('should call API with prompt and default size', async () => {
    const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
      capturedRequest.url = url.toString();
      if (options?.body) {
        capturedRequest.body = options.body.toString();
      }

      return {
        ok: true,
        json: async () => ({
          data: [{ url: 'https://example.com/image.png' }]
        })
      } as Response;
    };

    fetchMocker.mock(mockFetch as any);

    const result = await generateImage({
      prompt: 'A beautiful sunset'
    });

    assert.equal(result, 'https://example.com/image.png');
    assert.ok(capturedRequest.url.includes('/images/generations'));

    const body = JSON.parse(capturedRequest.body || '{}');
    assert.equal(body.prompt, 'A beautiful sunset');
    assert.equal(body.size, '1024x1024');
  });

  it('should call API with custom size', async () => {
    const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
      capturedRequest.url = url.toString();
      if (options?.body) {
        capturedRequest.body = options.body.toString();
      }

      return {
        ok: true,
        json: async () => ({
          data: [{ url: 'https://example.com/image.png' }]
        })
      } as Response;
    };

    fetchMocker.mock(mockFetch as any);

    await generateImage({
      prompt: 'Test',
      size: '768x1344'
    });

    assert.ok(capturedRequest.url.includes('/images/generations'));

    const body = JSON.parse(capturedRequest.body || '{}');
    assert.equal(body.prompt, 'Test');
    assert.equal(body.size, '768x1344');
  });

  it('should validate prompt length', async () => {
    await assert.rejects(
      () => generateImage({ prompt: '' }),
      /Prompt is required/
    );
  });

  it('should validate prompt too long', async () => {
    await assert.rejects(
      () => generateImage({ prompt: 'a'.repeat(4001) }),
      /Prompt is too long/
    );
  });

  it('should validate size', async () => {
    await assert.rejects(
      () => generateImage({ prompt: 'Test', size: 'invalid' }),
      /Invalid size/
    );
  });
});
