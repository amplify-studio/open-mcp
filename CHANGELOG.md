# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2026-02-03

### Added
- **Inactivity Timeout**: Automatic server shutdown after 3 minutes of no client activity
  - Prevents zombie processes from accumulating
  - Timer resets on any MCP request (tools, resources, logging)
  - Clean shutdown with proper logging
  - See `docs/inactivity-timeout.md` for details

### Changed
- **Code simplification and cleanup**:
  - Removed proxy functionality (`src/proxy.ts`, `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` env vars)
  - Deleted unused error factory functions (`createJSONError`, `createDataError`)
  - Added explicit return type annotations for better type safety
  - Improved error handling consistency - use `createTimeoutError()` instead of plain `Error`
  - Removed hardcoded timeout values to use improved 30s defaults
  - Updated documentation to remove proxy-related references
- Made `GATEWAY_URL` a required environment variable (no default value)

### Fixed
- Initialize handler now correctly returns protocolVersion, capabilities, and serverInfo
  - Removed custom Initialize handler that was overriding SDK defaults
  - SDK's built-in handler now provides complete initialization response

## [0.9.0] - 2026-01-16

### Added
- Docker Compose deployment with 7 integrated services:
  - Firecrawl API (web scraping and crawling)
  - Playwright browser service (dynamic content support)
  - PostgreSQL database (persistent storage)
  - Redis (rate limiting and caching)
  - Firecrawl Reader Adapter (Jina Reader compatible API)
  - SearXNG search engine
  - Nginx API gateway (unified entry point)
- Chinese mirror support for faster Docker builds in China
- FIRECRAWL_INTEGRATION.md - comprehensive integration guide
- INTEGRATION.md - detailed integration documentation

### Changed
- Simplified Docker Compose configuration using YAML anchors
- Unified nginx proxy configuration for all services
- Made open-mcp fully independent from firecrawl dependency
- Refactored nginx configuration with shared proxy settings

### Removed
- Duplicate firecrawl-adapter service (consolidated into firecrawl-reader-adapter)

### Infrastructure
- Added services/nuq-postgres/ with Dockerfile and initialization scripts
- Added services/firecrawl-reader-adapter/ with Python Flask service
- Added config/nginx/conf.d/proxy-common.conf for shared configuration

[0.9.0]: https://github.com/amplify-studio/open-mcp/compare/v0.8.2...v0.9.0
