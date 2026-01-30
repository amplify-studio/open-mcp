import { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface SearXNGWeb {
  results: Array<{
    title: string;
    content: string;
    url: string;
  }>;
}

export function isSearXNGWebSearchArgs(args: unknown): args is {
  query: string;
  limit?: number;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "query" in args &&
    typeof (args as { query: string }).query === "string"
  );
}

export const WEB_SEARCH_TOOL: Tool = {
  name: "searxng_web_search",
  description:
    "Performs web search using the Gateway API Firecrawl search. " +
    "Returns search results with title, content, URL, and relevance score. " +
    "Use this for general queries, news, articles, and online content.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query string",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10, max: 100)",
        default: 10,
        minimum: 1,
        maximum: 100,
      },
    },
    required: ["query"],
  },
};

export const READ_URL_TOOL: Tool = {
  name: "web_url_read",
  description:
    "Read the content from an URL. " +
    "Use this for further information retrieving to understand the content of each URL.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "URL",
      },
      startChar: {
        type: "number",
        description: "Starting character position for content extraction (default: 0)",
        minimum: 0,
      },
      maxLength: {
        type: "number",
        description: "Maximum number of characters to return",
        minimum: 1,
      },
      section: {
        type: "string",
        description: "Extract content under a specific heading (searches for heading text)",
      },
      paragraphRange: {
        type: "string",
        description: "Return specific paragraph ranges (e.g., '1-5', '3', '10-')",
      },
      readHeadings: {
        type: "boolean",
        description: "Return only a list of headings instead of full content",
      },
    },
    required: ["url"],
  },
};

export const IMAGE_OCR_TOOL: Tool = {
  name: "image_ocr",
  description:
    "Perform OCR (Optical Character Recognition) on images using PaddleOCR. " +
    "Extracts text from image files (supports PNG, JPG, JPEG, BMP, GIF formats). " +
    "Use this when you need to extract text from screenshots, scanned documents, or other images containing text.",
  inputSchema: {
    type: "object",
    properties: {
      imageFile: {
        type: "string",
        description: "Path to the image file to perform OCR on",
      },
    },
    required: ["imageFile"],
  },
};

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
      file: {
        type: "string",
        description: "File path, URL, or base64 data (image, video, or PDF)",
      },
      prompt: {
        type: "string",
        description: "Question or instruction for the visual content analysis",
      },
      thinking: {
        type: "boolean",
        description: "Enable deep thinking mode for complex reasoning (default: true)",
        default: true,
      },
    },
    required: ["file", "prompt"],
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

export interface ImageOCRArgs {
  imageFile: string;
}

export interface ImageUnderstandArgs {
  file: string;
  prompt: string;
  thinking?: boolean;
}

export interface ImageGenerateArgs {
  prompt: string;
  size?: string;
}

/**
 * Generic type guard for checking if an object has a property of a specific type
 */
function hasProperty<T extends string>(
  args: unknown,
  prop: T,
  type: 'string' | 'number' | 'boolean' | 'object'
): args is Record<T, unknown> {
  return (
    typeof args === "object" &&
    args !== null &&
    prop in args &&
    typeof (args as Record<T, unknown>)[prop] === type
  );
}

export function isImageOCRArgs(args: unknown): args is ImageOCRArgs {
  return hasProperty(args, 'imageFile', 'string');
}

export function isImageUnderstandArgs(args: unknown): args is ImageUnderstandArgs {
  return (
    hasProperty(args, 'prompt', 'string') &&
    hasProperty(args, 'file', 'string')
  );
}

export function isImageGenerateArgs(args: unknown): args is ImageGenerateArgs {
  return hasProperty(args, 'prompt', 'string');
}

export function isWebUrlReadArgs(args: unknown): args is {
  url: string;
  startChar?: number;
  maxLength?: number;
  section?: string;
  paragraphRange?: string;
  readHeadings?: boolean;
} {
  return hasProperty(args, 'url', 'string');
}
