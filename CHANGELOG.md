# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
