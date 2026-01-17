# Image OCR Feature Design

**Date:** 2025-01-17
**Author:** Claude + User
**Status:** Design Complete, Ready for Implementation

## Overview

Add image OCR (Optical Character Recognition) capability to open-mcp server, enabling Claude Desktop/Claude Code to extract text from images including screenshots, scanned documents, and photos.

**Target Audience:** Personal developers
**Deployment:** Docker container
**Processing Capacity:** < 100 images/day (single instance)

---

## Architecture

### System Architecture

```
Claude Desktop/Claude Code
        ↓
    open-mcp (MCP Server)
        ↓
    ┌─────────────────────┐
    │  Image OCR Tool     │
    │  - Receive request  │
    │  - Validate image   │
    │  - Call OCR service │
    └─────────────────────┘
        ↓
    HTTP POST
        ↓
┌─────────────────────────────┐
│  PaddleOCR Container         │
│  - FastAPI Server            │
│  - PaddleOCR Engine          │
│  - Lightweight Model (17MB)  │
│  - Languages: Chinese, English│
└─────────────────────────────┘
        ↓
    Extracted Text
        ↓
    Return to Claude
```

### Components

1. **image_ocr Tool** (in open-mcp)
   - Receives image file path/URL
   - Validates format and size
   - Calls PaddleOCR container
   - Returns extracted text with metadata

2. **paddleocr-service** (Docker container)
   - FastAPI HTTP server on port 8080
   - PaddleOCR lightweight model (PP-OCRv4_mobile_ch)
   - Single worker, CPU mode
   - Health check endpoint

---

## MCP Tool Definition

### Tool: image_ocr

```typescript
{
  name: "image_ocr",
  description: "Extract text from images using OCR. Supports screenshots, scanned documents, and photos. Returns extracted text with confidence scores.",
  inputSchema: {
    type: "object",
    properties: {
      image: {
        type: "string",
        description: "Image file path, URL, or base64 data"
      },
      lang: {
        type: "string",
        enum: ["auto", "ch", "en"],
        description: "Language: auto-detect, Chinese, or English",
        default: "auto"
      }
    },
    required: ["image"]
  }
}
```

### Request Example

```json
{
  "image": "/path/to/screenshot.png",
  "lang": "auto"
}
```

### Response Format

```json
{
  "success": true,
  "text": "Extracted text content...",
  "confidence": 0.95,
  "language": "ch",
  "processingTime": "1.2s",
  "engine": "paddleocr",
  "blocks": [
    {
      "text": "First line of text",
      "box": [x1, y1, x2, y2],
      "confidence": 0.96
    }
  ]
}
```

---

## Docker Configuration

### docker-compose.yml Addition

```yaml
services:
  # Existing services...

  # PaddleOCR Service
  paddleocr-service:
    image: paddlepaddle/paddle:latest
    container_name: paddleocr-service
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - MODEL_NAME=PP-OCRv4_mobile_ch
      - USE_GPU=false
      - WORKERS=1
      - LOG_LEVEL=info
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      - ./models:/root/.paddleocr
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### .env Configuration

```bash
# PaddleOCR Configuration
PADDLEOCR_URL=http://paddleocr-service:8080
PADDLEOCR_MODEL=PP-OCRv4_mobile_ch
PADDLEOCR_PORT=8080
PADDLEOCR_USE_GPU=false

# Limits
MAX_IMAGE_SIZE=10485760  # 10MB
SUPPORTED_FORMATS=png,jpg,jpeg,webp,bmp
```

---

## Implementation

### File: src/tools/image-ocr.ts

```typescript
import { MCPSearXNGError } from '../error-handler.js';
import fs from 'fs/promises';

interface OCROptions {
  image: string;
  lang?: 'auto' | 'ch' | 'en';
}

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

async function validateImage(image: string): Promise<void> {
  const supportedFormats = ['png', 'jpg', 'jpeg', 'webp', 'bmp'];
  const ext = image.split('.').pop()?.toLowerCase();

  if (!ext || !supportedFormats.includes(ext)) {
    throw new MCPSearXNGError(
      `Unsupported image format: ${ext}. Supported: ${supportedFormats.join(', ')}`,
      'invalid_request'
    );
  }

  if (image.startsWith('/') || image.startsWith('./')) {
    const stats = await fs.stat(image);
    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE || '10485760');

    if (stats.size > maxSize) {
      throw new MCPSearXNGError(
        `Image too large: ${stats.size} bytes (max: ${maxSize})`,
        'invalid_request'
      );
    }
  }
}

