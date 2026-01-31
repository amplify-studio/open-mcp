# Image AI Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add two MCP tools to integrate Zhipu AI's vision capabilities - image understanding (GLM-4.6V-Flash) and image generation (Cogview-3-Flash).

**Architecture:** Create shared API client layer for Zhipu AI, file processing utilities for base64 conversion, and two MCP tools that expose these capabilities to AI agents.

**Tech Stack:** TypeScript, Node.js fetch, undici for HTTP, @modelcontextprotocol/sdk for MCP integration

---

## Task 1: Create file helper utilities

**Files:**
- Create: `src/utils/file-helper.ts`
- Test: `__tests__/unit/file-helper.test.ts`

**Purpose:** Utility functions for detecting file types and converting local files to base64.

**Step 1: Write the failing test**

Create `__tests__/unit/file-helper.test.ts`:

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectFileType, readAsBase64, normalizeInput } from '../../src/utils/file-helper.js';

describe('file-helper', () => {
  describe('detectFileType', () => {
    it('should detect image files', () => {
      assert.equal(detectFileType('/path/to/image.png'), 'image');
      assert.equal(detectFileType('/path/to/photo.jpg'), 'image');
    });

    it('should detect video files', () => {
      assert.equal(detectFileType('/path/to/video.mp4'), 'video');
      assert.equal(detectFileType('/path/to/movie.mov'), 'video');
    });

    it('should detect document files', () => {
      assert.equal(detectFileType('/path/to/doc.pdf'), 'file');
      assert.equal(detectFileType('/path/to/text.txt'), 'file');
    });

    it('should return null for unknown types', () => {
      assert.equal(detectFileType('/path/to/unknown.xyz'), null);
    });
  });

  describe('normalizeInput', () => {
    it('should detect local file paths', () => {
      const result = normalizeInput('/tmp/test.png');
      assert.equal(result.type, 'local');
      assert.equal(result.value, '/tmp/test.png');
    });

    it('should detect HTTP URLs', () => {
      const result = normalizeInput('https://example.com/image.png');
      assert.equal(result.type, 'url');
    });

    it('should detect base64 data URIs', () => {
      const result = normalizeInput('data:image/png;base64,iVBORw0KG...');
      assert.equal(result.type, 'base64');
    });

    it('should detect raw base64 strings', () => {
      const result = normalizeInput('iVBORw0KGgoAAAANSUhEUgAAAAUA');
      assert.equal(result.type, 'base64');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx tsx __tests__/unit/file-helper.test.ts`

Expected: FAIL with "Cannot find module '../../src/utils/file-helper.ts'"

**Step 3: Write minimal implementation**

Create `src/utils/file-helper.ts`:

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';

// Supported file extensions by content type
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const FILE_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx'];

/**
 * Detect content type based on file extension
 */
export function detectFileType(filePath: string): 'image' | 'video' | 'file' | null {
  const ext = path.extname(filePath).toLowerCase();

  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (FILE_EXTENSIONS.includes(ext)) return 'file';

  return null;
}

/**
 * Normalize user input - detect if it's a local path, URL, or base64
 */
export function normalizeInput(input: string): {
  type: 'local' | 'url' | 'base64';
  value: string;
} {
  // Check for data URI
  if (input.startsWith('data:')) {
    return { type: 'base64', value: input };
  }

  // Check for HTTP(S) URL
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return { type: 'url', value: input };
  }

  // Check if it looks like base64 (alphanumeric and +/=, length > 100)
  if (/^[A-Za-z0-9+/=]{100,}$/.test(input)) {
    return { type: 'base64', value: input };
  }

  // Otherwise, treat as local file path
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
    throw new Error(
      `Failed to read file: ${filePath}. ` +
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get MIME type based on file extension
 */
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx __tests__/unit/file-helper.test.ts`

Expected: PASS all tests

**Step 5: Commit**

```bash
git add src/utils/file-helper.ts __tests__/unit/file-helper.test.ts
git commit -m "feat: add file helper utilities for type detection and base64 conversion"
```

---

## Task 2: Create Zhipu API client

**Files:**
- Create: `src/api/zhipu.ts`
- Test: `__tests__/unit/zhipu-api.test.ts`

**Purpose:** Shared HTTP client for calling Zhipu AI APIs with authentication and error handling.

**Step 1: Write the failing test**

Create `__tests__/unit/zhipu-api.test.ts`:

```typescript
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { callVisionAPI, callImageGenAPI } from '../../src/api/zhipu.js';

describe('zhipu-api', () => {
  describe('callVisionAPI', () => {
    it('should call GLM-4.6V-Flash API with correct format', async () => {
      const mockFetch = mock.fn(() => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'This is a test response' }
          }]
        })
      }));
      globalThis.fetch = mockFetch;

      const messages = [{
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,test' } }
        ]
      }];

      const result = await callVisionAPI(messages, false);

      assert.equal(result, 'This is a test response');
      assert.equal(mockFetch.mock.calls.length, 1);

      const callArgs = mockFetch.mock.calls[0];
      assert.equal(callArgs[0], 'https://open.bigmodel.cn/api/paas/v4/chat/completions');

      const body = JSON.parse(callArgs[1].body);
      assert.equal(body.model, 'glm-4.6v-flash');
      assert.equal(body.thinking.type, 'disabled');
    });

    it('should include thinking parameter when enabled', async () => {
      const mockFetch = mock.fn(() => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'Response with thinking' }
          }]
        })
      }));
      globalThis.fetch = mockFetch;

      const messages = [{
        role: 'user',
        content: [{ type: 'text', text: 'Test' }]
      }];

      await callVisionAPI(messages, true);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      assert.equal(body.thinking.type, 'enabled');
    });

    it('should handle API errors', async () => {
      const mockFetch = mock.fn(() => ({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      }));
      globalThis.fetch = mockFetch;

      const messages = [{ role: 'user', content: [{ type: 'text', text: 'Test' }] }];

      await assert.rejects(
        () => callVisionAPI(messages, false),
        /Authentication failed.*Invalid API key/
      );
    });
  });

  describe('callImageGenAPI', () => {
    it('should call Cogview-3-Flash API', async () => {
      const mockFetch = mock.fn(() => ({
        ok: true,
        json: async () => ({
          data: [{ url: 'https://example.com/generated-image.png' }]
        })
      }));
      globalThis.fetch = mockFetch;

      const result = await callImageGenAPI('A beautiful sunset', '1024x1024');

      assert.equal(result, 'https://example.com/generated-image.png');
      assert.equal(mockFetch.mock.calls.length, 1);

      const callArgs = mockFetch.mock.calls[0];
      assert.equal(callArgs[0], 'https://open.bigmodel.cn/api/paas/v4/images/generations');

      const body = JSON.parse(callArgs[1].body);
      assert.equal(body.model, 'cogview-3-flash');
      assert.equal(body.prompt, 'A beautiful sunset');
      assert.equal(body.size, '1024x1024');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx tsx __tests__/unit/zhipu-api.test.ts`

Expected: FAIL with "Cannot find module '../../src/api/zhipu.ts'"

**Step 3: Write minimal implementation**

Create `src/api/zhipu.ts`:

```typescript
/**
 * Zhipu AI API Client
 * Handles HTTP requests to Zhipu AI vision and image generation APIs
 */

const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const ZHIPU_API_KEY = process.env.ZHIPUAI_API_KEY;

if (!ZHIPU_API_KEY) {
  console.warn('WARNING: ZHIPUAI_API_KEY not set in environment variables');
}

interface VisionMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{
    type: 'text' | 'image_url' | 'video_url' | 'file_url';
    text?: string;
    image_url?: { url: string };
    video_url?: { url: string };
    file_url?: { url: string };
  }>;
}

interface VisionAPIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ImageGenAPIResponse {
  data: Array<{
    url: string;
  }>;
}

interface ZhipuError {
  error?: {
    code?: string;
    message: string;
  };
}

/**
 * Call GLM-4.6V-Flash for image/video/document understanding
 */
export async function callVisionAPI(
  messages: VisionMessage[],
  thinking: boolean = false
): Promise<string> {
  if (!ZHIPU_API_KEY) {
    throw new Error('ZHIPUAI_API_KEY environment variable is required');
  }

  const requestBody = {
    model: 'glm-4.6v-flash',
    messages,
    thinking: {
      type: thinking ? 'enabled' : 'disabled'
    }
  };

  const response = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZHIPU_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData: ZhipuError = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
    throw new Error(
      `Vision API error (${response.status}): ${errorMessage}`
    );
  }

  const data: VisionAPIResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from vision API');
  }

  return data.choices[0].message.content;
}

/**
 * Call Cogview-3-Flash for image generation
 */
export async function callImageGenAPI(
  prompt: string,
  size: string = '1024x1024'
): Promise<string> {
  if (!ZHIPU_API_KEY) {
    throw new Error('ZHIPUAI_API_KEY environment variable is required');
  }

  const requestBody = {
    model: 'cogview-3-flash',
    prompt,
    size
  };

  const response = await fetch(`${ZHIPU_API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZHIPU_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData: ZhipuError = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
    throw new Error(
      `Image generation API error (${response.status}): ${errorMessage}`
    );
  }

  const data: ImageGenAPIResponse = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error('No images generated');
  }

  return data.data[0].url;
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx __tests__/unit/zhipu-api.test.ts`

Expected: PASS all tests

**Step 5: Commit**

```bash
git add src/api/zhipu.ts __tests__/unit/zhipu-api.test.ts
git commit -m "feat: add Zhipu AI API client for vision and image generation"
```

---

## Task 3: Add tool definitions to types.ts

**Files:**
- Modify: `src/types.ts`

**Purpose:** Define MCP tool schemas for image understanding and generation.

**Step 1: Add tool definitions**

Add to `src/types.ts` (after the existing IMAGE_OCR_TOOL):

```typescript
import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ... existing code ...

export const IMAGE_UNDERSTAND_TOOL: Tool = {
  name: "image_understand",
  description:
    "Understand and analyze images, videos, and documents using Zhipu GLM-4.6V-Flash model. " +
    "Supports visual Q&A, content description, OCR, document parsing, video understanding, " +
    "and frontend code replication from screenshots. " +
    "Accepts file paths, URLs, or base64 data. " +
    "Use this when you need to extract information from visual content or answer questions about images/videos.",
  inputSchema: {
    type: "object",
    properties: {
      files: {
        type: "array",
        items: { type: "string" },
        description: "Array of file paths, URLs, or base64 data (images, videos, PDFs, etc.)",
      },
      prompt: {
        type: "string",
        description: "Question or instruction for the visual content analysis",
      },
      thinking: {
        type: "boolean",
        description: "Enable deep thinking mode for complex reasoning (default: false)",
        default: false,
      },
    },
    required: ["files", "prompt"],
  },
};

export const IMAGE_GENERATE_TOOL: Tool = {
  name: "image_generate",
  description:
    "Generate images from text descriptions using Zhipu Cogview-3-Flash model. " +
    "Supports multiple resolutions. " +
    "Use this when you need to create visual content from text prompts.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the image to generate",
      },
      size: {
        type: "string",
        enum: ["1024x1024", "768x1344", "864x1152", "1344x768", "1152x864", "1440x720", "720x1440"],
        description: "Image size (default: 1024x1024)",
        default: "1024x1024",
      },
    },
    required: ["prompt"],
  },
};

export interface ImageUnderstandArgs {
  files: string[];
  prompt: string;
  thinking?: boolean;
}

export interface ImageGenerateArgs {
  prompt: string;
  size?: string;
}

export function isImageUnderstandArgs(args: unknown): args is ImageUnderstandArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "files" in args &&
    Array.isArray((args as { files: unknown }).files) &&
    "prompt" in args &&
    typeof (args as { prompt: string }).prompt === "string"
  );
}

