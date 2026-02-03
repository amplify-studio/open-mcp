# Image AI Tools Design Document

**Date**: 2025-01-21
**Author**: Design Discussion
**Status**: Approved

## Overview

Add two new MCP tools to integrate Zhipu AI's vision capabilities:
- **Image Understanding**: Call GLM-4.6V-Flash for visual question answering
- **Image Generation**: Call Cogview-3-Flash for text-to-image generation

## Architecture

### Components

```
src/
├── api/
│   └── zhipu.ts              # Zhipu API client (shared)
├── tools/
│   ├── image-understand.ts   # Image understanding tool
│   └── image-generate.ts     # Image generation tool
├── utils/
│   └── file-helper.ts        # File processing utilities
├── types.ts                  # Add tool definitions
└── error-handler.ts          # Add ZHIPUAI_API_KEY validation
```

### Tool Definitions

#### 1. `image_understand` Tool

**Purpose**: Multi-modal visual understanding using GLM-4.6V-Flash

**Capabilities**:
- Image description and Q&A
- Video understanding (temporal analysis)
- Document/table parsing
- OCR extraction
- Frontend code replication
- Function Call support

**Input Parameters**:
```typescript
{
  files: string[],      // File paths/URLs/base64 (images, videos, PDFs)
  prompt: string,       // User question or instruction
  thinking?: boolean    // Enable deep thinking (default: false)
}
```

**Output**: Text response from the model

#### 2. `image_generate` Tool

**Purpose**: Text-to-image generation using Cogview-3-Flash

**Input Parameters**:
```typescript
{
  prompt: string,       // Image description
  size?: string         // Image size (default: "1024x1024")
}
```

**Output**: Generated image URL

## Data Flow

### Image Understanding Flow

```
User Input
  ↓
image_understand tool
  ↓
buildVisionContent: Convert input format
  ├─ detectFileType: Determine file type
  ├─ readAsBase64: Local file → base64 (if needed)
  └─ Build messages array (Zhipu format)
  ↓
callVisionAPI: Send request
  ├─ Read ZHIPUAI_API_KEY
  ├─ POST https://open.bigmodel.cn/api/paas/v4/chat/completions
  └─ Parse response
  ↓
Return result to user
```

### Image Generation Flow

```
User Input (prompt, size?)
  ↓
image_generate tool
  ↓
Build request parameters
  ↓
callImageGenAPI: Send request
  ├─ POST https://open.bigmodel.cn/api/paas/v4/images/generations
  └─ Parse response (image URL)
  ↓
Return image URL to user
```

## File Conversion Logic

The middleware layer handles file format conversion:

1. **Detect input type**:
   - Local file path (starts with `/`, `./`, `../`) → read and convert to base64
   - HTTP(S) URL → use directly
   - base64 data (`data:image` or raw base64) → use directly

2. **Determine content type** (based on file extension):
   - `.png/.jpg/.jpeg/.gif/.webp` → `image_url`
   - `.mp4/.mov/.avi` → `video_url`
   - `.pdf/.txt/.docx` → `file_url`

3. **Send to VLM**: Zhipu API standard format

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ZHIPUAI_API_KEY` | Yes (when image tools enabled) | Zhipu AI API key |

## Error Handling

### Environment Validation

```typescript
export function validateZhipuAI(): string | null {
  const hasImageTools =
    process.env.ENABLE_IMAGE_UNDERSTAND === 'true' ||
    process.env.ENABLE_IMAGE_GENERATE === 'true';

  if (hasImageTools && !process.env.ZHIPUAI_API_KEY) {
    return "ZHIPUAI_API_KEY is required when image tools are enabled";
  }
  return null;
}
```

### API Error Handling

Unified error handling in `api/zhipu.ts`:
- 401: Authentication failed
- 429: Rate limit exceeded
- 500: Server error

### File Processing Errors

- File not found → Clear error message
- Unsupported format → List supported formats
- File too large → Size limit warning
- Base64 conversion failed → Detailed error

## Testing Strategy

### Unit Tests

- `utils/file-helper.test.ts`: File type detection, base64 conversion
- `api/zhipu.test.ts`: API calls, error handling

### Integration Tests

- `tools/image-understand.test.ts`: End-to-end with mock API
- `tools/image-generate.test.ts`: Parameter building

### Test Fixtures

```
__tests__/fixtures/
├── test-image.png
├── test-video.mp4
└── test-document.pdf
```

### Manual Testing

```bash
export ZHIPUAI_API_KEY="your-key"
npm run inspector
```

## Zhipu API Format

### Vision API Request

```json
{
  "model": "glm-4.6v-flash",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "https://xxx.png or base64"
          }
        },
        {
          "type": "text",
          "text": "User question"
        }
      ]
    }
  ],
  "thinking": {
    "type": "enabled"
  }
}
```

### Supported Content Types

- `image_url`: Image URL or base64
- `video_url`: Video URL
- `file_url`: File URL
- `text`: Text content
