import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { createProxyAgent } from "./proxy.js";
import { logMessage } from "./logging.js";
import {
  createConfigurationError,
  createNetworkError,
  createServerError,
  type ErrorContext
} from "./error-handler.js";

export async function performWebSearch(
  server: Server,
  query: string,
  limit: number = 10
) {
  const startTime = Date.now();

  logMessage(server, "info", `Starting web search: "${query}" (limit: ${limit})`);

  const gatewayUrl = process.env.GATEWAY_URL || "http://115.190.91.253:80";

  // Validate gateway URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(gatewayUrl);
  } catch (error) {
    throw createConfigurationError(
      `Invalid GATEWAY_URL format: ${gatewayUrl}. Use format: http://115.190.91.253:80`
    );
  }

  const url = new URL('/api/firecrawl-search', parsedUrl);

  // Prepare request body
  const requestBody = {
    query,
    limit
  };

  // Prepare request options
  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  };

  // Add proxy dispatcher if configured
  const proxyAgent = createProxyAgent(url.toString());
  if (proxyAgent) {
    (requestOptions as any).dispatcher = proxyAgent;
  }

  // Add basic authentication if configured
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;

  if (username && password) {
    const base64Auth = Buffer.from(`${username}:${password}`).toString('base64');
    (requestOptions.headers as Record<string, string>)['Authorization'] = `Basic ${base64Auth}`;
  }

  // Add User-Agent if configured
  const userAgent = process.env.USER_AGENT;
  if (userAgent) {
    (requestOptions.headers as Record<string, string>)['User-Agent'] = userAgent;
  }

  // Fetch with error handling
  let response: Response;
  try {
    logMessage(server, "info", `Making POST request to: ${url.toString()}`);
    response = await fetch(url.toString(), requestOptions);
  } catch (error: any) {
    logMessage(server, "error", `Network error during search request: ${error.message}`, { query, url: url.toString() });
    const context: ErrorContext = {
      url: url.toString(),
      gatewayUrl,
      proxyAgent: !!proxyAgent,
      username
    };
    throw createNetworkError(error, context);
  }

  if (!response.ok) {
    let responseBody: string;
    try {
      responseBody = await response.text();
    } catch {
      responseBody = '[Could not read response body]';
    }

    const context: ErrorContext = {
      url: url.toString(),
      gatewayUrl
    };
    throw createServerError(response.status, response.statusText, responseBody, context);
  }

  // Parse JSON response
  let data: any;
  try {
    data = await response.json();
  } catch (error: any) {
    let responseText: string;
    try {
      responseText = await response.text();
    } catch {
      responseText = '[Could not read response text]';
    }

    const context: ErrorContext = { url: url.toString() };
    throw new Error(`Failed to parse JSON response: ${responseText}`);
  }

  // Handle Firecrawl API response format: {success: true, data: [...]}
  let results = data.results || data.data || [];

  // If wrapped in success object
  if (data.success && data.data) {
    results = data.data;
  }

  if (!Array.isArray(results)) {
    throw new Error(`Invalid response format: results is not an array`);
  }

  if (results.length === 0) {
    logMessage(server, "info", `No results found for query: "${query}"`);
    return JSON.stringify({
      query,
      results: [],
      totalCount: 0,
      duration: `${Date.now() - startTime}ms`
    }, null, 2);
  }

  // Format results (API returns: url, title, description)
  const formattedResults = results.map((result: any) => ({
    title: result.title || "",
    content: result.description || result.content || "",
    url: result.url || result.link || ""
  }));

  const duration = Date.now() - startTime;
  logMessage(server, "info", `Search completed: "${query}" - ${formattedResults.length} results in ${duration}ms`);

  // Return as JSON string
  return JSON.stringify({
    query,
    results: formattedResults,
    totalCount: formattedResults.length,
    duration: `${duration}ms`
  }, null, 2);
}