export function isImageGenerateArgs(args: unknown): args is ImageGenerateArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "prompt" in args &&
    typeof (args as { prompt: string }).prompt === "string"
  );
}
```

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add tool definitions for image understanding and generation"
```

---

## Task 4: Implement image understanding tool

**Files:**
- Create: `src/tools/image-understand.ts`
- Test: `__tests__/integration/image-understand.test.ts`

**Purpose:** Tool handler that converts user input to Zhipu API format.

**Step 1: Write the failing test**

Create `__tests__/integration/image-understand.test.ts`:

```typescript
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { understandImage } from '../../src/tools/image-understand.js';
import * as zhipu from '../../src/api/zhipu.js';

describe('image-understand tool', () => {
  it('should convert local file to base64 and call API', async () => {
    // Mock file reading
    mock.method(
      await import('node:fs/promises'),
      'readFile',
      () => Promise.resolve(Buffer.from('test-image-data'))
    );

    // Mock Zhipu API
    mock.method(zhipu, 'callVisionAPI', async () => 'Test response');

    const result = await understandImage({
      files: ['/tmp/test.png'],
      prompt: 'What is in this image?',
      thinking: false
    });

    assert.equal(result, 'Test response');
  });

  it('should pass through URLs directly', async () => {
    mock.method(zhipu, 'callVisionAPI', async () => 'URL response');

    const result = await understandImage({
      files: ['https://example.com/image.png'],
      prompt: 'Describe this image'
    });

    assert.equal(result, 'URL response');
  });

  it('should handle multiple files', async () => {
    mock.method(
      await import('node:fs/promises'),
      'readFile',
      () => Promise.resolve(Buffer.from('test-data'))
    );

    mock.method(zhipu, 'callVisionAPI', async () => 'Multi-file response');

    const result = await understandImage({
      files: ['/tmp/img1.png', '/tmp/img2.jpg'],
      prompt: 'Compare these images'
    });

    assert.equal(result, 'Multi-file response');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx tsx __tests__/integration/image-understand.test.ts`

