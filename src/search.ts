import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { createProxyAgent } from "./proxy.js";
import { logMessage } from "./logging.js";
import {
  createConfigurationError,
  createNetworkError,
  createServerError,
  GATEWAY_URL_REQUIRED_MESSAGE,
  type ErrorContext
} from "./error-handler.js";

export async function performWebSearch(
  server: Server,
  query: string,
  limit: number = 10
) {
  const startTime = Date.now();

  logMessage(server, "info", `Starting web search: "${query}" (limit: ${limit})`);

  const gatewayUrl = process.env.GATEWAY_URL;
  if (!gatewayUrl) {
    throw createConfigurationError(GATEWAY_URL_REQUIRED_MESSAGE);
  }

  // Build and validate the endpoint URL
  let searchUrl: URL;
  try {
    searchUrl = new URL('/api/firecrawl-search', gatewayUrl);
  } catch {
    throw createConfigurationError(
      `Invalid GATEWAY_URL format: ${gatewayUrl}. Use format: http://your-gateway.com:80`
    );
  }

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
  const proxyAgent = createProxyAgent(searchUrl.toString());
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
    logMessage(server, "info", `Making POST request to: ${searchUrl.toString()}`);
    response = await fetch(searchUrl.toString(), requestOptions);
  } catch (error: any) {
    logMessage(server, "error", `Network error during search request: ${error.message}`, { query, url: searchUrl.toString() });
    throw createNetworkError(error, { url: searchUrl.toString(), gatewayUrl });
  }

  if (!response.ok) {
    let responseBody: string;
    try {
      responseBody = await response.text();
    } catch {
      responseBody = '[Could not read response body]';
    }
    throw createServerError(response.status, response.statusText, responseBody, { url: searchUrl.toString(), gatewayUrl });
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
