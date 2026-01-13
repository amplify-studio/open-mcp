# Open MCP

> An open-source MCP (Model Context Protocol) server solution for AI agent integration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Open MCP is a comprehensive server solution that enables AI assistants (like Claude) to interact with external services through the Model Context Protocol. Currently focused on web search and content extraction, with plans to expand into a full-featured AI agent platform.

## Current Features

### 🌐 Web Search
- General web queries with pagination
- Time-based filtering (day, month, year)
- Language selection
- Safe search levels

### 📄 URL Content Reading
- Extract web page content as text/markdown
- Intelligent caching with TTL
- Section extraction and pagination options

## Roadmap

### Phase 1: Current (Search & Content)
- ✅ Web search via Gateway API
- ✅ URL content reading
- ✅ Intelligent caching

### Phase 2: Knowledge Base (RAG)
- 🔄 Document indexing
- 🔄 Semantic search
- 🔄 Vector storage integration

### Phase 3: Data Integration
- ⏳ Database connectors
- ⏳ API integrations
- ⏳ File system access

### Phase 4: Agent Framework
- ⏳ Tool composition
- ⏳ Workflow orchestration
- ⏳ Multi-agent coordination

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Open MCP                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Search   │  │  Content   │  │  Future    │            │
│  │   Module   │  │   Reader   │  │  Modules   │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                   │
│        └────────────────┴────────────────┘                   │
│                         │                                    │
│                   ┌─────▼─────┐                              │
│                   │   Core    │                              │
│                   │  Layer    │                              │
│                   └─────┬─────┘                              │
│                         │                                    │
│  ┌──────────────────────┼──────────────────────┐            │
│  │                      │                      │            │
│ ▼▼                     ▼▼                    ▼▼           │
┌─────────┐         ┌─────────┐          ┌─────────┐         │
│  Cache  │         │ Gateway │          │ Plugins │         │
└─────────┘         └─────────┘          └─────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │  Gateway API    │
                    │  (External)     │
                    └─────────────────┘
```

## Installation

### Option 1: From npm (Recommended)

**Using Claude CLI:**
```bash
claude mcp add-json -s user open-mcp '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"]
}'
```

**With custom gateway:**
```bash
claude mcp add-json -s user open-mcp '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "http://115.190.91.253:80"
  }
}'
```

### Option 2: Claude Desktop Config

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"]
    }
  }
}
```

**With custom gateway:**
```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "http://115.190.91.253:80"
      }
    }
  }
}
```

### Option 3: From GitHub

Alternative: install directly from GitHub (no npm):

```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "npx",
      "args": ["-y", "github:amplify-studio/open-mcp"]
    }
  }
}
```

### Option 4: Local Development (For Developers)

```bash
# Clone the repository
git clone https://github.com/amplify-studio/open-mcp.git
cd open-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run directly
node dist/index.js
```

**Claude Desktop Config** (local development):
```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "node",
      "args": ["/path/to/open-mcp/dist/index.js"]
    }
  }
}
```

### Option 5: Test with MCP Inspector

```bash
cd open-mcp
npm run inspector
# Visit http://localhost:6274 to test
```

### Option 6: Global Install (Advanced)

```bash
cd open-mcp
npm link
# Then use: open-mcp
```

## Updating

To update to the latest version:

### Using Claude CLI

```bash
# Remove old version
claude mcp remove open-mcp

# Install latest version
claude mcp add-json -s user open-mcp '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"]
}'
```

### Clear npx Cache (Optional)

If you encounter issues after updating:

```bash
# Clear npx cache
npm cache clean --force

# Then reinstall
claude mcp remove open-mcp
claude mcp add-json -s user open-mcp '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"]
}'
```

### Check Current Version

```bash
# View your configuration
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

## Output Format

Both tools return JSON strings for structured data parsing.

### Web Search Output

```json
{
  "query": "search term",
  "results": [
    {
      "title": "Result Title",
      "content": "Description or snippet",
      "url": "https://example.com",
      "score": 0.123
    }
  ],
  "totalCount": 10,
  "duration": "234ms",
  "page": 1
}
```

### URL Read Output

```json
{
  "url": "https://example.com",
  "content": "Page content in markdown/text format...",
  "charCount": 1500,
  "duration": "456ms",
  "cached": false
}
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GATEWAY_URL` | No | `http://115.190.91.253:80` | Gateway API base URL |
| `AUTH_USERNAME` | No | - | Basic auth username |
| `AUTH_PASSWORD` | No | - | Basic auth password |
| `HTTP_PROXY` | No | - | Proxy URL for HTTP requests |
| `HTTPS_PROXY` | No | - | Proxy URL for HTTPS requests |
| `NO_PROXY` | No | - | Comma-separated bypass list |
| `MCP_HTTP_PORT` | No | - | Enable HTTP transport on specified port |

## Gateway API

The server connects to a Gateway API that provides:

| API | Method | Endpoint | Description |
|-----|--------|----------|-------------|
| Search | GET | `/api/search/` | Web search |
| Read | GET | `/api/read/{url}` | Extract web content |
| Health | GET | `/health` | Health check |
| Status | GET | `/api/status` | Service status |

## Development

```bash
# Install dependencies
npm install

# Development mode with file watching
npm run watch

# Run tests
npm test

# Test with MCP Inspector
npm run inspector

# Build for production
npm run build
```

## Docker Deployment

### Quick Start

```bash
# Clone and start services
git clone https://github.com/amplify-studio/open-mcp.git
cd open-mcp
docker-compose up -d

# Verify deployment
curl http://localhost:3333/health
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| SearXNG | 8888 | Metasearch engine |
| Reader | 8080 | Web content extractor |
| Nginx Gateway | 3333 | Unified API gateway |

### API Endpoints

- **Search**: `GET /api/search/?q=query`
- **Read**: `GET /api/read/https://example.com`
- **Health**: `GET /health`

See [docker/README.md](docker/README.md) for detailed deployment guide.

## Contributing

We're building an open-source community for AI agent infrastructure. Contributions welcome!

- Fork the repository
- Create a feature branch
- Make your changes
- Submit a pull request

## License

MIT

## Credits

Based on [mcp-searxng](https://github.com/ihor-sokoliuk/mcp-searxng) by Ihor Sokoliuk

---

**Made with ❤️ by [Amplify Studio](https://github.com/amplify-studio)**