Expected: FAIL with "Cannot find module '../../src/tools/image-understand.ts'"

**Step 3: Write minimal implementation**

Create `src/tools/image-understand.ts`:

```typescript
import { readFile } from 'node:fs/promises';
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

/**
 * Build Zhipu API message format from user input
 */
async function buildVisionContent(
  files: string[],
  prompt: string
): Promise<ContentItem[]> {
  const content: ContentItem[] = [];

  // Process each file
  for (const file of files) {
    const normalized = normalizeInput(file);
    let dataUrl: string;

    if (normalized.type === 'local') {
      // Read file and convert to base64
      const base64 = await readAsBase64(normalized.value);
      const mimeType = getMimeType(normalized.value);
      dataUrl = `data:${mimeType};base64,${base64}`;
    } else if (normalized.type === 'base64') {
      // Check if it already has data URI prefix
      if (normalized.value.startsWith('data:')) {
        dataUrl = normalized.value;
      } else {
        // Raw base64, need to detect type
        const fileType = detectFileType(normalized.value);
        const mimeTypes = {
          image: 'image/png',
          video: 'video/mp4',
          file: 'application/octet-stream'
        };
        const mimeType = mimeTypes[fileType || 'file'] || 'application/octet-stream';
        dataUrl = `data:${mimeType};base64,${normalized.value}`;
      }
    } else {
      // URL
      dataUrl = normalized.value;
    }

    // Determine content type based on file type
    const fileType = normalized.type === 'local'
      ? detectFileType(normalized.value)
      : normalized.type === 'url'
      ? detectFileType(dataUrl)
      : null;

    if (fileType === 'image') {
      content.push({
        type: 'image_url',
        image_url: { url: dataUrl }
      });
    } else if (fileType === 'video') {
      content.push({
        type: 'video_url',
        video_url: { url: dataUrl }
      });
    } else {
      content.push({
        type: 'file_url',
        file_url: { url: dataUrl }
      });
    }
  }

  // Add text prompt
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

  if (!files || files.length === 0) {
    throw new Error('At least one file is required');
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt is required');
  }

  // Build API message format
  const content = await buildVisionContent(files, prompt);

  // Call Zhipu API
  const messages = [{
    role: 'user' as const,
    content
  }];

  return await callVisionAPI(messages, thinking);
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx __tests__/integration/image-understand.test.ts`

