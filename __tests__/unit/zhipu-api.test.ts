import { describe, it, after, before } from 'node:test';
import assert from 'node:assert';

// Set environment variable before importing the module
process.env.ZHIPUAI_API_KEY = 'test-api-key-12345';

import { callVisionAPI, callImageGenAPI } from '../../src/api/zhipu.js';
import { FetchMocker } from '../helpers/mock-fetch.js';

describe('zhipu-api', () => {
  const fetchMocker = new FetchMocker();

  after(() => {
    fetchMocker.restore();
    // Restore original API key after tests
    const originalApiKey = process.env.ZHIPUAI_API_KEY;
    if (originalApiKey === undefined) {
      delete process.env.ZHIPUAI_API_KEY;
    } else {
      process.env.ZHIPUAI_API_KEY = originalApiKey;
    }
  });

  describe('callVisionAPI', () => {
    it('should call GLM-4.6V-Flash API with correct format', async () => {
      let capturedUrl: string = '';
      let capturedOptions: any = {};

      const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
        capturedUrl = url.toString();
        capturedOptions = options;

        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: { content: 'This is a test response' }
            }]
          })
        } as Response;
      };

      fetchMocker.mock(mockFetch as any);

      const messages = [{
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,test' } }
        ]
      }];

      const result = await callVisionAPI(messages, false);

      assert.equal(result, 'This is a test response');
      assert.equal(capturedUrl, 'https://open.bigmodel.cn/api/paas/v4/chat/completions');

      const body = JSON.parse(capturedOptions.body as string);
      assert.equal(body.model, 'glm-4.6v-flash');
      assert.equal(body.thinking.type, 'disabled');
    });

    it('should include thinking parameter when enabled', async () => {
      let capturedOptions: any = {};

      const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
        capturedOptions = options;

        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: { content: 'Response with thinking' }
            }]
          })
        } as Response;
      };

      fetchMocker.mock(mockFetch as any);

      const messages = [{
        role: 'user',
        content: [{ type: 'text', text: 'Test' }]
      }];

      await callVisionAPI(messages, true);

      const body = JSON.parse(capturedOptions.body as string);
      assert.equal(body.thinking.type, 'enabled');
    });

    it('should handle API errors', async () => {
      const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: { message: 'Invalid API key' } })
        } as Response;
      };

      fetchMocker.mock(mockFetch as any);

      const messages = [{ role: 'user', content: [{ type: 'text', text: 'Test' }] }];

      await assert.rejects(
        () => callVisionAPI(messages, false),
        /Authentication failed.*Invalid API key/
      );
    });
  });

  describe('callImageGenAPI', () => {
    it('should call Cogview-3-Flash API', async () => {
      let capturedUrl: string = '';
      let capturedOptions: any = {};

      const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
        capturedUrl = url.toString();
        capturedOptions = options;

        return {
          ok: true,
          json: async () => ({
            data: [{ url: 'https://example.com/generated-image.png' }]
          })
        } as Response;
      };

      fetchMocker.mock(mockFetch as any);

      const result = await callImageGenAPI('A beautiful sunset', '1024x1024');

      assert.equal(result, 'https://example.com/generated-image.png');
      assert.equal(capturedUrl, 'https://open.bigmodel.cn/api/paas/v4/images/generations');

      const body = JSON.parse(capturedOptions.body as string);
      assert.equal(body.model, 'cogview-3-flash');
      assert.equal(body.prompt, 'A beautiful sunset');
      assert.equal(body.size, '1024x1024');
    });
  });
});
