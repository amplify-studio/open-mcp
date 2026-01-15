# Open MCP - curl Examples

This document provides curl command examples for interacting with the Open MCP HTTP server.

## Prerequisites

Start the Open MCP server with HTTP transport:

```bash
MCP_HTTP_PORT=3333 npm start
```

## Health Check

```bash
curl http://localhost:3333/health
```

Expected response:
```json
{
  "status": "healthy",
  "server": "ihor-sokoliuk/mcp-searxng",
  "version": "0.8.2",
  "transport": "http"
}
```

---

## Session Initialization

Initialize a new MCP session:

```bash
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
      "clientInfo": {
        "name": "curl-client",
        "version": "1.0.0"
      }
    }
  }'
```

**Important:** Save the `mcp-session-id` from the response headers for subsequent requests.

---

## List Tools

Get a list of all available tools:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "searxng_web_search",
        "description": "Search the web using SearXNG metasearch engine",
        "inputSchema": { ... }
      },
      {
        "name": "web_url_read",
        "description": "Extract and convert web page content to markdown",
        "inputSchema": { ... }
      }
    ]
  }
}
```

---

## Web Search

Perform a web search:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "searxng_web_search",
      "arguments": {
        "query": "MCP protocol"
      }
    }
  }'
```

With advanced options:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "searxng_web_search",
      "arguments": {
        "query": "AI news 2025",
        "pageno": 1,
        "time_range": "month",
        "language": "en",
        "safesearch": 1
      }
    }
  }'
```

---

## URL Content Reading

Extract content from a web page:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "web_url_read",
      "arguments": {
        "url": "https://example.com"
      }
    }
  }'
```

With pagination options:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "web_url_read",
      "arguments": {
        "url": "https://example.com/long-page",
        "startChar": 0,
        "maxLength": 1000
      }
    }
  }'
```

---

## List Resources

Get available resources:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "resources/list"
  }'
```

---

## Read Resource

Read a specific resource:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 8,
    "method": "resources/read",
    "params": {
      "uri": "config://server-config"
    }
  }'
```

---

## Helper Script

Save this as `mcp-curl.sh` for easier testing:

```bash
#!/bin/bash

MCP_URL="http://localhost:3333/mcp"
SESSION_ID=""

# Initialize session
init_session() {
  echo "Initializing session..."
  RESPONSE=$(curl -s -i -X POST "$MCP_URL" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "initialize",
      "params": {
        "protocolVersion": "2025-06-18",
        "capabilities": {},
        "clientInfo": {"name": "bash-script", "version": "1.0"}
      }
    }')

  SESSION_ID=$(echo "$RESPONSE" | grep -i "mcp-session-id" | cut -d' ' -f2 | tr -d '\r')
  echo "Session ID: $SESSION_ID"
}

# Call tool
call_tool() {
  local tool_name=$1
  local arguments=$2

  curl -s -X POST "$MCP_URL" \
    -H "Content-Type: application/json" \
    -H "mcp-session-id: $SESSION_ID" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": 2,
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"$tool_name\",
        \"arguments\": $arguments
      }
    }" | jq .
}

# Usage
init_session
call_tool "searxng_web_search" '{"query": "test"}'
```

---

## Common Errors

### Invalid Session ID

```json
{
  "error": "Invalid or missing session ID"
}
```

**Solution:** Initialize a new session first.

### Missing Accept Header

```json
{
  "error": "Missing required headers"
}
```

**Solution:** Include `Accept: application/json, text/event-stream` header.

### Connection Refused

```
curl: (7) Failed to connect to localhost port 3333
```

**Solution:** Ensure the MCP server is running with `MCP_HTTP_PORT=3333`.