Expected: PASS all tests

**Step 5: Commit**

```bash
git add src/tools/image-understand.ts __tests__/integration/image-understand.test.ts
git commit -m "feat: implement image understanding tool"
```

---

## Task 5: Implement image generation tool

**Files:**
- Create: `src/tools/image-generate.ts`
- Test: `__tests__/integration/image-generate.test.ts`

**Step 1: Write the failing test**

Create `__tests__/integration/image-generate.test.ts`:

```typescript
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { generateImage } from '../../src/tools/image-generate.js';
import * as zhipu from '../../src/api/zhipu.js';

describe('image-generate tool', () => {
  it('should call API with prompt and default size', async () => {
    mock.method(zhipu, 'callImageGenAPI', async () => 'https://example.com/image.png');

    const result = await generateImage({
      prompt: 'A beautiful sunset'
    });

    assert.equal(result, 'https://example.com/image.png');
  });

  it('should call API with custom size', async () => {
    mock.method(zhipu, 'callImageGenAPI', async () => 'https://example.com/image.png');

    await generateImage({
      prompt: 'Test',
      size: '768x1344'
    });

    const callArgs = mock.method(zhipu, 'callImageGenAPI').mock.calls[0];
    assert.equal(callArgs.arguments[1], '768x1344');
  });

  it('should validate prompt length', async () => {
    await assert.rejects(
      () => generateImage({ prompt: '' }),
      /Prompt is required/
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx tsx __tests__/integration/image-generate.test.ts`

