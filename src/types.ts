import { Tool } from "@modelcontextprotocol/sdk/types.js";

export function isSearXNGWebSearchArgs(args: unknown): args is {
  query: string;
  limit?: number;
} {
  if (
    typeof args !== "object" ||
    args === null ||
    !("query" in args) ||
    typeof (args as { query: string }).query !== "string"
  ) {
    return false;
  }

  const searchArgs = args as Partial<{ limit: number }>;
  if (searchArgs.limit !== undefined && (typeof searchArgs.limit !== "number" || searchArgs.limit < 1 || searchArgs.limit > 100)) {
    return false;
  }

  return true;
}

export const WEB_SEARCH_TOOL: Tool = {
  name: "searxng_web_search",
  description:
    "Performs web search using the Gateway API Firecrawl search. " +
    "Returns search results with title, content, and URL. " +
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

export function isImageUnderstandArgs(args: unknown): args is ImageUnderstandArgs {
  if (!hasProperty(args, 'prompt', 'string') || !hasProperty(args, 'file', 'string')) {
    return false;
  }

  const typedArgs = args as Partial<ImageUnderstandArgs>;

  if (typedArgs.thinking !== undefined && typeof typedArgs.thinking !== 'boolean') {
    return false;
  }

  return true;
}

export function isImageGenerateArgs(args: unknown): args is ImageGenerateArgs {
  if (!hasProperty(args, 'prompt', 'string')) {
    return false;
  }

  const typedArgs = args as Partial<ImageGenerateArgs>;

  if (typedArgs.size !== undefined && typeof typedArgs.size !== 'string') {
    return false;
  }

  return true;
}

export function isWebUrlReadArgs(args: unknown): args is WebUrlReadArgs {
  if (!hasProperty(args, 'url', 'string')) {
    return false;
  }

  const urlArgs = args as Partial<WebUrlReadArgs>;

  if (urlArgs.startChar !== undefined && (typeof urlArgs.startChar !== 'number' || urlArgs.startChar < 0)) {
    return false;
  }
  if (urlArgs.maxLength !== undefined && (typeof urlArgs.maxLength !== 'number' || urlArgs.maxLength < 1)) {
    return false;
  }
  if (urlArgs.section !== undefined && typeof urlArgs.section !== 'string') {
    return false;
  }
  if (urlArgs.paragraphRange !== undefined && typeof urlArgs.paragraphRange !== 'string') {
    return false;
  }
  if (urlArgs.readHeadings !== undefined && typeof urlArgs.readHeadings !== 'boolean') {
    return false;
  }

  return true;
}

export interface WebUrlReadArgs {
  url: string;
  startChar?: number;
  maxLength?: number;
  section?: string;
  paragraphRange?: string;
  readHeadings?: boolean;
}