async function callPaddleOCR(options: OCROptions): Promise<OCRResult> {
  const paddleocrUrl = process.env.PADDLEOCR_URL || 'http://paddleocr-service:8080';

  const response = await fetch(`${paddleocrUrl}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: options.image,
      lang: options.lang || 'auto',
    }),
  });

  if (!response.ok) {
    throw new MCPSearXNGError(
      `OCR service error: ${response.status}`,
      'server_error'
    );
  }

  return await response.json();
}

export async function extractTextFromImage(
  options: OCROptions
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    await validateImage(options.image);
    const result = await callPaddleOCR(options);
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

    const response: OCRResult = {
      success: true,
      text: result.text,
      confidence: result.confidence || 0.9,
      language: result.language || 'unknown',
      processingTime,
      engine: 'paddleocr',
      blocks: result.blocks,
    };

    if (response.confidence < 0.5) {
      response.warning = 'Low confidence score, image quality may be poor';
    }

    return response;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new MCPSearXNGError(
        `Image file not found: ${options.image}`,
        'invalid_request'
      );
    }

    if (error.code === 'ECONNREFUSED') {
      throw new MCPSearXNGError(
        'OCR service is not running. Please start the paddleocr-service container.',
        'server_error'
      );
    }

    throw error;
  }
}
```

### Modify: src/index.ts

Add tool registration and handler:

```typescript
import { extractTextFromImage } from './tools/image-ocr.js';

// In ListToolsRequestSchema handler
const tools = [
  // Existing tools...
  WEB_SEARCH_TOOL,
  READ_URL_TOOL,

  // New OCR tool
  {
    name: 'image_ocr',
    description: 'Extract text from images using OCR...',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        lang: {
          type: 'string',
          enum: ['auto', 'ch', 'en'],
          default: 'auto'
        }
      },
      required: ['image']
    }
  }
];

// In CallToolRequestSchema handler
switch (name) {
  case 'image_ocr':
    return await extractTextFromImage(args);
  // ... existing cases
}
```

---

## Error Handling

### Error Scenarios

| Scenario | Handling |
|----------|----------|
| Image not found | Return friendly error: "Image file not found" |
| Unsupported format | List supported formats |
| File too large | Show max size limit (10MB) |
| OCR service down | Prompt to start container |
| No text detected | Return empty text + warning |
| Low confidence | Return result + warning |
| Timeout | 30s timeout with error message |

---

## Testing

### Test Structure

```
__tests__/
├── unit/
│   └── image-ocr.test.ts
├── integration/
│   └── ocr-service.test.ts
└── helpers/
    └── test-images/
        ├── simple-text.png
        ├── chinese.png
        ├── english.png
        └── complex-layout.png
```

### Manual Testing

```bash
# 1. Start services
docker-compose up -d paddleocr-service

# 2. Health check
curl http://localhost:8080/health

# 3. Test with MCP Inspector
npm run inspector

# 4. Run tests
npm test
```

---

## Usage Examples

### Example 1: Extract Text from Screenshot

```
User: Help me extract the text from this screenshot

Claude: I'll use the OCR tool to extract text from this image.

[Calls image_ocr tool]

Extracted text:
────────────────────────────
[Extracted content here...]
────────────────────────────

Confidence: 95%
Processing time: 1.2s
```

### Example 2: Batch Processing

```
User: Process all scanned documents in this folder

Claude: I'll process each document:

1. document1.png → ✅ Extracted
2. document2.png → ✅ Extracted
3. document3.png → ✅ Extracted

All documents processed successfully.
```

---

## Implementation Roadmap

### Phase 1: Core OCR (1-2 days)
- [ ] Add paddleocr-service to docker-compose.yml
- [ ] Implement src/tools/image-ocr.ts
- [ ] Register tool in src/index.ts
- [ ] Basic error handling
- [ ] Unit tests

### Phase 2: Integration (1 day)
- [ ] Test with MCP Inspector
- [ ] Integration tests
- [ ] Update README.md
- [ ] Add usage examples

### Phase 3: Polish (optional)
- [ ] Performance optimization
- [ ] Additional languages
- [ ] Image preprocessing
- [ ] Batch processing support

---

## Technical Decisions

### Why PaddleOCR?
- ✅ 95% accuracy for Chinese
- ✅ Lightweight model (17MB)
- ✅ Official MCP support
- ✅ Free and open source
- ✅ Active community (50K+ GitHub stars)

### Why Docker Deployment?
- ✅ Easy integration with existing docker-compose
- ✅ Isolated environment
- ✅ Simple deployment
- ✅ Resource management

### Why Single Instance?
- ✅ Sufficient for personal use (<100 images/day)
- ✅ Simple architecture
- ✅ Lower resource usage
- ✅ Easy to scale later if needed

---

## Future Enhancements

### Potential Features
1. **Batch processing** - Process multiple images in one request
2. **PDF support** - Extract text from PDF files
3. **Handwriting support** - Integrate handwriting OCR model
4. **More languages** - Add Japanese, Korean, etc.
5. **Image preprocessing** - Auto-rotate, denoise, enhance
6. **Confidence scoring** - Detailed per-block confidence
7. **Layout analysis** - Detect tables, columns, headers

---

## References

- [PaddleOCR GitHub](https://github.com/PaddlePaddle/PaddleOCR) - 50K+ stars
- [PaddleOCR MCP Documentation](https://paddlepaddle.github.io/PaddleOCR/main/en/version3.x/deployment/mcp_server.html)
- [PaddleOCR 3.0 Technical Report](https://arxiv.org/pdf/2507.05595)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Document Status:** ✅ Design Complete
**Next Step:** Implementation (Phase 1)
**Estimated Time:** 2-3 days