Expected: FAIL with "Cannot find module '../../src/tools/image-generate.ts'"

**Step 3: Write minimal implementation**

Create `src/tools/image-generate.ts`:

```typescript
import { callImageGenAPI } from '../api/zhipu.js';
import type { ImageGenerateArgs } from '../types.js';

/**
 * Main function: Generate image from text prompt
 */
export async function generateImage(
  args: ImageGenerateArgs
): Promise<string> {
  const { prompt, size = '1024x1024' } = args;

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt is required');
  }

  if (prompt.length > 4000) {
    throw new Error('Prompt is too long (max 4000 characters)');
  }

  // Validate size
  const validSizes = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'];
  if (!validSizes.includes(size)) {
    throw new Error(
      `Invalid size: ${size}. Must be one of: ${validSizes.join(', ')}`
    );
  }

  return await callImageGenAPI(prompt, size);
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx __tests__/integration/image-generate.test.ts`

Expected: PASS all tests

**Step 5: Commit**

```bash
git add src/tools/image-generate.ts __tests__/integration/image-generate.test.ts
git commit -m "feat: implement image generation tool"
```

---

## Task 6: Register tools in index.ts

**Files:**
- Modify: `src/index.ts`

**Purpose:** Wire up the new tools to the MCP server.

**Step 1: Update imports**

Add to imports in `src/index.ts`:

```typescript
import {
  WEB_SEARCH_TOOL,
  READ_URL_TOOL,
  IMAGE_OCR_TOOL,
  IMAGE_UNDERSTAND_TOOL,
  IMAGE_GENERATE_TOOL,
  isSearXNGWebSearchArgs,
  isImageOCRArgs,
  isImageUnderstandArgs,
  isImageGenerateArgs
} from "./types.js";

import { logMessage, setLogLevel } from "./logging.js";
import { performWebSearch } from "./search.js";
import { fetchAndConvertToMarkdown } from "./url-reader.js";
import { createConfigResource, createHelpResource } from "./resources.js";
import { createHttpServer } from "./http-server.js";
import { validateEnvironment as validateEnv } from "./error-handler.js";
import { extractTextFromImage } from "./tools/image-ocr.js";
import { understandImage } from "./tools/image-understand.js";
import { generateImage } from "./tools/image-generate.js";
```

**Step 2: Update server capabilities**

Update the capabilities object in `src/index.ts`:

