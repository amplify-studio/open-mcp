#!/usr/bin/env node

/**
 * Runtime test for inactivity timeout feature
 * This simulates a persistent STDIO connection with the MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const TEST_INTERVAL_MS = 30000; // Send request every 30s
const MAX_REQUESTS = 3; // Send 3 requests total

let requestCount = 0;

console.log('==========================================');
console.log('Runtime Inactivity Timeout Test');
console.log('==========================================\n');

// Start the MCP server
const server = spawn('node', ['dist/index.js'], {
  cwd: process.cwd(),
  env: { ...process.env, GATEWAY_URL: 'http://localhost' }
});

server.stdout.on('data', (data) => {
  console.log('[Server OUT]:', data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.error('[Server ERR]:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`\n[Server EXIT]: code ${code}`);
  process.exit(code);
});

// Send MCP requests
function sendRequest(id, method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: id,
    method: method,
    params: params
  };

  console.log(`\n[Client REQ]: ${method}`);
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Test sequence
async function runTest() {
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n--- Starting test sequence ---\n');

  // Send initialize request
  sendRequest(1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Send list tools request
  sendRequest(2, 'tools/list', {});

  // Periodically send requests to reset timeout
  const interval = setInterval(async () => {
    requestCount++;

    if (requestCount > MAX_REQUESTS) {
      clearInterval(interval);
      console.log('\n--- Test complete, stopping server ---');
      server.kill('SIGTERM');
      return;
    }

    console.log(`\n[Keeping alive] Request ${requestCount}/${MAX_REQUESTS}`);
    sendRequest(requestCount + 2, 'tools/list', {});
  }, TEST_INTERVAL_MS);
}

// Start test
runTest().catch(err => {
  console.error('Test failed:', err);
  server.kill();
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nTest interrupted by user');
  server.kill();
  process.exit(0);
});
