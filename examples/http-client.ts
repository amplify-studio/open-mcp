#!/usr/bin/env tsx

/**
 * Open MCP HTTP Client Example
 *
 * This example demonstrates how to connect to the Open MCP server
 * using HTTP transport and call various tools.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.url);
const readline = require('readline');

interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPResponse {
  jsonrpc: string;
  id?: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

class MCPHttpClient {
  private baseUrl: string;
  private sessionId?: string;
  private requestId = 0;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async initialize(): Promise<void> {
    console.log('🔌 Connecting to', this.baseUrl);

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: {
            name: 'http-client-example',
            version: '1.0.0',
          },
        },
      }),
    });

    // Extract session ID from response headers
    const sessionId = response.headers.get('mcp-session-id');
    if (sessionId) {
      this.sessionId = sessionId;
      console.log('✅ Session established:', sessionId);
    }

    const data = (await response.json()) as MCPResponse;
    if (data.error) {
      throw new Error(`Initialize failed: ${data.error.message}`);
    }
  }

  async listTools(): Promise<Tool[]> {
    const response = await this.sendRequest('tools/list');
    return response.result?.tools || [];
  }

  async callTool(name: string, args: any): Promise<any> {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: args,
    });
    return response.result;
  }

  async listResources(): Promise<any[]> {
    const response = await this.sendRequest('resources/list');
    return response.result?.resources || [];
  }

  async readResource(uri: string): Promise<any> {
    const response = await this.sendRequest('resources/read', { uri });
    return response.result;
  }

  private async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };

    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++this.requestId,
        method,
        params,
      }),
    });

    const data = (await response.json()) as MCPResponse;

    if (data.error) {
      throw new Error(`Request failed: ${data.error.message}`);
    }

    return data;
  }

  close(): void {
    console.log('🔌 Closing connection');
    // In HTTP mode, sessions are managed server-side
    // No explicit close needed, but we could send a shutdown notification
  }
}

// Demo functions
async function demoListTools(client: MCPHttpClient): Promise<void> {
  console.log('\n📋 Available Tools:');
  const tools = await client.listTools();

  for (const tool of tools) {
    console.log(`  • ${tool.name}`);
    console.log(`    ${tool.description}`);
  }
}

async function demoSearch(client: MCPHttpClient): Promise<void> {
  const query = await readlineQuestion('\n🔍 Enter search query (or press Enter to skip): ');

  if (!query.trim()) {
    console.log('⏭️  Skipping search');
    return;
  }

  console.log(`Searching for: ${query}`);

  const result = await client.callTool('searxng_web_search', {
    query,
  });

  console.log('\n📊 Search Results:');
  const data = JSON.parse(result.content[0].text);

  if (data.results && data.results.length > 0) {
    for (const item of data.results.slice(0, 5)) {
      console.log(`  • ${item.title}`);
      console.log(`    ${item.url}`);
      console.log(`    ${item.content?.slice(0, 100)}...`);
      console.log();
    }
  } else {
    console.log('  No results found');
  }
}

async function demoReadUrl(client: MCPHttpClient): Promise<void> {
  const url = await readlineQuestion('\n📄 Enter URL to read (or press Enter to skip): ');

  if (!url.trim()) {
    console.log('⏭️  Skipping URL read');
    return;
  }

  console.log(`Reading: ${url}`);

  const result = await client.callTool('web_url_read', { url });

  console.log('\n📖 Content:');
  console.log(result.content?.[0]?.text || 'No content');
}

async function demoResources(client: MCPHttpClient): Promise<void> {
  console.log('\n📚 Available Resources:');
  const resources = await client.listResources();

  for (const resource of resources) {
    console.log(`  • ${resource.name}`);
    console.log(`    ${resource.uri}`);
    console.log(`    ${resource.description}`);
  }
}

function readlineQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main demo
async function main() {
  const baseUrl = process.env.MCP_SERVER_URL || 'http://localhost:3333/mcp';
  const client = new MCPHttpClient(baseUrl);

  try {
    // Initialize
    await client.initialize();

    // List available tools
    await demoListTools(client);

    // Perform search
    await demoSearch(client);

    // Read URL
    await demoReadUrl(client);

    // Show resources
    await demoResources(client);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MCPHttpClient };