```typescript
capabilities: {
  logging: {},
  resources: {},
  tools: {
    searxng_web_search: {
      description: WEB_SEARCH_TOOL.description,
      schema: WEB_SEARCH_TOOL.inputSchema,
    },
    web_url_read: {
      description: READ_URL_TOOL.description,
      schema: READ_URL_TOOL.inputSchema,
    },
    image_understand: {
      description: IMAGE_UNDERSTAND_TOOL.description,
      schema: IMAGE_UNDERSTAND_TOOL.inputSchema,
    },
    image_generate: {
      description: IMAGE_GENERATE_TOOL.description,
      schema: IMAGE_GENERATE_TOOL.inputSchema,
    },
  },
}
```

**Step 3: Update ListTools handler**

Update the tools list in `ListToolsRequestSchema` handler:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logMessage(server, "debug", "Handling list_tools request");
  return {
    tools: [
      WEB_SEARCH_TOOL,
      READ_URL_TOOL,
      IMAGE_OCR_TOOL,
      IMAGE_UNDERSTAND_TOOL,
      IMAGE_GENERATE_TOOL
    ],
  };
});
```

**Step 4: Add tool call handlers**

Add to the `CallToolRequestSchema` handler (after existing image_generate handler):

```typescript
} else if (name === "image_understand") {
  if (!isImageUnderstandArgs(args)) {
    throw new Error("Invalid arguments for image understanding");
  }

  const result = await understandImage(args);

  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  };
} else if (name === "image_generate") {
  if (!isImageGenerateArgs(args)) {
    throw new Error("Invalid arguments for image generation");
  }

  const result = await generateImage(args);

  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  };
} else {
  throw new Error(`Unknown tool: ${name}`);
}
```

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: register image understanding and generation tools in MCP server"
```

---

## Task 7: Add environment variable validation

**Files:**
- Modify: `src/error-handler.ts`

**Purpose:** Validate ZHIPUAI_API_KEY when image tools are enabled.

**Step 1: Add validation function**

Add to `src/error-handler.ts`:

```typescript
export function validateZhipuAI(): string | null {
  // Check if image tools are being used
  // For now, we'll just warn if API key is missing when tools are registered
  if (!process.env.ZHIPUAI_API_KEY) {
    // Don't block startup, but warn that image tools won't work
    console.warn('WARNING: ZHIPUAI_API_KEY not set. Image understanding and generation tools will not work.');
  }
  return null;
}
```

**Step 2: Update main validation**

Update the `main()` function in `src/index.ts` to call the new validation:

```typescript
async function main() {
  // Environment validation
  const validationError = validateEnv();
  if (validationError) {
    console.error(`❌ ${validationError}`);
    process.exit(1);
  }

  // Validate Zhipu AI (warning only, don't block startup)
  validateZhipuAI();
```

**Step 3: Commit**

```bash
git add src/error-handler.ts src/index.ts
git commit -m "feat: add ZhipuAI API key validation"
```

---

## Task 8: Add test fixtures

**Files:**
- Create: `__tests__/fixtures/test-image.png`
- Create: `__tests__/fixtures/test-document.pdf`

**Step 1: Create test image**

Create a minimal test image:

```bash
# Create a simple 1x1 PNG test image
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > __tests__/fixtures/test-image.png
```

**Step 2: Create test document**

Create a minimal test PDF:

```bash
echo "Test document content" > __tests__/fixtures/test-document.txt
# Or copy an existing PDF if available
```

**Step 3: Commit**

```bash
git add __tests__/fixtures/
git commit -m "test: add test fixtures for image and document processing"
```

---

## Task 9: Run all tests

**Step 1: Run test suite**

Run: `npm test`

Expected: All tests pass

**Step 2: Build project**

Run: `npm run build`

Expected: Build succeeds without errors

**Step 3: Test with MCP Inspector**

Run: `npm run inspector`

Then test the tools manually:
1. Test `image_understand` with a local image path
2. Test `image_understand` with an image URL
3. Test `image_generate` with a text prompt

**Step 4: Commit**

