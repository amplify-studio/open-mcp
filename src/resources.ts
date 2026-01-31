import { getCurrentLogLevel } from "./logging.js";
import { packageVersion } from "./index.js";

export function createConfigResource() {
  const config = {
    serverInfo: {
      name: "ihor-sokoliuk/mcp-searxng",
      version: packageVersion,
      description: "MCP server for SearXNG integration via Gateway API"
    },
    environment: {
      gatewayUrl: process.env.GATEWAY_URL || "Not configured",
      hasAuth: !!(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD),
      hasProxy: !!(process.env.HTTP_PROXY ?? process.env.HTTPS_PROXY ?? process.env.http_proxy ?? process.env.https_proxy),
      hasNoProxy: !!(process.env.NO_PROXY ?? process.env.no_proxy),
      nodeVersion: process.version,
      currentLogLevel: getCurrentLogLevel()
    },
    capabilities: {
      tools: ["searxng_web_search", "web_url_read", "image_understand", "image_generate"],
      logging: true,
      resources: true,
      transports: process.env.MCP_HTTP_PORT ? ["stdio", "http"] : ["stdio"]
    }
  };

  return JSON.stringify(config, null, 2);
}

export function createHelpResource() {
  return `# SearXNG MCP Server Help

## Overview
This is a Model Context Protocol (MCP) server that provides web search capabilities through a Gateway API and URL content reading functionality.

## Available Tools

### 1. searxng_web_search
Performs web searches using the configured Gateway API (Firecrawl search).

**Parameters:**
- \`query\` (required): The search query string
- \`limit\` (optional): Maximum number of results (default: 10, max: 100)

### 2. web_url_read
Reads and converts web page content to Markdown format via Gateway API.

**Parameters:**
- \`url\` (required): The URL to fetch and convert
- \`startChar\` (optional): Starting character position (default: 0)
- \`maxLength\` (optional): Maximum number of characters to return
- \`section\` (optional): Extract content under a specific heading
- \`paragraphRange\` (optional): Return specific paragraph ranges (e.g., "1-5", "3", "10-")
- \`readHeadings\` (optional): Return only a list of headings

### 3. image_understand
Analyze images, videos, and documents using Zhipu GLM-4.6V-Flash model.

**Parameters:**
- \`file\` (required): File path, URL, or base64 data
- \`prompt\` (required): Question or instruction for analysis
- \`thinking\` (optional): Enable deep thinking mode (default: true)

### 4. image_generate
Generate images from text using Zhipu Cogview-3-Flash model.

**Parameters:**
- \`prompt\` (required): Text description of the image to generate
- \`size\` (optional): Image size (default: "1024x1024")

## Configuration

### Required Environment Variables
- \`GATEWAY_URL\`: URL of the Gateway API

### Optional Environment Variables
- \`ZHIPUAI_API_KEY\`: API key for image tools (understand/generate)
- \`AUTH_USERNAME\` & \`AUTH_PASSWORD\`: Basic authentication for Gateway
- \`HTTP_PROXY\` / \`HTTPS_PROXY\`: Proxy server configuration
- \`NO_PROXY\`: Comma-separated list of hosts to bypass proxy
- \`MCP_HTTP_PORT\`: Enable HTTP transport on specified port

## Transport Modes

### STDIO (Default)
Standard input/output transport for desktop clients like Claude Desktop.

### HTTP (Optional)
RESTful HTTP transport for web applications. Set \`MCP_HTTP_PORT\` to enable.

## Usage Examples

### Search the web
\`\`\`
Tool: searxng_web_search
Args: {"query": "latest AI developments", "limit": 10}
\`\`\`

### Read a specific article
\`\`\`
Tool: web_url_read
Args: {"url": "https://example.com/article"}
\`\`\`

### Analyze an image
\`\`\`
Tool: image_understand
Args: {"file": "https://example.com/image.jpg", "prompt": "Describe this image"}
\`\`\`

### Generate an image
\`\`\`
Tool: image_generate
Args: {"prompt": "A sunset over mountains", "size": "1024x1024"}
\`\`\`

## Troubleshooting

1. **Network errors**: Check if Gateway API is running and accessible
2. **Empty results**: Try different search terms or check Gateway service
3. **Timeout errors**: The server has a 10-second timeout for URL fetching
4. **Image tools not working**: Ensure ZHIPUAI_API_KEY is set

Use logging level "debug" for detailed request information.

## Current Configuration
See the "config://server-config" resource for live settings.
`;
}
