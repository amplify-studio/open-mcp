import { describe, it, after, before } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';

// Set environment variable before importing the module
process.env.ZHIPUAI_API_KEY = 'test-api-key-12345';

import { understandImage } from '../../src/tools/image-understand.js';
import { FetchMocker } from '../helpers/mock-fetch.js';

describe('image-understand tool', () => {
  const fetchMocker = new FetchMocker();
  const testFiles: string[] = [];

  before(async () => {
    // Create temporary test image files
    const testDir = '/tmp/tests';
    await fs.mkdir(testDir, { recursive: true });

    // Create test PNG file
    const testFile1 = `${testDir}/test1.png`;
    await fs.writeFile(testFile1, Buffer.from('test-image-data-1'));
    testFiles.push(testFile1);

    // Create test JPG file
    const testFile2 = `${testDir}/test2.jpg`;
    await fs.writeFile(testFile2, Buffer.from('test-image-data-2'));
    testFiles.push(testFile2);
  });

  after(async () => {
    fetchMocker.restore();

    // Clean up test files
    for (const file of testFiles) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore if file doesn't exist
      }
    }
  });

  it('should convert local file to base64 and call API', async () => {
    const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'Test response' }
          }]
        })
      } as Response;
    };

    fetchMocker.mock(mockFetch as any);

    const result = await understandImage({
      files: [testFiles[0]],
      prompt: 'What is in this image?',
      thinking: false
    });

    assert.equal(result, 'Test response');
  });

  it('should pass through URLs directly', async () => {
    const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'URL response' }
          }]
        })
      } as Response;
    };

    fetchMocker.mock(mockFetch as any);

    const result = await understandImage({
      files: ['https://example.com/image.png'],
      prompt: 'Describe this image'
    });

    assert.equal(result, 'URL response');
  });

  it('should handle multiple files', async () => {
    const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'Multi-file response' }
          }]
        })
      } as Response;
    };

    fetchMocker.mock(mockFetch as any);

    const result = await understandImage({
      files: testFiles,
      prompt: 'Compare these images'
    });

    assert.equal(result, 'Multi-file response');
  });
});