```bash
git commit --allow-empty -m "test: verify all tests pass and build succeeds"
```

---

## Task 10: Update documentation

**Files:**
- Modify: `README.md`
- Modify: `readme/zh-CN.md`

**Step 1: Update English README**

Add to README.md in the MCP Tools section:

```markdown
### Image Understanding Tool

**Tool Name:** `image_understand`

**Parameters:**
- `files` (array, required): File paths, URLs, or base64 data
- `prompt` (string, required): Question or instruction
- `thinking` (boolean, optional): Enable deep thinking mode

**Example:**

```json
{
  "files": ["/path/to/image.png"],
  "prompt": "What objects are in this image?",
  "thinking": false
}
```

**Response:** Text description or answer

### Image Generation Tool

**Tool Name:** `image_generate`

**Parameters:**
- `prompt` (string, required): Image description
- `size` (string, optional): Image size (default: "1024x1024")

**Example:**

```json
{
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x1024"
}
```

**Response:** Image URL
```

**Step 2: Update environment variables section**

Add to README.md:

```markdown
| `ZHIPUAI_API_KEY` | No* | - | Zhipu AI API key for image tools |

*Required when using image_understand or image_generate tools
```

**Step 3: Update Chinese README**

Make equivalent changes to `readme/zh-CN.md`

**Step 4: Commit**

```bash
git add README.md readme/zh-CN.md
git commit -m "docs: add image AI tools documentation"
```

---

## Task 11: Create feature summary document

**Files:**
- Create: `docs/features/image-ai-tools.md`

**Step 1: Create feature documentation**

Create comprehensive feature documentation:

```markdown
# Image AI Tools Feature

## Overview

This feature adds two new MCP tools for working with images using Zhipu AI's free models:
- **Image Understanding** (`image_understand`): Powered by GLM-4.6V-Flash
- **Image Generation** (`image_generate`): Powered by Cogview-3-Flash

## Capabilities

### Image Understanding

The `image_understand` tool supports:
- Visual Q&A - Ask questions about images
- Content description - Describe what's in an image
- OCR - Extract text from images
- Video understanding - Analyze video content
- Document parsing - Extract information from PDFs
- Frontend code replication - Generate code from screenshots

### Image Generation

The `image_generate` tool creates images from text descriptions with multiple resolution options.

## Usage Examples

See README.md for detailed usage instructions.

## API Reference

[Zhipu AI Documentation](https://open.bigmodel.cn/dev/api)
```

**Step 2: Commit**

```bash
git add docs/features/image-ai-tools.md
git commit -m "docs: add image AI tools feature documentation"
```

---

## Task 12: Final verification and merge preparation

**Step 1: Run full test suite**

Run: `npm test && npm run test:coverage`

Expected: All tests pass with good coverage

**Step 2: Verify build**

Run: `npm run build`

Expected: Clean build with no errors

**Step 3: Check git diff**

Run: `git diff main --stat`

Verify all changes are expected

**Step 4: Update version if needed**

Check `package.json` - if this is a new feature, consider bumping version

**Step 5: Create merge commit message**

```bash
git checkout main
git merge feature/image-ai-tools --no-ff -m "feat: add image understanding and generation tools

Add two new MCP tools powered by Zhipu AI's free models:
- image_understand: GLM-4.6V-Flash for visual analysis
- image_generate: Cogview-3-Flash for image generation

Features:
- Support for images, videos, and documents
- Local file path to base64 conversion
- Multiple output resolutions
- Deep thinking mode support

Closes #[issue-number]"
```

**Step 6: Push to remote**

```bash
git push origin feature/image-ai-tools
```

Then create pull request on GitHub.

---

## Completion Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Build succeeds without errors
- [ ] Manual testing with MCP Inspector successful
- [ ] Documentation updated (README, feature docs)
- [ ] Environment variables documented
- [ ] Code follows existing patterns
- [ ] No console errors or warnings
- [ ] Feature branch pushed to remote
- [ ] Pull request created

---

**Total estimated time:** 3-4 hours
**Number of tasks:** 12
**Number of commits:** ~15 commits for incremental progress
