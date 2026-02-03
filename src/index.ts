#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  SetLevelRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  LoggingLevel,
} from "@modelcontextprotocol/sdk/types.js";

// Import modularized functionality
import {
  IMAGE_GENERATE_TOOL,
  IMAGE_UNDERSTAND_TOOL,
  READ_URL_TOOL,
  WEB_SEARCH_TOOL,
  isImageGenerateArgs,
  isImageUnderstandArgs,
  isSearXNGWebSearchArgs,
  isWebUrlReadArgs,
} from "./types.js";
import { logMessage, setLogLevel } from "./logging.js";
import { performWebSearch } from "./search.js";
import { fetchAndConvertToMarkdown } from "./url-reader.js";
import { understandImage } from "./tools/image-understand.js";
import { generateImage } from "./tools/image-generate.js";
import { createConfigResource, createHelpResource } from "./resources.js";
import { createHttpServer } from "./http-server.js";
import { validateEnvironment as validateEnv } from "./error-handler.js";

// Use a static version string that will be updated by the version script
const packageVersion = "0.10.2";

// Export the version for use in other modules
export { packageVersion };

// Server implementation
const server = new Server(
  {
    name: "ihor-sokoliuk/mcp-searxng",
    version: packageVersion,
  },
  {
    capabilities: {
      logging: {},
      resources: {},
      tools: {
        searxng_web_search: {
          description: WEB_SEARCH_TOOL.description,
          schema: WEB_SEARCH_TOOL.inputSchema,
        },
        web_url_read: {
          description: READ_URL_TOOL.description,
          schema: READ_URL_TOOL.inputSchema,
        },
        image_understand: {
          description: IMAGE_UNDERSTAND_TOOL.description,
          schema: IMAGE_UNDERSTAND_TOOL.inputSchema,
        },
        image_generate: {
          description: IMAGE_GENERATE_TOOL.description,
          schema: IMAGE_GENERATE_TOOL.inputSchema,
        },
      },
    },
  }
);

