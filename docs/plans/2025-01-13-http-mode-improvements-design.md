# HTTP Mode Improvements Design Document

**Date:** 2025-01-13
**Status:** Design Complete
**Author:** Amplify Studio

## Overview

Enhance the existing HTTP transport support in open-mcp by adding comprehensive documentation, tests, example clients, and ensuring compatibility with `claude mcp add --transport http`.

## Current State

The project already has HTTP transport support via `MCP_HTTP_PORT` environment variable:
- Uses `StreamableHTTPServerTransport` from MCP SDK
- Single `/mcp` endpoint supporting POST/GET/DELETE
- SSE support for server-to-client messages
- Session management
- Health check at `/health`

**Gap:** Documentation is minimal and there are no tests or examples for HTTP mode.

## Design Goals

1. Add comprehensive HTTP mode documentation to README
2. Add integration tests for HTTP transport
3. Create example client code (Node.js, Python, curl)
4. Verify and ensure `claude mcp add --transport http` compatibility

---

## Part 1: Documentation

### HTTP vs STDIO Transport

| Transport | Use Case | Connection |
|-----------|----------|------------|
| **STDIO** | Local development, Claude Desktop | Process stdin/stdout |
| **HTTP** | Remote servers, cloud deployment | HTTP/SSE over network |

### Usage

**Start HTTP server:**
```bash
# Basic
MCP_HTTP_PORT=3333 npm start

# With environment variables
GATEWAY_URL=http://115.190.91.253:80 MCP_HTTP_PORT=3333 npm start
```

**Verify:**
```bash
curl http://localhost:3333/health
```

**Add to Claude Code:**
```bash
claude mcp add --transport http open-mcp http://localhost:3333/mcp
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/mcp` | POST | Send JSON-RPC requests |
| `/mcp` | GET | Receive SSE notifications |
| `/mcp` | DELETE | Close session |

### Security Considerations

- Enable DNS rebinding protection (Origin header validation)
- Bind to localhost only for local development
- Implement authentication for production (API Gateway, reverse proxy)
- Configure CORS appropriately

---

## Part 2: Testing

### Test Structure

```
__tests__/
├── integration/
│   └── http-server.test.ts  (new)
└── helpers/
    └── http-client.ts       (new)
```

### Test Cases

1. **Basic Connection Tests**
   - Health check returns correct status
   - Server version information is correct

2. **MCP Protocol Tests**
   - Initialize request/response
   - Tools list returns correct tools
   - Tool call (search) executes and returns results
   - Resources list returns correct resources

3. **Session Management Tests**
   - New session created with unique ID
   - Session ID reused in subsequent requests
   - Session can be closed properly

4. **SSE Tests**
   - GET request establishes SSE connection
   - Server can send notifications

5. **Error Handling Tests**
   - Invalid session ID returns 400
   - Invalid JSON-RPC returns error
   - Missing parameters return error

### Test Helper Class

```typescript
// __tests__/helpers/http-client.ts
export class MCPHttpClient {
  private baseUrl: string;
  private sessionId?: string;

  async initialize(): Promise<void>;
  async callTool(name: string, args: any): Promise<any>;
  async listTools(): Promise<Tool[]>;
  async listResources(): Promise<Resource[]>;
  close(): void;
}
```

---

## Part 3: Example Clients

### Node.js Client

**File:** `examples/http-client.ts`

```typescript
import { MCPHttpClient } from '../src/http-client';

async function main() {
  const client = new MCPHttpClient('http://localhost:3333/mcp');

  // Initialize
  await client.initialize();

  // List tools
  const tools = await client.listTools();
  console.log('Available tools:', tools);

  // Search
  const results = await client.callTool('searxng_web_search', {
    query: 'MCP protocol'
  });
  console.log('Search results:', results);

  // Read URL
  const content = await client.callTool('web_url_read', {
    url: 'https://example.com'
  });
  console.log('Page content:', content);

  client.close();
}

main().catch(console.error);
```

### curl Examples

**File:** `examples/curl-examples.md`

```bash
# Health check
curl http://localhost:3333/health

# Initialize session
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
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'

# List tools (use returned session ID)
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}'

# Call search tool
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "searxng_web_search",
      "arguments": {"query": "test"}
    }
  }'
```

### Python Client

**File:** `examples/python_client.py`

```python
import requests
import json

class OpenMCPClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session_id = None

    def initialize(self):
        response = requests.post(
            f"{self.base_url}/mcp",
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": {"name": "python-client", "version": "1.0"}
                }
            }
        )
        self.session_id = response.headers.get('mcp-session-id')
        return response.json()

    def search(self, query):
        response = requests.post(
            f"{self.base_url}/mcp",
            headers={"mcp-session-id": self.session_id},
            json={
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {
                    "name": "searxng_web_search",
                    "arguments": {"query": query}
                }
            }
        )
        return response.json()

# Usage
client = OpenMCPClient('http://localhost:3333/mcp')
client.initialize()
results = client.search('test')
print(results)
```

---

## Part 4: Claude Code Integration

### Compatibility Requirements

For `claude mcp add --transport http` to work:

1. Server must accept `Accept: application/json, text/event-stream` header
2. Server must return `mcp-session-id` response header
3. Single `/mcp` endpoint for all operations
4. Support POST/GET/DELETE methods

### Implementation Changes

**1. Accept Header Validation (http-server.ts)**

```typescript
const acceptHeader = req.headers['accept'];
if (!acceptHeader ||
    (!acceptHeader.includes('application/json') &&
     !acceptHeader.includes('text/event-stream'))) {
  res.status(406).json({ error: 'Not Acceptable' });
  return;
}
```

**2. CORS Configuration (http-server.ts)**

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  exposedHeaders: ['mcp-session-id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id', 'Accept'],
  credentials: true,
}));
```

**3. Environment Variables (.env.example)**

```bash
MCP_HTTP_PORT=3333
ALLOWED_ORIGINS=http://localhost:3000,https://claude.ai
```

### Testing Steps

```bash
# 1. Start server
MCP_HTTP_PORT=3333 npm start

# 2. Add to Claude Code
claude mcp add --transport http open-mcp http://localhost:3333/mcp

# 3. Verify
claude mcp list

# 4. Test in Claude Code
# Type /mcp to check status
# Try using the search tool
```

---

## Implementation Checklist

- [ ] Add HTTP mode section to README.md
- [ ] Create `__tests__/integration/http-server.test.ts`
- [ ] Create `__tests__/helpers/http-client.ts`
- [ ] Create `examples/` directory
- [ ] Create `examples/http-client.ts`
- [ ] Create `examples/curl-examples.md`
- [ ] Create `examples/python_client.py`
- [ ] Update `src/http-server.ts` with Accept header validation
- [ ] Update CORS configuration
- [ ] Add environment variables to `.env.example`
- [ ] Run all tests
- [ ] Test `claude mcp add` manually
- [ ] Update CLAUDE.md with HTTP mode info

## Success Criteria

1. README has complete HTTP mode documentation
2. All integration tests pass
3. Example clients work correctly
4. `claude mcp add --transport http` successfully connects
5. Health check endpoint returns correct information
