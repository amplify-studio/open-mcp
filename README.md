# Open MCP Search Server

Looking for free web search and page reading services? Want better MCP integration? Try this project!

**Doc Language:** [English](README.md) | [中文](readme/zh-CN.md)

[![npm version](https://badge.fury.io/js/%40amplify-studio%2Fopen-mcp.svg)](https://www.npmjs.com/package/@amplify-studio/open-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@amplify-studio/open-mcp)](https://www.npmjs.com/package/@amplify-studio/open-mcp)
[![Docker pulls](https://img.shields.io/docker/pulls/amplifystudio/open-mcp)](https://hub.docker.com/r/amplifystudio/open-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/amplify-studio/open-mcp?style=social)](https://github.com/amplify-studio/open-mcp)

Deploy your own local web search and page reading service in one click. Powered by SearXNG and Firecrawl, integrated with Claude via MCP protocol.

## Features

### MCP Tools

Tools provided to AI assistants via MCP protocol:

- 🔍 **Web Search** - Search the web with pagination, time filtering, and language options
- 📄 **URL Reading** - Extract web page content as markdown with advanced filtering

### Server Features

Infrastructure capabilities for deployment and performance:

- 💾 **Smart Caching** - Automatic caching with TTL to improve performance
- 🔄 **Dual Transport** - STDIO or HTTP modes for flexible deployment
- 🌐 **Proxy Support** - Built-in proxy configuration with NO_PROXY bypass

### Powered By

| Feature | Powered By |
|---------|------------|
| Search | [SearXNG](https://searxng.org/) - Privacy-respecting metasearch |
| Scraping | [Firecrawl](https://www.firecrawl.dev/) - Web scraping API |
| Protocol | [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official implementation |

---

## Compatible Clients

Works with any MCP client:

- **Claude Desktop** / **Claude Code** / **Cursor** / **Cline**
- **Continue.dev**
- **HTTP Mode** (for remote deployment)

---

## Quick Start

### Want to try it first?

Use our hosted MCP service directly:

```bash
claude mcp add-json -s user mcp-searxng '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "http://115.190.91.253:80"
  }
}'
```

### Like it? Want to deploy yourself?

Continue below for deployment guide

---

## Installation Methods

#### Using Claude CLI (Recommended)

```bash
claude mcp add-json -s user mcp-searxng '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "https://your-gateway-instance.com"
  }
}'
```

#### Using Claude Desktop Config

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-searxng": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "https://your-gateway-instance.com"
      }
    }
  }
}
```

#### Using Continue.dev

Add to your `config.json`:

```json
{
  "mcpServers": {
    "mcp-searxng": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "https://your-gateway-instance.com"
      }
    }
  }
}
```

#### HTTP Mode

```bash
# Start HTTP server
MCP_HTTP_PORT=3333 GATEWAY_URL=https://your-gateway-instance.com npx @amplify-studio/open-mcp@latest

# Connect from Claude Code
claude mcp add --transport http mcp-searxng http://localhost:3333/mcp
```

## Usage

### Web Search Tool

**Tool Name:** `searxng_web_search`

**Parameters:**
- `query` (string, required): The search query
- `limit` (number, optional): Maximum results (1-100, default: 10)

**Example:**

```json
{
  "query": "Model Context Protocol",
  "limit": 5
}
```

**Response:**

```json
{
  "query": "Model Context Protocol",
  "results": [
    {
      "title": "Result Title",
      "content": "Description or snippet...",
      "url": "https://example.com"
    }
  ],
  "totalCount": 5,
  "duration": "234ms"
}
```

### URL Reading Tool

**Tool Name:** `web_url_read`

**Parameters:**
- `url` (string, required): The URL to fetch
- `startChar` (number, optional): Starting character position (default: 0)
- `maxLength` (number, optional): Maximum characters to return
- `section` (string, optional): Extract content under specific heading
- `paragraphRange` (string, optional): Paragraph range like '1-5', '3', '10-'
- `readHeadings` (boolean, optional): Return only headings (default: false)

**Example:**

```json
{
  "url": "https://example.com/article",
  "maxLength": 5000,
  "section": "Introduction"
}
```

**Response:**

```json
{
  "url": "https://example.com/article",
  "content": "# Article Content\n\n...",
  "charCount": 1500,
  "duration": "456ms",
  "cached": false
}
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GATEWAY_URL` | No | `http://115.190.91.253:80` | Gateway API URL |
| `AUTH_USERNAME` | No | - | HTTP Basic Auth username |
| `AUTH_PASSWORD` | No | - | HTTP Basic Auth password |
| `USER_AGENT` | No | - | Custom User-Agent header |
| `HTTP_PROXY` | No | - | Proxy URL for HTTP requests |
| `HTTPS_PROXY` | No | - | Proxy URL for HTTPS requests |
| `NO_PROXY` | No | - | Comma-separated bypass list |
| `MCP_HTTP_PORT` | No | - | Enable HTTP transport on specified port |

### Full Configuration Example

```json
{
  "mcpServers": {
    "mcp-searxng": {
      "command": "npx",
      "args": ["-y", "@amplify-studio/open-mcp@latest"],
      "env": {
        "GATEWAY_URL": "https://search.example.com",
        "AUTH_USERNAME": "your_username",
        "AUTH_PASSWORD": "your_password",
        "USER_AGENT": "MyBot/1.0",
        "HTTP_PROXY": "http://proxy.company.com:8080",
        "HTTPS_PROXY": "http://proxy.company.com:8080",
        "NO_PROXY": "localhost,127.0.0.1,.local,.internal"
      }
    }
  }
}
```

## Installation Methods

### Option 1: NPX (Recommended)

```bash
npx -y @amplify-studio/open-mcp@latest
```

### Option 2: Global Install

```bash
npm install -g @amplify-studio/open-mcp
mcp-searxng
```

### Option 3: Docker

#### Using Pre-built Image

```bash
docker pull amplifystudio/open-mcp:latest
```

```json
{
  "mcpServers": {
    "mcp-searxng": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GATEWAY_URL",
        "amplifystudio/open-mcp:latest"
      ],
      "env": {
        "GATEWAY_URL": "https://your-gateway-instance.com"
      }
    }
  }
}
```

#### Docker Compose

```yaml
services:
  mcp-searxng:
    image: amplifystudio/open-mcp:latest
    stdin_open: true
    environment:
      - GATEWAY_URL=https://your-gateway-instance.com
      # Add optional variables as needed
      # - AUTH_USERNAME=your_username
      # - AUTH_PASSWORD=your_password
```

### Option 4: Local Development

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

## HTTP Transport Mode

The server supports HTTP transport for remote deployment.

### Starting HTTP Server

```bash
# Basic
MCP_HTTP_PORT=3333 npx @amplify-studio/open-mcp@latest

# With custom Gateway
MCP_HTTP_PORT=3333 GATEWAY_URL=https://your-gateway-instance.com npx @amplify-studio/open-mcp@latest

# Background mode
MCP_HTTP_PORT=3333 npx @amplify-studio/open-mcp@latest &
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/mcp` | POST | Send JSON-RPC requests |
| `/mcp` | GET | Receive SSE notifications |
| `/mcp` | DELETE | Close session |

### Verify Connection

```bash
# Health check
curl http://localhost:3333/health

# Expected response
# {"status":"healthy","server":"mcp-searxng","version":"0.9.0","transport":"http"}
```

### Example curl Commands

```bash
# 1. Initialize session
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0"}
    }
  }'

# 2. List tools (use returned session-id)
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}'

# 3. Call search tool
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "searxng_web_search",
      "arguments": {"query": "test", "limit": 5}
    }
  }'
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Development mode with file watching
npm run watch

# Run tests
npm test

# Generate coverage report
npm run test:coverage

# Test with MCP Inspector
npm run inspector

# Build for production
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run coverage report
npm run test:coverage

# Test specific file
npx tsx __tests__/unit/search.test.ts
```

## Updating

### Using Claude CLI

```bash
# Remove old version
claude mcp remove mcp-searxng

# Install latest version
claude mcp add-json -s user mcp-searxng '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "https://your-gateway-instance.com"
  }
}'
```

### Clear npx Cache

If you encounter issues after updating:

```bash
npm cache clean --force
claude mcp remove mcp-searxng
claude mcp add-json -s user mcp-searxng '{
  "command": "npx",
  "args": ["-y", "@amplify-studio/open-mcp@latest"],
  "env": {
    "GATEWAY_URL": "https://your-gateway-instance.com"
  }
}'
```

## Contributing

We welcome contributions! Please follow these guidelines:

- Fork the repository
- Create a feature branch
- Make your changes
- Submit a pull request

### Coding Standards

- Use TypeScript with strict type safety
- Follow existing error handling patterns
- Write concise, informative error messages
- Include unit tests for new functionality
- Maintain 90%+ test coverage

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits & Acknowledgments

This project is a fork of [mcp-searxng](https://github.com/ihor-sokoliuk/mcp-searxng) by [Ihor Sokoliuk](https://github.com/ihor-sokoliuk), adapted and enhanced with additional features and improvements.

### Key Dependencies

This project is built upon these excellent open-source projects:

| Project | Purpose | License |
|---------|---------|---------|
| [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) | Official MCP TypeScript SDK | MIT |
| [node-html-markdown](https://github.com/crosstype/node-html-markdown) | HTML to Markdown conversion | MIT |
| [undici](https://github.com/nodejs/undici) | HTTP client with proxy support | MIT |
| [express](https://github.com/expressjs/express) | HTTP server framework | MIT |
| [cors](https://github.com/expressjs/cors) | CORS middleware | MIT |

### Related Projects

Special thanks to these amazing projects:

- [mcp-searxng](https://github.com/ihor-sokoliuk/mcp-searxng) - Original project that we forked from, created by [Ihor Sokoliuk](https://github.com/ihor-sokoliuk)
- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP documentation
- [SearXNG](https://searxng.org/) - Privacy-respecting metasearch engine
- [Firecrawl](https://www.firecrawl.dev/) - Web scraping and crawling API

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=amplify-studio/open-mcp&type=Date)](https://star-history.com/#amplify-studio/open-mcp&Date)

---

**Made with ❤️ by [Amplify Studio](https://github.com/amplify-studio)**