// List tools handler - dynamically return available tools based on configuration
server.setRequestHandler(ListToolsRequestSchema, async () => {
  resetActivityTimeout();
  logMessage(server, "debug", "Handling list_tools request");

  const hasGateway = !!process.env.GATEWAY_URL;
  const hasZhipuAI = !!process.env.ZHIPUAI_API_KEY;

  const tools = [];

  // Add gateway-dependent tools if GATEWAY_URL is configured
  if (hasGateway) {
    tools.push(WEB_SEARCH_TOOL, READ_URL_TOOL);
  }

  // Add AI tools if ZHIPUAI_API_KEY is configured
  if (hasZhipuAI) {
    tools.push(IMAGE_UNDERSTAND_TOOL, IMAGE_GENERATE_TOOL);
  }

  // If neither is configured, return all tools (for compatibility)
  if (tools.length === 0) {
    tools.push(
      WEB_SEARCH_TOOL,
      READ_URL_TOOL,
      IMAGE_UNDERSTAND_TOOL,
      IMAGE_GENERATE_TOOL
    );
  }

  logMessage(server, "info", `Available tools: ${tools.map(t => t.name).join(', ')}`);

  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  resetActivityTimeout();
  const { name, arguments: args } = request.params;
  logMessage(server, "debug", `Handling call_tool request: ${name}`);

  try {
    let result: string;

    switch (name) {
      case "searxng_web_search": {
        if (!process.env.GATEWAY_URL) {
          throw new Error("GATEWAY_URL environment variable is required for web search. Configure it or use image tools only.");
        }
        if (!isSearXNGWebSearchArgs(args)) {
          throw new Error("Invalid arguments for web search");
        }
        result = await performWebSearch(server, args.query, args.limit);
        break;
      }

      case "web_url_read": {
        if (!process.env.GATEWAY_URL) {
          throw new Error("GATEWAY_URL environment variable is required for URL reading. Configure it or use image tools only.");
        }
        if (!isWebUrlReadArgs(args)) {
          throw new Error("Invalid arguments for URL reading");
        }
        // Use default 30s timeout (undefined) instead of hardcoded 10s
        result = await fetchAndConvertToMarkdown(server, args.url, undefined, {
          startChar: args.startChar,
          maxLength: args.maxLength,
          section: args.section,
          paragraphRange: args.paragraphRange,
          readHeadings: args.readHeadings,
        });
        break;
      }

      case "image_understand": {
        if (!process.env.ZHIPUAI_API_KEY) {
          throw new Error("ZHIPUAI_API_KEY environment variable is required for image understanding");
        }
        if (!isImageUnderstandArgs(args)) {
          throw new Error("Invalid arguments for image understanding");
        }
        result = await understandImage(args);
        break;
      }

      case "image_generate": {
        if (!process.env.ZHIPUAI_API_KEY) {
          throw new Error("ZHIPUAI_API_KEY environment variable is required for image generation");
        }
        if (!isImageGenerateArgs(args)) {
          throw new Error("Invalid arguments for image generation");
        }
        result = await generateImage(args);
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (error) {
    logMessage(server, "error", `Tool execution error: ${error instanceof Error ? error.message : String(error)}`, {
      tool: name,
      args: args,
      error: error instanceof Error ? error.stack : String(error)
    });
    throw error;
  }
});

// Logging level handler
server.setRequestHandler(SetLevelRequestSchema, async (request) => {
  resetActivityTimeout();
  const { level } = request.params;
  logMessage(server, "info", `Setting log level to: ${level}`);
  setLogLevel(level);
  return {};
});

// List resources handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  resetActivityTimeout();
  logMessage(server, "debug", "Handling list_resources request");
  return {
    resources: [
      {
        uri: "config://server-config",
        mimeType: "application/json",
        name: "Server Configuration",
        description: "Current server configuration and environment variables"
      },
      {
        uri: "help://usage-guide",
        mimeType: "text/markdown",
        name: "Usage Guide",
        description: "How to use the MCP SearXNG server effectively"
      }
    ]
  };
});

// Read resource handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  resetActivityTimeout();
  const { uri } = request.params;
  logMessage(server, "debug", `Handling read_resource request for: ${uri}`);

  switch (uri) {
    case "config://server-config":
      return {
        contents: [
          {
            uri: uri,
            mimeType: "application/json",
            text: createConfigResource()
          }
        ]
      };

    case "help://usage-guide":
      return {
        contents: [
          {
            uri: uri,
            mimeType: "text/markdown",
            text: createHelpResource()
          }
        ]
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Inactivity timeout: shut down after 3 minutes of no client requests
const INACTIVITY_TIMEOUT_MS = 180000; // 3 minutes
let activityTimeout: NodeJS.Timeout | undefined;

/**
 * Reset the inactivity timer. Called on every MCP request.
 * If no request occurs within the timeout period, the server exits.
 */
function resetActivityTimeout(): void {
  clearTimeout(activityTimeout);
  activityTimeout = setTimeout(() => {
    logMessage(server, "info", `No activity for ${INACTIVITY_TIMEOUT_MS / 1000}s, shutting down`);
    process.exit(0);
  }, INACTIVITY_TIMEOUT_MS);
}

// Shutdown configuration
const SHUTDOWN_TIMEOUT_MS = 10000;

function setupShutdownHandlers(mode: 'http' | 'stdio', httpServer?: import('http').Server): void {
  const shutdown = (signal: string): void => {
    clearTimeout(activityTimeout);
    const logFn = mode === 'http' ? console.log : (msg: string) => logMessage(server, 'info', msg);
    logFn(`Received ${signal}. Shutting down ${mode.toUpperCase()} server...`);

    if (mode === 'http' && httpServer) {
      const timeoutId = setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);

      httpServer.close(() => {
        clearTimeout(timeoutId);
        console.log('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Main function
async function main(): Promise<void> {
  // Environment validation
  const validationError = validateEnv();
  if (validationError) {
    console.error(`❌ ${validationError}`);
    process.exit(1);
  }

  // Validate Zhipu AI (warning only, don't block startup)
  if (!process.env.ZHIPUAI_API_KEY) {
    console.warn('WARNING: ZHIPUAI_API_KEY not set. Image tools will not work.');
  }

  // Check for HTTP transport mode
  const httpPort = process.env.MCP_HTTP_PORT;
  const hasZhipuAI = !!process.env.ZHIPUAI_API_KEY;
  const gatewayUrlDisplay = process.env.GATEWAY_URL || (hasZhipuAI ? "Not configured (optional, AI tools available)" : "Not configured (required for search/URL tools)");

  if (httpPort) {
    const port = parseInt(httpPort, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(`Invalid HTTP port: ${httpPort}. Must be between 1-65535.`);
      process.exit(1);
    }

    console.log(`GATEWAY_URL: ${gatewayUrlDisplay}`);
    console.log(`Starting HTTP transport on port ${port}`);
    const app = await createHttpServer(server);

    const httpServer = app.listen(port, () => {
      console.log(`HTTP server listening on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`MCP endpoint: http://localhost:${port}/mcp`);
    });

    setupShutdownHandlers('http', httpServer);
  } else {
    // Default STDIO transport
    // Show helpful message when running in terminal
    if (process.stdin.isTTY) {
      console.log(`🔍 MCP SearXNG Server v${packageVersion} - Ready`);
      console.log("✅ Configuration valid");
      console.log(`🌐 Gateway URL: ${gatewayUrlDisplay}`);
      console.log("📡 Waiting for MCP client connection via STDIO...\n");
    }

    const transport = new StdioServerTransport();

    // Handle stdin close (when client disconnects)
    const handleStdioClose = () => {
      clearTimeout(activityTimeout);
      logMessage(server, "info", "STDIO connection closed by client");
      transport.close().then(() => process.exit(0));
    };

    // Listen for both stdin close and transport close
    process.stdin.on('close', handleStdioClose);
    transport.onclose = handleStdioClose;

    await server.connect(transport);

    // Start inactivity timer after connection
    resetActivityTimeout();

    // Log after connection is established
    logMessage(server, "info", `MCP SearXNG Server v${packageVersion} connected via STDIO`);
    logMessage(server, "info", `Environment: ${process.env.NODE_ENV || 'development'}`);
    logMessage(server, "info", `Gateway URL: ${gatewayUrlDisplay}`);

    setupShutdownHandlers('stdio');
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server (CLI entrypoint)
main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

