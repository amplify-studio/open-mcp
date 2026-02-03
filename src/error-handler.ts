/**
 * Concise error handling for MCP SearXNG server
 * Provides clear, focused error messages that identify the root cause
 */

export const GATEWAY_URL_REQUIRED_MESSAGE = "GATEWAY_URL is required. Set it to your Gateway API URL (e.g., http://your-gateway.com:80)";

export interface ErrorContext {
  url?: string;
  gatewayUrl?: string;
  timeout?: number;
}

export class MCPSearXNGError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPSearXNGError';
  }
}

export function createConfigurationError(message: string): MCPSearXNGError {
  return new MCPSearXNGError(`🔧 Configuration Error: ${message}`);
}

export function createNetworkError(error: any, context: ErrorContext): MCPSearXNGError {
  const target = context.gatewayUrl ? 'Gateway server' : 'target server';

  if (error.code === 'ECONNREFUSED') {
    return new MCPSearXNGError(`🌐 Connection Error: ${target} is not responding (${context.url})`);
  }

  if (error.code === 'ENOTFOUND' || error.code === 'EAI_NONAME') {
    const hostname = context.url ? new URL(context.url).hostname : 'unknown';
    return new MCPSearXNGError(`🌐 DNS Error: Cannot resolve hostname "${hostname}"`);
  }

  if (error.code === 'ETIMEDOUT') {
    return new MCPSearXNGError(`🌐 Timeout Error: ${target} is too slow to respond`);
  }

  if (error.message?.includes('certificate')) {
    return new MCPSearXNGError(`🌐 SSL Error: Certificate problem with ${target}`);
  }

  const errorMsg = error.message || error.code || 'Connection failed';
  if (errorMsg === 'fetch failed' || errorMsg === 'Connection failed') {
    const guidance = context.gatewayUrl
      ? 'Check if the GATEWAY_URL is correct and the Gateway server is available'
      : 'Check if the target URL is accessible';
    return new MCPSearXNGError(`🌐 Network Error: ${errorMsg}. ${guidance}`);
  }

  return new MCPSearXNGError(`🌐 Network Error: ${errorMsg}`);
}

export function createServerError(status: number, statusText: string, _responseBody: string, context: ErrorContext): MCPSearXNGError {
  const target = context.gatewayUrl ? 'Gateway server' : 'Website';

  if (status === 403) {
    return new MCPSearXNGError(`🚫 ${target} Error (${status}): Access blocked (bot detection or geo-restriction)`);
  }

  if (status === 404) {
    return new MCPSearXNGError(`🚫 ${target} Error (${status}): Page not found`);
  }

  if (status === 429) {
    return new MCPSearXNGError(`🚫 ${target} Error (${status}): Rate limit exceeded`);
  }

  if (status >= 500) {
    return new MCPSearXNGError(`🚫 ${target} Error (${status}): Internal server error`);
  }

  return new MCPSearXNGError(`🚫 ${target} Error (${status}): ${statusText}`);
}

export function createNoResultsMessage(query: string): string {
  return `🔍 No results found for "${query}". Try different search terms or check if the Gateway service is working.`;
}

export function createURLFormatError(url: string): MCPSearXNGError {
  return new MCPSearXNGError(`🔧 URL Format Error: Invalid URL "${url}"`);
}

export function createContentError(message: string, url: string): MCPSearXNGError {
  return new MCPSearXNGError(`📄 Content Error: ${message} (${url})`);
}

export function createTimeoutError(timeout: number, url: string): MCPSearXNGError {
  const hostname = new URL(url).hostname;
  return new MCPSearXNGError(`⏱️ Timeout Error: ${hostname} took longer than ${timeout}ms to respond`);
}

export function createEmptyContentWarning(url: string): string {
  return `📄 Content Warning: Page fetched but appears empty after conversion (${url}). May contain only media or require JavaScript.`;
}

export function createUnexpectedError(error: any, context: ErrorContext): MCPSearXNGError {
  return new MCPSearXNGError(`❓ Unexpected Error: ${error.message || String(error)}`);
}

export function validateEnvironment(): string | null {
  const issues: string[] = [];

  // Validate GATEWAY_URL if provided
  const gatewayUrl = process.env.GATEWAY_URL;
  if (gatewayUrl) {
    try {
      const url = new URL(gatewayUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        issues.push(`GATEWAY_URL has invalid protocol: ${url.protocol}`);
      }
    } catch {
      issues.push(`GATEWAY_URL has invalid format: ${gatewayUrl}`);
    }
  }

  // Validate auth credentials are paired correctly
  const hasUsername = process.env.AUTH_USERNAME;
  const hasPassword = process.env.AUTH_PASSWORD;

  if (hasUsername && !hasPassword) {
    issues.push("AUTH_USERNAME is set but AUTH_PASSWORD is missing");
  }
  if (hasPassword && !hasUsername) {
    issues.push("AUTH_PASSWORD is set but AUTH_USERNAME is missing");
  }

  if (issues.length === 0) {
    return null;
  }

  return `⚠️ Configuration Issues: ${issues.join(', ')}. GATEWAY_URL must be set to a valid HTTP(S) URL`;
}
