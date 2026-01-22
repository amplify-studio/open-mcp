# Image AI Tools Feature

## Overview

This feature adds three new MCP tools for working with images using Zhipu AI's free models:
- **Image OCR** (`image_ocr`): Extract text from images using PaddleOCR
- **Image Understanding** (`image_understand`): Powered by GLM-4.6V-Flash
- **Image Generation** (`image_generate`): Powered by Cogview-3-Flash

## Capabilities

### Image OCR

The `image_ocr` tool supports:
- Text extraction from images using PaddleOCR
- Multiple image formats (PNG, JPG, JPEG)
- Local file paths, URLs, or base64 data
- Multilingual text recognition

### Image Understanding

The `image_understand` tool supports:
- Visual Q&A - Ask questions about images
- Content description - Describe what's in an image
- OCR - Extract text from images (using GLM-4V)
- Video understanding - Analyze video content
- Document parsing - Extract information from PDFs
- Frontend code replication - Generate code from screenshots

### Image Generation

The `image_generate` tool creates images from text descriptions with multiple resolution options.

## Usage Examples

### Image OCR

```json
{
  "image": "/path/to/image.png"
}
```

### Image Understanding

```json
{
  "files": ["/path/to/image.png"],
  "prompt": "What objects are in this image?",
  "thinking": false
}
```

### Image Generation

```json
{
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x1024"
}
```

## Configuration

Set the `ZHIPUAI_API_KEY` environment variable to use these tools:

```bash
export ZHIPUAI_API_KEY="your-api-key-here"
```

**Note:** The API key is only required when using image tools. The server will start without it, but image tools will not work.

## API Reference

- [Zhipu AI Documentation](https://open.bigmodel.cn/dev/api)
- [GLM-4V Vision Model](https://open.bigmodel.cn/dev/api#glm-4v)
- [Cogview-3 Image Generation](https://open.bigmodel.cn/dev/api#cogview)

## Implementation Details

### Tool Locations

- `src/tools/image-ocr.ts` - PaddleOCR-based text extraction
- `src/tools/image-understand.ts` - GLM-4.6V-Flash visual understanding
- `src/tools/image-generate.ts` - Cogview-3-Flash image generation

### Type Definitions

Tool schemas are defined in `src/types.ts`:
- `IMAGE_OCR_TOOL` - OCR tool schema
- `IMAGE_UNDERSTAND_TOOL` - Image understanding schema
- `IMAGE_GENERATE_TOOL` - Image generation schema

### Error Handling

All image tools use custom error handling with clear error messages:
- Missing API key
- Invalid image format
- API rate limits
- Network errors

## Testing

Test fixtures are available in `__tests__/fixtures/`:
- `test-image.png` - 1x1 pixel PNG for testing
- `test-document.txt` - Sample document for testing

## Benefits

1. **Free to Use**: Zhipu AI offers free tier for these models
2. **High Quality**: State-of-the-art vision models
3. **Easy Integration**: Simple MCP tool interface
4. **Flexible Input**: Supports files, URLs, and base64
5. **Bilingual**: Works with both English and Chinese content
