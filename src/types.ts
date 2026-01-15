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
