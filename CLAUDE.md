# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that integrates SearXNG search API, providing web search and URL reading capabilities to AI assistants. The server is written in TypeScript and uses the `@modelcontextprotocol/sdk` for MCP protocol implementation.

## Development Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run watch          # Development mode with file watching
npm test               # Run all tests
npm run test:coverage  # Generate coverage report
npm run inspector      # Run MCP inspector for testing
```

### Running a Single Test

```bash
npx tsx __tests__/unit/search.test.ts
```

### Running Evals

```bash
SEARXNG_URL=YOUR_URL OPENAI_API_KEY=your-key npx mcp-eval evals.ts src/index.ts
```

## Architecture

### Entry Point

- `src/index.ts` - Main entry point that creates the MCP server, sets up request handlers for tools and resources, and manages transport (STDIO or HTTP)

### Core Modules

- `src/types.ts` - TypeScript interfaces and MCP tool definitions (`WEB_SEARCH_TOOL`, `READ_URL_TOOL`)
- `src/search.ts` - `performWebSearch()` function that queries SearXNG API
- `src/url-reader.ts` - `fetchAndConvertToMarkdown()` function with pagination options (startChar, maxLength, section, paragraphRange, readHeadings)
- `src/cache.ts` - Simple in-memory cache with TTL for URL content (default 1 minute TTL, 30s cleanup interval)
- `src/proxy.ts` - Proxy agent creation using Undici's `ProxyAgent` with NO_PROXY bypass support
- `src/error-handler.ts` - Custom error factory functions (`createConfigurationError`, `createNetworkError`, etc.)
- `src/logging.ts` - Logging utilities via MCP logging protocol
- `src/resources.ts` - MCP resource providers for config and help
- `src/http-server.ts` - Express-based HTTP transport (optional, enabled via `MCP_HTTP_PORT`)

### Transport Modes

The server supports two transports:
- **STDIO** (default): Standard MCP transport via stdin/stdout
- **HTTP** (optional): Set `MCP_HTTP_PORT` env var to enable HTTP server at `/mcp` endpoint with health check at `/health`

## Environment Variables

### Required
- `SEARXNG_URL` - SearXNG instance URL (default: `http://localhost:8080`)

### Optional
- `AUTH_USERNAME` / `AUTH_PASSWORD` - HTTP Basic Auth
- `USER_AGENT` - Custom User-Agent header
- `HTTP_PROXY` / `HTTPS_PROXY` - Proxy URLs
- `NO_PROXY` - Comma-separated bypass list
- `MCP_HTTP_PORT` - Enable HTTP transport on specified port

## MCP Tools

1. **searxng_web_search** - Web search with pagination, time filtering, language selection, safe search
2. **web_url_read** - Fetch URL content and convert to markdown with advanced extraction options

## MCP Resources

1. **config://server-config** - Current server configuration as JSON
2. **help://usage-guide** - Usage guide in markdown

## Testing

Tests use a custom test framework (not jest/vitest). Test files are in `__tests__/` directory with:
- Unit tests in `__tests__/unit/`
- Integration tests in `__tests__/integration/`
- Shared helpers in `__tests__/helpers/`

Tests automatically set `SEARXNG_URL=https://test-searx.example.com` for isolation.

### Test Patterns

Use `testFunction()` from `test-utils.ts` for test assertions:
```typescript
await testFunction('Test description', () => {
  // Test code
  assert.equal(actual, expected);
}, results);
```

## TypeScript Configuration

- Target: ES2022
- Module: NodeNext with NodeNext module resolution
- Strict mode enabled
- Output: `dist/` directory

## Dependencies

Key dependencies:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `undici` - HTTP client with ProxyAgent support
- `node-html-markdown` - HTML to markdown conversion
- `express` - HTTP server (for HTTP transport)
- `cors` - CORS support for HTTP transport

## Version Management

The version is defined as `packageVersion` in `src/index.ts` and is automatically updated by the `scripts/update-version.js` script during release.
