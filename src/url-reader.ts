import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { createProxyAgent } from "./proxy.js";
import { logMessage } from "./logging.js";
import { urlCache } from "./cache.js";
import {
  createURLFormatError,
  createConfigurationError,
  createNetworkError,
  createServerError,
  createContentError,
  createTimeoutError,
  createEmptyContentWarning,
  createUnexpectedError,
  GATEWAY_URL_REQUIRED_MESSAGE,
  type ErrorContext
} from "./error-handler.js";

interface PaginationOptions {
  startChar?: number;
  maxLength?: number;
  section?: string;
  paragraphRange?: string;
  readHeadings?: boolean;
}

function applyCharacterPagination(content: string, startChar: number = 0, maxLength?: number): string {
  if (startChar >= content.length) {
    return "";
  }

  const start = Math.max(0, startChar);
  const end = maxLength ? Math.min(content.length, start + maxLength) : content.length;

  return content.slice(start, end);
}

function extractSection(markdownContent: string, sectionHeading: string): string {
  const lines = markdownContent.split('\n');
  const sectionRegex = new RegExp(`^#{1,6}\s*.*${sectionHeading}.*$`, 'i');

  let startIndex = -1;
  let currentLevel = 0;

  // Find the section start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (sectionRegex.test(line)) {
      startIndex = i;
      currentLevel = (line.match(/^#+/) || [''])[0].length;
      break;
    }
  }

  if (startIndex === -1) {
    return "";
  }

  // Find the section end (next heading of same or higher level)
  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^#+/);
    if (match && match[0].length <= currentLevel) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join('\n');
}

function extractParagraphRange(markdownContent: string, range: string): string {
  const paragraphs = markdownContent.split('\n\n').filter(p => p.trim().length > 0);

  // Parse range (e.g., "1-5", "3", "10-")
  const rangeMatch = range.match(/^(\d+)(?:-(\d*))?$/);
  if (!rangeMatch) {
    return "";
  }

  const start = parseInt(rangeMatch[1]) - 1; // Convert to 0-based index
  const endStr = rangeMatch[2];

  if (start < 0 || start >= paragraphs.length) {
    return "";
  }

  if (endStr === undefined) {
    // Single paragraph (e.g., "3")
    return paragraphs[start] || "";
  } else if (endStr === "") {
    // Range to end (e.g., "10-")
    return paragraphs.slice(start).join('\n\n');
  } else {
    // Specific range (e.g., "1-5")
    const end = parseInt(endStr);
    return paragraphs.slice(start, end).join('\n\n');
  }
}

function extractHeadings(markdownContent: string): string {
  const lines = markdownContent.split('\n');
  const headings = lines.filter(line => /^#{1,6}\s/.test(line));

  if (headings.length === 0) {
    return "No headings found in the content.";
  }

  return headings.join('\n');
}

function applyPaginationOptions(markdownContent: string, options: PaginationOptions): string {
  let result = markdownContent;

  // Apply heading extraction first if requested
  if (options.readHeadings) {
    return extractHeadings(result);
  }

  // Apply section extraction
  if (options.section) {
    result = extractSection(result, options.section);
    if (result === "") {
      return `Section "${options.section}" not found in the content.`;
    }
  }

  // Apply paragraph range filtering
  if (options.paragraphRange) {
    result = extractParagraphRange(result, options.paragraphRange);
    if (result === "") {
      return `Paragraph range "${options.paragraphRange}" is invalid or out of bounds.`;
    }
  }

  // Apply character-based pagination last
  if (options.startChar !== undefined || options.maxLength !== undefined) {
    result = applyCharacterPagination(result, options.startChar, options.maxLength);
  }

  return result;
}

export async function fetchAndConvertToMarkdown(
  server: Server,
  url: string,
  timeoutMs: number = 10000,
  paginationOptions: PaginationOptions = {}
) {
  const startTime = Date.now();
  logMessage(server, "info", `Fetching URL: ${url}`);

  // Check cache first
  const cachedEntry = urlCache.get(url);
  if (cachedEntry) {
    logMessage(server, "info", `Using cached content for URL: ${url}`);
    const result = applyPaginationOptions(cachedEntry.markdownContent, paginationOptions);
    const duration = Date.now() - startTime;
    logMessage(server, "info", `Processed cached URL: ${url} (${result.length} chars in ${duration}ms)`);
    return result;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    logMessage(server, "error", `Invalid URL format: ${url}`);
    throw createURLFormatError(url);
  }

  // Build gateway API URL
  const gatewayUrl = process.env.GATEWAY_URL;

  if (!gatewayUrl) {
    throw createConfigurationError(GATEWAY_URL_REQUIRED_MESSAGE);
  }
  const gatewayApiUrl = `${gatewayUrl}/api/read/${encodeURIComponent(url)}`;

  // Create an AbortController instance
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Prepare request options with proxy support
    const requestOptions: RequestInit = {
      signal: controller.signal,
    };

    // Add proxy dispatcher if proxy is configured
    const proxyAgent = createProxyAgent(gatewayApiUrl);
    if (proxyAgent) {
      (requestOptions as any).dispatcher = proxyAgent;
    }

    let response: Response;
    try {
      response = await fetch(gatewayApiUrl, requestOptions);
    } catch (error: any) {
      throw createNetworkError(error, { url, gatewayUrl, timeout: timeoutMs });
    }

    if (!response.ok) {
      let responseBody: string;
      try {
        responseBody = await response.text();
      } catch {
        responseBody = '[Could not read response body]';
      }
      throw createServerError(response.status, response.statusText, responseBody, { url, gatewayUrl });
    }

    // Retrieve content from gateway API (JSON response)
    let markdownContent: string;
    try {
      const jsonData = await response.json();

      // Gateway API returns: { content: "...", title: "...", url: "...", wordCount: N }
      if (!jsonData.content) {
        throw createContentError("Gateway API returned empty content field.", url);
      }

      markdownContent = jsonData.content;
    } catch (error: any) {
      if (error.name === 'MCPSearXNGError') {
        throw error;
      }
      throw createContentError(
        `Failed to read gateway response: ${error.message || 'Unknown error'}`,
        url
      );
    }

    if (!markdownContent || markdownContent.trim().length === 0) {
      logMessage(server, "warning", `Empty content from gateway: ${url}`);
      return createEmptyContentWarning(url);
    }

    // Cache the markdown content from gateway
    urlCache.set(url, "", markdownContent);

    // Apply pagination options
    const content = applyPaginationOptions(markdownContent, paginationOptions);

    const duration = Date.now() - startTime;
    logMessage(server, "info", `Successfully fetched and converted URL: ${url} (${content.length} chars in ${duration}ms)`);

    // Return as JSON string
    return JSON.stringify({
      url,
      content,
      charCount: content.length,
      duration: `${duration}ms`,
      cached: !!cachedEntry
    }, null, 2);
  } catch (error: any) {
    if (error.name === "AbortError") {
      logMessage(server, "error", `Timeout fetching URL: ${url} (${timeoutMs}ms)`);
      throw createTimeoutError(timeoutMs, url);
    }
    // Re-throw our enhanced errors
    if (error.name === 'MCPSearXNGError') {
      logMessage(server, "error", `Error fetching URL: ${url} - ${error.message}`);
      throw error;
    }
    
    // Catch any unexpected errors
    logMessage(server, "error", `Unexpected error fetching URL: ${url}`, error);
    throw createUnexpectedError(error, { url });
  } finally {
    // Clean up the timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
}
