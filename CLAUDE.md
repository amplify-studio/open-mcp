# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides web search and URL reading capabilities via a Gateway API. The server is written in TypeScript using the `@modelcontextprotocol/sdk`. It connects to a Gateway service that uses Firecrawl for search and URL reading operations.

## Development Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run watch          # Development mode with file watching
npm test               # Run all tests (uses custom test framework)
npm run test:coverage  # Generate coverage report with c8
npm run inspector      # Run MCP inspector for testing
npm run bootstrap      # Install dependencies and build
```

### Running a Single Test

The project uses a custom test framework (not jest/vitest). Run individual test files with:

```bash
npx tsx __tests__/unit/search.test.ts
npx tsx __tests__/integration/url-reader.test.ts
```

### Running Evals

```bash
SEARXNG_URL=https://test-searx.example.com OPENAI_API_KEY=your-key npx mcp-eval evals.ts src/index.ts
```

## Architecture

### Entry Point

- `src/index.ts` - Main entry point that creates the MCP server, registers request handlers for tools/resources, and manages transport (STDIO or HTTP). The version is defined as `packageVersion` constant and is auto-updated by `scripts/update-version.js` during release.

### Core Modules

- `src/types.ts` - TypeScript interfaces and MCP tool definitions (`WEB_SEARCH_TOOL`, `READ_URL_TOOL`). Contains type guard functions `isSearXNGWebSearchArgs()` and `isWebUrlReadArgs()` (defined in index.ts).
- `src/search.ts` - `performWebSearch()` - Queries Gateway API's `/api/firecrawl-search` endpoint. Uses Firecrawl search via Gateway. Returns formatted JSON with query, results array, totalCount, and duration.
- `src/url-reader.ts` - `fetchAndConvertToMarkdown()` - Fetches via Gateway API's `/api/read/{url}` endpoint. Supports advanced pagination options (startChar, maxLength, section, paragraphRange, readHeadings). Processes markdown returned from Gateway (no local HTML conversion).
- `src/cache.ts` - Simple in-memory cache for URL content with TTL (default 1 minute, 30s cleanup interval)
- `src/proxy.ts` - Creates Undici `ProxyAgent` with NO_PROXY bypass support. Proxy agent is attached to request options via `dispatcher` property.
- `src/error-handler.ts` - Custom `MCPSearXNGError` class with factory functions: `createConfigurationError`, `createNetworkError`, `createServerError`, `createURLFormatError`, `createTimeoutError`, etc. Also contains `validateEnvironment()` for startup validation.
- `src/logging.ts` - Logging utilities using MCP protocol's `server.logging()` with level support (debug, info, warning, error)
- `src/resources.ts` - MCP resource providers: `createConfigResource()` returns server config as JSON, `createHelpResource()` returns usage guide
- `src/http-server.ts` - Express-based HTTP transport (optional, enabled via `MCP_HTTP_PORT` env var). Endpoints: `/health` (health check), `/mcp` (JSON-RPC over HTTP with SSE support)

### Transport Modes

- **STDIO** (default): Standard MCP transport via stdin/stdout
- **HTTP** (optional): Set `MCP_HTTP_PORT` env var to enable HTTP server at `/mcp` endpoint with health check at `/health`

## Environment Variables

### Optional
- `GATEWAY_URL` - Gateway API URL (default: `http://115.190.91.253:80`)
- `AUTH_USERNAME` / `AUTH_PASSWORD` - HTTP Basic Auth for Gateway requests
- `USER_AGENT` - Custom User-Agent header
- `HTTP_PROXY` / `HTTPS_PROXY` - Proxy URLs (uses Undici ProxyAgent)
- `NO_PROXY` - Comma-separated bypass list for proxy
- `MCP_HTTP_PORT` - Enable HTTP transport on specified port

## MCP Tools

1. **searxng_web_search** - Web search via Gateway API (Firecrawl search)
   - Parameters: `query` (required), `limit` (optional, default 10, max 100)
   - Returns JSON with query, results array (title, content, url), totalCount, duration

2. **web_url_read** - Fetch URL content via Gateway API
   - Parameters: `url` (required), `startChar`, `maxLength`, `section`, `paragraphRange`, `readHeadings` (all optional)
   - Returns JSON with url, content (markdown), charCount, duration, cached status

## MCP Resources

1. **config://server-config** - Current server configuration as JSON
2. **help://usage-guide** - Usage guide in markdown

## Testing

Tests use a custom test framework in `__tests__/run-all.ts`:
- Unit tests in `__tests__/unit/`
- Integration tests in `__tests__/integration/`
- Shared helpers in `__tests__/helpers/`

Test files use `testFunction()` from `test-utils.ts` for assertions:
```typescript
await testFunction('Test description', () => {
  assert.equal(actual, expected);
}, results);
```

Tests automatically set `SEARXNG_URL=https://test-searx.example.com` for isolation (note: this var name is legacy, actual code uses `GATEWAY_URL`).

## Error Handling

All errors use the custom `MCPSearXNGError` class with emoji-prefixed messages for quick identification:
- 🔧 Configuration Error
- 🌐 Network/Connection Error
- 🚫 Server Error (HTTP status codes)
- 🔧 URL Format Error
- 📄 Content Error
- ⏱️ Timeout Error
- ❓ Unexpected Error

## Important Implementation Notes

- The code references `SEARXNG_URL` in tests/README but the actual implementation uses `GATEWAY_URL` for the Gateway API endpoint
- Search uses Gateway's `/api/firecrawl-search` endpoint (Firecrawl search)
- URL reading uses Gateway's `/api/read/{encodedUrl}` endpoint (Gateway returns pre-converted markdown)
- No local HTML-to-markdown conversion happens - Gateway handles content extraction
- Cache stores full markdown content from Gateway; pagination is applied locally after retrieval
